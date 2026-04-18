const { promisePool } = require('../config/database');

// Récupérer les amis (uniquement les relations acceptées)
const getFriends = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [friends] = await promisePool.query(
      `SELECT u.id, u.username, u.email, 
        f.status, f.created_at as friendship_date
       FROM followers f
       JOIN users u ON (u.id = f.follower_id OR u.id = f.followed_id)
       WHERE (f.follower_id = ? OR f.followed_id = ?)
         AND f.status = 'accepted'
         AND u.id != ?
       GROUP BY u.id`,
      [userId, userId, userId]
    );
    
    res.json({ status: 'success', data: friends });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// Envoyer une demande d'ami
const sendFriendRequest = async (req, res) => {
  const { followed_id } = req.body;
  const follower_id = req.user.id;
  
  if (follower_id === followed_id) {
    return res.status(400).json({ status: 'error', message: 'Vous ne pouvez pas vous suivre vous-même' });
  }
  
  try {
    // Vérifier si une demande existe déjà
    const [existing] = await promisePool.query(
      'SELECT * FROM followers WHERE (follower_id = ? AND followed_id = ?) OR (follower_id = ? AND followed_id = ?)',
      [follower_id, followed_id, followed_id, follower_id]
    );
    
    if (existing.length > 0) {
      if (existing[0].status === 'pending') {
        return res.status(400).json({ status: 'error', message: 'Demande déjà envoyée' });
      } else if (existing[0].status === 'accepted') {
        return res.status(400).json({ status: 'error', message: 'Vous êtes déjà amis' });
      }
    }
    
    await promisePool.query(
      'INSERT INTO followers (follower_id, followed_id, status) VALUES (?, ?, "pending")',
      [follower_id, followed_id]
    );
    
    // Créer une notification
    await promisePool.query(
      'INSERT INTO notifications (user_id, actor_id, type, is_read) VALUES (?, ?, "friend_request", 0)',
      [followed_id, follower_id]
    );
    
    res.json({ status: 'success', message: 'Demande d\'ami envoyée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// Accepter une demande d'ami
const acceptFriendRequest = async (req, res) => {
  const { request_id } = req.body; // ID de la relation
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'UPDATE followers SET status = "accepted" WHERE id = ? AND followed_id = ? AND status = "pending"',
      [request_id, userId]
    );
    
    res.json({ status: 'success', message: 'Demande acceptée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// Refuser une demande d'ami
const rejectFriendRequest = async (req, res) => {
  const { request_id } = req.body;
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'DELETE FROM followers WHERE id = ? AND followed_id = ? AND status = "pending"',
      [request_id, userId]
    );
    
    res.json({ status: 'success', message: 'Demande refusée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// Récupérer les demandes d'amis en attente
const getPendingRequests = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [requests] = await promisePool.query(
      `SELECT f.id as request_id, f.created_at, u.id, u.username, u.email,
        p.photo_path as avatar
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       LEFT JOIN profile_photo p ON u.id = p.user_id
       WHERE f.followed_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// Annuler une demande d'ami
const cancelFriendRequest = async (req, res) => {
  const { followed_id } = req.body;
  const follower_id = req.user.id;
  
  try {
    await promisePool.query(
      'DELETE FROM followers WHERE follower_id = ? AND followed_id = ? AND status = "pending"',
      [follower_id, followed_id]
    );
    
    res.json({ status: 'success', message: 'Demande annulée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// Vérifier le statut de la relation
const checkFriendStatus = async (req, res) => {
  const { userId } = req.query;
  const currentUserId = req.user.id;
  
  if (!userId || currentUserId === parseInt(userId)) {
    return res.json({ status: 'self', isFollowing: false });
  }
  
  try {
    const [result] = await promisePool.query(
      `SELECT status FROM followers 
       WHERE (follower_id = ? AND followed_id = ?)
       LIMIT 1`,
      [currentUserId, userId]
    );
    
    if (result.length === 0) {
      return res.json({ status: 'none', isFollowing: false });
    }
    
    const status = result[0].status;
    let isFollowing = false;
    let requestSent = false;
    
    if (status === 'accepted') {
      isFollowing = true;
    } else if (status === 'pending') {
      requestSent = true;
    }
    
    res.json({ 
      status, 
      isFollowing, 
      requestSent,
      canSendRequest: status === 'none'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Retirer un ami
const removeFriend = async (req, res) => {
  const { friend_id } = req.body;
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'DELETE FROM followers WHERE (follower_id = ? AND followed_id = ?) OR (follower_id = ? AND followed_id = ?)',
      [userId, friend_id, friend_id, userId]
    );
    
    res.json({ status: 'success', message: 'Ami retiré' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

module.exports = { 
  getFriends, 
  sendFriendRequest, 
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  cancelFriendRequest,
  checkFriendStatus,
  removeFriend
};