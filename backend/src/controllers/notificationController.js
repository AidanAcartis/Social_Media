const { promisePool } = require('../config/database');

const getNotifications = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [notifications] = await promisePool.query(
      `SELECT n.*, u.username 
       FROM notifications n 
       JOIN users u ON n.actor_id = u.id 
       WHERE n.user_id = ? AND n.is_read = 0 
       ORDER BY n.created_at DESC`,
      [userId]
    );
    
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const markAsRead = async (req, res) => {
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
    
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getNotifications, markAsRead };