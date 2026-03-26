const express = require('express');
const { updateInventory, getInventory, resetInventory } = require('../controllers/inventoryController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, pdsOfficerMiddleware } = require('../middleware/auth');

const router = express.Router();

// Update inventory - only PDS Officer can do this
router.post('/update', authMiddleware, pdsOfficerMiddleware, validate(schemas.inventoryUpdate), updateInventory);

// Get inventory - both can view
router.get('/', authMiddleware, getInventory);

// Reset inventory to zero (PDS Officer only)
router.post('/reset', authMiddleware, pdsOfficerMiddleware, resetInventory);

module.exports = router;

