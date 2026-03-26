const otpService = require('../services/otpService');
const jwt = require('jsonwebtoken');

/**
 * Send OTP to user's registered phone number
 * POST /api/otp/send
 * Body: { phone: string }
 */
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Validate phone number
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }
    
    // Send OTP
    const result = await otpService.sendOTP(phone.trim());
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error in sendOTP controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send OTP. Please try again later.' 
    });
  }
};

/**
 * Verify OTP and authenticate user
 * POST /api/otp/verify
 * Body: { phone: string, otp: string }
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    // Validate input
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }
    
    if (!otp || otp.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'OTP is required' 
      });
    }
    
    // Verify OTP
    const result = await otpService.verifyOTP(phone.trim(), otp.trim());
    
    if (result.success) {
      // Generate JWT token for authenticated session
      const token = jwt.sign(
        { 
          userId: result.userId,
          phone: result.user.phone,
          rationCardNumber: result.user.rationCardNumber
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token valid for 7 days
      );
      
      res.json({ 
        success: true, 
        message: 'OTP verified successfully',
        token,
        user: result.user
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error in verifyOTP controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to verify OTP. Please try again later.' 
    });
  }
};

/**
 * Get latest OTP for testing/debugging (should be removed in production)
 * GET /api/otp/latest/:phone
 */
const getLatestOTP = async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false,
        error: 'This endpoint is not available in production' 
      });
    }
    
    const { phone } = req.params;
    const otp = await otpService.getLatestOTP(phone);
    
    if (otp) {
      res.json({ 
        success: true,
        otp: otp.otp,
        expiresAt: otp.expiresAt,
        verified: otp.verified
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'No OTP found for this phone number' 
      });
    }
  } catch (error) {
    console.error('❌ Error in getLatestOTP controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve OTP' 
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getLatestOTP
};
