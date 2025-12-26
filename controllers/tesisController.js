const TesisModel = require('../models/TesisModel');

const tesisController = {
    getAll: async (req, res) => {
        try {
            const facilities = await TesisModel.getAll();
            res.json(facilities);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const facility = await TesisModel.getById(req.params.id);
            if (!facility) {
                return res.status(404).json({ error: 'Tesis bulunamadı' });
            }
            res.json(facility);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const id = await TesisModel.create(req.body);
            res.status(201).json({ success: true, id, message: 'Tesis eklendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await TesisModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Tesis güncellendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await TesisModel.delete(req.params.id);
            res.json({ success: true, message: 'Tesis silindi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    calculateWeighted: async (req, res) => {
        try {
            const {
                kulup_id = 1,
                agirlik_altyapi = 25,
                agirlik_donanim = 25,
                agirlik_ulasim = 25,
                agirlik_konaklama = 25
            } = req.body;

            const weights = { agirlik_altyapi, agirlik_donanim, agirlik_ulasim, agirlik_konaklama };

            const facilities = await TesisModel.calculateWeighted(kulup_id, weights);
            res.json(facilities);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = tesisController;
