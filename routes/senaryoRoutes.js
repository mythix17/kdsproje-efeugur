const express = require('express');
const router = express.Router();
const senaryoController = require('../controllers/senaryoController');

router.post('/', senaryoController.create);
router.get('/', senaryoController.getAll);

module.exports = router;
