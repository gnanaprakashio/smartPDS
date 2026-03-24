const otpService = require('../services/otpService');
const userService = require('../services/userService');

const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Check if user exists or create temp
    let user = await userService.getUserByPhone(phone);
    
    const result = await otpService.sendOTP(phone);
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'OTP send failed' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const result = await otpService.verifyOTP(phone, otp);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'OTP verified successfully',
        token: 'temp-token-for-session' // Replace with JWT
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};

