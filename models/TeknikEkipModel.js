const pool = require('../config/db');

const TeknikEkipModel = {
    getAll: async () => {
        const [rows] = await pool.query('SELECT * FROM teknik_ekip ORDER BY toplam_puan DESC');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM teknik_ekip WHERE personel_id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { kulup_id, ad, gorev, deneyim_puani, basari_puani, uyum_puani, kontrat_suresi_ay } = data;
        const [result] = await pool.query(
            `INSERT INTO teknik_ekip (kulup_id, ad, gorev, deneyim_puani, basari_puani, uyum_puani, kontrat_suresi_ay, toplam_puan)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [kulup_id || 1, ad, gorev, deneyim_puani, basari_puani, uyum_puani, kontrat_suresi_ay]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { ad, gorev, deneyim_puani, basari_puani, uyum_puani, kontrat_suresi_ay } = data;
        await pool.query(
            `UPDATE teknik_ekip SET 
        ad = ?, gorev = ?, deneyim_puani = ?, basari_puani = ?,
        uyum_puani = ?, kontrat_suresi_ay = ?
       WHERE personel_id = ?`,
            [ad, gorev, deneyim_puani, basari_puani, uyum_puani, kontrat_suresi_ay, id]
        );
        return true;
    },

    delete: async (id) => {
        await pool.query('DELETE FROM teknik_ekip WHERE personel_id = ?', [id]);
        return true;
    },

    getByRole: async (gorev) => {
        const [rows] = await pool.query(
            'SELECT * FROM teknik_ekip WHERE gorev = ? ORDER BY toplam_puan DESC',
            [gorev]
        );
        return rows;
    },

    calculateWeighted: async (kulup_id, filters, weights) => {
        const { gorev } = filters;
        const { agirlik_deneyim, agirlik_basari, agirlik_uyum } = weights;

        await pool.query(
            `UPDATE agirlik_ayarlari SET 
        kriter_1_agirlik = ?, 
        kriter_2_agirlik = ?, 
        kriter_3_agirlik = ?, 
        kriter_4_agirlik = 0,
        kriter_1_adi = 'Deneyim',
        kriter_2_adi = 'Başarı',
        kriter_3_adi = 'Uyum',
        kriter_4_adi = NULL,
        guncelleme_tarihi = CURRENT_TIMESTAMP
      WHERE tablo_adi = 'teknik_ekip' AND kulup_id = ?`,
            [agirlik_deneyim, agirlik_basari, agirlik_uyum, kulup_id]
        );

        const [rows] = await pool.query(`
      SELECT 
        personel_id,
        ad,
        gorev,
        deneyim_puani,
        basari_puani,
        uyum_puani,
        kontrat_suresi_ay,
        toplam_puan AS varsayilan_puan,
        ROUND(
          (deneyim_puani * ? / 100) +
          (basari_puani * ? / 100) +
          (uyum_puani * ? / 100),
          2
        ) AS agirlikli_puan
      FROM teknik_ekip
      WHERE kulup_id = ?
        AND (? = '' OR gorev = ?)
      ORDER BY agirlikli_puan DESC
    `, [agirlik_deneyim, agirlik_basari, agirlik_uyum, kulup_id, gorev || '', gorev || '']);

        return rows;
    },

    getUniqueRoles: async () => {
        const [rows] = await pool.query('SELECT DISTINCT gorev FROM teknik_ekip');
        return rows.map(r => r.gorev);
    },

    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM teknik_ekip');
        return rows[0].count;
    }
};

module.exports = TeknikEkipModel;
