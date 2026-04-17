const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/read', authenticateToken, markAsRead);

module.exports = router;