const express = require('express');
const { 
  addReaction, 
  removeReaction, 
  getUserReaction, 
  getReactionCount 
} = require('../controllers/reactionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/post/:postId', authenticateToken, addReaction);
router.delete('/post/:postId', authenticateToken, removeReaction);
router.get('/post/:postId/user', authenticateToken, getUserReaction);
router.get('/post/:postId/count', authenticateToken, getReactionCount);

module.exports = router;