const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2');

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

// Route d'authentification simple pour tester
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await promisePool.query(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Pour l'instant, on ne vérifie pas le mot de passe en détail
    // Tu devras ajouter bcrypt plus tard
    res.json({
      message: 'Connexion réussie',
      user: users[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer l'utilisateur courant
app.get('/api/auth/me', (req, res) => {
  // Pour l'instant, on retourne un utilisateur de test
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
});