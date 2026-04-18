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
const fs = require('fs');

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
// Ajoutez ceci avant les routes pour voir quels fichiers sont demandés
// app.use('/uploads', (req, res, next) => {
//   console.log('Static file requested:', req.path);
//   next();
// }, express.static(path.join(__dirname, '../uploads')));

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

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📱 Utilisateur ${userId} a rejoint sa room`);
  });

socket.on('getForumMessages', async () => {
  try {
    const [messages] = await promisePool.query(
      `SELECT fm.*, u.username, u.id as user_id
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
      user_id: senderId,  // Ajoutez cette ligne
      content: content,
      username: username,
      created_at: new Date()
    };
    
    io.emit('newForumMessage', newMessage);
  } catch (error) {
    console.error('Erreur sendForumMessage:', error);
  }
});

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
      
      await promisePool.query(
        'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
        [receiverId, senderId]
      );
      
      const [unreadCount] = await promisePool.query(
        'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = 0',
        [senderId]
      );
      
      io.to(`user_${senderId}`).emit('unreadMessagesCount', { unreadCount: unreadCount[0].count });
    } catch (error) {
      console.error('Erreur getMessages:', error);
    }
  });

  // Dans la section Socket.IO, ajoutez :
socket.on('getNotifications', async (userId) => {
  try {
    const [notifications] = await promisePool.query(
      `SELECT n.*, u.username, n.type 
       FROM notifications n
       JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = ? AND n.is_read = 0
       ORDER BY n.created_at DESC`,
      [userId]
    );
    socket.emit('notificationUpdate', { 
      unreadCount: notifications.length,
      notifications 
    });
  } catch (error) {
    console.error('Erreur getNotifications:', error);
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
      
      io.to(`user_${receiverId}`).emit('newPrivateMessage', newMessage[0]);
      socket.emit('newPrivateMessage', newMessage[0]);
      
      const [unreadCount] = await promisePool.query(
        'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = 0',
        [receiverId]
      );
      
      io.to(`user_${receiverId}`).emit('unreadMessagesCount', { unreadCount: unreadCount[0].count });
    } catch (error) {
      console.error('Erreur sendPrivateMessage:', error);
    }
  });

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

// ========== ROUTES D'UPLOAD ==========
const { authenticateToken } = require('./middleware/auth');
const { upload } = require('./middleware/upload');

