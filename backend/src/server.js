const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialisation de Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connexion à MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'social_media_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Tester la connexion à la base de données
(async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Connecté à la base de données MySQL');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error.message);
  }
})();

// ========== SOCKET.IO ==========
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

  socket.on('disconnect', () => {
    console.log('🔌 Utilisateur déconnecté:', socket.id);
  });
});

// ========== ROUTES API ==========

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend fonctionne!', timestamp: new Date() });
});

// ROUTE D'INSCRIPTION
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  console.log('=== TENTATIVE D\'INSCRIPTION ===');
  console.log('Username:', username);
  console.log('Email:', email);
  
  try {
    const [existing] = await promisePool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existing.length > 0) {
      console.log('❌ Utilisateur existe déjà');
      return res.status(400).json({ message: 'Email ou nom d\'utilisateur déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé');
    
    const [result] = await promisePool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    console.log('✅ Utilisateur créé avec ID:', result.insertId);
    
    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET || 'mon_secret_jwt',
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: result.insertId, username, email }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur: ' + error.message });
  }
});

// ROUTE DE CONNEXION
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('=== TENTATIVE DE CONNEXION ===');
  console.log('Email:', email);
  
  try {
    const [users] = await promisePool.query(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    console.log('✅ Connexion réussie pour:', user.username);
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'mon_secret_jwt',
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      message: 'Connexion réussie',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer l'utilisateur courant
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mon_secret_jwt');
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
});

// Route de déconnexion
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnexion réussie' });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api/health`);
  console.log(`🔐 Inscription: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔌 WebSocket prêt sur le port ${PORT}`);
});