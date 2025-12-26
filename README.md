# ⚽ Futbol Kulübü Karar Destek Sistemi (KDS)

Modern bir web tabanlı karar destek sistemi. Futbol kulübü yönetimi için oyuncu, sponsor, teknik ekip ve tesis değerlendirmesi yapar.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

## 🚀 Özellikler

- **Dashboard**: Genel bakış ve özet istatistikler
- **Oyuncu Analizi**: Fiziksel güç, pozisyon ihtiyacı, taktik uyum ve sakatlık riski kriterleri
- **Sponsor Analizi**: Finansal katkı, imaj, taraftar uyumu ve marka değeri kriterleri
- **Teknik Ekip Analizi**: Deneyim, başarı ve uyum kriterleri
- **Tesis Analizi**: Altyapı, donanım, ulaşım ve konaklama kriterleri
- **Ağırlık Ayarlama**: Her kategori için kriterlerin ağırlıklarını değiştirme
- **Dinamik Grafikler**: Chart.js ile interaktif görselleştirme
- **Karşılaştırma**: Kategoriler arası çoklu kriter analizi

## 📋 Gereksinimler

- Node.js v16+
- MySQL 8.0+
- Modern web tarayıcısı

## ⚙️ Kurulum

### 1. Veritabanını Oluşturun

MySQL'e bağlanın ve `deneme.sql` dosyasını import edin:

```bash
mysql -u root -p < deneme.sql
```

Veya phpMyAdmin kullanarak:
1. Yeni bir veritabanı oluşturun: `deneme`
2. SQL sekmesinden `deneme.sql` dosyasını import edin

### 2. Proje Bağımlılıklarını Yükleyin

```bash
cd yap
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun (env.example dosyasını referans alabilirsiniz):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=deneme
PORT=3000
```

### 4. Sunucuyu Başlatın

```bash
npm start
```

veya geliştirme modunda (otomatik yenileme):

```bash
npm run dev
```

### 5. Tarayıcıda Açın

```
http://localhost:3000
```

## 🎮 Kullanım

### Ağırlık Ayarlama

1. Herhangi bir analiz sayfasına gidin (Oyuncular, Sponsorlar, vb.)
2. "Ağırlık Ayarları" panelindeki slider'ları kullanarak kriterlerin ağırlıklarını değiştirin
3. Toplamın %100 olduğundan emin olun (yeşil renkte gösterilir)
4. "Uygula ve Hesapla" butonuna tıklayın
5. Grafikler ve tablo anlık olarak güncellenecektir

### Filtreleme

- **Oyuncular**: Pozisyona göre filtreleme (Kaleci, Defans, Ortasaha, Forvet)
- **Teknik Ekip**: Göreve göre filtreleme (Teknik Direktör, Yardımcı Antrenör, vb.)

## 📊 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/kulupler` | Tüm kulüpler |
| GET | `/api/oyuncular` | Tüm oyuncular |
| GET | `/api/sponsorlar` | Tüm sponsorlar |
| GET | `/api/teknik-ekip` | Tüm teknik ekip |
| GET | `/api/tesisler` | Tüm tesisler |
| POST | `/api/oyuncular/agirlikli-puan` | Oyuncu ağırlıklı puan hesaplama |
| POST | `/api/sponsorlar/agirlikli-puan` | Sponsor ağırlıklı puan hesaplama |
| POST | `/api/teknik-ekip/agirlikli-puan` | Teknik ekip ağırlıklı puan hesaplama |
| POST | `/api/tesisler/agirlikli-puan` | Tesis ağırlıklı puan hesaplama |
| GET | `/api/dashboard` | Dashboard özet bilgileri |

## 🛠️ Teknolojiler

- **Backend**: Node.js, Express.js
- **Veritabanı**: MySQL 8.0
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Grafikler**: Chart.js
- **Font**: Outfit, JetBrains Mono

Geliştirici: KDS Projesi



























