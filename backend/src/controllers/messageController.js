const { promisePool } = require('../config/database');

// Récupérer les messages entre deux utilisateurs
const getMessages = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    const [messages] = await promisePool.query(
      `SELECT m.*, 
        u1.username as sender_username,
        u2.username as receiver_username
       FROM private_messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [currentUserId, userId, userId, currentUserId]
    );
    
    // Marquer les messages comme lus
    await promisePool.query(
      'UPDATE private_messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0',
      [currentUserId, userId]
    );
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Envoyer un message
const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;
  
  if (!receiverId || !content || !content.trim()) {
    return res.status(400).json({ message: 'Destinataire et contenu requis' });
  }
  
  try {
    const [result] = await promisePool.query(
      'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content.trim()]
    );
    
    const [newMessage] = await promisePool.query(
      `SELECT m.*, 
        u1.username as sender_username,
        u2.username as receiver_username
       FROM private_messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Marquer les messages comme lus
const markMessagesAsRead = async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.user.id;
  
  try {
    await promisePool.query(
      'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [senderId, receiverId]
    );
    
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Compter les messages non lus
const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [result] = await promisePool.query(
      'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );
    
    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount
};