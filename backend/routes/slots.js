const express = require('express');
const { getSlots, createSlot, deleteAllSlots } = require('../controllers/slotController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, getSlots);
router.post('/create', authMiddleware, validate(schemas.slotCreate), createSlot);
router.delete('/all', authMiddleware, deleteAllSlots);

module.exports = router;

