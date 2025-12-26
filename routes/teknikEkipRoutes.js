const express = require('express');
const router = express.Router();
const teknikEkipController = require('../controllers/teknikEkipController');

// Helper routes
router.get('/gorevler', (req, res) => {
    // The original app used /api/gorevler for roles, which maps here if we set it up right or we can use a util route
    // But since it's related to teknik ekip, let's keep it here or handle it via a specific path
    teknikEkipController.getRoles(req, res);
});
// Note: In server.js /api/gorevler is a separate endpoint. We can route it in server.js to this controller method or keep it here.
// I will keep a specific route for getting roles in the main router file or here. 
// Let's stick to using /api/teknik-ekip/gorevler if possible, but the frontend calls /api/gorevler.
// I will handle /api/gorevler separately in server.js or utilRoutes, OR I can alias it. 
// For now, inside this router, it would be /api/teknik-ekip/gorevler.

router.get('/gorev/:gorev', teknikEkipController.getByRole);
router.post('/agirlikli-puan', teknikEkipController.calculateWeighted);

// Standard CRUD
router.get('/', teknikEkipController.getAll);
router.get('/:id', teknikEkipController.getById);
router.post('/', teknikEkipController.create);
router.put('/:id', teknikEkipController.update);
router.delete('/:id', teknikEkipController.delete);

module.exports = router;
