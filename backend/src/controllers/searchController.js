const { promisePool } = require('../config/database');

// Rechercher des utilisateurs
const searchUsers = async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user.id;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Terme de recherche trop court (minimum 2 caractères)' });
  }
  
  try {
    const [users] = await promisePool.query(
      `SELECT u.id, u.username, u.email, 
        p.photo_path as avatar,
        (SELECT COUNT(*) FROM followers WHERE followed_id = u.id) as followersCount,
        (SELECT COUNT(*) FROM followers WHERE follower_id = ? AND followed_id = u.id) as isFollowing
       FROM users u
       LEFT JOIN profile_photo p ON u.id = p.user_id
       WHERE u.username LIKE ? AND u.id != ?
       ORDER BY u.username
       LIMIT 20`,
      [currentUserId, `%${q}%`, currentUserId]
    );
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rechercher des posts
const searchPosts = async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user.id;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Terme de recherche trop court' });
  }
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, u.username,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
        (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ?) as userReaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.content LIKE ?
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [currentUserId, `%${q}%`]
    );
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Recherche globale
const globalSearch = async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user.id;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Terme de recherche trop court' });
  }
  
  try {
    // Rechercher les utilisateurs
    const [users] = await promisePool.query(
      `SELECT u.id, u.username, u.email, 'user' as type,
        p.photo_path as avatar
       FROM users u
       LEFT JOIN profile_photo p ON u.id = p.user_id
       WHERE u.username LIKE ? AND u.id != ?
       LIMIT 10`,
      [`%${q}%`, currentUserId]
    );
    
    // Rechercher les posts
    const [posts] = await promisePool.query(
      `SELECT p.id, p.content, p.created_at, 'post' as type,
        u.username, u.id as userId
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.content LIKE ?
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [`%${q}%`]
    );
    
    res.json({ users, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  searchUsers,
  searchPosts,
  globalSearch
};