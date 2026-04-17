const { promisePool } = require('../config/database');

let io = null;

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Nouvel utilisateur connecté:', socket.id);

    // Utilisateur rejoint sa room personnelle
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`📱 Utilisateur ${userId} a rejoint sa room`);
    });

    // ========== FORUM PUBLIC ==========
    socket.on('getForumMessages', async () => {
      try {
        const [messages] = await promisePool.query(
          `SELECT fm.*, u.username 
           FROM forum_messages fm
           JOIN users u ON fm.sender_id = u.id
           ORDER BY fm.created_at ASC
           LIMIT 100`
        );
        socket.emit('forumMessages', messages);
      } catch (error) {
        console.error('Erreur getForumMessages:', error);
        socket.emit('forumMessages', []);
      }
    });

    socket.on('sendForumMessage', async (data) => {
      const { senderId, username, content } = data;
      
      try {
        const [result] = await promisePool.query(
          'INSERT INTO forum_messages (sender_id, content) VALUES (?, ?)',
          [senderId, content]
        );
        
        const newMessage = {
          id: result.insertId,
          sender_id: senderId,
          content: content,
          username: username,
          created_at: new Date()
        };
        
        io.emit('newForumMessage', newMessage);
      } catch (error) {
        console.error('Erreur sendForumMessage:', error);
      }
    });

    // ========== MESSAGES PRIVÉS ==========
    socket.on('getMessages', async (data) => {
      const { senderId, receiverId } = data;
      
      try {
        const [messages] = await promisePool.query(
          `SELECT pm.*, 
            u1.username as sender_username,
            u2.username as receiver_username
           FROM private_messages pm
           JOIN users u1 ON pm.sender_id = u1.id
           JOIN users u2 ON pm.receiver_id = u2.id
           WHERE (pm.sender_id = ? AND pm.receiver_id = ?)
              OR (pm.sender_id = ? AND pm.receiver_id = ?)
           ORDER BY pm.created_at ASC`,
          [senderId, receiverId, receiverId, senderId]
        );
        
        socket.emit('receiveMessages', messages);
        
        // Marquer les messages comme lus
        await promisePool.query(
          'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
          [receiverId, senderId]
        );
        
        // Mettre à jour le compteur de messages non lus
        const [unreadCount] = await promisePool.query(
          'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = 0',
          [senderId]
        );
        
        io.to(`user_${senderId}`).emit('unreadMessagesCount', { unreadCount: unreadCount[0].count });
      } catch (error) {
        console.error('Erreur getMessages:', error);
      }
    });

    socket.on('sendPrivateMessage', async (data) => {
      const { senderId, receiverId, content } = data;
      
      try {
        const [result] = await promisePool.query(
          'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
          [senderId, receiverId, content]
        );
        
        const [newMessage] = await promisePool.query(
          `SELECT pm.*, 
            u1.username as sender_username,
            u2.username as receiver_username
           FROM private_messages pm
           JOIN users u1 ON pm.sender_id = u1.id
           JOIN users u2 ON pm.receiver_id = u2.id
           WHERE pm.id = ?`,
          [result.insertId]
        );
        
        // Envoyer au destinataire
        io.to(`user_${receiverId}`).emit('newPrivateMessage', newMessage[0]);
        // Envoyer à l'expéditeur
        socket.emit('newPrivateMessage', newMessage[0]);
        
        // Mettre à jour le compteur de messages non lus pour le destinataire
        const [unreadCount] = await promisePool.query(
          'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = 0',
          [receiverId]
        );
        
        io.to(`user_${receiverId}`).emit('unreadMessagesCount', { unreadCount: unreadCount[0].count });
      } catch (error) {
        console.error('Erreur sendPrivateMessage:', error);
      }
    });

    // ========== NOTIFICATIONS ==========
    socket.on('getNotifications', async (userId) => {
      try {
        const [notifications] = await promisePool.query(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
          [userId]
        );
        socket.emit('notificationUpdate', { unreadCount: notifications[0].count });
      } catch (error) {
        console.error('Erreur getNotifications:', error);
      }
    });

    socket.on('getUnreadMessages', async (userId) => {
      try {
        const [unreadCount] = await promisePool.query(
          'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = 0',
          [userId]
        );
        socket.emit('unreadMessagesCount', { unreadCount: unreadCount[0].count });
      } catch (error) {
        console.error('Erreur getUnreadMessages:', error);
      }
    });

    // ========== DÉCONNEXION ==========
    socket.on('disconnect', () => {
      console.log('🔌 Utilisateur déconnecté:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO non initialisé');
  }
  return io;
};

module.exports = { initSocket, getIO };