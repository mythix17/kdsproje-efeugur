const express = require('express');
const router = express.Router();
const oyuncuController = require('../controllers/oyuncuController');

// Helper routes
router.get('/pozisyonlar', oyuncuController.getPositions);
router.post('/agirlikli-puan', oyuncuController.calculateWeighted);
router.get('/pozisyon/:pozisyon', oyuncuController.getByPosition);

// Standard CRUD
router.get('/', oyuncuController.getAll);
router.get('/:id', oyuncuController.getById);
router.post('/', oyuncuController.create);
router.put('/:id', oyuncuController.update);
router.delete('/:id', oyuncuController.delete);

module.exports = router;
