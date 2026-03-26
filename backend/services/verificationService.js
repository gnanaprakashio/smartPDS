const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Initialize Twilio client for SMS
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
    console.log('✅ Twilio SMS service initialized for verificationService');
  } else {
    console.warn('⚠️  Twilio credentials not configured for verificationService. SMS will be logged to console only.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio in verificationService:', error.message);
}

/**
 * Format phone number to international format
 */
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  return cleaned;
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send notification via SMS - sends real SMS via Twilio
 */
const sendNotification = async (user, otp) => {
  const date = user.scheduleDate 
    ? new Date(user.scheduleDate).toLocaleDateString('en-IN')
    : 'N/A';
  const timeSlot = user.timeSlot || 'N/A';
  
  // English message
  const englishMessage = `Dear ${user.name}, your ration pickup is scheduled on ${date} between ${timeSlot}. Your OTP is ${otp}.`;
  
  // Tamil message
  const tamilMessage = `அன்பார்ந்த ${user.name}, உங்கள் ரேஷன் பெறும் தேதி ${date} அன்று ${timeSlot} நடைபெறும். உங்கள் OTP எண் ${otp}.`;
  
  // Combined bilingual message
  const message = `${englishMessage}\n\n${tamilMessage}`;

  // Format phone number
  const formattedPhone = formatPhoneNumber(user.phone);

  // Try to send SMS via Twilio if enabled
  if (twilioEnabled && twilioClient) {
    try {
      const twilioMessage = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      
      console.log(`\n✅ [SMS SENT VIA TWILIO] to ${formattedPhone}`);
      console.log(`   English: ${englishMessage}`);
      console.log(`   Tamil: ${tamilMessage}`);
      console.log(`   OTP: ${otp}`);
      console.log(`   Message SID: ${twilioMessage.sid}\n`);

      return { success: true, simulated: false, method: 'sms', messageSid: twilioMessage.sid, message, englishMessage, tamilMessage };
    } catch (twilioError) {
      console.error('❌ Twilio SMS Error in verificationService:', twilioError.message);
      
      // Fallback to console
      console.log(`\n📱 [SMS FALLBACK - LOGGED TO CONSOLE] to ${user.phone}`);
      console.log(`   English: ${englishMessage}`);
      console.log(`   Tamil: ${tamilMessage}`);
      console.log(`   OTP: ${otp}\n`);

      return { success: true, simulated: true, method: 'console', warning: 'SMS delivery failed', message, englishMessage, tamilMessage };
    }
  } else {
    // Twilio not configured - log to console only
    console.log(`\n📱 [SMS NOTIFICATION - CONSOLE ONLY] to ${user.phone}`);
    console.log(`   English: ${englishMessage}`);
    console.log(`   Tamil: ${tamilMessage}`);
    console.log(`   OTP: ${otp}\n`);

    return { success: true, simulated: true, method: 'console', message, englishMessage, tamilMessage };
  }
};

/**
 * Send notification via specific channel (SMS only now)
 */
const sendNotificationByChannel = async (user, otp, channel = 'sms') => {
  return sendNotification(user, otp);
};

/**
 * Generate OTP and notify scheduled users
 */
