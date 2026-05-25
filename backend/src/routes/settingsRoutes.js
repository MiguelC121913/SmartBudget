const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getSettings, updateApiKey, deleteApiKey } = require('../controllers/settingsController');

const router = express.Router();

router.use(protect);

router.get('/',         getSettings);
router.put('/api-key',  updateApiKey);
router.delete('/api-key', deleteApiKey);

module.exports = router;
