const express = require('express');
const { getUsername, getProfilePhoto, updateProfilePhoto, searchUsers } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/search', authenticateToken, searchUsers);
router.get('/:userId/username', getUsername);
router.get('/:userId/avatar', getProfilePhoto);
router.post('/avatar', authenticateToken, upload.single('avatar'), updateProfilePhoto);

module.exports = router;