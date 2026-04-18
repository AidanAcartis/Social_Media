const { promisePool } = require('../config/database');

// Récupérer TOUTES les notifications
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [notifications] = await promisePool.query(
      `SELECT n.*, u.username 
       FROM notifications n 
       JOIN users u ON n.actor_id = u.id 
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );
    
    console.log(`📬 ${notifications.length} notifications trouvées pour l'utilisateur ${userId}`);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [result] = await promisePool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    console.log(`🔔 ${result[0].count} notifications non lues pour l'utilisateur ${userId}`);
    res.json({ count: result[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Marquer TOUTES les notifications comme lues
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [result] = await promisePool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    console.log(`✅ ${result.affectedRows} notifications marquées comme lues pour l'utilisateur ${userId}`);
    
    res.json({ message: 'Notifications marquées comme lues', count: result.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const markOneAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  try {
    await promisePool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND is_read = 0',
      [notificationId, userId]
    );
    
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getNotifications, getUnreadCount, markAllAsRead, markOneAsRead };