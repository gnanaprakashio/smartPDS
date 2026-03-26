const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Initialize Twilio client only if credentials are valid
let twilioClient = null;
let twilioEnabled = false;

try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
  // Check if Twilio credentials are properly configured
  if (accountSid && authToken && phoneNumber && accountSid.startsWith('AC')) {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    twilioEnabled = true;
    console.log('✅ Twilio SMS service initialized successfully');
  } else {
    console.warn('⚠️  Twilio credentials not configured or invalid. OTP will be logged to console only.');
    console.warn('   To enable SMS: Set valid TWILIO_ACCOUNT_SID (starts with AC), TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio:', error.message);
  console.warn('⚠️  OTP will be logged to console only.');
}

/**
 * Generate a secure 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format phone number to international format
 * Assumes Indian phone numbers if not already formatted
 */
const formatPhoneNumber = (phone) => {
  // Remove any spaces, dashes, or parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If it starts with +, assume it's already formatted
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with 91, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If it's a 10-digit number, assume it's Indian and add +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // Return as is if format is unclear
  return cleaned;
};

/**
 * Send OTP via Twilio SMS (or console if Twilio not configured)
 */
const sendOTP = async (phone) => {
  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    
    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: phone }
    });
    
    if (!user) {
      return { 
        success: false, 
        error: 'User not found with this phone number' 
      };
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otp,
        expiresAt,
        verified: false
      }
    });
    
    // Send OTP via Twilio SMS if enabled
    if (twilioEnabled && twilioClient) {
      try {
        const message = await twilioClient.messages.create({
          body: `Your Smart PDS verification OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });
        
        console.log(`✅ OTP sent via SMS to ${formattedPhone} (Message SID: ${message.sid})`);
        
        return { 
          success: true, 
          message: 'OTP sent successfully to your registered phone number',
          expiresAt,
          method: 'sms'
        };
      } catch (twilioError) {
        console.error('❌ Twilio SMS Error:', twilioError.message);
        
        // Log OTP to console as fallback
        console.log(`📱 FALLBACK - OTP for ${phone}: ${otp} (expires: ${expiresAt})`);
        
        return { 
          success: true, 
          message: 'OTP generated (SMS failed, check console)',
          expiresAt,
          method: 'console',
          warning: 'SMS delivery failed. OTP logged to console.'
        };
      }
    } else {
      // Twilio not configured - log to console
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 OTP for ${user.name} (${phone})`);
      console.log(`   OTP Code: ${otp}`);
      console.log(`   Expires: ${expiresAt.toLocaleString()}`);
      console.log(`${'='.repeat(60)}\n`);
      
      return { 
        success: true, 
        message: 'OTP generated successfully (check console for code)',
        expiresAt,
        method: 'console',
        otp: otp // Include OTP in response when Twilio is not configured (dev mode only)
      };
    }
  } catch (error) {
    console.error('❌ Error in sendOTP:', error);
    return { 
      success: false, 
      error: 'Failed to send OTP. Please try again.' 
    };
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (phone, otp) => {
  try {
    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: phone }
    });
    
    if (!user) {
      return { 
        success: false, 
        error: 'User not found with this phone number' 
      };
    }
    
    // Find valid OTP verification
    const verification = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        otp,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!verification) {
      return { 
        success: false, 
        error: 'Invalid or expired OTP. Please request a new one.' 
      };
    }
    
    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: verification.id },
      data: { verified: true }
    });
    
    console.log(`✅ OTP verified successfully for user: ${user.name} (${phone})`);
    
    return { 
      success: true, 
      verificationId: verification.id,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        rationCardNumber: user.rationCardNumber
      }
    };
  } catch (error) {
    console.error('❌ Error in verifyOTP:', error);
    return { 
      success: false, 
      error: 'Failed to verify OTP. Please try again.' 
    };
  }
};

/**
 * Get latest OTP for a phone number (for debugging/testing)
 */
const getLatestOTP = async (phone) => {
  try {
    const user = await prisma.user.findUnique({
      where: { phone: phone }
    });
    
    if (!user) {
      return null;
    }
    
    return prisma.otpVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('❌ Error in getLatestOTP:', error);
    return null;
  }
};

/**
 * Clean up expired OTPs (can be called periodically)
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    console.log(`🧹 Cleaned up ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error('❌ Error cleaning up OTPs:', error);
    return 0;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getLatestOTP,
  cleanupExpiredOTPs,
  formatPhoneNumber,
  twilioEnabled
};
