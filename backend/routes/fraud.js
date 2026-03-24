const express = require('express');
const { getFraudAlerts, getFraudStats } = require('../controllers/fraudController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/logs', authMiddleware, getFraudAlerts);
router.get('/stats', authMiddleware, getFraudStats);

module.exports = router;

