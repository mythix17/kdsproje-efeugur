const express = require('express');
const router = express.Router();
const oyuncuController = require('../controllers/oyuncuController');
const teknikEkipController = require('../controllers/teknikEkipController');

// Global helper routes
router.get('/pozisyonlar', oyuncuController.getPositions);
router.get('/gorevler', teknikEkipController.getRoles);

module.exports = router;
