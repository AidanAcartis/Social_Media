const { promisePool } = require('../config/database');

const getLocations = async (req, res) => {
  try {
    const [data] = await promisePool.query('SELECT * FROM location');
    res.json({ status: 'success', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

const updateLocation = async (req, res) => {
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
};

module.exports = { getLocations, updateLocation };