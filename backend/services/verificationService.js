const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a 4-digit OTP
 */
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Send notification via SMS only - simulated on console
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

  // Simulate SMS notification on console
  console.log(`\n📱 [SMS NOTIFICATION SENT] to ${user.phone}`);
  console.log(`   English: ${englishMessage}`);
  console.log(`   Tamil: ${tamilMessage}`);
  console.log(`   OTP: ${otp}\n`);

  return { success: true, simulated: true, method: 'sms', message, englishMessage, tamilMessage };
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

    const totalStock = inventory.riceStock + inventory.sugarStock + inventory.wheatStock + inventory.oilStock + (inventory.toorDalStock || 0);

    if (totalStock <= 0) {
      return { success: false, error: 'Insufficient stock' };
    }

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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'COMPLETED',
        otp: null,
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
  generateAndNotifyUsers,
  verifyOTP
};
