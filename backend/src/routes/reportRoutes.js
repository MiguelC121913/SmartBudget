const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const { generateMonthly } = require('../controllers/reportController');
const UserSettings = require('../models/UserSettings');

const router = express.Router();

/**
 * One report per user every 5 minutes (demo mode only).
 * Reports cost more than categorisations (~800 tokens each) so the window
 * is longer than the AI categorisation rate limit.
 */
const reportRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1,
  keyGenerator: (req) => req.user._id.toString(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Puedes generar un reporte cada 5 minutos. Intenta de nuevo pronto.',
    });
  },
});

// BYOK users bypass the rate limit — consistent with aiRateLimiter.js behaviour.
const conditionalReportLimiter = async (req, res, next) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user._id })
      .select('hasCustomKey')
      .lean();
    if (settings?.hasCustomKey) return next();
    return reportRateLimiter(req, res, next);
  } catch (err) {
    console.error('conditionalReportLimiter error:', err.message);
    return next(); // fail open
  }
};

router.post('/monthly', protect, conditionalReportLimiter, generateMonthly);

module.exports = router;
