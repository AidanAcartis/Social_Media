const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const createUploadDirs = () => {
  const dirs = [
    'uploads/profiles',
    'uploads/covers',
    'uploads/posts',
    'uploads/proofs'
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'avatar') folder += 'profiles';
    else if (file.fieldname === 'cover') folder += 'covers';
    else if (file.fieldname === 'file' || file.fieldname === 'image') folder += 'posts';
    else if (file.fieldname === 'proof') folder += 'proofs';
    else folder += 'posts';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Types de fichiers autorisés
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'application/pdf'
  ];
  
  // Extensions autorisées
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.mp4', '.webm', '.ogg', '.mov', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Formats acceptés: images (jpg, png, gif, webp), vidéos (mp4, webm), PDF'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB pour les vidéos
});

module.exports = { upload };