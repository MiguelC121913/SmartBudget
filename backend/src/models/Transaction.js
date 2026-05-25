const mongoose = require('mongoose');

/**
 * Transaction schema.
 * Represents a single financial movement (income or expense) belonging to one user.
 * `amount` is always a positive number; the direction is expressed via `type`.
 */
const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be a positive number'],
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    categorizedByAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index: fast queries for a user's transactions sorted by date descending
transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
