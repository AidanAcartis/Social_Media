const { promisePool } = require('../config/database');

const getFriends = async (req, res) => {
  try {
    const [data] = await promisePool.query('SELECT * FROM followers');
    res.json({ status: 'success', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

const follow = async (req, res) => {
  const { follower_id, followed_id } = req.body;
  
  if (!follower_id || !followed_id) {
    return res.status(400).json({ status: 'error', message: 'Données invalides' });
  }
  
  try {
    await promisePool.query(
      'INSERT INTO followers (follower_id, followed_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE follower_id = follower_id',
      [follower_id, followed_id]
    );
    
    // Ajouter une notification
    await promisePool.query(
      'INSERT INTO notifications (user_id, actor_id, type, is_read) VALUES (?, ?, "follow", 0)',
      [followed_id, follower_id]
    );
    
    res.json({ status: 'success', message: 'Utilisateur suivi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

const unfollow = async (req, res) => {
  const { follower_id, followed_id } = req.body;
  
  try {
    await promisePool.query(
      'DELETE FROM followers WHERE follower_id = ? AND followed_id = ?',
      [follower_id, followed_id]
    );
    
    res.json({ status: 'success', message: 'Utilisateur désabonné' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

const checkFollowStatus = async (req, res) => {
  const { userId } = req.query;
  const follower_id = req.user.id;
  
  try {
    const [result] = await promisePool.query(
      'SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?',
      [follower_id, userId]
    );
    
    res.json({ isFollowing: result.length > 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getFriends, follow, unfollow, checkFollowStatus };