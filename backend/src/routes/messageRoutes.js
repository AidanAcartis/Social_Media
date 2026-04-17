const express = require('express');
const { 
  getMessages, 
  sendMessage, 
  markMessagesAsRead, 
  getUnreadCount 
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);
router.put('/read', authenticateToken, markMessagesAsRead);
router.get('/unread/count', authenticateToken, getUnreadCount);

module.exports = router;