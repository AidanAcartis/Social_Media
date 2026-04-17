const express = require('express');
const { searchUsers, searchPosts, globalSearch } = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticateToken, searchUsers);
router.get('/posts', authenticateToken, searchPosts);
router.get('/global', authenticateToken, globalSearch);

module.exports = router;