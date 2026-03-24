const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService');

const FRAUD_THRESHOLDS = {
  multiple_cards: 3, // Same card used >3 times in day
  otp_fails: 5, // OTP failed >5 times
  slot_skips: 3 // Skipped >3 consecutive slots
};

const detectMultipleCardUsage = async (rationCardNumber, date) => {
  const fromDate = new Date(date);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(date);
  toDate.setHours(23, 59, 59, 999);

  const collections = await prisma.rationDistribution.count({
    where: {
      rationCardNumber,
      issueDate: {
        gte: fromDate,
        lte: toDate
      }
    }
  });

  return collections > FRAUD_THRESHOLDS.multiple_cards;
};

const detectOTPFailures = async (phone, hours = 24) => {
  const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const failures = await prisma.otpVerification.count({
    where: {
      phone,
      verified: false,
      expiresAt: {
        gt: fromDate
      }
    }
  });

  return failures > FRAUD_THRESHOLDS.otp_fails;
};

const detectSlotSkipping = async (userId) => {
  const assignments = await prisma.slotAssignment.findMany({
    where: { userId, status: 'MISSED' },
    orderBy: { slotDate: 'desc' },
    take: 5
  });

  return assignments.length >= FRAUD_THRESHOLDS.slot_skips;
};

const logFraudAlert = async (userId, type, details) => {
  const severity = type === 'high_risk' ? 'HIGH' : type === 'multiple_cards' ? 'HIGH' : 'MEDIUM'
  
  const log = await prisma.fraudLog.create({
    data: {
      userId,
      reason: `${type}: ${details}`,
      severity
    }
  });

  // Auto reputation penalty for confirmed fraud
  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: { decrement: 15 } }
  });

  // Create notification for fraud alert
  try {
    const severityEmoji = {
      HIGH: '🚨',
      MEDIUM: '⚠️',
      LOW: 'ℹ️'
    }
    await notificationService.createNotification(
      `${severityEmoji[severity]} Fraud Alert - ${severity} Risk`,
      `${type}: ${details}`,
      'FRAUD',
      null
    )
  } catch (notifError) {
    console.error('Error creating fraud notification:', notifError)
  }

  return log;
};

const getFraudAlerts = async (limit = 50) => {
  return prisma.fraudLog.findMany({
    where: { createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          rationCardNumber: true,
          phone: true,
          reputationScore: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

const takeAdminAction = async (fraudLogId, action, adminId) => {
  const fraudLog = await prisma.fraudLog.findUnique({
    where: { id: fraudLogId },
    include: { user: true }
  });

  if (!fraudLog) throw new Error('Fraud log not found');

  switch (action) {
    case 'suspend':
      await prisma.user.update({
        where: { id: fraudLog.userId },
        data: { status: 'SUSPENDED' }
      });
      break;
    case 'manual_verify':
      await prisma.user.update({
        where: { id: fraudLog.userId },
        data: { status: 'MANUAL_VERIFICATION' }
      });
      break;
    case 'reset_reputation':
      await prisma.user.update({
        where: { id: fraudLog.userId },
        data: { reputationScore: 100 }
      });
      break;
  }

  // Log admin action
  await prisma.adminAction.create({
    data: {
      fraudLogId,
      adminId,
      action
    }
  });

  return { success: true, action };
};

const getFraudStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const totalAlerts = await prisma.fraudLog.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  });
  
  const severityBreakdown = await prisma.fraudLog.groupBy({
    by: ['severity'],
    where: { createdAt: { gte: sevenDaysAgo } },
    _count: true
  });
  
  const fraudTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const count = await prisma.fraudLog.count({
      where: {
        createdAt: { gte: date, lt: nextDate }
      }
    });
    
    fraudTrend.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  
  const suspiciousUsers = await prisma.fraudLog.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { userId: true },
    distinct: ['userId']
  });
  
  const flaggedAccounts = await prisma.user.count({
    where: { reputationScore: { lt: 50 } }
  });
  
  const highRiskAccounts = await prisma.user.count({
    where: { reputationScore: { lt: 30 } }
  });
  
  const severityData = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };
  severityBreakdown.forEach(item => {
    severityData[item.severity] = item._count;
  });
  
  return {
    totalAlerts,
    suspiciousUsers: suspiciousUsers.length,
    flaggedAccounts,
    highRiskAccounts,
    severityBreakdown: severityData,
    fraudTrend
  };
};

module.exports = {
  detectMultipleCardUsage,
  detectOTPFailures,
  detectSlotSkipping,
  logFraudAlert,
  getFraudAlerts,
  takeAdminAction,
  getFraudStats
};

