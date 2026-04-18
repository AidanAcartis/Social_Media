const express = require('express');
const { 
  getFriends, 
  sendFriendRequest, 
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  cancelFriendRequest,
  checkFriendStatus,
  removeFriend
} = require('../controllers/followerController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes GET
router.get('/', authenticateToken, getFriends);
router.get('/pending', authenticateToken, getPendingRequests);
router.get('/check', authenticateToken, checkFriendStatus);

// Routes POST
router.post('/request', authenticateToken, sendFriendRequest);
router.post('/accept', authenticateToken, acceptFriendRequest);
router.post('/reject', authenticateToken, rejectFriendRequest);
router.post('/cancel', authenticateToken, cancelFriendRequest);
router.post('/remove', authenticateToken, removeFriend);

module.exports = router;