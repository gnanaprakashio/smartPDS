const express = require('express');
const { verifyOTP, generateAndNotifyUsers } = require('../services/verificationService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/verify - Verify OTP and complete distribution
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { rationCardNumber, otp } = req.body;

    if (!rationCardNumber || !otp) {
      return res.status(400).json({ error: 'Card number and OTP are required' });
    }

    const result = await verifyOTP(rationCardNumber, otp);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/verify/notify - Generate OTPs and notify all scheduled users
router.post('/notify', authMiddleware, async (req, res) => {
  try {
    const result = await generateAndNotifyUsers();
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Notification failed' });
  }
});

module.exports = router;
