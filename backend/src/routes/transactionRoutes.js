const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const controller = require('../controllers/transactionController');

const router = express.Router();

// Apply auth middleware to every route in this file
router.use(protect);

// aiRateLimiter enforces the 5-call/hour demo limit; BYOK users bypass it.
router.post('/', aiRateLimiter, controller.createTransaction);
router.get('/', controller.listTransactions);
router.get('/:id', controller.getTransactionById);
router.put('/:id', controller.updateTransaction);
router.delete('/:id', controller.deleteTransaction);
router.post('/:id/recategorize', aiRateLimiter, controller.recategorizeTransaction);

module.exports = router;
