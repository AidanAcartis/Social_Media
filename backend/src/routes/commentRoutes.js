const express = require('express');
const { 
  getCommentsByPost, 
  addComment, 
  deleteComment,
  addCommentReaction,
  removeCommentReaction
} = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/post/:postId', authenticateToken, getCommentsByPost);
router.post('/post/:postId', authenticateToken, addComment);
router.delete('/:commentId', authenticateToken, deleteComment);
router.post('/:commentId/reactions', authenticateToken, addCommentReaction);
router.delete('/:commentId/reactions', authenticateToken, removeCommentReaction);

module.exports = router;