const { promisePool } = require('../config/database');

// Récupérer les commentaires d'un post
const getCommentsByPost = async (req, res) => {
  const { postId } = req.params;
  
  try {
    const [comments] = await promisePool.query(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.post_id = ? 
       ORDER BY c.created_at DESC`,
      [postId]
    );
    
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ajouter un commentaire
const addComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
  }
  
  try {
    const [result] = await promisePool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content.trim()]
    );
    
    // Récupérer le post owner pour la notification
    const [post] = await promisePool.query(
      'SELECT user_id FROM posts WHERE id = ?',
      [postId]
    );
    
    if (post.length > 0 && post[0].user_id !== userId) {
      // Ajouter une notification
      await promisePool.query(
        'INSERT INTO notifications (user_id, actor_id, type, post_id, is_read) VALUES (?, ?, "comment", ?, 0)',
        [post[0].user_id, userId, postId]
      );
    }
    
    // Récupérer le commentaire créé avec le nom d'utilisateur
    const [newComment] = await promisePool.query(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un commentaire
const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  
  try {
    // Vérifier que l'utilisateur est propriétaire du commentaire
    const [comment] = await promisePool.query(
      'SELECT user_id FROM comments WHERE id = ?',
      [commentId]
    );
    
    if (comment.length === 0) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }
    
    if (comment[0].user_id !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    await promisePool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    
    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ajouter une réaction à un commentaire
const addCommentReaction = async (req, res) => {
  const { commentId } = req.params;
  const { type } = req.body;
  const userId = req.user.id;
  
  if (!type) {
    return res.status(400).json({ message: 'Type de réaction requis' });
  }
  
  try {
    // Vérifier si l'utilisateur a déjà réagi
    const [existing] = await promisePool.query(
      'SELECT * FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );
    
    if (existing.length > 0) {
      // Mettre à jour la réaction existante
      await promisePool.query(
        'UPDATE comment_reactions SET reaction_type = ? WHERE comment_id = ? AND user_id = ?',
        [type, commentId, userId]
      );
    } else {
      // Ajouter une nouvelle réaction
      await promisePool.query(
        'INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [commentId, userId, type]
      );
      
      // Récupérer le commentaire pour la notification
      const [comment] = await promisePool.query(
        'SELECT c.user_id, c.post_id FROM comments c WHERE c.id = ?',
        [commentId]
      );
      
      if (comment.length > 0 && comment[0].user_id !== userId) {
        await promisePool.query(
          'INSERT INTO notifications (user_id, actor_id, type, post_id, is_read) VALUES (?, ?, "comment_reaction", ?, 0)',
          [comment[0].user_id, userId, comment[0].post_id]
        );
      }
    }
    
    // Compter les réactions
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM comment_reactions WHERE comment_id = ?',
      [commentId]
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

// Supprimer une réaction de commentaire
const removeCommentReaction = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );
    
    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as count FROM comment_reactions WHERE comment_id = ?',
      [commentId]
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

module.exports = {
  getCommentsByPost,
  addComment,
  deleteComment,
  addCommentReaction,
  removeCommentReaction
};