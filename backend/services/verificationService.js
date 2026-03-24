const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

// WhatsApp Configuration (from environment variables)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Twilio SMS Configuration (from environment variables)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client (only if credentials are provided)
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send WhatsApp message using Meta Business API
 */
const sendWhatsApp = async (phone, message) => {
  // If WhatsApp not configured, fall back to console log
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`📱 [SIMULATED WhatsApp] to ${phone}: ${message}`);
    return { success: true, simulated: true, method: 'whatsapp' };
  }

  try {
    // Format phone number (remove + and any dashes)
    const formattedPhone = phone.replace(/\D/g, '');
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp sent to ${phone}:`, response.data.messages[0].id);
    return { success: true, messageId: response.data.messages[0].id, method: 'whatsapp' };
  } catch (error) {
    console.error('❌ WhatsApp error:', error.response?.data || error.message);
    return { success: false, error: error.message, method: 'whatsapp' };
  }
};

/**
 * Send SMS using Twilio API
 */
const sendSMS = async (phone, message) => {
  // If Twilio not configured, fall back to console log
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log(`📱 [SIMULATED SMS] to ${phone}: ${message}`);
    return { success: true, simulated: true, method: 'sms' };
  }

  try {
    // Format phone number for India (add +91 if not present)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ SMS sent to ${phone}:`, response.sid);
    return { success: true, messageId: response.sid, method: 'sms' };
  } catch (error) {
    console.error('❌ SMS error:', error.message);
    return { success: false, error: error.message, method: 'sms' };
  }
};

/**
 * Send notification - tries WhatsApp first, then falls back to SMS
 * This is ideal for non-smartphone users who can receive SMS
 */
const sendNotification = async (user, otp) => {
  const date = user.scheduleDate 
    ? new Date(user.scheduleDate).toLocaleDateString('en-IN')
    : 'N/A';
  const timeSlot = user.timeSlot || 'N/A';
  
  const message = `Dear ${user.name}, your ration pickup is scheduled on ${date} at ${timeSlot}. Your OTP is ${otp}.`;

  // Try WhatsApp first (for smartphone users)
  const whatsappResult = await sendWhatsApp(user.phone, message);
  
  if (whatsappResult.success) {
    return whatsappResult;
  }

  // Fall back to SMS (for non-smartphone users)
  console.log(`📱 WhatsApp failed, trying SMS for ${user.phone}...`);
  const smsResult = await sendSMS(user.phone, message);
  
  return smsResult;
};

/**
 * Send notification via specific channel (SMS or WhatsApp)
 */
const sendNotificationByChannel = async (user, otp, channel = 'auto') => {
  const date = user.scheduleDate 
    ? new Date(user.scheduleDate).toLocaleDateString('en-IN')
    : 'N/A';
  const timeSlot = user.timeSlot || 'N/A';
  
  const message = `Dear ${user.name}, your ration pickup is scheduled on ${date} at ${timeSlot}. Your OTP is ${otp}.`;

  if (channel === 'sms') {
    return sendSMS(user.phone, message);
  } else if (channel === 'whatsapp') {
    return sendWhatsApp(user.phone, message);
  } else {
    return sendNotification(user, otp);
  }
};

/**
 * Generate a 4-digit OTP
 */
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Generate OTP and notify scheduled users
 */
const generateAndNotifyUsers = async () => {
  try {
    // Find all scheduled users who haven't received OTP
    const scheduledUsers = await prisma.user.findMany({
      where: {
        status: 'SCHEDULED',
        otp: null
      }
    });

    const results = [];

    for (const user of scheduledUsers) {
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setHours(otpExpiry.getHours() + 24); // OTP valid for 24 hours

      // Update user with OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp,
          otpExpiry
        }
      });

      // Send notification
      const notification = await sendNotification(user, otp);
      
      results.push({
        userId: user.id,
        name: user.name,
        phone: user.phone,
        otp,
        notification: notification.message
      });
    }

    console.log(`📲 OTP generation complete: ${results.length} users notified`);
    
    return {
      success: true,
      count: results.length,
      users: results
    };
  } catch (error) {
    console.error('OTP generation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP and complete distribution
 */
const verifyOTP = async (rationCardNumber, otp) => {
  try {
    // Find user by ration card number
    const user = await prisma.user.findUnique({
      where: { rationCardNumber }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if already completed
    if (user.status === 'COMPLETED') {
      return { success: false, error: 'Ration already received' };
    }

    // Check if not scheduled
    if (user.status !== 'SCHEDULED') {
      return { success: false, error: 'User not scheduled' };
    }

    // Verify OTP
    if (user.otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Check OTP expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, error: 'OTP expired' };
    }

    // Get inventory
    const inventory = await prisma.inventory.findFirst();
    
    if (!inventory) {
      return { success: false, error: 'No inventory found' };
    }

    // Calculate total stock (including toorDal)
    const totalStock = inventory.riceStock + inventory.sugarStock + inventory.wheatStock + inventory.oilStock + (inventory.toorDalStock || 0);

    // Safety check: if stock <= 0
    if (totalStock <= 0) {
      return { success: false, error: 'Insufficient stock' };
    }

    // Reduce stock by 5kg (distribute from available items proportionally)
    const reduction = 5;
    const riceReduction = (inventory.riceStock / totalStock) * reduction;
    const sugarReduction = (inventory.sugarStock / totalStock) * reduction;
    const wheatReduction = (inventory.wheatStock / totalStock) * reduction;
    const oilReduction = (inventory.oilStock / totalStock) * reduction;

    await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        riceStock: Math.max(0, inventory.riceStock - riceReduction),
        sugarStock: Math.max(0, inventory.sugarStock - sugarReduction),
        wheatStock: Math.max(0, inventory.wheatStock - wheatReduction),
        oilStock: Math.max(0, inventory.oilStock - oilReduction)
      }
    });

    // Update user status to completed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'COMPLETED',
        otp: null, // Clear OTP after successful verification
        otpExpiry: null
      }
    });

    console.log(`✅ Verification successful for ${user.name} (${rationCardNumber})`);
    console.log(`   Stock reduced by ${reduction}kg`);

    return {
      success: true,
      message: 'Verification successful',
      user: {
        name: user.name,
        rationCardNumber: user.rationCardNumber,
        date: user.scheduleDate,
        timeSlot: user.timeSlot
      },
      stockReduced: reduction
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendNotification,
  sendNotificationByChannel,
  sendWhatsApp,
  sendSMS,
  generateAndNotifyUsers,
  verifyOTP
};
