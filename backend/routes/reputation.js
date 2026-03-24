const express = require('express');
const {
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
} = require('../controllers/reputationController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, getReputationStats);
router.get('/tiers', authMiddleware, getUsersByTier);
router.get('/blocked', authMiddleware, getBlockedUsers);
router.get('/requests', authMiddleware, getAllResetRequests);
router.get('/:userId', authMiddleware, getReputation);
router.post('/calculate-priority', authMiddleware, calculatePriority);
router.post('/collection', authMiddleware, updateReputationOnCollection);
router.post('/missed', authMiddleware, markUserMissed);
router.post('/monthly-update', authMiddleware, monthlyUpdate);

router.post('/reset-blocked', authMiddleware, resetBlockedUser);
router.post('/request-reset', authMiddleware, submitResetRequest);

router.post('/staff-request', authMiddleware, createStaffResetRequest);
router.post('/approve-request', authMiddleware, approveRequest);
router.post('/reject-request', authMiddleware, rejectRequest);

module.exports = router;