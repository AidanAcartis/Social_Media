const express = require('express');
const { getLocations, updateLocation } = require('../controllers/locationController');

const router = express.Router();

router.get('/', getLocations);
router.post('/', updateLocation);

module.exports = router;