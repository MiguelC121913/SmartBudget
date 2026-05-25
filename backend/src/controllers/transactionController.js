const Transaction = require('../models/Transaction');
const { categorizeTransaction } = require('../services/aiService');
const { getUserApiKey } = require('../utils/getUserApiKey');

const ALLOWED_TYPES = ['expense', 'income'];

/**
 * Centralised error handler for controller catch blocks.
 * Maps Mongoose error types to appropriate HTTP responses.
 * @param {Error} err
 * @param {import('express').Response} res
 */
const handleError = (err, res) => {
  console.error(err);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Server error' });
};

/**
 * @desc  Create a new transaction. If `category` is omitted, Claude auto-categorizes it.
 * @route POST /api/transactions
 * @access Private
 */
const createTransaction = async (req, res) => {
  try {
    const { amount, type, description, date } = req.body;
    let { category } = req.body;

    if (!amount || !type || !description) {
      return res.status(400).json({ message: 'amount, type and description are required' });
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: 'type must be "expense" or "income"' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }

    let categorizedByAI = false;

    if (!category || !category.trim()) {
      const userApiKey = await getUserApiKey(req.user._id);
      const aiCategory = await categorizeTransaction(description, type, userApiKey);
      if (aiCategory) {
        category = aiCategory;
        categorizedByAI = true;
      } else {
        // AI unavailable — use safe fallback
        category = type === 'income' ? 'other_income' : 'other';
        categorizedByAI = false;
      }
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type,
      description,
      category,
      categorizedByAI,
      ...(date && { date }),
    });

    res.status(201).json({ transaction });
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * @desc  List transactions for the authenticated user with optional filters
 * @route GET /api/transactions
 * @access Private
 * @queryParam {string}  [type]       - Filter by "expense" or "income"
 * @queryParam {string}  [category]   - Filter by exact category
 * @queryParam {string}  [startDate]  - ISO date string, inclusive lower bound on date
 * @queryParam {string}  [endDate]    - ISO date string, inclusive upper bound on date
 * @queryParam {number}  [limit=100]  - Max records to return (hard cap 500)
 * @queryParam {number}  [skip=0]     - Records to skip for pagination
 */
const listTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const skip = parseInt(req.query.skip) || 0;

    // Always scope to the authenticated user — never expose other users' data
    const filter = { user: req.user._id };

    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: 'type must be "expense" or "income"' });
      }
      filter.type = type;
    }

    if (category) {
      filter.category = category.toLowerCase().trim();
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Run count and paginated query in parallel for efficiency
    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({ transactions, total });
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * @desc  Get a single transaction by ID
 * @route GET /api/transactions/:id
 * @access Private
 */
const getTransactionById = async (req, res) => {
  try {
    // Scope by both _id and user so one user can never read another's transaction
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * @desc  Update a transaction (only allowed fields)
 * @route PUT /api/transactions/:id
 * @access Private
 */
const updateTransaction = async (req, res) => {
  try {
    // Whitelist updatable fields to prevent mass-assignment
    const UPDATABLE = ['amount', 'type', 'description', 'category', 'date', 'categorizedByAI'];
    const updates = {};
    for (const field of UPDATABLE) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * @desc  Delete a transaction
 * @route DELETE /api/transactions/:id
 * @access Private
 */
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction deleted', id: transaction._id });
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * @desc  Re-run AI categorization on an existing transaction
 * @route POST /api/transactions/:id/recategorize
 * @access Private
 */
const recategorizeTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userApiKey = await getUserApiKey(req.user._id);
    const aiCategory = await categorizeTransaction(transaction.description, transaction.type, userApiKey);

    if (!aiCategory) {
      return res.status(503).json({ message: 'AI service unavailable, try again later' });
    }

    transaction.category = aiCategory;
    transaction.categorizedByAI = true;
    await transaction.save();

    res.status(200).json({ transaction });
  } catch (err) {
    handleError(err, res);
  }
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  recategorizeTransaction,
};
