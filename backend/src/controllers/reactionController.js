const { promisePool } = require('../config/database');

// Ajouter une réaction à un post
const addReaction = async (req, res) => {
  const { postId } = req.params;
  const { type } = req.body;
  const userId = req.user.id;
  
  if (!type) {
    return res.status(400).json({ message: 'Type de réaction requis' });
  }
  
  try {
    // Vérifier si l'utilisateur a déjà réagi
    const [existing] = await promisePool.query(
      'SELECT * FROM post_reactions WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    
    if (existing.length > 0) {
      // Mettre à jour la réaction existante
      await promisePool.query(
        'UPDATE post_reactions SET reaction_type = ? WHERE post_id = ? AND user_id = ?',
        [type, postId, userId]
      );
    } else {
      // Ajouter une nouvelle réaction
      await promisePool.query(
        'INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [postId, userId, type]
      );
      
      // Récupérer le post owner pour la notification
      const [post] = await promisePool.query(
        'SELECT user_id FROM posts WHERE id = ?',
        [postId]
      );
      
      if (post.length > 0 && post[0].user_id !== userId) {
        await promisePool.query(
          'INSERT INTO notifications (user_id, actor_id, type, post_id, is_read) VALUES (?, ?, "reaction", ?, 0)',
          [post[0].user_id, userId, postId]
        );
      }
    }
    
    // Compter les réactions
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM post_reactions WHERE post_id = ?',
      [postId]
    );
    
    res.json({ 
      message: 'Réaction ajoutée avec succès',
      reaction: type,
      count: countResult[0].count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une réaction
const removeReaction = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM post_reactions WHERE post_id = ?',
      [postId]
    );
    
    res.json({ 
      message: 'Réaction supprimée',
      count: countResult[0].count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer la réaction d'un utilisateur sur un post
const getUserReaction = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  try {
    const [reaction] = await promisePool.query(
      'SELECT reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    
    res.json({ reaction: reaction.length > 0 ? reaction[0].reaction_type : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Compter les réactions d'un post
const getReactionCount = async (req, res) => {
  const { postId } = req.params;
  
  try {
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM post_reactions WHERE post_id = ?',
      [postId]
    );
    
    res.json({ count: countResult[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  addReaction,
  removeReaction,
  getUserReaction,
  getReactionCount
};