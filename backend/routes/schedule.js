const express = require('express');
const { generateDailyScheduleAI, assignSlotsAI, getTodaySchedule, generateSchedule } = require('../controllers/scheduleController');
const { authMiddleware } = require('../middleware/auth');
const scheduleService = require('../services/scheduleService');

const router = express.Router();

router.post('/generate-ai', authMiddleware, generateDailyScheduleAI);
router.post('/assign-ai', authMiddleware, assignSlotsAI);
router.get('/today', authMiddleware, getTodaySchedule);
router.get('/today-summary', authMiddleware, async (req, res) => {
  try {
    const shopId = req.user.shopId || req.query.shopId;
    const summary = await scheduleService.getTodaySummary(shopId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching today summary:', error);
    res.status(500).json({ error: 'Failed to fetch today summary' });
  }
});
router.post('/generate-schedule', authMiddleware, generateSchedule);

// Manual scheduling endpoint - triggers autoSchedule for pending cards
// Supports custom delayDays parameter
router.post('/run-schedule', authMiddleware, async (req, res) => {
  try {
    const { shopId, delayDays } = req.body;
    const result = await scheduleService.autoSchedule(shopId, delayDays);
    res.json(result);
  } catch (error) {
    console.error('Run schedule error:', error);
    res.status(500).json({ error: 'Failed to run schedule' });
  }
});

// Mark users as MISSED if their scheduled date has passed
router.post('/mark-missed', authMiddleware, async (req, res) => {
  try {
    const { shopId } = req.body;
    const result = await scheduleService.markMissedUsers(shopId);
    res.json(result);
  } catch (error) {
    console.error('Mark missed error:', error);
    res.status(500).json({ error: 'Failed to mark missed users' });
  }
});

// Auto-reschedule MISSED users to next available slot
router.post('/reschedule-missed', authMiddleware, async (req, res) => {
  try {
    const { shopId, delayDays } = req.body;
    const result = await scheduleService.rescheduleMissedUsers(shopId, delayDays);
    res.json(result);
  } catch (error) {
    console.error('Reschedule missed error:', error);
    res.status(500).json({ error: 'Failed to reschedule missed users' });
  }
});

// Combined: Mark missed AND reschedule in one call
router.post('/process-missed', authMiddleware, async (req, res) => {
  try {
    const { shopId, delayDays } = req.body;
    
    // Step 1: Mark users as missed
    const markResult = await scheduleService.markMissedUsers(shopId);
    
    // Step 2: Reschedule missed users
    const rescheduleResult = await scheduleService.rescheduleMissedUsers(shopId, delayDays);
    
    res.json({
      markedAsMissed: markResult.count,
      rescheduled: rescheduleResult.rescheduled || 0,
      stillPending: rescheduleResult.stillPending || 0,
      newCollectionDate: rescheduleResult.newCollectionDate
    });
  } catch (error) {
    console.error('Process missed error:', error);
    res.status(500).json({ error: 'Failed to process missed users' });
  }
});

module.exports = router;

