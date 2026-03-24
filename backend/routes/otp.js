const express = require('express');
const { sendOTP, verifyOTP } = require('../controllers/otpController');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post('/send', validate(schemas.otpSend), sendOTP);
router.post('/verify', validate(schemas.otpVerify), verifyOTP);

module.exports = router;

