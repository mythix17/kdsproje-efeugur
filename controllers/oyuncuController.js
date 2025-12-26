const OyuncuModel = require('../models/OyuncuModel');

const oyuncuController = {
    getAll: async (req, res) => {
        try {
            const players = await OyuncuModel.getAll();
            res.json(players);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const player = await OyuncuModel.getById(req.params.id);
            if (!player) {
                return res.status(404).json({ error: 'Oyuncu bulunamadı' });
            }
            res.json(player);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const id = await OyuncuModel.create(req.body);
            res.status(201).json({ success: true, id, message: 'Oyuncu eklendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await OyuncuModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Oyuncu güncellendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await OyuncuModel.delete(req.params.id);
            res.json({ success: true, message: 'Oyuncu silindi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getByPosition: async (req, res) => {
        try {
            const players = await OyuncuModel.getByPosition(req.params.pozisyon);
            res.json(players);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    calculateWeighted: async (req, res) => {
        try {
            const {
                kulup_id = 1,
                pozisyon = '',
                agirlik_fiziksel = 25,
                agirlik_pozisyon = 25,
                agirlik_taktik = 25,
                agirlik_saglik = 25
            } = req.body;

            const filters = { pozisyon };
            const weights = { agirlik_fiziksel, agirlik_pozisyon, agirlik_taktik, agirlik_saglik };

            const players = await OyuncuModel.calculateWeighted(kulup_id, filters, weights);
            res.json(players);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getPositions: async (req, res) => {
        try {
            const positions = await OyuncuModel.getUniquePositions();
            res.json(positions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = oyuncuController;
