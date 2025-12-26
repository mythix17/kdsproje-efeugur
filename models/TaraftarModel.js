const pool = require('../config/db');

const TaraftarModel = {
    getAll: async (filters) => {
        const { yil } = filters || {};
        let query = 'SELECT * FROM taraftar_gruplari WHERE 1=1';
        const params = [];

        if (yil) {
            query += ' AND yil = ?';
            params.push(yil);
        }

        query += ' ORDER BY yil DESC, toplam_puan DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM taraftar_gruplari WHERE tribun_id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { kulup_id, tribun_adi, kapasite, yil, memnuniyet_puani, taraftar_etki_puani, medya_yorum_puani, kapasite_doluluk } = data;
        const [result] = await pool.query(
            `INSERT INTO taraftar_gruplari (kulup_id, tribun_adi, kapasite, yil, memnuniyet_puani, taraftar_etki_puani, medya_yorum_puani, kapasite_doluluk, toplam_puan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [kulup_id || 1, tribun_adi, kapasite, yil, memnuniyet_puani, taraftar_etki_puani, medya_yorum_puani, kapasite_doluluk]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { tribun_adi, kapasite, yil, memnuniyet_puani, taraftar_etki_puani, medya_yorum_puani, kapasite_doluluk } = data;
        await pool.query(
            `UPDATE taraftar_gruplari SET 
        tribun_adi = ?, kapasite = ?, yil = ?,
        memnuniyet_puani = ?, taraftar_etki_puani = ?, medya_yorum_puani = ?, kapasite_doluluk = ?
       WHERE tribun_id = ?`,
            [tribun_adi, kapasite, yil, memnuniyet_puani, taraftar_etki_puani, medya_yorum_puani, kapasite_doluluk, id]
        );
        return true;
    },

    delete: async (id) => {
        await pool.query('DELETE FROM taraftar_gruplari WHERE tribun_id = ?', [id]);
        return true;
    },

    calculateWeighted: async (kulup_id, filters, weights) => {
        const { yil } = filters;
        const { agirlik_memnuniyet, agirlik_etki, agirlik_medya, agirlik_doluluk } = weights;

        await pool.query(
            `UPDATE agirlik_ayarlari SET 
        kriter_1_agirlik = ?, 
        kriter_2_agirlik = ?, 
        kriter_3_agirlik = ?, 
        kriter_4_agirlik = ?,
        kriter_1_adi = 'Memnuniyet Puanı',
        kriter_2_adi = 'Taraftar Etki Puanı',
        kriter_3_adi = 'Medya Yorum Puanı',
        kriter_4_adi = 'Kapasite Doluluk',
        guncelleme_tarihi = CURRENT_TIMESTAMP
      WHERE tablo_adi = 'taraftar_gruplari' AND kulup_id = ?`,
            [agirlik_memnuniyet, agirlik_etki, agirlik_medya, agirlik_doluluk, kulup_id]
        );

        let query = `
      SELECT 
        tribun_id,
        tribun_adi,
        kapasite,
        yil,
        memnuniyet_puani,
        taraftar_etki_puani,
        medya_yorum_puani,
        kapasite_doluluk,
        toplam_puan AS varsayilan_puan,
        ROUND(
          (memnuniyet_puani * ? / 100) +
          (taraftar_etki_puani * ? / 100) +
          (medya_yorum_puani * ? / 100) +
          (kapasite_doluluk * ? / 100),
          2
        ) AS agirlikli_puan
      FROM taraftar_gruplari
      WHERE kulup_id = ?
    `;

        const params = [agirlik_memnuniyet, agirlik_etki, agirlik_medya, agirlik_doluluk, kulup_id];

        if (yil) {
            query += ' AND yil = ?';
            params.push(yil);
        }

        query += ' ORDER BY yil DESC, agirlikli_puan DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getUniqueYears: async () => {
        const [rows] = await pool.query('SELECT DISTINCT yil FROM taraftar_gruplari ORDER BY yil DESC');
        return rows.map(r => r.yil);
    },

    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(DISTINCT tribun_adi) as count FROM taraftar_gruplari');
        return rows[0].count;
    }
};

module.exports = TaraftarModel;
