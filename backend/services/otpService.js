const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendOTP = async (phone) => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  
  await prisma.otpVerification.create({
    data: {
      phone,
      otp,
      expiresAt,
      verified: false
    }
  });

  // TODO: SMS/WhatsApp API
  console.log(`OTP for ${phone}: ${otp} (expires: ${expiresAt})`);

  return { success: true, message: 'OTP sent to phone' };
};

const verifyOTP = async (phone, otp) => {
  const verification = await prisma.otpVerification.findFirst({
    where: {
      phone,
      otp,
      verified: false,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!verification) {
    return { success: false, error: 'Invalid or expired OTP' };
  }

  await prisma.otpVerification.update({
    where: { id: verification.id },
    data: { verified: true }
  });

  return { success: true, verificationId: verification.id };
};

const getLatestOTP = async (phone) => {
  return prisma.otpVerification.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' }
  });
};

module.exports = {
  sendOTP,
  verifyOTP,
  getLatestOTP
};

