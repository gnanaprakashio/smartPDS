const fraudService = require('../services/fraudService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFraudAlerts = async (req, res) => {
  try {
    const alerts = await fraudService.getFraudAlerts(50);
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
};

const takeAdminAction = async (req, res) => {
  try {
    const { fraudLogId, action } = req.body;
    
    const result = await fraudService.takeAdminAction(fraudLogId, action, req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const getFraudStats = async (req, res) => {
  try {
    const stats = await fraudService.getFraudStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch fraud stats' });
  }
};

module.exports = {
  getFraudAlerts,
  takeAdminAction,
  getFraudStats
};

