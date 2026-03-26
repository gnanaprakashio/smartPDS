const express = require('express');
const { sendOTP, verifyOTP, getLatestOTP } = require('../controllers/otpController');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Send OTP to user's phone
router.post('/send', validate(schemas.otpSend), sendOTP);

// Verify OTP
router.post('/verify', validate(schemas.otpVerify), verifyOTP);

// Get latest OTP (for testing/debugging only - should be disabled in production)
router.get('/latest/:phone', getLatestOTP);

module.exports = router;
