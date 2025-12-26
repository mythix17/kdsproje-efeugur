const TaraftarModel = require('../models/TaraftarModel');

const taraftarController = {
    getAll: async (req, res) => {
        try {
            const { yil } = req.query;
            const filters = { yil };
            const groups = await TaraftarModel.getAll(filters);
            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const group = await TaraftarModel.getById(req.params.id);
            if (!group) {
                return res.status(404).json({ error: 'Taraftar grubu bulunamadı' });
            }
            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const id = await TaraftarModel.create(req.body);
            res.status(201).json({ success: true, id, message: 'Taraftar grubu eklendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await TaraftarModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Taraftar grubu güncellendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await TaraftarModel.delete(req.params.id);
            res.json({ success: true, message: 'Taraftar grubu silindi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    calculateWeighted: async (req, res) => {
        try {
            const {
                kulup_id = 1,
                yil = null,
                agirlik_memnuniyet = 25,
                agirlik_etki = 25,
                agirlik_medya = 25,
                agirlik_doluluk = 25
            } = req.body;

            const filters = { yil };
            const weights = { agirlik_memnuniyet, agirlik_etki, agirlik_medya, agirlik_doluluk };

            const groups = await TaraftarModel.calculateWeighted(kulup_id, filters, weights);
            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getYears: async (req, res) => {
        try {
            const years = await TaraftarModel.getUniqueYears();
            res.json(years);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = taraftarController;
