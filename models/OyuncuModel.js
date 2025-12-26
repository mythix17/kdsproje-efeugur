const pool = require('../config/db');

const OyuncuModel = {
    getAll: async () => {
        const [rows] = await pool.query('SELECT * FROM oyuncular ORDER BY toplam_puan DESC');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM oyuncular WHERE oyuncu_id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { kulup_id, oyuncu_adi, pozisyon, yas, uyruk, fiziksel_guc, pozisyon_ihtiyaci, taktik_uyum, saglik_puani, kontrat_suresi_ay } = data;
        const [result] = await pool.query(
            `INSERT INTO oyuncular (kulup_id, oyuncu_adi, pozisyon, yas, uyruk, fiziksel_guc, pozisyon_ihtiyaci, taktik_uyum, saglik_puani, kontrat_suresi_ay, toplam_puan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [kulup_id || 1, oyuncu_adi, pozisyon, yas, uyruk, fiziksel_guc, pozisyon_ihtiyaci, taktik_uyum, saglik_puani, kontrat_suresi_ay]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { oyuncu_adi, pozisyon, yas, uyruk, fiziksel_guc, pozisyon_ihtiyaci, taktik_uyum, saglik_puani, kontrat_suresi_ay } = data;
        await pool.query(
            `UPDATE oyuncular SET 
        oyuncu_adi = ?, pozisyon = ?, yas = ?, uyruk = ?,
        fiziksel_guc = ?, pozisyon_ihtiyaci = ?, taktik_uyum = ?,
        saglik_puani = ?, kontrat_suresi_ay = ?
       WHERE oyuncu_id = ?`,
            [oyuncu_adi, pozisyon, yas, uyruk, fiziksel_guc, pozisyon_ihtiyaci, taktik_uyum, saglik_puani, kontrat_suresi_ay, id]
        );
        return true;
    },

    delete: async (id) => {
        await pool.query('DELETE FROM oyuncular WHERE oyuncu_id = ?', [id]);
        return true;
    },

    getByPosition: async (pozisyon) => {
        const [rows] = await pool.query(
            'SELECT * FROM oyuncular WHERE pozisyon = ? ORDER BY toplam_puan DESC',
            [pozisyon]
        );
        return rows;
    },

    calculateWeighted: async (kulup_id, filters, weights) => {
        const { pozisyon } = filters;
        const { agirlik_fiziksel, agirlik_pozisyon, agirlik_taktik, agirlik_saglik } = weights;

        // Ağırlık ayarlarını güncelle
        await pool.query(
            `UPDATE agirlik_ayarlari SET 
        kriter_1_agirlik = ?, 
        kriter_2_agirlik = ?, 
        kriter_3_agirlik = ?, 
        kriter_4_agirlik = ?,
        kriter_1_adi = 'Fiziksel Güç',
        kriter_2_adi = 'Pozisyon İhtiyacı',
        kriter_3_adi = 'Taktik Uyum',
        kriter_4_adi = 'Sağlık / Dayanıklılık',
        guncelleme_tarihi = CURRENT_TIMESTAMP
      WHERE tablo_adi = 'oyuncular' AND kulup_id = ?`,
            [agirlik_fiziksel, agirlik_pozisyon, agirlik_taktik, agirlik_saglik, kulup_id]
        );

        const [rows] = await pool.query(`
      SELECT 
        oyuncu_id,
        oyuncu_adi,
        pozisyon,
        yas,
        uyruk,
        fiziksel_guc,
        pozisyon_ihtiyaci,
        taktik_uyum,
        saglik_puani,
        kontrat_suresi_ay,
        toplam_puan AS varsayilan_puan,
        ROUND(
          (fiziksel_guc * ? / 100) +
          (pozisyon_ihtiyaci * ? / 100) +
          (taktik_uyum * ? / 100) +
          (saglik_puani * ? / 100),
          2
        ) AS agirlikli_puan
      FROM oyuncular
      WHERE kulup_id = ?
        AND (? = '' OR pozisyon = ?)
      ORDER BY agirlikli_puan DESC
    `, [agirlik_fiziksel, agirlik_pozisyon, agirlik_taktik, agirlik_saglik, kulup_id, pozisyon || '', pozisyon || '']);

        return rows;
    },

    getUniquePositions: async () => {
        const [rows] = await pool.query('SELECT DISTINCT pozisyon FROM oyuncular');
        return rows.map(r => r.pozisyon);
    },

    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM oyuncular');
        return rows[0].count;
    },

    getBestPlayer: async () => {
        const [rows] = await pool.query('SELECT oyuncu_adi, toplam_puan FROM oyuncular ORDER BY toplam_puan DESC LIMIT 1');
        return rows[0];
    }
};

module.exports = OyuncuModel;
