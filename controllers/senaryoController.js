const SenaryoModel = require('../models/SenaryoModel');

const senaryoController = {
    create: async (req, res) => {
        try {
            console.log('📥 Senaryo kayıt isteği alındı:', req.body);

            const {
                kulup_id = 1,
                senaryo_adi,
                tablo_adi,
                filtre_degeri = '',
                aciklama = '',
                secilen_alternatifler,
                kullanilan_agirliklar,
                sonuclar,
                kazanan_id,
                kazanan_adi,
                kazanan_puan,
                karar_notu = ''
            } = req.body;

            if (!tablo_adi) {
                return res.status(400).json({ error: 'tablo_adi gerekli' });
            }

            const data = {
                kulup_id,
                senaryo_adi: senaryo_adi || `Karşılaştırma ${new Date().toLocaleString('tr-TR')}`,
                tablo_adi,
                filtre_degeri: filtre_degeri && filtre_degeri.trim() !== '' ? filtre_degeri : null,
                aciklama: aciklama && aciklama.trim() !== '' ? aciklama : null,
                secilen_alternatifler: secilen_alternatifler || [],
                kullanilan_agirliklar: kullanilan_agirliklar || {},
                sonuclar: sonuclar || [],
                kazanan_id: kazanan_id || null,
                kazanan_adi: kazanan_adi && kazanan_adi.trim() !== '' ? kazanan_adi : null,
                kazanan_puan: kazanan_puan || null,
                karar_notu: karar_notu && karar_notu.trim() !== '' ? karar_notu : null
            };

            const senaryo_id = await SenaryoModel.create(data);
            console.log('✅ Senaryo kaydedildi:', senaryo_id);
            res.json({ success: true, senaryo_id, message: 'Senaryo kaydedildi' });
        } catch (error) {
            console.error('❌ Senaryo kaydetme hatası:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const { kulup_id = 1, limit = 50 } = req.query;
            const scenarios = await SenaryoModel.getAll(kulup_id, limit);
            res.json(scenarios);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = senaryoController;
