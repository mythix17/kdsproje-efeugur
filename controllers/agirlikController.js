const AgirlikModel = require('../models/AgirlikModel');

const agirlikController = {
    getAll: async (req, res) => {
        try {
            const settings = await AgirlikModel.getAll();
            res.json(settings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await AgirlikModel.update(req.params.tablo, req.body);
            res.json({ success: true, message: 'Ağırlık ayarları güncellendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = agirlikController;
