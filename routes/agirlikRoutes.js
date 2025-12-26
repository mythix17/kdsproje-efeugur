const express = require('express');
const router = express.Router();
const agirlikController = require('../controllers/agirlikController');

router.get('/', agirlikController.getAll);
router.put('/:tablo', agirlikController.update);

module.exports = router;
