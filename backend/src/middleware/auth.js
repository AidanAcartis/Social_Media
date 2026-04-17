const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await promisePool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide' });
  }
};

module.exports = { authenticateToken };