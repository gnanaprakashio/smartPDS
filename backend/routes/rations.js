const express = require('express');
const { verifyOTPAndDistribute, getUserRationHistory } = require('../controllers/rationsController');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post('/verify-complete', authMiddleware, validate(schemas.rationsVerify), verifyOTPAndDistribute);
router.get('/history', authMiddleware, getUserRationHistory);

module.exports = router;

