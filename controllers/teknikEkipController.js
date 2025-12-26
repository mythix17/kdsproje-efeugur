const TeknikEkipModel = require('../models/TeknikEkipModel');

const teknikEkipController = {
    getAll: async (req, res) => {
        try {
            const staff = await TeknikEkipModel.getAll();
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const staff = await TeknikEkipModel.getById(req.params.id);
            if (!staff) {
                return res.status(404).json({ error: 'Personel bulunamadı' });
            }
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const id = await TeknikEkipModel.create(req.body);
            res.status(201).json({ success: true, id, message: 'Personel eklendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await TeknikEkipModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Personel güncellendi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await TeknikEkipModel.delete(req.params.id);
            res.json({ success: true, message: 'Personel silindi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getByRole: async (req, res) => {
        try {
            const staff = await TeknikEkipModel.getByRole(req.params.gorev);
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    calculateWeighted: async (req, res) => {
        try {
            const {
                kulup_id = 1,
                gorev = '',
                agirlik_deneyim = 33.33,
                agirlik_basari = 33.33,
                agirlik_uyum = 33.34
            } = req.body;

            const filters = { gorev };
            const weights = { agirlik_deneyim, agirlik_basari, agirlik_uyum };

            const staff = await TeknikEkipModel.calculateWeighted(kulup_id, filters, weights);
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getRoles: async (req, res) => {
        try {
            const roles = await TeknikEkipModel.getUniqueRoles();
            res.json(roles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = teknikEkipController;
