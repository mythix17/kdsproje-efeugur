const pool = require('../config/db');

const SponsorModel = {
    getAll: async () => {
        const [rows] = await pool.query('SELECT * FROM sponsorlar ORDER BY toplam_puan DESC');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM sponsorlar WHERE sponsor_id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { kulup_id, ad, sektor, finansal_katki, imaj_puani, taraftar_uyumu, marka_degeri } = data;
        const [result] = await pool.query(
            `INSERT INTO sponsorlar (kulup_id, ad, sektor, finansal_katki, imaj_puani, taraftar_uyumu, marka_degeri, toplam_puan)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [kulup_id || 1, ad, sektor, finansal_katki, imaj_puani, taraftar_uyumu, marka_degeri]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { ad, sektor, finansal_katki, imaj_puani, taraftar_uyumu, marka_degeri } = data;
        await pool.query(
            `UPDATE sponsorlar SET 
        ad = ?, sektor = ?, finansal_katki = ?, imaj_puani = ?,
        taraftar_uyumu = ?, marka_degeri = ?
       WHERE sponsor_id = ?`,
            [ad, sektor, finansal_katki, imaj_puani, taraftar_uyumu, marka_degeri, id]
        );
        return true;
    },

    delete: async (id) => {
        await pool.query('DELETE FROM sponsorlar WHERE sponsor_id = ?', [id]);
        return true;
    },

    calculateWeighted: async (kulup_id, weights) => {
        const { agirlik_finansal, agirlik_imaj, agirlik_taraftar, agirlik_marka } = weights;

        await pool.query(
            `UPDATE agirlik_ayarlari SET 
        kriter_1_agirlik = ?, 
        kriter_2_agirlik = ?, 
        kriter_3_agirlik = ?, 
        kriter_4_agirlik = ?,
        kriter_1_adi = 'Finansal Katkı',
        kriter_2_adi = 'İmaj Puanı',
        kriter_3_adi = 'Taraftar Uyumu',
        kriter_4_adi = 'Marka Değeri',
        guncelleme_tarihi = CURRENT_TIMESTAMP
      WHERE tablo_adi = 'sponsorlar' AND kulup_id = ?`,
            [agirlik_finansal, agirlik_imaj, agirlik_taraftar, agirlik_marka, kulup_id]
        );

        const [rows] = await pool.query(`
      SELECT 
        sponsor_id,
        ad,
        sektor,
        finansal_katki,
        imaj_puani,
        taraftar_uyumu,
        marka_degeri,
        toplam_puan AS varsayilan_puan,
        ROUND(
          (finansal_katki * ? / 100) +
          (imaj_puani * ? / 100) +
          (taraftar_uyumu * ? / 100) +
          (marka_degeri * ? / 100),
          2
        ) AS agirlikli_puan
      FROM sponsorlar
      WHERE kulup_id = ?
      ORDER BY agirlikli_puan DESC
    `, [agirlik_finansal, agirlik_imaj, agirlik_taraftar, agirlik_marka, kulup_id]);

        return rows;
    },

    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM sponsorlar');
        return rows[0].count;
    },

    getBestSponsor: async () => {
        const [rows] = await pool.query('SELECT ad, toplam_puan FROM sponsorlar ORDER BY toplam_puan DESC LIMIT 1');
        return rows[0];
    }
};

module.exports = SponsorModel;
