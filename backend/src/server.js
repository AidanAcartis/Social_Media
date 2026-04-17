const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend fonctionne!', timestamp: new Date() });
});

// ROUTE D'INSCRIPTION (AJOUTÉE)
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  console.log('=== TENTATIVE D\'INSCRIPTION ===');
  console.log('Username:', username);
  console.log('Email:', email);
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const [existing] = await promisePool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existing.length > 0) {
      console.log('❌ Utilisateur existe déjà');
      return res.status(400).json({ message: 'Email ou nom d\'utilisateur déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé');
    
    // Créer l'utilisateur
    const [result] = await promisePool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    console.log('✅ Utilisateur créé avec ID:', result.insertId);
    
    // Créer le token JWT
    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET || 'mon_secret_jwt',
      { expiresIn: '7d' }
    );
    
    // Définir le cookie
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

// Route de connexion (améliorée)
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
  res.json({ 
    user: { 
      id: 1, 
      username: 'TestUser', 
      email: 'test@example.com' 
    } 
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api/health`);
  console.log(`🔐 Inscription: POST http://localhost:${PORT}/api/auth/register`);
});