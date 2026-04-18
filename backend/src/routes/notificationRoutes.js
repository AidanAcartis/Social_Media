const express = require('express');
const { getNotifications, getUnreadCount, markAllAsRead, markOneAsRead } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.get('/unread/count', authenticateToken, getUnreadCount);
router.put('/read', authenticateToken, markAllAsRead);
router.put('/read/:notificationId', authenticateToken, markOneAsRead);

module.exports = router;