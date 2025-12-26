const express = require('express');
const router = express.Router();
const taraftarController = require('../controllers/taraftarController');

// Helper routes
router.get('/yillar', taraftarController.getYears);
router.post('/agirlikli-puan', taraftarController.calculateWeighted);

// Standard CRUD
router.get('/', taraftarController.getAll);
router.get('/:id', taraftarController.getById);
router.post('/', taraftarController.create);
router.put('/:id', taraftarController.update);
router.delete('/:id', taraftarController.delete);

module.exports = router;
