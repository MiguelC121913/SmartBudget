const rateLimit = require('express-rate-limit');
const UserSettings = require('../models/UserSettings');

/** 5 AI calls per rolling hour window for demo-mode users. */
const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.user._id.toString(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message:
        'Demo limit reached. Add your own API key in Settings to continue.',
    });
  },
});

/**
 * Middleware that enforces the demo-mode AI rate limit.
 *
 * - BYOK users (hasCustomKey === true) bypass the limiter entirely.
 * - For POST /api/transactions the limit is skipped when a category is
 *   explicitly provided (no AI call will be made anyway).
 * - On DB errors the middleware fails open so users are not blocked
 *   by an infrastructure problem.
 *
 * @type {import('express').RequestHandler}
 */
const aiRateLimiter = async (req, res, next) => {
  // If a category is already provided, no AI call will happen — skip limiting.
  if (req.body && req.body.category) return next();

  try {
    const settings = await UserSettings.findOne({ user: req.user._id })
      .select('hasCustomKey')
      .lean();

    if (settings?.hasCustomKey) return next(); // BYOK users are unlimited

    return demoLimiter(req, res, next);
  } catch (err) {
    // Fail open: a DB hiccup should not block legitimate requests.
    console.error('aiRateLimiter: DB error, skipping rate limit —', err.message);
    return next();
  }
};

module.exports = { aiRateLimiter };
