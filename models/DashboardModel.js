const pool = require('../config/db');

const DashboardModel = {
    getSummary: async () => {
        const [oyuncuSayisi] = await pool.query('SELECT COUNT(*) as count FROM oyuncular');
        const [sponsorSayisi] = await pool.query('SELECT COUNT(*) as count FROM sponsorlar');
        const [teknikEkipSayisi] = await pool.query('SELECT COUNT(*) as count FROM teknik_ekip');
        const [tesisSayisi] = await pool.query('SELECT COUNT(*) as count FROM tesisler');
        const [taraftarGrupSayisi] = await pool.query('SELECT COUNT(DISTINCT tribun_adi) as count FROM taraftar_gruplari');
        const [enIyiOyuncu] = await pool.query('SELECT oyuncu_adi, toplam_puan FROM oyuncular ORDER BY toplam_puan DESC LIMIT 1');
        const [enIyiSponsor] = await pool.query('SELECT ad, toplam_puan FROM sponsorlar ORDER BY toplam_puan DESC LIMIT 1');

        return {
            oyuncuSayisi: oyuncuSayisi[0].count,
            sponsorSayisi: sponsorSayisi[0].count,
            teknikEkipSayisi: teknikEkipSayisi[0].count,
            tesisSayisi: tesisSayisi[0].count,
            taraftarGrupSayisi: taraftarGrupSayisi[0].count,
            enIyiOyuncu: enIyiOyuncu[0],
            enIyiSponsor: enIyiSponsor[0]
        };
    }
};

module.exports = DashboardModel;
