const pool = require('../config/db');

const TesisModel = {
    getAll: async () => {
        const [rows] = await pool.query('SELECT * FROM tesisler ORDER BY toplam_puan DESC');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM tesisler WHERE tesis_id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { kulup_id, ad, altyapi_kalitesi, donanim_kalitesi, ulasim_kolayligi, konaklama_durumu } = data;
        const [result] = await pool.query(
            `INSERT INTO tesisler (kulup_id, ad, altyapi_kalitesi, donanim_kalitesi, ulasim_kolayligi, konaklama_durumu, toplam_puan)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [kulup_id || 1, ad, altyapi_kalitesi, donanim_kalitesi, ulasim_kolayligi, konaklama_durumu]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { ad, altyapi_kalitesi, donanim_kalitesi, ulasim_kolayligi, konaklama_durumu } = data;
        await pool.query(
            `UPDATE tesisler SET 
        ad = ?, altyapi_kalitesi = ?, donanim_kalitesi = ?,
        ulasim_kolayligi = ?, konaklama_durumu = ?
       WHERE tesis_id = ?`,
            [ad, altyapi_kalitesi, donanim_kalitesi, ulasim_kolayligi, konaklama_durumu, id]
        );
        return true;
    },

    delete: async (id) => {
        await pool.query('DELETE FROM tesisler WHERE tesis_id = ?', [id]);
        return true;
    },

    calculateWeighted: async (kulup_id, weights) => {
        const { agirlik_altyapi, agirlik_donanim, agirlik_ulasim, agirlik_konaklama } = weights;

        await pool.query(
            `UPDATE agirlik_ayarlari SET 
        kriter_1_agirlik = ?, 
        kriter_2_agirlik = ?, 
        kriter_3_agirlik = ?, 
        kriter_4_agirlik = ?,
        kriter_1_adi = 'Altyapı Kalitesi',
        kriter_2_adi = 'Donanım Kalitesi',
        kriter_3_adi = 'Ulaşım Kolaylığı',
        kriter_4_adi = 'Konaklama Durumu',
        guncelleme_tarihi = CURRENT_TIMESTAMP
      WHERE tablo_adi = 'tesisler' AND kulup_id = ?`,
            [agirlik_altyapi, agirlik_donanim, agirlik_ulasim, agirlik_konaklama, kulup_id]
        );

        const [rows] = await pool.query(`
      SELECT 
        tesis_id,
        ad,
        altyapi_kalitesi,
        donanim_kalitesi,
        ulasim_kolayligi,
        konaklama_durumu,
        toplam_puan AS varsayilan_puan,
        ROUND(
          (altyapi_kalitesi * ? / 100) +
          (donanim_kalitesi * ? / 100) +
          (ulasim_kolayligi * ? / 100) +
          (konaklama_durumu * ? / 100),
          2
        ) AS agirlikli_puan
      FROM tesisler
      WHERE kulup_id = ?
      ORDER BY agirlikli_puan DESC
    `, [agirlik_altyapi, agirlik_donanim, agirlik_ulasim, agirlik_konaklama, kulup_id]);

        return rows;
    },

    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM tesisler');
        return rows[0].count;
    }
};

module.exports = TesisModel;
