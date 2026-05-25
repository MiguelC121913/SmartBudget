const Transaction = require('../models/Transaction');
const { getUserApiKey } = require('../utils/getUserApiKey');
const { generateMonthlyReport } = require('../services/reportService');

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * @desc  Generate an AI monthly report for the authenticated user.
 * @route POST /api/reports/monthly
 * @access Private
 */
const generateMonthly = async (req, res) => {
  try {
    const y = parseInt(req.body.year);
    const m = parseInt(req.body.month);

    if (!y || !m || m < 1 || m > 12 || y < 2000 || y > 2100) {
      return res.status(400).json({
        message: 'year y month son requeridos. month debe ser un número entre 1 y 12.',
      });
    }

    // First and last instant of the requested month
    const start = new Date(y, m - 1, 1, 0, 0, 0);
    const end   = new Date(y, m,     0, 23, 59, 59); // day 0 of next month = last day of this month

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean();

    const lang = req.body.lang === 'en' ? 'en' : 'es';

    if (transactions.length === 0) {
      return res.json({
        report: null,
        stats:  null,
        message: lang === 'en'
          ? 'No transactions this month. Start adding some to see your report!'
          : 'No hay transacciones este mes. ¡Registra algunas para ver tu reporte!',
      });
    }

    const monthLabel = lang === 'en'
      ? `${MONTH_NAMES_EN[m - 1]} ${y}`
      : `${MONTH_NAMES_ES[m - 1]} ${y}`;
    const apiKey     = await getUserApiKey(req.user._id);
    const result     = await generateMonthlyReport(transactions, monthLabel, apiKey, lang);

    if (!result.success) {
      return res.status(503).json({ message: result.error });
    }

    return res.json({ report: result.report, stats: result.stats });
  } catch (err) {
    console.error('reportController.generateMonthly:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { generateMonthly };
