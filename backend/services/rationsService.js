const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const reputationService = require('./reputationService');

const completeRationDistribution = async (otpVerificationId, collectedOnTime = true) => {
  const otpRecord = await prisma.otpVerification.findUnique({
    where: { id: otpVerificationId },
    include: {
      user: true
    }
  });

  if (!otpRecord || !otpRecord.verified) {
    throw new Error('Invalid OTP verification');
  }

  const userAssignments = await prisma.slotAssignment.findFirst({
    where: {
      userId: otpRecord.userId,
      status: 'SCHEDULED'
    },
    include: {
      slot: true
    }
  });

  if (!userAssignments) {
    throw new Error('No active slot assignment');
  }

  const slotDate = new Date(userAssignments.slot?.slotDate || userAssignments.slotDate);
  const now = new Date();
  const isOnTime = collectedOnTime && now <= new Date(slotDate.getTime() + 2 * 60 * 60 * 1000);

  await prisma.slotAssignment.update({
    where: { id: userAssignments.id },
    data: { status: 'COMPLETED' }
  });

  const reputationResult = await reputationService.updateReputationOnCollection(
    otpRecord.userId,
    isOnTime
  );

  await prisma.user.update({
    where: { id: otpRecord.userId },
    data: { collected: true, status: 'COMPLETED' }
  });

  return {
    success: true,
    message: isOnTime
      ? 'Ration distributed on-time (+5 reputation)'
      : 'Ration distributed late (no bonus)',
    user: otpRecord.user,
    slot: userAssignments.slot,
    reputation: reputationResult
  };
};

const markUserMissed = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new Error('User not found');

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'MISSED' }
  });

  const reputationResult = await reputationService.updateReputationOnMissedSlot(userId);

  return {
    success: true,
    message: 'User marked as missed (-5 reputation)',
    reputation: reputationResult
  };
};

const undoRationCollection = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new Error('User not found');

  await prisma.user.update({
    where: { id: userId },
    data: {
      collected: false,
      status: 'SCHEDULED'
    }
  });

  const recentLog = await prisma.reputationLog.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (recentLog && recentLog.scoreChange > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: {
          decrement: recentLog.scoreChange
        }
      }
    });

    await prisma.reputationLog.create({
      data: {
        userId,
        changeReason: 'Collection undone',
        scoreChange: -recentLog.scoreChange
      }
    });
  }

  return { success: true, message: 'Collection undone, reputation adjusted' };
};

module.exports = {
  completeRationDistribution,
  markUserMissed,
  undoRationCollection
};