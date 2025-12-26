const pool = require('../config/db');

const AgirlikModel = {
    getAll: async () => {
        const [rows] = await pool.query('SELECT * FROM agirlik_ayarlari');
        return rows;
    },

    update: async (tablo, data) => {
        const { kriter_1_agirlik, kriter_2_agirlik, kriter_3_agirlik, kriter_4_agirlik } = data;

        // Kriter adlarını tablo adına göre belirle (Basitleştirilmiş, detaylar controller'dan veya DB'den gelebilir ama burada hardcoded tutuldu)
        const kriterAdlari = {
            'oyuncular': ['Fiziksel Güç', 'Pozisyon İhtiyacı', 'Taktik Uyum', 'Sağlık / Dayanıklılık'],
            'sponsorlar': ['Finansal Katkı', 'İmaj Puanı', 'Taraftar Uyumu', 'Marka Değeri'],
            'teknik_ekip': ['Deneyim', 'Başarı', 'Uyum', null],
            'tesisler': ['Altyapı Kalitesi', 'Donanım Kalitesi', 'Ulaşım Kolaylığı', 'Konaklama Durumu'],
            'taraftar_gruplari': ['Memnuniyet Puanı', 'Taraftar Etki Puanı', 'Medya Yorum Puanı', 'Kapasite Doluluk']
        };

        const adlar = kriterAdlari[tablo] || [null, null, null, null];

        await pool.query(
            `UPDATE agirlik_ayarlari SET 
        kriter_1_agirlik = ?, 
        kriter_2_agirlik = ?, 
        kriter_3_agirlik = ?, 
        kriter_4_agirlik = ?,
        kriter_1_adi = ?,
        kriter_2_adi = ?,
        kriter_3_adi = ?,
        kriter_4_adi = ?,
        guncelleme_tarihi = CURRENT_TIMESTAMP
      WHERE tablo_adi = ?`,
            [kriter_1_agirlik, kriter_2_agirlik, kriter_3_agirlik, kriter_4_agirlik, adlar[0], adlar[1], adlar[2], adlar[3], tablo]
        );

        return true;
    }
};

module.exports = AgirlikModel;
