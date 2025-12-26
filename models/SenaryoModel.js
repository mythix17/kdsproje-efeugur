const pool = require('../config/db');

const SenaryoModel = {
    create: async (data) => {
        const {
            kulup_id,
            senaryo_adi,
            tablo_adi,
            filtre_degeri,
            aciklama,
            secilen_alternatifler,
            kullanilan_agirliklar,
            sonuclar,
            kazanan_id,
            kazanan_adi,
            kazanan_puan,
            karar_notu
        } = data;

        const [result] = await pool.query(
            `INSERT INTO karsilastirma_senaryo 
        (kulup_id, senaryo_adi, tablo_adi, filtre_degeri, aciklama, 
         secilen_alternatifler, kullanilan_agirliklar, sonuclar,
         kazanan_id, kazanan_adi, kazanan_puan, durum, karar_notu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tamamlandi', ?)`,
            [
                kulup_id,
                senaryo_adi,
                tablo_adi,
                filtre_degeri,
                aciklama,
                JSON.stringify(secilen_alternatifler),
                JSON.stringify(kullanilan_agirliklar),
                JSON.stringify(sonuclar),
                kazanan_id,
                kazanan_adi,
                kazanan_puan,
                karar_notu
            ]
        );
        return result.insertId;
    },

    getAll: async (kulup_id, limit) => {
        const [rows] = await pool.query(
            `SELECT * FROM karsilastirma_senaryo 
       WHERE kulup_id = ? 
       ORDER BY olusturma_tarihi DESC 
       LIMIT ?`,
            [kulup_id, parseInt(limit)]
        );

        return rows.map(row => ({
            ...row,
            secilen_alternatifler: typeof row.secilen_alternatifler === 'string' ? JSON.parse(row.secilen_alternatifler) : row.secilen_alternatifler,
            kullanilan_agirliklar: typeof row.kullanilan_agirliklar === 'string' ? JSON.parse(row.kullanilan_agirliklar) : row.kullanilan_agirliklar,
            sonuclar: typeof row.sonuclar === 'string' ? JSON.parse(row.sonuclar) : row.sonuclar
        }));
    }
};

module.exports = SenaryoModel;
