const express = require('express');
const { getFriends, follow, unfollow, checkFollowStatus } = require('../controllers/followerController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getFriends);
router.post('/follow', authenticateToken, follow);
router.post('/unfollow', authenticateToken, unfollow);
router.get('/check', authenticateToken, checkFollowStatus);

module.exports = router;