const { promisePool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Récupérer tous les posts (feed)
const getFeed = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, u.username, 
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
        (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ?) as userReaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id IN (SELECT followed_id FROM followers WHERE follower_id = ?) OR p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId, userId, userId]
    );
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les posts d'un utilisateur
const getUserPosts = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, u.username,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
        (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ?) as userReaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [currentUserId, userId]
    );
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un post spécifique
const getPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, u.username,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
        (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ?) as userReaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [userId, postId]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }
    
    res.json(posts[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un post
const createPost = async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  let imagePath = null;
  
  if (req.file) {
    imagePath = `/uploads/posts/${req.file.filename}`;
  }
  
  try {
    const [result] = await promisePool.query(
      'INSERT INTO posts (user_id, content, image, doc_type, doc_url) VALUES (?, ?, ?, ?, ?)',
      [userId, content || '', imagePath, imagePath ? 'photo' : null, imagePath]
    );
    
    // Notifier les followers
    const [followers] = await promisePool.query(
      'SELECT follower_id FROM followers WHERE followed_id = ?',
      [userId]
    );
    
    for (const follower of followers) {
      await promisePool.query(
        'INSERT INTO notifications (user_id, actor_id, type, post_id, is_read) VALUES (?, ?, "new_post", ?, 0)',
        [follower.follower_id, userId, result.insertId]
      );
    }
    
    const [newPost] = await promisePool.query(
      `SELECT p.*, u.username,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newPost[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un post
const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  try {
    const [post] = await promisePool.query(
      'SELECT user_id, image FROM posts WHERE id = ?',
      [postId]
    );
    
    if (post.length === 0) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }
    
    if (post[0].user_id !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Supprimer l'image si elle existe
    if (post[0].image) {
      const imagePath = path.join(__dirname, '../../', post[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await promisePool.query('DELETE FROM posts WHERE id = ?', [postId]);
    
    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getFeed,
  getUserPosts,
  getPost,
  createPost,
  deletePost
};