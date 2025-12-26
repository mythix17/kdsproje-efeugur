const express = require('express');
const router = express.Router();
const tesisController = require('../controllers/tesisController');

// Helper routes
router.post('/agirlikli-puan', tesisController.calculateWeighted);

// Standard CRUD
router.get('/', tesisController.getAll);
router.get('/:id', tesisController.getById);
router.post('/', tesisController.create);
router.put('/:id', tesisController.update);
router.delete('/:id', tesisController.delete);

module.exports = router;
