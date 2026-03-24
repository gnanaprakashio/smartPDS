const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REPUTATION_CONFIG = {
  DEFAULT_SCORE: 50,
  ON_TIME_BONUS: 5,
  MISSED_SLOT_PENALTY: -5,
  MIN_SCORE: 10,
  MAX_SCORE: 100,
  FRAUD_PENALTY: -15,
  FIRST_MONTH_GRACE_DAYS: 30
};

const initializeNewUserReputation = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, reputationScore: true }
  });

  if (!user) return null;

  const daysSinceRegistration = Math.floor(
    (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
  );

  const initialScore = daysSinceRegistration <= REPUTATION_CONFIG.FIRST_MONTH_GRACE_DAYS
    ? REPUTATION_CONFIG.DEFAULT_SCORE
    : user.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE;

  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: initialScore }
  });

  await prisma.reputationLog.create({
    data: {
      userId,
      changeReason: 'New user initialization',
      scoreChange: initialScore
    }
  });

  return initialScore;
};

const calculateReputationScore = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputationScore: true, createdAt: true }
  });

  if (!user) return REPUTATION_CONFIG.DEFAULT_SCORE;

  const daysSinceRegistration = Math.floor(
    (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceRegistration <= REPUTATION_CONFIG.FIRST_MONTH_GRACE_DAYS) {
    return REPUTATION_CONFIG.DEFAULT_SCORE;
  }

  return Math.max(
    REPUTATION_CONFIG.MIN_SCORE,
    Math.min(REPUTATION_CONFIG.MAX_SCORE, user.reputationScore)
  );
};

const updateReputationOnCollection = async (userId, collectedOnTime = true) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputationScore: true }
  });

  if (!user) return null;

  const currentScore = user.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE;
  const scoreChange = collectedOnTime
    ? REPUTATION_CONFIG.ON_TIME_BONUS
    : 0;

  let newScore = currentScore + scoreChange;
  newScore = Math.max(
    REPUTATION_CONFIG.MIN_SCORE,
    Math.min(REPUTATION_CONFIG.MAX_SCORE, newScore)
  );

  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: newScore }
  });

  await prisma.reputationLog.create({
    data: {
      userId,
      changeReason: collectedOnTime
        ? 'On-time ration collection'
        : 'Late ration collection (no bonus)',
      scoreChange: scoreChange
    }
  });

  return { oldScore: currentScore, newScore, change: scoreChange };
};

const updateReputationOnMissedSlot = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputationScore: true }
  });

  if (!user) return null;

  const currentScore = user.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE;
  const scoreChange = REPUTATION_CONFIG.MISSED_SLOT_PENALTY;

  let newScore = currentScore + scoreChange;
  newScore = Math.max(
    REPUTATION_CONFIG.MIN_SCORE,
    Math.min(REPUTATION_CONFIG.MAX_SCORE, newScore)
  );

  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: newScore }
  });

  await prisma.reputationLog.create({
    data: {
      userId,
      changeReason: 'Missed scheduled slot',
      scoreChange: scoreChange
    }
  });

  return { oldScore: currentScore, newScore, change: scoreChange };
};

const updateReputationOnFraud = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputationScore: true }
  });

  if (!user) return null;

  const currentScore = user.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE;
  const scoreChange = REPUTATION_CONFIG.FRAUD_PENALTY;

  let newScore = currentScore + scoreChange;
  newScore = Math.max(
    REPUTATION_CONFIG.MIN_SCORE,
    Math.min(REPUTATION_CONFIG.MAX_SCORE, newScore)
  );

  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: newScore }
  });

  await prisma.reputationLog.create({
    data: {
      userId,
      changeReason: 'Fraud attempt detected',
      scoreChange: scoreChange
    }
  });

  return { oldScore: currentScore, newScore, change: scoreChange };
};

const calculateFinalPriority = (cardType, reputationScore) => {
  const cardTypePriority = {
    'AAY': 1,
    'PHH': 2,
    'NPHH': 3,
    'NPHH_S': 4
  };

  const basePriority = cardTypePriority[cardType] || 3;
  const reputationAdjustment = reputationScore / 200;

  return basePriority - reputationAdjustment;
};

