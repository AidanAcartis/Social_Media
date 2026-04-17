const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { promisePool } = require('../config/database');

const router = express.Router();

// Route pour créer un post
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  console.log('=== CREATE POST ===');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  
  const userId = req.user.id;
  const content = req.body.content || '';
  const imagePath = req.file ? `/uploads/posts/${req.file.filename}` : null;
  
  try {
    const [result] = await promisePool.query(
      'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
      [userId, content, imagePath]
    );
    
    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      content: content,
      image: imagePath,
      created_at: new Date()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer les posts d'un utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, u.username 
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;