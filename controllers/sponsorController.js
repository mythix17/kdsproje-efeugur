const SponsorModel = require('../models/SponsorModel');

const sponsorController = {
    getAll: async (req, res) => {
        try {
            const sponsors = await SponsorModel.getAll();
            res.json(sponsors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const sponsor = await SponsorModel.getById(req.params.id);
            if (!sponsor) {
                return res.status(404).json({ error: 'Sponsor bulunamadı' });
            }
            res.json(sponsor);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const id = await SponsorModel.create(req.body);
            res.status(201).json({ success: true, id, message: 'Sponsor eklendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await SponsorModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Sponsor güncellendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await SponsorModel.delete(req.params.id);
            res.json({ success: true, message: 'Sponsor silindi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    calculateWeighted: async (req, res) => {
        try {
            const {
                kulup_id = 1,
                agirlik_finansal = 25,
                agirlik_imaj = 25,
                agirlik_taraftar = 25,
                agirlik_marka = 25
            } = req.body;

            const weights = { agirlik_finansal, agirlik_imaj, agirlik_taraftar, agirlik_marka };

            const sponsors = await SponsorModel.calculateWeighted(kulup_id, weights);
            res.json(sponsors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = sponsorController;
