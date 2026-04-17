const express = require('express');
const { 
  getFeed, 
  getUserPosts, 
  getPost, 
  createPost, 
  deletePost 
} = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/feed', authenticateToken, getFeed);
router.get('/user/:userId', authenticateToken, getUserPosts);
router.get('/:postId', authenticateToken, getPost);
router.post('/', authenticateToken, upload.single('image'), createPost);
router.delete('/:postId', authenticateToken, deletePost);

module.exports = router;