const generateAndNotifyUsers = async () => {
  try {
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
      otpExpiry.setHours(otpExpiry.getHours() + 24);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp,
          otpExpiry
        }
      });

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
    const user = await prisma.user.findUnique({
      where: { rationCardNumber }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.status === 'COMPLETED') {
      return { success: false, error: 'Ration already received' };
    }

    if (user.status !== 'SCHEDULED') {
      return { success: false, error: 'User not scheduled' };
    }

    if (user.otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, error: 'OTP expired' };
    }

    const inventory = await prisma.inventory.findFirst();
    
    if (!inventory) {
      return { success: false, error: 'No inventory found' };
    }

    const cardType = user.cardType || 'PHH';
    const members = user.members || 1;

    // Check if user has reserved items - they should have been reserved during scheduling
    const reserved = user.reservedItems;
    let riceNeeded, wheatNeeded, sugarNeeded, oilNeeded, toorDalNeeded;
    
    if (reserved) {
      // Use reserved amounts from scheduling time
      riceNeeded = reserved.rice;
      wheatNeeded = reserved.wheat;
      sugarNeeded = reserved.sugar;
      oilNeeded = reserved.oil;
      toorDalNeeded = reserved.toorDal;
    } else {
      // Fallback: Calculate allocation (should not happen for properly scheduled users)
      const cardType = user.cardType || 'PHH';
      const members = user.members || 1;
      
      const tnpdsAllocations = {
        AAY:   { rice: 35, wheat: 5, sugar: 1.5, oil: 1, toorDal: 1 },
        PHH:   { rice: 5,  wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
        NPHH:  { rice: 12, wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
        NPHH_S:{ rice: 0,  wheat: 0, sugar: 3.5, oil: 1, toorDal: 1 }
      };

      const allocation = tnpdsAllocations[cardType] || tnpdsAllocations.PHH;
      riceNeeded = (cardType === 'PHH') ? (allocation.rice * members) : allocation.rice;
      wheatNeeded = allocation.wheat;
      sugarNeeded = allocation.sugar;
      oilNeeded = allocation.oil;
      toorDalNeeded = allocation.toorDal;
    }

    // Check stock against reserved items - NOT total available stock
    // The reserved stock should always be available if system works correctly
    if (!reserved) {
      // If user has no reserved items, check against available stock (fallback)
      if (inventory.riceStock < riceNeeded || 
          inventory.wheatStock < wheatNeeded || 
          inventory.sugarStock < sugarNeeded || 
          inventory.oilStock < oilNeeded ||
          (inventory.toorDalStock || 0) < toorDalNeeded) {
        return { 
          success: false, 
          error: 'Insufficient stock',
          required: { rice: riceNeeded, wheat: wheatNeeded, sugar: sugarNeeded, oil: oilNeeded, toorDal: toorDalNeeded },
          available: { 
            rice: inventory.riceStock, 
            wheat: inventory.wheatStock, 
            sugar: inventory.sugarStock, 
            oil: inventory.oilStock, 
            toorDal: inventory.toorDalStock || 0 
          }
        };
      }
    }

    // Deduct from stock - reduce both available and reserved stock
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        riceStock: inventory.riceStock - riceNeeded,
        sugarStock: inventory.sugarStock - sugarNeeded,
        wheatStock: inventory.wheatStock - wheatNeeded,
        oilStock: inventory.oilStock - oilNeeded,
        toorDalStock: Math.max(0, (inventory.toorDalStock || 0) - toorDalNeeded),
        // Also reduce reserved stock since this reservation is now fulfilled
        reservedRice: Math.max(0, (inventory.reservedRice || 0) - riceNeeded),
        reservedWheat: Math.max(0, (inventory.reservedWheat || 0) - wheatNeeded),
        reservedSugar: Math.max(0, (inventory.reservedSugar || 0) - sugarNeeded),
        reservedOil: Math.max(0, (inventory.reservedOil || 0) - oilNeeded),
        reservedToorDal: Math.max(0, (inventory.reservedToorDal || 0) - toorDalNeeded)
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'COMPLETED',
        otp: null,
        otpExpiry: null,
        reservedItems: null,  // Clear reserved items since they are now distributed
        collected: true
      }
    });

    const reduction = riceNeeded + wheatNeeded + sugarNeeded + oilNeeded + toorDalNeeded;

    console.log(`✅ Verification successful for ${user.name} (${rationCardNumber})`);
    console.log(`   Stock reduced: Rice=${riceNeeded}kg, Wheat=${wheatNeeded}kg, Sugar=${sugarNeeded}kg, Oil=${oilNeeded}L, ToorDal=${toorDalNeeded}kg`);

    return {
      success: true,
      message: 'Verification successful',
      user: {
        name: user.name,
        rationCardNumber: user.rationCardNumber,
        date: user.scheduleDate,
        timeSlot: user.timeSlot
      },
      stockReduced: reduction,
      allocatedItems: {
        rice: riceNeeded,
        wheat: wheatNeeded,
        sugar: sugarNeeded,
        oil: oilNeeded,
        toorDal: toorDalNeeded
      }
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
  generateAndNotifyUsers,
  verifyOTP,
  twilioEnabled
};
