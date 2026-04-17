const { promisePool } = require('../config/database');
const path = require('path');

const getUsername = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [users] = await promisePool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ username: users[0].username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getProfilePhoto = async (req, res) => {
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
};

const updateProfilePhoto = async (req, res) => {
  const userId = req.user.id;
  const photoPath = req.file ? `/uploads/profiles/${req.file.filename}` : null;
  
  if (!photoPath) {
    return res.status(400).json({ message: 'Aucun fichier uploadé' });
  }
  
  try {
    await promisePool.query(
      'DELETE FROM profile_photo WHERE user_id = ?',
      [userId]
    );
    
    await promisePool.query(
      'INSERT INTO profile_photo (user_id, photo_path) VALUES (?, ?)',
      [userId, photoPath]
    );
    
    res.json({ message: 'Photo mise à jour', photo_path: photoPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const searchUsers = async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Nom d\'utilisateur requis' });
  }
  
  try {
    const [users] = await promisePool.query(
      `SELECT u.id, u.username, u.email, p.photo_path 
       FROM users u 
       LEFT JOIN profile_photo p ON u.id = p.user_id 
       WHERE u.username LIKE ? 
       ORDER BY u.username`,
      [`%${username}%`]
    );
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getUsername, getProfilePhoto, updateProfilePhoto, searchUsers };