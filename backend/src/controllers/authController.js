const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

const register = async (req, res) => {
  const { username, email, password } = req.body;
  
  console.log('=== Requête reçue sur /api/auth/register ===');
  console.log('Body:', { username, email, password: '***' });
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const [existing] = await promisePool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existing.length > 0) {
      console.log('Utilisateur existe déjà');
      return res.status(400).json({ message: 'Email ou nom d\'utilisateur déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe hashé avec succès');
    
    // Créer l'utilisateur
    const [result] = await promisePool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    console.log('Utilisateur créé avec ID:', result.insertId);
    
    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Mettre à false pour le développement (HTTP)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: result.insertId, username, email }
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ message: 'Erreur serveur: ' + error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log('=== Requête reçue sur /api/auth/login ===');
  console.log('Email:', email);
  
  try {
    const [users] = await promisePool.query(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log('Utilisateur non trouvé');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      console.log('Mot de passe incorrect');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    console.log('Connexion réussie pour:', user.username);
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
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
    console.error('Erreur détaillée:', error);
    res.status(500).json({ message: 'Erreur serveur: ' + error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnexion réussie' });
};

module.exports = { register, login, getMe, logout };