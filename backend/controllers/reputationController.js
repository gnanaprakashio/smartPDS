const reputationService = require('../services/reputationService');

const getReputation = async (req, res) => {
  try {
    const reputation = await reputationService.getUserReputation(req.params.userId);
    if (!reputation) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      userId: reputation.id,
      name: reputation.name,
      rationCardNumber: reputation.rationCardNumber,
      cardType: reputation.cardType,
      reputationScore: reputation.reputationScore,
      createdAt: reputation.createdAt,
      logs: reputation.reputationLogs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reputation' });
  }
};

const getReputationStats = async (req, res) => {
  try {
    const { shopId } = req.query;
    const stats = await reputationService.getReputationStats(shopId || null);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reputation stats' });
  }
};

const updateReputationOnCollection = async (req, res) => {
  try {
    const { userId, collectedOnTime } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await reputationService.updateReputationOnCollection(userId, collectedOnTime);
    
    res.json({
      success: true,
      message: collectedOnTime ? 'On-time collection (+5 reputation)' : 'Collection recorded',
      reputation: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update reputation' });
  }
};

const markUserMissed = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await reputationService.updateReputationOnMissedSlot(userId);
    
    res.json({
      success: true,
      message: 'User marked as missed (-5 reputation)',
      reputation: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark missed' });
  }
};

const calculatePriority = async (req, res) => {
  try {
    const { cardType, reputationScore } = req.body;
    
    if (!cardType || reputationScore === undefined) {
      return res.status(400).json({ error: 'cardType and reputationScore are required' });
    }

    const finalPriority = reputationService.calculateFinalPriority(cardType, reputationScore);
    
    res.json({
      cardType,
      reputationScore,
      basePriority: { AAY: 1, PHH: 2, NPHH: 3, NPHH_S: 4 }[cardType] || 3,
      finalPriority: Math.round(finalPriority * 1000) / 1000,
      explanation: 'Lower priority = scheduled earlier'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate priority' });
  }
};

const getUsersByTier = async (req, res) => {
  try {
    const { shopId } = req.query;
    const tiers = await reputationService.getUsersByReputationTier(shopId || null);
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user tiers' });
  }
};

const monthlyUpdate = async (req, res) => {
  try {
    const { shopId } = req.body;
    const result = await reputationService.monthlyReputationUpdate(shopId || null);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: 'Monthly update failed' });
  }
};

const resetBlockedUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const officerId = req.user?.id || 'ADMIN';

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Reason is required (minimum 10 characters) to document why reset is being done' 
      });
    }

    const result = await reputationService.resetBlockedUserReputation(userId, officerId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'User reputation reset successfully',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset reputation' });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const { shopId } = req.query;
    const blockedUsers = await reputationService.getBlockedUsersForShop(shopId || null);
    res.json({
      success: true,
      count: blockedUsers.length,
      blockedUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

const submitResetRequest = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const { requestType } = req.query;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' });
    }

    const result = await reputationService.requestReputationReset(
      userId, 
      reason, 
      requestType || 'STAFF'
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

const createStaffResetRequest = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    const staffId = req.user?.id || 'STAFF';
    const staffName = req.user?.name || 'Shop Staff';

    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Reason must be at least 10 characters describing the user issue' 
      });
    }

    const result = await reputationService.createResetRequest(userId, staffId, staffName, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reset request' });
  }
};

const getAllResetRequests = async (req, res) => {
  try {
    const { shopId, status } = req.query;
    
    const requests = await reputationService.getResetRequests(
      shopId || null,
      status || null
    );

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const officerId = req.user?.id || 'PDS_OFFICER';

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Reason required (min 10 chars) to document approval' 
      });
    }

    const result = await reputationService.approveResetRequest(requestId, officerId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Request approved and reputation reset to 50',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const officerId = req.user?.id || 'PDS_OFFICER';

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Reason required to document rejection' 
      });
    }

    const result = await reputationService.rejectResetRequest(requestId, officerId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Request rejected',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
};

module.exports = {
  getReputation,
  getReputationStats,
  updateReputationOnCollection,
  markUserMissed,
  calculatePriority,
  getUsersByTier,
  monthlyUpdate,
  resetBlockedUser,
  getBlockedUsers,
  submitResetRequest,
  createStaffResetRequest,
  getAllResetRequests,
  approveRequest,
  rejectRequest
};