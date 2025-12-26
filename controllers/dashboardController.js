const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
    getSummary: async (req, res) => {
        try {
            const summary = await DashboardModel.getSummary();
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = dashboardController;