// Route pour l'avatar
app.post('/api/users/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  console.log('=== upload avatar ===');
  console.log('req.file:', req.file);
  console.log('req.user:', req.user);
  
  const userId = req.user.id;
  const photoPath = req.file ? `/uploads/profiles/${req.file.filename}` : null;
  
  if (!photoPath) {
    return res.status(400).json({ message: 'Aucun fichier uploadé' });
  }
  
  try {
    await promisePool.query('DELETE FROM profile_photo WHERE user_id = ?', [userId]);
    await promisePool.query('INSERT INTO profile_photo (user_id, photo_path) VALUES (?, ?)', [userId, photoPath]);
    res.json({ message: 'Photo mise à jour', photo_path: photoPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour la photo de couverture
app.post('/api/users/cover', authenticateToken, upload.single('cover'), async (req, res) => {
  console.log('=== upload cover ===');
  console.log('req.file:', req.file);
  
  const userId = req.user.id;
  const photoPath = req.file ? `/uploads/covers/${req.file.filename}` : null;
  
  if (!photoPath) {
    return res.status(400).json({ message: 'Aucun fichier uploadé' });
  }
  
  try {
    await promisePool.query('DELETE FROM cover_photo WHERE user_id = ?', [userId]);
    await promisePool.query('INSERT INTO cover_photo (user_id, photo_path) VALUES (?, ?)', [userId, photoPath]);
    res.json({ message: 'Photo de couverture mise à jour', photo_path: photoPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========== ROUTES POUR RÉCUPÉRER LES PHOTOS (AJOUTÉES) ==========

// Récupérer la photo de profil
app.get('/api/users/:userId/avatar', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [photos] = await promisePool.query(
      'SELECT photo_path FROM profile_photo WHERE user_id = ?',
      [userId]
    );
    
    if (photos.length === 0) {
      return res.json({ photo_path: null });
    }
    
    res.json({ photo_path: photos[0].photo_path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer la photo de couverture
app.get('/api/users/:userId/cover', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [photos] = await promisePool.query(
      'SELECT photo_path FROM cover_photo WHERE user_id = ?',
      [userId]
    );
    
    if (photos.length === 0) {
      return res.json({ photo_path: null });
    }
    
    res.json({ photo_path: photos[0].photo_path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de test pour debug
app.get('/api/debug/cover/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [photos] = await promisePool.query(
      'SELECT * FROM cover_photo WHERE user_id = ?',
      [userId]
    );
    res.json({ photos });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// ========== ROUTES POUR LES POSTS ==========

// Créer un post
// Créer un post
app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  console.log('=== CREATE POST ===');
  
  const userId = req.user.id;
  const content = req.body.content || '';
  const imagePath = req.file ? `/uploads/posts/${req.file.filename}` : null;
  
  // Détecter le type de fichier
  let docType = null;
  if (imagePath) {
    docType = detectFileType(imagePath);
  }
  
  try {
    const [result] = await promisePool.query(
      'INSERT INTO posts (user_id, content, image, doc_type, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, content, imagePath, docType]
    );
    
    // Récupérer le post créé avec les infos utilisateur
    const [newPost] = await promisePool.query(
      `SELECT p.*, u.username 
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      id: newPost[0].id,
      content: newPost[0].content,
      image: newPost[0].image,
      doc_type: newPost[0].doc_type,
      createdAt: newPost[0].created_at,
      reactionCount: 0,
      commentCount: 0,
      userReaction: null,
      user: {
        id: newPost[0].user_id,
        username: newPost[0].username
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les posts d'un utilisateur
app.get('/api/posts/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, 
        u.id as user_id, 
        u.username,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
        (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ?) as userReaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [currentUserId, userId]
    );
    
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.created_at,
      reactionCount: post.reactionCount || 0,
      commentCount: post.commentCount || 0,
      userReaction: post.userReaction,
      user: {
        id: post.user_id,
        username: post.username
      }
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer le feed (tous les posts)
// Récupérer le feed (tous les posts)
app.get('/api/posts/feed', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [posts] = await promisePool.query(
      `SELECT p.*, 
        u.id as user_id, 
        u.username,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reactionCount,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
        (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ?) as userReaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.created_at,
      reactionCount: post.reactionCount || 0,
      commentCount: post.commentCount || 0,
      userReaction: post.userReaction,
      user: {
        id: post.user_id,
        username: post.username
      }
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========== ROUTE POUR SUPPRIMER UN POST ==========

// Supprimer un post
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  console.log('=== DELETE POST ===');
  console.log('Post ID:', postId);
  console.log('User ID:', userId);
  
  try {
    // Vérifier que le post existe et appartient à l'utilisateur
    const [post] = await promisePool.query(
      'SELECT user_id, image FROM posts WHERE id = ?',
      [postId]
    );
    
    if (post.length === 0) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }
    
    if (post[0].user_id !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Supprimer l'image si elle existe
    if (post[0].image) {
      const imagePath = path.join(__dirname, post[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Image supprimée:', imagePath);
      }
    }
    
    // Supprimer le post
    await promisePool.query('DELETE FROM posts WHERE id = ?', [postId]);
    
    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========== ROUTES ABOUT ==========

// Récupérer les descriptions
app.get('/api/about', async (req, res) => {
  try {
    const [data] = await promisePool.query('SELECT * FROM about');
    res.json({ status: 'success', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

// Mettre à jour une description
app.post('/api/about', authenticateToken, async (req, res) => {
  const { user_id, description } = req.body;
  
  if (!user_id || !description) {
    return res.status(400).json({ status: 'error', message: 'user_id et description requis' });
  }
  
  try {
    const [existing] = await promisePool.query(
      'SELECT * FROM about WHERE user_id = ?',
      [user_id]
    );
    
    if (existing.length > 0) {
      await promisePool.query(
        'UPDATE about SET description = ? WHERE user_id = ?',
        [description, user_id]
      );
      res.json({ status: 'success', message: 'Description mise à jour' });
    } else {
      await promisePool.query(
        'INSERT INTO about (user_id, description) VALUES (?, ?)',
        [user_id, description]
      );
      res.json({ status: 'success', message: 'Description ajoutée' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

// ========== ROUTES LOCATION ==========

// Récupérer les localisations
app.get('/api/location', async (req, res) => {
  try {
    const [data] = await promisePool.query('SELECT * FROM location');
    res.json({ status: 'success', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

// Mettre à jour une localisation
app.post('/api/location', authenticateToken, async (req, res) => {
  const { user_id, country, city } = req.body;
  
  if (!user_id || !country || !city) {
    return res.status(400).json({ status: 'error', message: 'Tous les champs sont requis' });
  }
  
  try {
    const [existing] = await promisePool.query(
      'SELECT * FROM location WHERE user_id = ?',
      [user_id]
    );
    
    if (existing.length > 0) {
      await promisePool.query(
        'UPDATE location SET country = ?, city = ? WHERE user_id = ?',
        [country, city, user_id]
      );
      res.json({ status: 'success', message: 'Localisation mise à jour' });
    } else {
      await promisePool.query(
        'INSERT INTO location (user_id, country, city) VALUES (?, ?, ?)',
        [user_id, country, city]
      );
      res.json({ status: 'success', message: 'Localisation ajoutée' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

// ========== ROUTE POUR RÉCUPÉRER LES FICHIERS D'UN UTILISATEUR ==========
// Fonction helper à ajouter au début du fichier
function detectFileTypeFromUrl(filePath) {
  if (!filePath) return null;
  
  const extension = filePath.split('.').pop().toLowerCase();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  
  if (imageExtensions.includes(extension)) {
    return 'photo';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else if (documentExtensions.includes(extension)) {
    return 'pdf';
  }
  
  return 'other';
}

// Modifiez la route GET /api/users/:userId/files
app.get('/api/users/:userId/files', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [files] = await promisePool.query(
      `SELECT p.id, p.content, p.image as doc_url, p.doc_type, p.created_at,
              p.user_id, u.username
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ? 
         AND p.image IS NOT NULL
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    const formattedFiles = files.map(file => ({
      id: file.id,
      doc_url: file.doc_url,
      doc_type: file.doc_type || detectFileTypeFromUrl(file.doc_url),
      content: file.content,
      created_at: file.created_at,
      user_id: file.user_id,
      username: file.username
    }));
    
    res.json(formattedFiles);
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Fonction helper pour détecter le type de fichier
function detectFileType(filePath) {
  if (!filePath) return null;
  
  const extension = filePath.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
    return 'photo';
  } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
    return 'video';
  } else if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(extension)) {
    return 'pdf';
  }
  
  return 'other';
}

// ========== ROUTES POUR LES AMIS (FOLLOWERS) ==========

// Récupérer les amis
app.get('/api/friends', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [friends] = await promisePool.query(
      `SELECT u.id, u.username, u.email, f.status
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
});

// Récupérer les demandes en attente
app.get('/api/friends/pending', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [requests] = await promisePool.query(
      `SELECT f.id as request_id, f.created_at, u.id, u.username, u.email
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       WHERE f.followed_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});

// Envoyer une demande d'ami
app.post('/api/friends/request', authenticateToken, async (req, res) => {
  const { followed_id } = req.body;
  const follower_id = req.user.id;
  
  if (follower_id === followed_id) {
    return res.status(400).json({ status: 'error', message: 'Vous ne pouvez pas vous ajouter vous-même' });
  }
  
  try {
    const [existing] = await promisePool.query(
      `SELECT * FROM followers 
       WHERE (follower_id = ? AND followed_id = ?) 
       OR (follower_id = ? AND followed_id = ?)`,
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
});

// Accepter une demande d'ami
app.post('/api/friends/accept', authenticateToken, async (req, res) => {
  const { request_id } = req.body;
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
});

// Refuser une demande d'ami
app.post('/api/friends/reject', authenticateToken, async (req, res) => {
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
});

// Vérifier le statut de la relation
app.get('/api/friends/check', authenticateToken, async (req, res) => {
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
    
    res.json({ 
      status: result[0].status,
      isFollowing: result[0].status === 'accepted',
      requestSent: result[0].status === 'pending'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes de recherche
app.get('/api/search/users', authenticateToken, async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user.id;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Terme de recherche trop court' });
  }
  
  try {
    const [users] = await promisePool.query(
      `SELECT u.id, u.username, u.email, 
        p.photo_path as avatar,
        CASE WHEN f.status = 'accepted' THEN 1 ELSE 0 END as isFollowing,
        CASE WHEN f.status = 'pending' AND f.follower_id = ? THEN 1 ELSE 0 END as requestSent
       FROM users u
       LEFT JOIN profile_photo p ON u.id = p.user_id
       LEFT JOIN followers f ON (f.follower_id = ? AND f.followed_id = u.id) 
                            OR (f.followed_id = ? AND f.follower_id = u.id)
       WHERE u.username LIKE ? AND u.id != ?
       GROUP BY u.id
       ORDER BY u.username
       LIMIT 20`,
      [currentUserId, currentUserId, currentUserId, `%${q}%`, currentUserId]
    );
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

  // Récupérer le nombre de notifications non lues
app.get('/api/notifications/unread/count', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [result] = await promisePool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api/health`);
  console.log(`🔐 Inscription: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔌 WebSocket prêt sur le port ${PORT}`);
});