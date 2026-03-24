const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { createQueue, getQueues, getAllQueues, updateQueueStatus } = require('../controllers/queueController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createQueue);
router.get('/my', getQueues);
router.get('/', getAllQueues); // Admin sees all
router.patch('/:id/status', updateQueueStatus);

module.exports = router;