const getUsersByReputationTier = async (shopId = null) => {
  const where = shopId ? { shopId } : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      rationCardNumber: true,
      cardType: true,
      reputationScore: true,
      status: true
    }
  });

  const tiers = {
    priority: users.filter(u => u.reputationScore >= 70),
    normal: users.filter(u => u.reputationScore >= 40 && u.reputationScore < 70),
    atRisk: users.filter(u => u.reputationScore >= 10 && u.reputationScore < 40),
    blocked: users.filter(u => u.reputationScore < 10)
  };

  return tiers;
};

const monthlyReputationUpdate = async (shopId = null) => {
  const where = shopId ? { shopId } : {};

  const users = await prisma.user.findMany({ where });

  const results = {
    updated: [],
    atRisk: [],
    blocked: []
  };

  for (const user of users) {
    const score = user.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE;

    if (score < REPUTATION_CONFIG.MIN_SCORE + 10) {
      results.atRisk.push({
        userId: user.id,
        name: user.name,
        currentScore: score,
        message: 'Below minimum threshold - may not receive next month slot'
      });
    }

    if (score <= REPUTATION_CONFIG.MIN_SCORE) {
      results.blocked.push({
        userId: user.id,
        name: user.name,
        currentScore: score
      });
    }

    results.updated.push({
      userId: user.id,
      name: user.name,
      score: score
    });
  }

  return results;
};

const getUserReputation = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reputationLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });
  return user;
};

const logReputationChange = async (userId, reason, scoreChange) => {
  const log = await prisma.reputationLog.create({
    data: {
      userId,
      changeReason: reason,
      scoreChange
    }
  });
  return log;
};

const getReputationStats = async (shopId = null) => {
  const where = shopId ? { shopId } : {};

  const users = await prisma.user.findMany({
    where,
    select: { reputationScore: true }
  });

  const scores = users.map(u => u.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || REPUTATION_CONFIG.DEFAULT_SCORE;

  const distribution = {
    excellent: users.filter(u => (u.reputationScore || 0) >= 80).length,
    good: users.filter(u => (u.reputationScore || 0) >= 60 && (u.reputationScore || 0) < 80).length,
    average: users.filter(u => (u.reputationScore || 0) >= 40 && (u.reputationScore || 0) < 60).length,
    poor: users.filter(u => (u.reputationScore || 0) >= 10 && (u.reputationScore || 0) < 40).length,
    critical: users.filter(u => (u.reputationScore || 0) < 10).length
  };

  return {
    totalUsers: users.length,
    averageScore: Math.round(avgScore * 100) / 100,
    distribution,
    minScore: Math.min(...scores) || REPUTATION_CONFIG.MIN_SCORE,
    maxScore: Math.max(...scores) || REPUTATION_CONFIG.MAX_SCORE
  };
};

const resetBlockedUserReputation = async (userId, officerId, reason) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      rationCardNumber: true, 
      reputationScore: true,
      shopId: true
    }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const currentScore = user.reputationScore || REPUTATION_CONFIG.DEFAULT_SCORE;
  
  if (currentScore > REPUTATION_CONFIG.MIN_SCORE) {
    return { 
      success: false, 
      error: `User score is ${currentScore}, not blocked. Only blocked users (≤10) need reset.` 
    };
  }

  const RESET_SCORE = 50;

  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: RESET_SCORE }
  });

  await prisma.reputationLog.create({
    data: {
      userId,
      changeReason: `PDS Officer reset - Reason: ${reason} (Reset by officer ${officerId})`,
      scoreChange: RESET_SCORE - currentScore
    }
  });

  return {
    success: true,
    userId: user.id,
    userName: user.name,
    rationCardNumber: user.rationCardNumber,
    previousScore: currentScore,
    newScore: RESET_SCORE,
    message: 'User reputation reset to 50 - eligible for next month slot allocation'
  };
};

