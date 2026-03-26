const express = require('express');
const { registerUser, getAllUsers, getUserById, getCardCounts, getAllShops, deleteAllUsers, uploadUsersCSV, upload, markCollected, searchUsers, updateUser, deleteUser } = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, staffMiddleware, pdsOfficerMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register user - both PDS Officer and Staff can do this
router.post('/register', authMiddleware, staffMiddleware, validate(schemas.userRegister), registerUser);

// Get all users - both can view
router.get('/', authMiddleware, getAllUsers);

// Search users by ration card number or phone (for Staff/PDS Officer)
router.get('/search', authMiddleware, searchUsers);

// Get all unique shops
router.get('/shops', authMiddleware, getAllShops);

// Get card type counts
router.get('/counts', authMiddleware, getCardCounts);

// Delete all users (PDS Officer only)
router.delete('/all', authMiddleware, pdsOfficerMiddleware, deleteAllUsers);

// Update user (edit/modify user data) - PDS Officer only
router.put('/:id', authMiddleware, pdsOfficerMiddleware, updateUser);

// Delete single user (remove user data) - PDS Officer only
router.delete('/:id', authMiddleware, pdsOfficerMiddleware, deleteUser);

// Get user by ID
router.get('/:id', authMiddleware, getUserById);

// Upload CSV - both PDS Officer and Staff can do this
router.post('/upload-users', authMiddleware, staffMiddleware, upload.single('file'), uploadUsersCSV);

// Mark user as collected - PDS Officer and Staff can update
router.patch('/:id/collect', authMiddleware, markCollected);

module.exports = router;

