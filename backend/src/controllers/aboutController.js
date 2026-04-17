const { promisePool } = require('../config/database');

const getAbout = async (req, res) => {
  try {
    const [data] = await promisePool.query('SELECT * FROM about');
    res.json({ status: 'success', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

const updateAbout = async (req, res) => {
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
};

module.exports = { getAbout, updateAbout };