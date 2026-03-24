const rationsService = require('../services/rationsService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const verifyOTPAndDistribute = async (req, res) => {
  try {
    const { verificationId } = req.body;
    
    const result = await rationsService.completeRationDistribution(verificationId);
    
    res.json(result);
  } catch (error) {
    console.error('Ration distribution error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const getUserRationHistory = async (req, res) => {
  try {
    const userAssignments = await prisma.slotAssignment.findMany({
      where: {
        userId: req.user.id,
        status: 'COMPLETED'
      },
      include: {
        slot: true,
        user: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    res.json(userAssignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ration history' });
  }
};

module.exports = {
  verifyOTPAndDistribute,
  getUserRationHistory
};