const getBlockedUsersForShop = async (shopId) => {
  const where = shopId ? { shopId } : {};

  const blockedUsers = await prisma.user.findMany({
    where: {
      ...where,
      reputationScore: { lte: REPUTATION_CONFIG.MIN_SCORE }
    },
    select: {
      id: true,
      name: true,
      rationCardNumber: true,
      phone: true,
      cardType: true,
      reputationScore: true,
      shopId: true,
      createdAt: true,
      reputationLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  return blockedUsers;
};

const createResetRequest = async (userId, staffId, staffName, reason) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      rationCardNumber: true, 
      reputationScore: true,
      shopId: true
    }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const existingRequest = await prisma.reputationResetRequest.findFirst({
    where: {
      userId: userId,
      status: 'PENDING'
    }
  });

  if (existingRequest) {
    return { 
      success: false, 
      error: 'A pending request already exists for this user' 
    };
  }

  const resetRequest = await prisma.reputationResetRequest.create({
    data: {
      userId: user.id,
      userName: user.name,
      rationCardNumber: user.rationCardNumber,
      shopId: user.shopId,
      staffId: staffId,
      staffName: staffName,
      reason: reason,
      status: 'PENDING'
    }
  });

  return {
    success: true,
    requestId: resetRequest.id,
    userId: user.id,
    userName: user.name,
    rationCardNumber: user.rationCardNumber,
    currentScore: user.reputationScore,
    reason: reason,
    message: 'Reset request submitted. PDS Officer will review and approve.',
    submittedAt: resetRequest.createdAt
  };
};

const getResetRequests = async (shopId = null, status = null) => {
  const where = {};
  
  if (shopId) {
    where.shopId = shopId;
  }
  
  if (status) {
    where.status = status;
  }

  const requests = await prisma.reputationResetRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  return requests;
};

const approveResetRequest = async (requestId, officerId, officerReason) => {
  const request = await prisma.reputationResetRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  if (request.status !== 'PENDING') {
    return { success: false, error: 'Request already processed' };
  }

  const user = await prisma.user.findUnique({
    where: { id: request.userId }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const previousScore = user.reputationScore;
  const RESET_SCORE = 50;

  await prisma.$transaction([
    prisma.reputationResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedBy: officerId,
        reviewedAt: new Date(),
        reviewedReason: officerReason
      }
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: { reputationScore: RESET_SCORE }
    }),
    prisma.reputationLog.create({
      data: {
        userId: request.userId,
        changeReason: `PDS Officer approved reset - Reason: ${officerReason}`,
        scoreChange: RESET_SCORE - previousScore
      }
    })
  ]);

  return {
    success: true,
    requestId: requestId,
    userId: request.userId,
    userName: request.userName,
    rationCardNumber: request.rationCardNumber,
    previousScore: previousScore,
    newScore: RESET_SCORE,
    message: 'Request approved. User reputation reset to 50.'
  };
};

const rejectResetRequest = async (requestId, officerId, reason) => {
  const request = await prisma.reputationResetRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  if (request.status !== 'PENDING') {
    return { success: false, error: 'Request already processed' };
  }

  await prisma.reputationResetRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      reviewedBy: officerId,
      reviewedAt: new Date(),
      reviewedReason: reason
    }
  });

  return {
    success: true,
    requestId: requestId,
    message: 'Request rejected'
  };
};

const requestReputationReset = async (userId, reason, requestType = 'STAFF') => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      rationCardNumber: true, 
      reputationScore: true,
      shopId: true
    }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  return {
    success: true,
    requestId: `REQ-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    rationCardNumber: user.rationCardNumber,
    currentScore: user.reputationScore,
    reason: reason,
    requestType: requestType,
    message: 'Reset request submitted. PDS Officer will review and approve.',
    submittedAt: new Date().toISOString()
  };
};

module.exports = {
  REPUTATION_CONFIG,
  initializeNewUserReputation,
  calculateReputationScore,
  calculateFinalPriority,
  updateReputationOnCollection,
  updateReputationOnMissedSlot,
  updateReputationOnFraud,
  getUsersByReputationTier,
  monthlyReputationUpdate,
  getUserReputation,
  logReputationChange,
  getReputationStats,
  resetBlockedUserReputation,
  getBlockedUsersForShop,
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
  requestReputationReset
};