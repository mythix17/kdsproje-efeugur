// ==================== Global Variables ====================
const API_BASE = '';
let charts = {};
let sponsorSektorSortActive = false; // Sektör sıralaması durumu
let oyuncuPozisyonSortActive = false; // Pozisyon sıralaması durumu
let taraftarTribunSortActive = false; // Tribün sıralaması durumu
let teknikGorevSortActive = false; // Görev sıralaması durumu
let oyuncuCurrentPage = 1; // Oyuncular sayfa numarası
const oyuncuPageSize = 20; // Sayfa başına oyuncu sayısı
let sponsorCurrentPage = 1; // Sponsorlar sayfa numarası
const sponsorPageSize = 10; // Sayfa başına sponsor sayısı
let teknikCurrentPage = 1; // Teknik ekip sayfa numarası
const teknikPageSize = 20; // Sayfa başına teknik ekip sayısı
let tesisCurrentPage = 1; // Tesisler sayfa numarası
const tesisPageSize = 10; // Sayfa başına tesis sayısı
let taraftarCurrentPage = 1; // Taraftar grupları sayfa numarası
const taraftarPageSize = 12; // Sayfa başına taraftar grubu sayısı

// ==================== Color Palette ====================
const colors = {
  blue: { bg: 'rgba(59, 130, 246, 0.7)', border: '#3b82f6' },
  green: { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
  purple: { bg: 'rgba(139, 92, 246, 0.7)', border: '#8b5cf6' },
  orange: { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },
  pink: { bg: 'rgba(236, 72, 153, 0.7)', border: '#ec4899' },
  red: { bg: 'rgba(239, 68, 68, 0.7)', border: '#ef4444' },
  cyan: { bg: 'rgba(6, 182, 212, 0.7)', border: '#06b6d4' },
  lime: { bg: 'rgba(132, 204, 22, 0.7)', border: '#84cc16' },
  merkezium: { bg: 'rgba(234, 179, 8, 0.8)', border: '#eab308' }, // Altın/Sarı renk
  teknikEkip: { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' } // Teknik ekip özel rengi
};

// Mevcut teknik ekip üyeleri listesi
const mevcutTeknikEkip = [
  'Domenico Tedesco',
  'Zeki Murat Göle',
  'Sandro Zufic',
  'Ahmet Erdoğdu',
  'Hazal Şentürk',
  'Dr. Victor Lenz',
  'Victor Lenz',
  'Arda Bale'
];

// Teknik ekip üyesi kontrolü
function isMevcutTeknikEkip(ad, gorev = null) {
  if (!ad) return false;
  const adLower = ad.toLowerCase().trim();

  // Sosyal medya sorumlusunda Elif Tanoğlu'nu mavi yap
  if (gorev && (gorev.toLowerCase().includes('sosyal medya') || gorev.toLowerCase().includes('sosyalmedya'))) {
    if (adLower.includes('elif') && adLower.includes('tanoğlu')) {
      return true;
    }
  }

  return mevcutTeknikEkip.some(mevcut =>
    adLower === mevcut.toLowerCase().trim() ||
    adLower.includes(mevcut.toLowerCase().trim()) ||
    mevcut.toLowerCase().trim().includes(adLower)
  );
}

// Mevcut tesis kontrolü
function isMevcutTesis(ad) {
  if (!ad) return false;
  const adLower = ad.toLowerCase().trim();
  // Can Bartu Tesisleri mevcut olarak mavi gösterilecek
  return adLower.includes('can bartu') || adLower.includes('canbartu');
}

const chartColors = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(132, 204, 22, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(244, 63, 94, 0.8)'
];

// ==================== Chart.js Global Config ====================
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#2d3a4f';
Chart.defaults.font.family = 'Outfit, sans-serif';

// ==================== Toast Notifications ====================
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 3000);
}

// ==================== Loading Overlay ====================
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// ==================== Utility Functions ====================
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    // Content-Type kontrolü
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Beklenmeyen yanıt formatı: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API hatası');
    }
    return data;
  } catch (error) {
    console.error('API Error:', endpoint, error);
    // Sadece kritik hatalarda toast göster, ama bazı endpoint'ler için sessiz kal
    // Taraftar grupları için toast gösterme çünkü veri yoksa bu normal olabilir
    if (!endpoint.includes('karsilastirma-senaryo') &&
      !endpoint.includes('taraftar-gruplari/yillar') &&
      !endpoint.includes('taraftar-gruplari') &&
      !endpoint.includes('agirlikli-puan') &&
      !endpoint.includes('taraftar')) {
      showToast('error', 'Hata', error.message);
    }
    return null;
  }
}

function destroyChart(chartId) {
  if (charts[chartId]) {
    charts[chartId].destroy();
    delete charts[chartId];
  }
}

function getScoreBadgeClass(score) {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

// ==================== Refresh Functions ====================
function getCurrentSection() {
  const activeNav = document.querySelector('.nav-item.active');
  return activeNav ? activeNav.dataset.section : 'dashboard';
}

async function refreshCurrentSection() {
  const section = getCurrentSection();
  await loadSectionData(section);
}

async function globalRefresh() {
  const btn = document.getElementById('globalRefresh');
  btn.classList.add('loading');

  try {
    await refreshCurrentSection();
    showToast('success', 'Yenilendi', 'Veriler başarıyla güncellendi');
  } finally {
    btn.classList.remove('loading');
  }
}

// ==================== Navigation ====================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDashboard();
  initWeightSliders();
  initFilters();
  initButtons();

  // Menü item'larına event'leri ekle (sayfa yüklendiğinde)
  setTimeout(() => {
    setupNavigationMenuItems();
  }, 300);

  // Global refresh button
  document.getElementById('globalRefresh').addEventListener('click', globalRefresh);
});

// ==================== Dashboard Menu Items ====================
// Event delegation için global flag - sadece bir kez ekle
let menuEventListenersAdded = false;

function setupNavigationMenuItems() {
  // Event delegation kullanarak menü item'larına tıklama event'leri ekle
  // Bu şekilde dinamik olarak eklenen menü item'ları da çalışır

  // Teknik ekip menüsü için event delegation
  const teknikMenu = document.getElementById('navTeknikEkipMenu');
  if (teknikMenu && !teknikMenu.dataset.listenerAdded) {
    teknikMenu.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      if (menuItem) {
        e.stopPropagation();
        e.preventDefault();
        const section = menuItem.dataset.section;
        const filter = menuItem.dataset.filter;
        console.log('Teknik ekip menü tıklandı:', section, filter);
        if (section && filter) {
          navigateToSectionWithFilter(section, 'gorev', filter);
        }
      }
    });
    teknikMenu.dataset.listenerAdded = 'true';
  }
}

function navigateToSectionWithFilter(section, filterType, filterValue) {
  // Navigasyonu aktif et
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }

  // Section'ı göster
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(`${section}-section`).classList.add('active');

  // Sayfa başlıklarını güncelle
  const titles = {
    'oyuncular': { title: 'Oyuncular', subtitle: 'Oyuncu Performans Analizi ve Sıralaması' },
    'teknik-ekip': { title: 'Teknik Ekip', subtitle: 'Personel Performans Analizi' }
  };

  if (titles[section]) {
    document.getElementById('pageTitle').textContent = titles[section].title;
    document.querySelector('.page-subtitle').textContent = titles[section].subtitle;
  }

  // Filtreyi uygula
  if (section === 'oyuncular' && filterType === 'pozisyon') {
    // Pozisyon grubuna göre filtrele
    const pozisyonlar = pozisyonGruplari[filterValue] || [];
    setTimeout(async () => {
      const select = document.getElementById('oyuncuPozisyonFilter');
      if (select) {
        // Önce tüm pozisyonları yükle
        await loadOyuncular();

        // Pozisyon grubundaki herhangi bir pozisyonu bul
        if (pozisyonlar.length > 0) {
          const pozisyonlarList = Array.from(select.options).map(opt => opt.value);

          // Önce tam eşleşme ara
          let matchedPozisyon = pozisyonlar.find(p => pozisyonlarList.includes(p));

          // Tam eşleşme yoksa, kısmi eşleşme ara
          if (!matchedPozisyon) {
            matchedPozisyon = pozisyonlarList.find(p =>
              pozisyonlar.some(gp =>
                p.toLowerCase().includes(gp.toLowerCase()) ||
                gp.toLowerCase().includes(p.toLowerCase())
              )
            );
          }

          if (matchedPozisyon) {
            select.value = matchedPozisyon;
            await calculateOyuncuWeighted();
          } else {
            // Eğer hiç eşleşme yoksa, tümünü göster
            select.value = '';
            await calculateOyuncuWeighted();
          }
        }
      }
    }, 100);
  } else if (section === 'teknik-ekip' && filterType === 'gorev') {
    setTimeout(async () => {
      const select = document.getElementById('teknikGorevFilter');
      if (select) {
        await loadTeknikEkip();
        select.value = filterValue;
        await calculateTeknikWeighted();
      }
    }, 100);
  } else {
    // Filtre yoksa normal yükleme
    loadSectionData(section);
  }
}

// Global hover timeouts - menü item'ları değişse bile çalışsın
const hoverTimeouts = {};

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    const menu = item.querySelector('.nav-menu');
    if (menu) {
      const menuId = menu.id || `menu-${item.dataset.section || 'unknown'}`;

      // Mouse enter - menüyü göster
      item.addEventListener('mouseenter', () => {
        // Önceki timeout'u iptal et
        if (hoverTimeouts[menuId]) {
          clearTimeout(hoverTimeouts[menuId]);
          delete hoverTimeouts[menuId];
        }
        // Menüyü hemen göster
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
        menu.style.transform = 'translateY(0)';
        menu.style.pointerEvents = 'auto';
      });

      // Mouse leave - menüyü gecikmeyle kapat
      item.addEventListener('mouseleave', () => {
        // Menüyü kapatmak için gecikme ekle
        hoverTimeouts[menuId] = setTimeout(() => {
          menu.style.opacity = '0';
          menu.style.visibility = 'hidden';
          menu.style.transform = 'translateY(-10px)';
          menu.style.pointerEvents = 'none';
          delete hoverTimeouts[menuId];
        }, 300); // 300ms gecikme
      });

      // Menü üzerindeyken de açık tut
      menu.addEventListener('mouseenter', () => {
        if (hoverTimeouts[menuId]) {
          clearTimeout(hoverTimeouts[menuId]);
          delete hoverTimeouts[menuId];
        }
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
        menu.style.transform = 'translateY(0)';
        menu.style.pointerEvents = 'auto';
      });

      // Menüden çıkınca kapat
      menu.addEventListener('mouseleave', () => {
        hoverTimeouts[menuId] = setTimeout(() => {
          menu.style.opacity = '0';
          menu.style.visibility = 'hidden';
          menu.style.transform = 'translateY(-10px)';
          menu.style.pointerEvents = 'none';
          delete hoverTimeouts[menuId];
        }, 300);
      });
    }

    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`${section}-section`).classList.add('active');

      const titles = {
        'dashboard': { title: 'Anasayfa', subtitle: 'Karar Destek Sistemi Kontrol Paneli' },
        'oyuncular': { title: 'Oyuncular', subtitle: 'Oyuncu Performans Analizi ve Sıralaması' },
        'sponsorlar': { title: 'Sponsorlar', subtitle: 'Sponsor Değerlendirme ve Karşılaştırma' },
        'teknik-ekip': { title: 'Teknik Ekip', subtitle: 'Personel Performans Analizi' },
        'tesisler': { title: 'Tesisler', subtitle: 'Tesis Kalite Değerlendirmesi' },
        'taraftar-gruplari': { title: 'Taraftar Grupları', subtitle: 'Taraftar Grup Analizi ve Değerlendirmesi' },
        'karsilastirma': { title: 'Karşılaştırma', subtitle: 'Çoklu Kriter Analiz Aracı' }
      };

      document.getElementById('pageTitle').textContent = titles[section].title;
      document.querySelector('.page-subtitle').textContent = titles[section].subtitle;

      // Section'ın görünür olmasını bekle - iki frame bekleyerek DOM'un tamamen güncellenmesini sağla
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loadSectionData(section);
        });
      });
    });
  });
}

async function loadSectionData(section) {
  switch (section) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'oyuncular':
      await loadOyuncular();
      break;
    case 'sponsorlar':
      await loadSponsorlar();
      break;
    case 'teknik-ekip':
      await loadTeknikEkip();
      break;
    case 'tesisler':
      await loadTesisler();
      break;
    case 'taraftar-gruplari':
      await loadTaraftarGruplari();
      break;
    case 'karsilastirma':
      await loadKarsilastirma();
      break;
  }
}

// ==================== Anasayfa (Dashboard) ====================
async function loadDashboard() {
  const [dashboard, oyuncular, sponsorlar, tesisler, gorevler, teknikEkip] = await Promise.all([
    fetchAPI('/api/dashboard'),
    fetchAPI('/api/oyuncular'),
    fetchAPI('/api/sponsorlar'),
    fetchAPI('/api/tesisler'),
    fetchAPI('/api/gorevler'),
    fetchAPI('/api/teknik-ekip')
  ]);

  if (dashboard) {
    document.getElementById('dashOyuncu').textContent = dashboard.oyuncuSayisi;
    document.getElementById('dashSponsor').textContent = dashboard.sponsorSayisi;
    document.getElementById('dashTeknikEkip').textContent = dashboard.teknikEkipSayisi;
    document.getElementById('dashTesis').textContent = dashboard.tesisSayisi;
    document.getElementById('dashTaraftarGrup').textContent = dashboard.taraftarGrupSayisi || 0;
    document.getElementById('totalRecords').textContent =
      dashboard.oyuncuSayisi + dashboard.sponsorSayisi + dashboard.teknikEkipSayisi + dashboard.tesisSayisi + (dashboard.taraftarGrupSayisi || 0);
  }

  // Teknik ekip menüsünü doldur (navigation bar'daki menü)
  if (gorevler) {
    const teknikMenu = document.getElementById('navTeknikEkipMenu');
    if (teknikMenu) {
      teknikMenu.innerHTML = gorevler.map(gorev =>
        `<div class="menu-item" data-section="teknik-ekip" data-filter="${gorev}">${gorev}</div>`
      ).join('');
    }
  }

  // Menü item'larına tıklama event'leri ekle (biraz gecikme ile)
  // Teknik ekip menüsü doldurulduktan sonra event'leri ekle
  setTimeout(() => {
    setupNavigationMenuItems();
  }, 200);

  if (oyuncular && oyuncular.length > 0) {
    try {
      const pozisyonlar = {};
      oyuncular.forEach(o => {
        pozisyonlar[o.pozisyon] = (pozisyonlar[o.pozisyon] || 0) + 1;
      });

      const pozisyonChartEl = document.getElementById('dashPozisyonChart');
      if (pozisyonChartEl) {
        destroyChart('dashPozisyonChart');
        charts.dashPozisyonChart = new Chart(pozisyonChartEl, {
          type: 'doughnut',
          data: {
            labels: Object.keys(pozisyonlar),
            datasets: [{
              data: Object.values(pozisyonlar),
              backgroundColor: chartColors,
              borderWidth: 0,
              hoverOffset: 10
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } },
            cutout: '60%'
          }
        });
      }

      // Teknik ekip grafiği oluştur
      if (teknikEkip && teknikEkip.length > 0) {
        createDashTeknikEkipChart(teknikEkip);

        // Dropdown değişikliğinde grafiği güncelle
        const chartTypeSelect = document.getElementById('dashTeknikEkipChartType');
        if (chartTypeSelect) {
          chartTypeSelect.addEventListener('change', () => {
            createDashTeknikEkipChart(teknikEkip);
          });
        }
      }
    } catch (error) {
      console.error('Oyuncu grafikleri oluşturulurken hata:', error);
    }
  }

  if (sponsorlar) {
    createDashSponsorChart(sponsorlar);

    // Dropdown değişikliğinde grafiği güncelle
    const sponsorChartTypeSelect = document.getElementById('dashSponsorChartType');
    if (sponsorChartTypeSelect) {
      sponsorChartTypeSelect.addEventListener('change', () => {
        createDashSponsorChart(sponsorlar);
      });
    }
  }

  // Taraftar grupları grafiği (tesis grafiği yerine)
  const taraftarGruplari = await fetchAPI('/api/taraftar-gruplari');
  if (taraftarGruplari && taraftarGruplari.length > 0) {
    createDashTaraftarChart(taraftarGruplari);

    // Dropdown değişikliğinde grafiği güncelle
    const taraftarChartTypeSelect = document.getElementById('dashTaraftarChartType');
    if (taraftarChartTypeSelect) {
      taraftarChartTypeSelect.addEventListener('change', () => {
        createDashTaraftarChart(taraftarGruplari);
      });
    }
  }
}

// ==================== Dashboard Sponsor Grafiği ====================
function createDashSponsorChart(sponsorlar) {
  if (!sponsorlar || sponsorlar.length === 0) return;

  const chartTypeSelect = document.getElementById('dashSponsorChartType');
  const chartTitle = document.getElementById('dashSponsorChartTitle');
  const chartType = chartTypeSelect ? chartTypeSelect.value : 'finansal';
  const dashSponsorChartEl = document.getElementById('dashSponsorChart');

  if (!dashSponsorChartEl) return;

  destroyChart('dashSponsorChart');

  let chartData = { labels: [], datasets: [{ label: '', data: [], backgroundColor: [], borderColor: [] }] };
  let title = 'Sponsor Finansal Katkı';

  switch (chartType) {
    case 'finansal':
      chartData = {
        labels: sponsorlar.map(s => s.ad),
        datasets: [{
          label: 'Finansal Katkı',
          data: sponsorlar.map(s => s.finansal_katki || 0),
          backgroundColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.bg : colors.purple.bg
          ),
          borderColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.border : colors.purple.border
          ),
          borderWidth: 2,
          borderRadius: 6
        }]
      };
      title = 'Sponsor Finansal Katkı';
      break;

    case 'marka':
      chartData = {
        labels: sponsorlar.map(s => s.ad),
        datasets: [{
          label: 'Marka Değeri',
          data: sponsorlar.map(s => s.marka_degeri || 0),
          backgroundColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.bg : colors.purple.bg
          ),
          borderColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.border : colors.purple.border
          ),
          borderWidth: 2,
          borderRadius: 6
        }]
      };
      title = 'Sponsor Marka Değeri';
      break;

    case 'imaj':
      chartData = {
        labels: sponsorlar.map(s => s.ad),
        datasets: [{
          label: 'İmaj Puanı',
          data: sponsorlar.map(s => s.imaj_puani || 0),
          backgroundColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.bg : colors.purple.bg
          ),
          borderColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.border : colors.purple.border
          ),
          borderWidth: 2,
          borderRadius: 6
        }]
      };
      title = 'Sponsor İmaj Puanı';
      break;

    case 'taraftar':
      chartData = {
        labels: sponsorlar.map(s => s.ad),
        datasets: [{
          label: 'Taraftar Uyum Puanı',
          data: sponsorlar.map(s => s.taraftar_uyumu || 0),
          backgroundColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.bg : colors.purple.bg
          ),
          borderColor: sponsorlar.map(s =>
            s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.border : colors.purple.border
          ),
          borderWidth: 2,
          borderRadius: 6
        }]
      };
      title = 'Sponsor Taraftar Uyum Puanı';
      break;
  }

  if (chartTitle) {
    chartTitle.textContent = title;
  }

  charts.dashSponsorChart = new Chart(dashSponsorChartEl, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(45, 58, 79, 0.5)' }
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });
}

// ==================== Dashboard Taraftar Grupları Grafiği ====================
function createDashTaraftarChart(taraftarGruplari) {
  if (!taraftarGruplari || taraftarGruplari.length === 0) return;

  const chartTypeSelect = document.getElementById('dashTaraftarChartType');
  const chartTitle = document.getElementById('dashTaraftarChartTitle');
  const chartType = chartTypeSelect ? chartTypeSelect.value : 'memnuniyet';
  const dashTaraftarChartEl = document.getElementById('dashTaraftarChart');

  if (!dashTaraftarChartEl) return;

  destroyChart('dashTaraftarChart');

  // Tüm tribünleri al
  const allTribunler = [...new Set(taraftarGruplari.map(t => t.tribun_adi))].sort();
  const yillar = [2022, 2023, 2024];

  let chartData = { labels: [], datasets: [] };
  let title = 'Taraftar Grupları - Memnuniyet Puanı';

  switch (chartType) {
    case 'memnuniyet':
      chartData = {
        labels: allTribunler,
        datasets: yillar.map((yil, yilIndex) => {
          const yilData = taraftarGruplari.filter(t => t.yil == yil);
          return {
            label: `${yil} Yılı`,
            data: allTribunler.map(tribun => {
              const item = yilData.find(t => t.tribun_adi === tribun);
              return item ? item.memnuniyet_puani : null;
            }),
            backgroundColor: chartColors[yilIndex % chartColors.length].replace('0.8', '0.1'),
            borderColor: chartColors[yilIndex % chartColors.length],
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: chartColors[yilIndex % chartColors.length],
            pointBorderColor: chartColors[yilIndex % chartColors.length],
            pointHoverRadius: 7
          };
        })
      };
      title = 'Taraftar Grupları - Memnuniyet Puanı';
      break;

    case 'etki':
      chartData = {
        labels: allTribunler,
        datasets: yillar.map((yil, yilIndex) => {
          const yilData = taraftarGruplari.filter(t => t.yil == yil);
          return {
            label: `${yil} Yılı`,
            data: allTribunler.map(tribun => {
              const item = yilData.find(t => t.tribun_adi === tribun);
              return item ? item.taraftar_etki_puani : null;
            }),
            backgroundColor: chartColors[yilIndex % chartColors.length].replace('0.8', '0.1'),
            borderColor: chartColors[yilIndex % chartColors.length],
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: chartColors[yilIndex % chartColors.length],
            pointBorderColor: chartColors[yilIndex % chartColors.length],
            pointHoverRadius: 7
          };
        })
      };
      title = 'Taraftar Grupları - Etki Puanı';
      break;

    case 'medya':
      chartData = {
        labels: allTribunler,
        datasets: yillar.map((yil, yilIndex) => {
          const yilData = taraftarGruplari.filter(t => t.yil == yil);
          return {
            label: `${yil} Yılı`,
            data: allTribunler.map(tribun => {
              const item = yilData.find(t => t.tribun_adi === tribun);
              return item ? item.medya_yorum_puani : null;
            }),
            backgroundColor: chartColors[yilIndex % chartColors.length].replace('0.8', '0.1'),
            borderColor: chartColors[yilIndex % chartColors.length],
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: chartColors[yilIndex % chartColors.length],
            pointBorderColor: chartColors[yilIndex % chartColors.length],
            pointHoverRadius: 7
          };
        })
      };
      title = 'Taraftar Grupları - Medya Yorum Puanı';
      break;

    case 'doluluk':
      chartData = {
        labels: allTribunler,
        datasets: yillar.map((yil, yilIndex) => {
          const yilData = taraftarGruplari.filter(t => t.yil == yil);
          return {
            label: `${yil} Yılı`,
            data: allTribunler.map(tribun => {
              const item = yilData.find(t => t.tribun_adi === tribun);
              return item ? item.kapasite_doluluk : null;
            }),
            backgroundColor: chartColors[yilIndex % chartColors.length].replace('0.8', '0.1'),
            borderColor: chartColors[yilIndex % chartColors.length],
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: chartColors[yilIndex % chartColors.length],
            pointBorderColor: chartColors[yilIndex % chartColors.length],
            pointHoverRadius: 7
          };
        })
      };
      title = 'Taraftar Grupları - Kapasite Doluluk';
      break;
  }

  if (chartTitle) {
    chartTitle.textContent = title;
  }

  charts.dashTaraftarChart = new Chart(dashTaraftarChartEl, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 10,
            usePointStyle: true,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label} - ${context.label}: ${context.parsed.y !== null ? context.parsed.y.toFixed(2) : 'Veri yok'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(45, 58, 79, 0.5)' }
        },
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 }
          }
        }
      }
    }
  });
}

// ==================== Dashboard Oyuncu Grafiği ====================
function createDashTeknikEkipChart(teknikEkip) {
  if (!teknikEkip || teknikEkip.length === 0) return;

  const chartTypeSelect = document.getElementById('dashTeknikEkipChartType');
  const chartTitle = document.getElementById('dashTeknikEkipChartTitle');
  const chartType = chartTypeSelect ? chartTypeSelect.value : 'deneyim';
  const topTeknikEkipChartEl = document.getElementById('dashTopTeknikEkipChart');

  if (!topTeknikEkipChartEl) return;

  destroyChart('dashTopTeknikEkipChart');

  let chartData = { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] };
  let title = 'Teknik Ekip';
  let maxValue = 100;

  // Toplam puan hesapla
  const teknikEkipWithTotal = teknikEkip.map(tek => ({
    ...tek,
    toplam_puan: Math.round(((tek.deneyim_puani || 0) + (tek.basari_puani || 0) + (tek.uyum_puani || 0)) / 3)
  }));

  // Yardımcı fonksiyon: İsim ve görev formatı (kısa versiyon - y ekseni için)
  const formatLabel = (tek) => {
    const ad = tek.ad || 'Bilinmiyor';
    const gorev = tek.gorev || 'Görev Belirtilmemiş';
    // Eğer ad çok uzunsa sadece soy isim göster, değilse tam isim
    const adParts = ad.split(' ');
    const displayName = adParts.length > 2 ? adParts.slice(-2).join(' ') : ad;
    // Y ekseni için kısa format: İsim (Görev)
    return `${displayName} (${gorev})`;
  };

  // Yardımcı fonksiyon: Tooltip için tam bilgi
  const getTooltipLabel = (tek, puanTipi) => {
    const ad = tek.ad || 'Bilinmiyor';
    const gorev = tek.gorev || 'Görev Belirtilmemiş';
    let puanBilgisi = '';
    if (puanTipi === 'toplam') {
      puanBilgisi = `Toplam Puan: ${tek.toplam_puan || 0}`;
    } else if (puanTipi === 'deneyim') {
      puanBilgisi = `Deneyim Puanı: ${tek.deneyim_puani || 0}`;
    } else if (puanTipi === 'basari') {
      puanBilgisi = `Başarı Puanı: ${tek.basari_puani || 0}`;
    } else if (puanTipi === 'uyum') {
      puanBilgisi = `Uyum Puanı: ${tek.uyum_puani || 0}`;
    }
    return [`${ad}`, `Görev: ${gorev}`, puanBilgisi];
  };

  let tooltipCallback = null;
  let currentData = [];

  switch (chartType) {
    case 'deneyim':
      const topDeneyim = [...teknikEkip].sort((a, b) => (b.deneyim_puani || 0) - (a.deneyim_puani || 0)).slice(0, 5);
      currentData = topDeneyim;
      chartData = {
        labels: topDeneyim.map(t => formatLabel(t)),
        datasets: [{
          label: 'Deneyim Puanı',
          data: topDeneyim.map(t => t.deneyim_puani || 0),
          backgroundColor: chartColors.slice(0, topDeneyim.length),
          borderRadius: 8,
          borderSkipped: false
        }]
      };
      title = 'Teknik Ekip - Deneyim Puanı';
      tooltipCallback = (context) => {
        const index = context.dataIndex;
        const tek = topDeneyim[index];
        return getTooltipLabel(tek, 'deneyim');
      };
      break;

    case 'basari':
      const topBasari = [...teknikEkip].sort((a, b) => (b.basari_puani || 0) - (a.basari_puani || 0)).slice(0, 5);
      currentData = topBasari;
      chartData = {
        labels: topBasari.map(t => formatLabel(t)),
        datasets: [{
          label: 'Başarı Puanı',
          data: topBasari.map(t => t.basari_puani || 0),
          backgroundColor: chartColors.slice(0, topBasari.length),
          borderRadius: 8,
          borderSkipped: false
        }]
      };
      title = 'Teknik Ekip - Başarı Puanı';
      tooltipCallback = (context) => {
        const index = context.dataIndex;
        const tek = topBasari[index];
        return getTooltipLabel(tek, 'basari');
      };
      break;

    case 'uyum':
      const topUyum = [...teknikEkip].sort((a, b) => (b.uyum_puani || 0) - (a.uyum_puani || 0)).slice(0, 5);
      currentData = topUyum;
      chartData = {
        labels: topUyum.map(t => formatLabel(t)),
        datasets: [{
          label: 'Uyum Puanı',
          data: topUyum.map(t => t.uyum_puani || 0),
          backgroundColor: chartColors.slice(0, topUyum.length),
          borderRadius: 8,
          borderSkipped: false
        }]
      };
      title = 'Teknik Ekip - Uyum Puanı';
      tooltipCallback = (context) => {
        const index = context.dataIndex;
        const tek = topUyum[index];
        return getTooltipLabel(tek, 'uyum');
      };
      break;

    case 'gorev-dagilim':
      const gorevDagilim = {};
      teknikEkip.forEach(t => {
        const gorev = t.gorev || 'Bilinmiyor';
        gorevDagilim[gorev] = (gorevDagilim[gorev] || 0) + 1;
      });

      chartData = {
        labels: Object.keys(gorevDagilim),
        datasets: [{
          label: 'Personel Sayısı',
          data: Object.values(gorevDagilim),
          backgroundColor: chartColors.slice(0, Object.keys(gorevDagilim).length),
          borderRadius: 8,
          borderSkipped: false
        }]
      };
      title = 'Teknik Ekip - Görev Dağılımı';
      maxValue = Math.max(...Object.values(gorevDagilim)) + 2;
      break;
  }

  if (chartTitle) {
    chartTitle.textContent = title;
  }

  charts.dashTopTeknikEkipChart = new Chart(topTeknikEkipChartEl, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function (context) {
              // Tooltip başlığında sadece isim göster
              if (tooltipCallback && currentData[context[0].dataIndex]) {
                const tek = currentData[context[0].dataIndex];
                return tek.ad || 'Bilinmiyor';
              }
              return context[0].label.split('\n')[0];
            },
            label: function (context) {
              // Tooltip içeriğinde görev ve puan bilgisi
              if (tooltipCallback) {
                return tooltipCallback(context);
              }
              return `${context.dataset.label}: ${context.parsed.x}`;
            }
          },
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          displayColors: true,
          backgroundColor: 'rgba(26, 35, 50, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          borderColor: '#2d3a4f',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: maxValue,
          grid: { color: 'rgba(45, 58, 79, 0.5)' },
          ticks: {
            callback: function (value) {
              return value;
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: false,
            callback: function (value, index) {
              // Label zaten formatLabel ile formatlanmış
              return this.getLabelForValue(value);
            }
          }
        }
      }
    }
  });
}

// ==================== Oyuncular ====================
async function loadOyuncular() {
  const pozisyonlar = await fetchAPI('/api/pozisyonlar');
  const select = document.getElementById('oyuncuPozisyonFilter');
  select.innerHTML = '<option value="">Tümü</option>';
  if (pozisyonlar) {
    pozisyonlar.forEach(p => {
      select.innerHTML += `<option value="${p}">${p}</option>`;
    });
  }

  // Ağırlık ayarlarını veritabanından yükle
  const agirlikAyarlari = await fetchAPI('/api/agirlik-ayarlari');
  if (agirlikAyarlari) {
    const oyuncuAyarlari = agirlikAyarlari.find(a => a.tablo_adi === 'oyuncular');
    if (oyuncuAyarlari) {
      document.getElementById('oyuncuFiziksel').value = oyuncuAyarlari.kriter_1_agirlik || 25;
      document.getElementById('oyuncuPozisyon').value = oyuncuAyarlari.kriter_2_agirlik || 25;
      document.getElementById('oyuncuTaktik').value = oyuncuAyarlari.kriter_3_agirlik || 25;
      document.getElementById('oyuncuSaglik').value = oyuncuAyarlari.kriter_4_agirlik || 25;
      updateWeightDisplay('oyuncuFiziksel');
      updateWeightDisplay('oyuncuPozisyon');
      updateWeightDisplay('oyuncuTaktik');
      updateWeightDisplay('oyuncuSaglik');
      updateWeightTotal('oyuncuToplam', ['oyuncuFiziksel', 'oyuncuPozisyon', 'oyuncuTaktik', 'oyuncuSaglik']);
    } else {
      // Veritabanında ayar yoksa varsayılan değerleri kullan
      document.getElementById('oyuncuFiziksel').value = 25;
      document.getElementById('oyuncuPozisyon').value = 25;
      document.getElementById('oyuncuTaktik').value = 25;
      document.getElementById('oyuncuSaglik').value = 25;
      updateWeightDisplay('oyuncuFiziksel');
      updateWeightDisplay('oyuncuPozisyon');
      updateWeightDisplay('oyuncuTaktik');
      updateWeightDisplay('oyuncuSaglik');
      updateWeightTotal('oyuncuToplam', ['oyuncuFiziksel', 'oyuncuPozisyon', 'oyuncuTaktik', 'oyuncuSaglik']);
    }
  } else {
    // API'den veri gelmezse varsayılan değerleri kullan
    document.getElementById('oyuncuFiziksel').value = 25;
    document.getElementById('oyuncuPozisyon').value = 25;
    document.getElementById('oyuncuTaktik').value = 25;
    document.getElementById('oyuncuSaglik').value = 25;
    updateWeightDisplay('oyuncuFiziksel');
    updateWeightDisplay('oyuncuPozisyon');
    updateWeightDisplay('oyuncuTaktik');
    updateWeightDisplay('oyuncuSaglik');
    updateWeightTotal('oyuncuToplam', ['oyuncuFiziksel', 'oyuncuPozisyon', 'oyuncuTaktik', 'oyuncuSaglik']);
  }

  // Section'ın görünür olmasını bekle, sonra grafikleri oluştur
  const oyuncuSection = document.getElementById('oyuncular-section');
  if (oyuncuSection && oyuncuSection.classList.contains('active')) {
    // Section zaten aktif, direkt hesapla
    await calculateOyuncuWeighted();
  } else {
    // Section henüz aktif değil, biraz bekle
    await new Promise(resolve => setTimeout(resolve, 100));
    await calculateOyuncuWeighted();
  }
}

async function calculateOyuncuWeighted() {
  const pozisyon = document.getElementById('oyuncuPozisyonFilter').value;
  let fiziksel = parseInt(document.getElementById('oyuncuFiziksel').value) || 0;
  let pozisyonW = parseInt(document.getElementById('oyuncuPozisyon').value) || 0;
  let taktik = parseInt(document.getElementById('oyuncuTaktik').value) || 0;
  let saglik = parseInt(document.getElementById('oyuncuSaglik').value) || 0;

  // Ağırlık toplamı kontrolü - sadece uyarı göster, değerleri değiştirme
  let total = fiziksel + pozisyonW + taktik + saglik;
  if (total !== 100 && total > 0) {
    // Toplam %100 değilse uyarı göster ama değerleri değiştirme
    showToast('warning', 'Uyarı', 'Ağırlıkların toplamı %100 olmalıdır. Şu an: %' + total + '. Lütfen değerleri ayarlayın.');
  } else if (total === 0) {
    // Eğer toplam 0 ise, varsayılan değerleri kullan (sadece ilk yüklemede)
    fiziksel = pozisyonW = taktik = saglik = 25;
    total = 100;
    document.getElementById('oyuncuFiziksel').value = 25;
    document.getElementById('oyuncuPozisyon').value = 25;
    document.getElementById('oyuncuTaktik').value = 25;
    document.getElementById('oyuncuSaglik').value = 25;
    updateWeightDisplay('oyuncuFiziksel');
    updateWeightDisplay('oyuncuPozisyon');
    updateWeightDisplay('oyuncuTaktik');
    updateWeightDisplay('oyuncuSaglik');
    updateWeightTotal('oyuncuToplam', ['oyuncuFiziksel', 'oyuncuPozisyon', 'oyuncuTaktik', 'oyuncuSaglik']);
  }

  console.log('calculateOyuncuWeighted çağrıldı:', { pozisyon, fiziksel, pozisyonW, taktik, saglik });

  const data = await fetchAPI('/api/oyuncular/agirlikli-puan', {
    method: 'POST',
    body: JSON.stringify({
      kulup_id: 1,
      pozisyon: pozisyon,
      agirlik_fiziksel: fiziksel,
      agirlik_pozisyon: pozisyonW,
      agirlik_taktik: taktik,
      agirlik_saglik: saglik
    })
  });

  console.log('API\'den gelen veri:', data);

  if (!data || data.length === 0) {
    console.warn('Oyuncu verisi bulunamadı veya boş');
    // Boş veri durumunda bile grafikleri temizle
    destroyChart('oyuncuChart');
    destroyChart('oyuncuRadarChart');
    const tbody = document.querySelector('#oyuncuTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 20px;">Veri bulunamadı</td></tr>';
    }
    return;
  }

  // Pozisyon sıralaması aktifse, aynı pozisyondaki oyuncuları alt alta getir
  let sortedData = [...data];
  if (oyuncuPozisyonSortActive) {
    sortedData.sort((a, b) => {
      // Önce pozisyona göre sırala
      const pozisyonCompare = (a.pozisyon || '').localeCompare(b.pozisyon || '', 'tr');
      if (pozisyonCompare !== 0) return pozisyonCompare;
      // Aynı pozisyondaysa ağırlıklı puana göre azalan sırala
      return b.agirlikli_puan - a.agirlikli_puan;
    });
  }

  try {
    // Section'ın görünür olduğundan emin ol
    const oyuncuSection = document.getElementById('oyuncular-section');
    if (!oyuncuSection || !oyuncuSection.classList.contains('active')) {
      console.warn('Oyuncular section henüz aktif değil, grafikler oluşturulamıyor');
      // Section aktif olana kadar bekle
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const oyuncuChartEl = document.getElementById('oyuncuChart');
    const oyuncuRadarChartEl = document.getElementById('oyuncuRadarChart');

    if (!oyuncuChartEl) {
      console.error('oyuncuChart elementi bulunamadı');
      // Element bulunamazsa biraz bekle ve tekrar dene
      await new Promise(resolve => setTimeout(resolve, 200));
      const retryChartEl = document.getElementById('oyuncuChart');
      if (!retryChartEl) {
        console.error('oyuncuChart elementi hala bulunamadı');
        return;
      }
    }

    destroyChart('oyuncuChart');
    charts.oyuncuChart = new Chart(oyuncuChartEl, {
      type: 'bar',
      data: {
        labels: sortedData.map(o => o.oyuncu_adi.split(' ').pop()),
        datasets: [{
          label: 'Ağırlıklı Puan',
          data: sortedData.map(o => o.agirlikli_puan),
          backgroundColor: data.map((_, i) => i === 0 ? colors.green.bg : colors.blue.bg),
          borderColor: data.map((_, i) => i === 0 ? colors.green.border : colors.blue.border),
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => sortedData[items[0].dataIndex].oyuncu_adi,
              afterLabel: (item) => `Pozisyon: ${sortedData[item.dataIndex].pozisyon}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: 'rgba(45, 58, 79, 0.5)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } }
        }
      }
    });

    const top3 = sortedData.slice(0, 3);
    if (oyuncuRadarChartEl && top3.length > 0) {
      destroyChart('oyuncuRadarChart');
      charts.oyuncuRadarChart = new Chart(oyuncuRadarChartEl, {
        type: 'radar',
        data: {
          labels: ['Fiziksel', 'Pozisyon', 'Taktik', 'Sağlık'],
          datasets: top3.map((o, i) => ({
            label: o.oyuncu_adi.split(' ').pop(),
            data: [o.fiziksel_guc, o.pozisyon_ihtiyaci, o.taktik_uyum, o.saglik_puani],
            backgroundColor: chartColors[i].replace('0.8', '0.2'),
            borderColor: chartColors[i],
            borderWidth: 2,
            pointBackgroundColor: chartColors[i]
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 20, display: false },
              grid: { color: 'rgba(45, 58, 79, 0.5)' },
              angleLines: { color: 'rgba(45, 58, 79, 0.5)' }
            }
          },
          plugins: { legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } }
        }
      });
    }

    // Sayfalama hesaplamaları
    const totalPages = Math.ceil(sortedData.length / oyuncuPageSize);
    const startIndex = (oyuncuCurrentPage - 1) * oyuncuPageSize;
    const endIndex = startIndex + oyuncuPageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const tbody = document.querySelector('#oyuncuTable tbody');
    const paginationEl = document.getElementById('oyuncuPagination');
    const prevBtn = document.getElementById('oyuncuPrevBtn');
    const nextBtn = document.getElementById('oyuncuNextBtn');
    const pageInfo = document.getElementById('oyuncuPageInfo');

    if (tbody) {
      if (sortedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 20px;">Veri bulunamadı</td></tr>';
        if (paginationEl) paginationEl.style.display = 'none';
      } else {
        // Sayfalama kontrollerini göster
        if (paginationEl) paginationEl.style.display = 'flex';

        // Sayfa bilgisini güncelle
        if (pageInfo) {
          pageInfo.textContent = `Sayfa ${oyuncuCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
        }

        // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya ayarla
        if (oyuncuCurrentPage > totalPages && totalPages > 0) {
          oyuncuCurrentPage = totalPages;
          // Sayfayı yeniden hesapla
          const newStartIndex = (oyuncuCurrentPage - 1) * oyuncuPageSize;
          const newEndIndex = newStartIndex + oyuncuPageSize;
          const newPaginatedData = sortedData.slice(newStartIndex, newEndIndex);
          tbody.innerHTML = newPaginatedData.map((o, i) => `
    <tr>
      <td>${newStartIndex + i + 1}</td>
      <td><strong>${o.oyuncu_adi}</strong></td>
      <td>${o.pozisyon}</td>
      <td>${o.yas}</td>
      <td>${o.uyruk || '-'}</td>
      <td>${o.kontrat_suresi_ay || '-'}</td>
      <td>${o.fiziksel_guc}</td>
      <td>${o.pozisyon_ihtiyaci}</td>
      <td>${o.taktik_uyum}</td>
      <td>${o.saglik_puani}</td>
      <td>${o.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(o.agirlikli_puan)}">${o.agirlikli_puan}</span></td>
    </tr>
  `).join('');
          if (pageInfo) pageInfo.textContent = `Sayfa ${oyuncuCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
          if (prevBtn) prevBtn.disabled = oyuncuCurrentPage === 1;
          if (nextBtn) nextBtn.disabled = true;
          return; // Erken çık
        }

        // Önceki/Sonraki butonlarını güncelle
        if (prevBtn) {
          prevBtn.disabled = oyuncuCurrentPage === 1;
        }
        if (nextBtn) {
          nextBtn.disabled = oyuncuCurrentPage >= totalPages || totalPages === 0;
        }

        // Tabloyu doldur
        tbody.innerHTML = paginatedData.map((o, i) => `
    <tr>
      <td>${startIndex + i + 1}</td>
      <td><strong>${o.oyuncu_adi}</strong></td>
      <td>${o.pozisyon}</td>
      <td>${o.yas}</td>
      <td>${o.uyruk || '-'}</td>
      <td>${o.kontrat_suresi_ay || '-'}</td>
      <td>${o.fiziksel_guc}</td>
      <td>${o.pozisyon_ihtiyaci}</td>
      <td>${o.taktik_uyum}</td>
      <td>${o.saglik_puani}</td>
      <td>${o.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(o.agirlikli_puan)}">${o.agirlikli_puan}</span></td>
    </tr>
  `).join('');
      }
    }

    // Pozisyon sütunu sıralama ikonunu güncelle ve event listener ekle
    const pozisyonHeader = document.querySelector('#oyuncuTable th[data-sort="pozisyon"]');
    if (pozisyonHeader) {
      const sortIcon = pozisyonHeader.querySelector('.sort-icon');
      if (sortIcon) {
        sortIcon.textContent = oyuncuPozisyonSortActive ? '↓' : '↕';
      }
      pozisyonHeader.style.color = oyuncuPozisyonSortActive ? '#3b82f6' : '';
      pozisyonHeader.style.cursor = 'pointer';

      // Event listener ekle (eğer yoksa)
      if (!pozisyonHeader.dataset.listenerAdded) {
        pozisyonHeader.addEventListener('click', () => {
          oyuncuPozisyonSortActive = !oyuncuPozisyonSortActive;
          calculateOyuncuWeighted();
        });
        pozisyonHeader.dataset.listenerAdded = 'true';
      }
    }
  } catch (error) {
    console.error('Oyuncu grafikleri oluşturulurken hata:', error);
  }
}

// ==================== Sponsorlar ====================
async function loadSponsorlar() {
  // Ağırlık ayarlarını veritabanından yükle
  const agirlikAyarlari = await fetchAPI('/api/agirlik-ayarlari');
  if (agirlikAyarlari) {
    const sponsorAyarlari = agirlikAyarlari.find(a => a.tablo_adi === 'sponsorlar');
    if (sponsorAyarlari) {
      document.getElementById('sponsorFinansal').value = sponsorAyarlari.kriter_1_agirlik || 25;
      document.getElementById('sponsorImaj').value = sponsorAyarlari.kriter_2_agirlik || 25;
      document.getElementById('sponsorTaraftar').value = sponsorAyarlari.kriter_3_agirlik || 25;
      document.getElementById('sponsorMarka').value = sponsorAyarlari.kriter_4_agirlik || 25;
      updateWeightDisplay('sponsorFinansal');
      updateWeightDisplay('sponsorImaj');
      updateWeightDisplay('sponsorTaraftar');
      updateWeightDisplay('sponsorMarka');
      updateWeightTotal(['sponsorFinansal', 'sponsorImaj', 'sponsorTaraftar', 'sponsorMarka'], 'sponsorToplam');
    }
  }

  await calculateSponsorWeighted();
}

async function calculateSponsorWeighted() {
  const finansal = parseInt(document.getElementById('sponsorFinansal').value);
  const imaj = parseInt(document.getElementById('sponsorImaj').value);
  const taraftar = parseInt(document.getElementById('sponsorTaraftar').value);
  const marka = parseInt(document.getElementById('sponsorMarka').value);

  // Ağırlık toplamı kontrolü
  const total = finansal + imaj + taraftar + marka;
  if (total !== 100) {
    showToast('warning', 'Uyarı', 'Ağırlıkların toplamı %100 olmalıdır. Şu an: %' + total);
    return;
  }

  const data = await fetchAPI('/api/sponsorlar/agirlikli-puan', {
    method: 'POST',
    body: JSON.stringify({
      kulup_id: 1,
      agirlik_finansal: finansal,
      agirlik_imaj: imaj,
      agirlik_taraftar: taraftar,
      agirlik_marka: marka
    })
  });

  if (!data) return;

  // Sektör sıralaması aktifse, aynı sektördekileri alt alta getir
  let sortedData = [...data];
  if (sponsorSektorSortActive) {
    sortedData.sort((a, b) => {
      // Önce sektöre göre sırala
      const sektorCompare = (a.sektor || '').localeCompare(b.sektor || '', 'tr');
      if (sektorCompare !== 0) return sektorCompare;
      // Aynı sektördeyse ağırlıklı puana göre azalan sırala
      return b.agirlikli_puan - a.agirlikli_puan;
    });
  }

  destroyChart('sponsorChart');
  charts.sponsorChart = new Chart(document.getElementById('sponsorChart'), {
    type: 'bar',
    data: {
      labels: sortedData.map(s => s.ad),
      datasets: [{
        label: 'Ağırlıklı Puan',
        data: sortedData.map(s => s.agirlikli_puan),
        backgroundColor: sortedData.map(s =>
          s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.bg : colors.purple.bg
        ),
        borderColor: sortedData.map(s =>
          s.ad && s.ad.toLowerCase().includes('merkezium') ? colors.merkezium.border : colors.purple.border
        ),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(45, 58, 79, 0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });

  const top3 = sortedData.slice(0, 3);
  destroyChart('sponsorRadarChart');
  charts.sponsorRadarChart = new Chart(document.getElementById('sponsorRadarChart'), {
    type: 'bar',
    data: {
      labels: ['Finansal', 'İmaj', 'Taraftar', 'Marka'],
      datasets: top3.map((s, i) => {
        const isMerkezium = s.ad && s.ad.toLowerCase().includes('merkezium');
        return {
          label: s.ad,
          data: [s.finansal_katki, s.imaj_puani, s.taraftar_uyumu, s.marka_degeri],
          backgroundColor: isMerkezium ? colors.merkezium.bg : chartColors[i],
          borderColor: isMerkezium ? colors.merkezium.border : chartColors[i].replace('0.8', '1'),
          borderWidth: 2,
          borderRadius: 6
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 },
          grid: { color: 'rgba(45, 58, 79, 0.5)' }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 10,
            usePointStyle: true,
            font: { size: 11 }
          }
        }
      }
    }
  });

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(sortedData.length / sponsorPageSize);
  const startIndex = (sponsorCurrentPage - 1) * sponsorPageSize;
  const endIndex = startIndex + sponsorPageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const tbody = document.querySelector('#sponsorTable tbody');
  const paginationEl = document.getElementById('sponsorPagination');
  const prevBtn = document.getElementById('sponsorPrevBtn');
  const nextBtn = document.getElementById('sponsorNextBtn');
  const pageInfo = document.getElementById('sponsorPageInfo');

  if (tbody) {
    if (sortedData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Veri bulunamadı</td></tr>';
      if (paginationEl) paginationEl.style.display = 'none';
    } else {
      // Sayfalama kontrollerini göster
      if (paginationEl) paginationEl.style.display = 'flex';

      // Sayfa bilgisini güncelle
      if (pageInfo) {
        pageInfo.textContent = `Sayfa ${sponsorCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
      }

      // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya ayarla
      if (sponsorCurrentPage > totalPages && totalPages > 0) {
        sponsorCurrentPage = totalPages;
        // Sayfayı yeniden hesapla
        const newStartIndex = (sponsorCurrentPage - 1) * sponsorPageSize;
        const newEndIndex = newStartIndex + sponsorPageSize;
        const newPaginatedData = sortedData.slice(newStartIndex, newEndIndex);
        tbody.innerHTML = newPaginatedData.map((s, i) => `
    <tr>
      <td>${newStartIndex + i + 1}</td>
      <td><strong>${s.ad}</strong></td>
      <td>${s.sektor}</td>
      <td>${s.finansal_katki}</td>
      <td>${s.imaj_puani}</td>
      <td>${s.taraftar_uyumu}</td>
      <td>${s.marka_degeri}</td>
      <td>${s.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(s.agirlikli_puan)}">${s.agirlikli_puan}</span></td>
    </tr>
  `).join('');
        if (pageInfo) pageInfo.textContent = `Sayfa ${sponsorCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
        if (prevBtn) prevBtn.disabled = sponsorCurrentPage === 1;
        if (nextBtn) nextBtn.disabled = true;
        // Sektör sütunu sıralama ikonunu güncelle ve event listener ekle
        const sektorHeader = document.querySelector('#sponsorTable th[data-sort="sektor"]');
        if (sektorHeader) {
          const sortIcon = sektorHeader.querySelector('.sort-icon');
          if (sortIcon) {
            sortIcon.textContent = sponsorSektorSortActive ? '↓' : '↕';
          }
          sektorHeader.style.color = sponsorSektorSortActive ? '#3b82f6' : '';
          sektorHeader.style.cursor = 'pointer';

          // Event listener ekle (eğer yoksa)
          if (!sektorHeader.dataset.listenerAdded) {
            sektorHeader.addEventListener('click', () => {
              sponsorSektorSortActive = !sponsorSektorSortActive;
              calculateSponsorWeighted();
            });
            sektorHeader.dataset.listenerAdded = 'true';
          }
        }
        return; // Erken çık
      }

      // Önceki/Sonraki butonlarını güncelle
      if (prevBtn) {
        prevBtn.disabled = sponsorCurrentPage === 1;
      }
      if (nextBtn) {
        nextBtn.disabled = sponsorCurrentPage >= totalPages || totalPages === 0;
      }

      // Tabloyu doldur
      tbody.innerHTML = paginatedData.map((s, i) => `
    <tr>
      <td>${startIndex + i + 1}</td>
      <td><strong>${s.ad}</strong></td>
      <td>${s.sektor}</td>
      <td>${s.finansal_katki}</td>
      <td>${s.imaj_puani}</td>
      <td>${s.taraftar_uyumu}</td>
      <td>${s.marka_degeri}</td>
      <td>${s.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(s.agirlikli_puan)}">${s.agirlikli_puan}</span></td>
    </tr>
  `).join('');
    }
  }

  // Sektör sütunu sıralama ikonunu güncelle ve event listener ekle
  const sektorHeader = document.querySelector('#sponsorTable th[data-sort="sektor"]');
  if (sektorHeader) {
    const sortIcon = sektorHeader.querySelector('.sort-icon');
    if (sortIcon) {
      sortIcon.textContent = sponsorSektorSortActive ? '↓' : '↕';
    }
    sektorHeader.style.color = sponsorSektorSortActive ? '#3b82f6' : '';
    sektorHeader.style.cursor = 'pointer';

    // Event listener ekle (eğer yoksa)
    if (!sektorHeader.dataset.listenerAdded) {
      sektorHeader.addEventListener('click', () => {
        sponsorSektorSortActive = !sponsorSektorSortActive;
        calculateSponsorWeighted();
      });
      sektorHeader.dataset.listenerAdded = 'true';
    }
  }
}

// ==================== Teknik Ekip ====================
async function loadTeknikEkip() {
  const gorevler = await fetchAPI('/api/gorevler');
  const select = document.getElementById('teknikGorevFilter');
  select.innerHTML = '<option value="">Tümü</option>';
  if (gorevler) {
    gorevler.forEach(g => {
      select.innerHTML += `<option value="${g}">${g}</option>`;
    });
  }

  // Ağırlık ayarlarını veritabanından yükle
  const agirlikAyarlari = await fetchAPI('/api/agirlik-ayarlari');
  if (agirlikAyarlari) {
    const teknikAyarlari = agirlikAyarlari.find(a => a.tablo_adi === 'teknik_ekip');
    if (teknikAyarlari) {
      document.getElementById('teknikDeneyim').value = teknikAyarlari.kriter_1_agirlik || 33.33;
      document.getElementById('teknikBasari').value = teknikAyarlari.kriter_2_agirlik || 33.33;
      document.getElementById('teknikUyum').value = teknikAyarlari.kriter_3_agirlik || 33.34;
      updateWeightDisplay('teknikDeneyim');
      updateWeightDisplay('teknikBasari');
      updateWeightDisplay('teknikUyum');
      updateWeightTotal(['teknikDeneyim', 'teknikBasari', 'teknikUyum'], 'teknikToplam');
    }
  }

  await calculateTeknikWeighted();
}

async function calculateTeknikWeighted() {
  const gorev = document.getElementById('teknikGorevFilter').value;
  const deneyim = parseInt(document.getElementById('teknikDeneyim').value);
  const basari = parseInt(document.getElementById('teknikBasari').value);
  const uyum = parseInt(document.getElementById('teknikUyum').value);

  // Ağırlık toplamı kontrolü
  const total = deneyim + basari + uyum;
  if (total !== 100) {
    showToast('warning', 'Uyarı', 'Ağırlıkların toplamı %100 olmalıdır. Şu an: %' + total);
    return;
  }

  const data = await fetchAPI('/api/teknik-ekip/agirlikli-puan', {
    method: 'POST',
    body: JSON.stringify({
      kulup_id: 1,
      gorev: gorev,
      agirlik_deneyim: deneyim,
      agirlik_basari: basari,
      agirlik_uyum: uyum
    })
  });

  if (!data) return;

  // Görev sıralaması aktifse, aynı görevdeki kişileri alt alta getir
  let sortedDataForChart = [...data];
  if (teknikGorevSortActive) {
    sortedDataForChart.sort((a, b) => {
      // Önce göreve göre sırala
      const gorevCompare = (a.gorev || '').localeCompare(b.gorev || '', 'tr');
      if (gorevCompare !== 0) return gorevCompare;
      // Aynı görevdeyse ağırlıklı puana göre azalan sırala
      return b.agirlikli_puan - a.agirlikli_puan;
    });
  }

  const chartData = sortedDataForChart.slice(0, 15);

  destroyChart('teknikChart');
  charts.teknikChart = new Chart(document.getElementById('teknikChart'), {
    type: 'bar',
    data: {
      labels: chartData.map(t => t.ad.split(' ').pop()),
      datasets: [{
        label: 'Ağırlıklı Puan',
        data: chartData.map(t => t.agirlikli_puan),
        backgroundColor: chartData.map(t =>
          isMevcutTeknikEkip(t.ad, t.gorev) ? colors.teknikEkip.bg : colors.orange.bg
        ),
        borderColor: chartData.map(t =>
          isMevcutTeknikEkip(t.ad, t.gorev) ? colors.teknikEkip.border : colors.orange.border
        ),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => chartData[items[0].dataIndex].ad,
            afterLabel: (item) => `Görev: ${chartData[item.dataIndex].gorev}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(45, 58, 79, 0.5)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } }
      }
    }
  });

  const top3 = sortedDataForChart.slice(0, 3);
  destroyChart('teknikRadarChart');
  charts.teknikRadarChart = new Chart(document.getElementById('teknikRadarChart'), {
    type: 'radar',
    data: {
      labels: ['Deneyim', 'Başarı', 'Uyum'],
      datasets: top3.map((t, i) => {
        const isMevcut = isMevcutTeknikEkip(t.ad, t.gorev);
        const teknikColor = colors.teknikEkip.bg.replace('0.8', '0.2');
        const teknikBorder = colors.teknikEkip.border;
        return {
          label: t.ad.split(' ').pop(),
          data: [t.deneyim_puani, t.basari_puani, t.uyum_puani],
          backgroundColor: isMevcut ? teknikColor : chartColors[i].replace('0.8', '0.2'),
          borderColor: isMevcut ? teknikBorder : chartColors[i],
          borderWidth: 2,
          pointBackgroundColor: isMevcut ? teknikBorder : chartColors[i]
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, display: false },
          grid: { color: 'rgba(45, 58, 79, 0.5)' },
          angleLines: { color: 'rgba(45, 58, 79, 0.5)' }
        }
      },
      plugins: { legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } }
    }
  });

  // Görev sıralaması aktifse, aynı görevdeki kişileri alt alta getir
  let sortedData = [...data];
  if (teknikGorevSortActive) {
    sortedData.sort((a, b) => {
      // Önce göreve göre sırala
      const gorevCompare = (a.gorev || '').localeCompare(b.gorev || '', 'tr');
      if (gorevCompare !== 0) return gorevCompare;
      // Aynı görevdeyse ağırlıklı puana göre azalan sırala
      return b.agirlikli_puan - a.agirlikli_puan;
    });
  }

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(sortedData.length / teknikPageSize);
  const startIndex = (teknikCurrentPage - 1) * teknikPageSize;
  const endIndex = startIndex + teknikPageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const tbody = document.querySelector('#teknikTable tbody');
  const paginationEl = document.getElementById('teknikPagination');
  const prevBtn = document.getElementById('teknikPrevBtn');
  const nextBtn = document.getElementById('teknikNextBtn');
  const pageInfo = document.getElementById('teknikPageInfo');

  if (tbody) {
    if (sortedData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Veri bulunamadı</td></tr>';
      if (paginationEl) paginationEl.style.display = 'none';
    } else {
      // Sayfalama kontrollerini göster
      if (paginationEl) paginationEl.style.display = 'flex';

      // Sayfa bilgisini güncelle
      if (pageInfo) {
        pageInfo.textContent = `Sayfa ${teknikCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
      }

      // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya ayarla
      if (teknikCurrentPage > totalPages && totalPages > 0) {
        teknikCurrentPage = totalPages;
        const newStartIndex = (teknikCurrentPage - 1) * teknikPageSize;
        const newEndIndex = newStartIndex + teknikPageSize;
        const newPaginatedData = sortedData.slice(newStartIndex, newEndIndex);
        tbody.innerHTML = newPaginatedData.map((t, i) => `
    <tr>
      <td>${newStartIndex + i + 1}</td>
      <td><strong>${t.ad}</strong></td>
      <td>${t.gorev}</td>
      <td>${t.deneyim_puani}</td>
      <td>${t.basari_puani}</td>
      <td>${t.uyum_puani}</td>
      <td>${t.kontrat_suresi_ay}</td>
      <td>${t.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(t.agirlikli_puan)}">${t.agirlikli_puan}</span></td>
    </tr>
  `).join('');
        if (pageInfo) pageInfo.textContent = `Sayfa ${teknikCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
        if (prevBtn) prevBtn.disabled = teknikCurrentPage === 1;
        if (nextBtn) nextBtn.disabled = true;
        // Görev sütunu sıralama ikonunu güncelle ve event listener ekle
        const gorevHeader = document.querySelector('#teknikTable th[data-sort="gorev"]');
        if (gorevHeader) {
          const sortIcon = gorevHeader.querySelector('.sort-icon');
          if (sortIcon) {
            sortIcon.textContent = teknikGorevSortActive ? '↓' : '↕';
          }
          gorevHeader.style.color = teknikGorevSortActive ? '#3b82f6' : '';
          gorevHeader.style.cursor = 'pointer';

          // Event listener ekle (eğer yoksa)
          if (!gorevHeader.dataset.listenerAdded) {
            gorevHeader.addEventListener('click', () => {
              teknikGorevSortActive = !teknikGorevSortActive;
              calculateTeknikWeighted();
            });
            gorevHeader.dataset.listenerAdded = 'true';
          }
        }
        return; // Erken çık
      }

      // Önceki/Sonraki butonlarını güncelle
      if (prevBtn) {
        prevBtn.disabled = teknikCurrentPage === 1;
      }
      if (nextBtn) {
        nextBtn.disabled = teknikCurrentPage >= totalPages || totalPages === 0;
      }

      // Tabloyu doldur
      tbody.innerHTML = paginatedData.map((t, i) => `
    <tr>
      <td>${startIndex + i + 1}</td>
      <td><strong>${t.ad}</strong></td>
      <td>${t.gorev}</td>
      <td>${t.deneyim_puani}</td>
      <td>${t.basari_puani}</td>
      <td>${t.uyum_puani}</td>
      <td>${t.kontrat_suresi_ay}</td>
      <td>${t.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(t.agirlikli_puan)}">${t.agirlikli_puan}</span></td>
    </tr>
  `).join('');
    }
  }

  // Görev sütunu sıralama ikonunu güncelle ve event listener ekle
  const gorevHeader = document.querySelector('#teknikTable th[data-sort="gorev"]');
  if (gorevHeader) {
    const sortIcon = gorevHeader.querySelector('.sort-icon');
    if (sortIcon) {
      sortIcon.textContent = teknikGorevSortActive ? '↓' : '↕';
    }
    gorevHeader.style.color = teknikGorevSortActive ? '#3b82f6' : '';
    gorevHeader.style.cursor = 'pointer';

    // Event listener ekle (eğer yoksa)
    if (!gorevHeader.dataset.listenerAdded) {
      gorevHeader.addEventListener('click', () => {
        teknikGorevSortActive = !teknikGorevSortActive;
        calculateTeknikWeighted();
      });
      gorevHeader.dataset.listenerAdded = 'true';
    }
  }
}

// ==================== Tesisler ====================
async function loadTesisler() {
  // Ağırlık ayarlarını veritabanından yükle
  const agirlikAyarlari = await fetchAPI('/api/agirlik-ayarlari');
  if (agirlikAyarlari) {
    const tesisAyarlari = agirlikAyarlari.find(a => a.tablo_adi === 'tesisler');
    if (tesisAyarlari) {
      document.getElementById('tesisAltyapi').value = tesisAyarlari.kriter_1_agirlik || 25;
      document.getElementById('tesisDonanim').value = tesisAyarlari.kriter_2_agirlik || 25;
      document.getElementById('tesisUlasim').value = tesisAyarlari.kriter_3_agirlik || 25;
      document.getElementById('tesisKonaklama').value = tesisAyarlari.kriter_4_agirlik || 25;
      updateWeightDisplay('tesisAltyapi');
      updateWeightDisplay('tesisDonanim');
      updateWeightDisplay('tesisUlasim');
      updateWeightDisplay('tesisKonaklama');
      updateWeightTotal(['tesisAltyapi', 'tesisDonanim', 'tesisUlasim', 'tesisKonaklama'], 'tesisToplam');
    }
  }
  await calculateTesisWeighted();
}

async function calculateTesisWeighted() {
  const altyapi = parseInt(document.getElementById('tesisAltyapi').value);
  const donanim = parseInt(document.getElementById('tesisDonanim').value);
  const ulasim = parseInt(document.getElementById('tesisUlasim').value);
  const konaklama = parseInt(document.getElementById('tesisKonaklama').value);

  // Ağırlık toplamı kontrolü
  const total = altyapi + donanim + ulasim + konaklama;
  if (total !== 100) {
    showToast('warning', 'Uyarı', 'Ağırlıkların toplamı %100 olmalıdır. Şu an: %' + total);
    return;
  }

  const data = await fetchAPI('/api/tesisler/agirlikli-puan', {
    method: 'POST',
    body: JSON.stringify({
      kulup_id: 1,
      agirlik_altyapi: altyapi,
      agirlik_donanim: donanim,
      agirlik_ulasim: ulasim,
      agirlik_konaklama: konaklama
    })
  });

  if (!data) return;

  destroyChart('tesisChart');
  charts.tesisChart = new Chart(document.getElementById('tesisChart'), {
    type: 'bar',
    data: {
      labels: data.map(t => t.ad),
      datasets: [{
        label: 'Ağırlıklı Puan',
        data: data.map(t => t.agirlikli_puan),
        backgroundColor: data.map(t =>
          isMevcutTesis(t.ad) ? colors.teknikEkip.bg : colors.cyan.bg
        ),
        borderColor: data.map(t =>
          isMevcutTesis(t.ad) ? colors.teknikEkip.border : colors.cyan.border
        ),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(45, 58, 79, 0.5)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 30, minRotation: 30 } }
      }
    }
  });

  // Tesis Kriter Seçimi için event listener ekle
  const tesisKriterSelect = document.getElementById('tesisKriterSelect');
  if (tesisKriterSelect && !tesisKriterSelect.dataset.listenerAdded) {
    tesisKriterSelect.addEventListener('change', () => {
      // Mevcut veriyi kullanarak grafiği yeniden çiz
      updateTesisDetailChart(data);
    });
    tesisKriterSelect.dataset.listenerAdded = 'true';
  }

  // İlk çizim
  updateTesisDetailChart(data);
}

function updateTesisDetailChart(data) {
  const select = document.getElementById('tesisKriterSelect');
  const kriter = select ? select.value : 'altyapi';
  const ctx = document.getElementById('tesisRadarChart');

  if (!ctx) return;

  let chartData;
  let chartOptions;

  // Tüm datayı al, null kontrolü yap
  if (!data || data.length === 0) return;

  destroyChart('tesisRadarChart');

  // Kriter isimleri haritası
  const kriterMap = {
    'altyapi': { prop: 'altyapi_kalitesi', label: 'Altyapı Kalitesi' },
    'donanim': { prop: 'donanim_kalitesi', label: 'Donanım Kalitesi' },
    'ulasim': { prop: 'ulasim_kolayligi', label: 'Ulaşım Kolaylığı' },
    'konaklama': { prop: 'konaklama_durumu', label: 'Konaklama Durumu' }
  };

  const selectedKriter = kriterMap[kriter];

  charts.tesisRadarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(t => t.ad),
      datasets: [{
        label: selectedKriter.label,
        data: data.map(t => t[selectedKriter.prop]),
        backgroundColor: data.map(t =>
          isMevcutTesis(t.ad) ? colors.teknikEkip.bg : colors.purple.bg
        ),
        borderColor: data.map(t =>
          isMevcutTesis(t.ad) ? colors.teknikEkip.border : colors.purple.border
        ),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(45, 58, 79, 0.5)' }
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });


  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(data.length / tesisPageSize);
  const startIndex = (tesisCurrentPage - 1) * tesisPageSize;
  const endIndex = startIndex + tesisPageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  const tbody = document.querySelector('#tesisTable tbody');
  const paginationEl = document.getElementById('tesisPagination');
  const prevBtn = document.getElementById('tesisPrevBtn');
  const nextBtn = document.getElementById('tesisNextBtn');
  const pageInfo = document.getElementById('tesisPageInfo');

  if (tbody) {
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Veri bulunamadı</td></tr>';
      if (paginationEl) paginationEl.style.display = 'none';
    } else {
      // Sayfalama kontrollerini göster
      if (paginationEl) paginationEl.style.display = 'flex';

      // Sayfa bilgisini güncelle
      if (pageInfo) {
        pageInfo.textContent = `Sayfa ${tesisCurrentPage} / ${totalPages} (Toplam ${data.length} kayıt)`;
      }

      // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya ayarla
      if (tesisCurrentPage > totalPages && totalPages > 0) {
        tesisCurrentPage = totalPages;
        const newStartIndex = (tesisCurrentPage - 1) * tesisPageSize;
        const newEndIndex = newStartIndex + tesisPageSize;
        const newPaginatedData = data.slice(newStartIndex, newEndIndex);
        tbody.innerHTML = newPaginatedData.map((t, i) => `
    <tr>
      <td>${newStartIndex + i + 1}</td>
      <td><strong>${t.ad}</strong></td>
      <td>${t.altyapi_kalitesi}</td>
      <td>${t.donanim_kalitesi}</td>
      <td>${t.ulasim_kolayligi}</td>
      <td>${t.konaklama_durumu}</td>
      <td>${t.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(t.agirlikli_puan)}">${t.agirlikli_puan}</span></td>
    </tr>
  `).join('');
        if (pageInfo) pageInfo.textContent = `Sayfa ${tesisCurrentPage} / ${totalPages} (Toplam ${data.length} kayıt)`;
        if (prevBtn) prevBtn.disabled = tesisCurrentPage === 1;
        if (nextBtn) nextBtn.disabled = true;
        return; // Erken çık
      }

      // Önceki/Sonraki butonlarını güncelle
      if (prevBtn) {
        prevBtn.disabled = tesisCurrentPage === 1;
      }
      if (nextBtn) {
        nextBtn.disabled = tesisCurrentPage >= totalPages || totalPages === 0;
      }

      // Tabloyu doldur
      tbody.innerHTML = paginatedData.map((t, i) => `
    <tr>
      <td>${startIndex + i + 1}</td>
      <td><strong>${t.ad}</strong></td>
      <td>${t.altyapi_kalitesi}</td>
      <td>${t.donanim_kalitesi}</td>
      <td>${t.ulasim_kolayligi}</td>
      <td>${t.konaklama_durumu}</td>
      <td>${t.varsayilan_puan}</td>
      <td><span class="score-badge ${getScoreBadgeClass(t.agirlikli_puan)}">${t.agirlikli_puan}</span></td>
    </tr>
  `).join('');
    }
  }
}

// ==================== Taraftar Grupları ====================
async function loadTaraftarGruplari() {
  // Ağırlık ayarlarını veritabanından yükle
  const agirlikAyarlari = await fetchAPI('/api/agirlik-ayarlari');
  if (agirlikAyarlari) {
    const taraftarAyarlari = agirlikAyarlari.find(a => a.tablo_adi === 'taraftar_gruplari');
    if (taraftarAyarlari) {
      document.getElementById('taraftarMemnuniyet').value = taraftarAyarlari.kriter_1_agirlik || 25;
      document.getElementById('taraftarEtki').value = taraftarAyarlari.kriter_2_agirlik || 25;
      document.getElementById('taraftarMedya').value = taraftarAyarlari.kriter_3_agirlik || 25;
      document.getElementById('taraftarDoluluk').value = taraftarAyarlari.kriter_4_agirlik || 25;
      updateWeightDisplay('taraftarMemnuniyet');
      updateWeightDisplay('taraftarEtki');
      updateWeightDisplay('taraftarMedya');
      updateWeightDisplay('taraftarDoluluk');
      updateWeightTotal(['taraftarMemnuniyet', 'taraftarEtki', 'taraftarMedya', 'taraftarDoluluk'], 'taraftarToplam');
    }
  }

  // Yıl filtreleme için yılları yükle
  try {
    const yillar = await fetchAPI('/api/taraftar-gruplari/yillar');
    console.log('Yıllar API yanıtı:', yillar);
    const yilSelect = document.getElementById('taraftarChartYilFilter');
    if (yilSelect) {
      yilSelect.innerHTML = '<option value="">Tümü</option>';
      if (yillar && Array.isArray(yillar) && yillar.length > 0) {
        yillar.forEach(yil => {
          yilSelect.innerHTML += `<option value="${yil}">${yil}</option>`;
        });
      } else {
        // Eğer API'den yıl gelmezse, veritabanından yılları çek
        const taraftarDataForYil = await fetchAPI('/api/taraftar-gruplari');
        if (taraftarDataForYil && Array.isArray(taraftarDataForYil)) {
          const uniqueYillar = [...new Set(taraftarDataForYil.map(t => t.yil))].sort((a, b) => b - a);
          uniqueYillar.forEach(yil => {
            yilSelect.innerHTML += `<option value="${yil}">${yil}</option>`;
          });
        }
      }
    } else {
      console.error('taraftarChartYilFilter elementi bulunamadı');
    }
  } catch (error) {
    console.error('Yıllar yüklenirken hata:', error);
    // Hata durumunda veritabanından yılları çek
    try {
      const taraftarDataForYil = await fetchAPI('/api/taraftar-gruplari');
      if (taraftarDataForYil && Array.isArray(taraftarDataForYil)) {
        const yilSelect = document.getElementById('taraftarChartYilFilter');
        if (yilSelect) {
          yilSelect.innerHTML = '<option value="">Tümü</option>';
          const uniqueYillar = [...new Set(taraftarDataForYil.map(t => t.yil))].sort((a, b) => b - a);
          uniqueYillar.forEach(yil => {
            yilSelect.innerHTML += `<option value="${yil}">${yil}</option>`;
          });
        }
      }
    } catch (err) {
      console.error('Yıllar yüklenirken ikinci denemede hata:', err);
    }
  }


  await calculateTaraftarWeighted();
}

async function calculateTaraftarWeighted() {
  let memnuniyet = parseInt(document.getElementById('taraftarMemnuniyet').value) || 0;
  let etki = parseInt(document.getElementById('taraftarEtki').value) || 0;
  let medya = parseInt(document.getElementById('taraftarMedya').value) || 0;
  let doluluk = parseInt(document.getElementById('taraftarDoluluk').value) || 0;

  // Ağırlık toplamı kontrolü - %100 olmadan çalışmamalı
  let total = memnuniyet + etki + medya + doluluk;
  if (total !== 100) {
    // Eğer toplam 0 ise, varsayılan değerleri kullan
    if (total === 0) {
      memnuniyet = etki = medya = doluluk = 25;
      document.getElementById('taraftarMemnuniyet').value = 25;
      document.getElementById('taraftarEtki').value = 25;
      document.getElementById('taraftarMedya').value = 25;
      document.getElementById('taraftarDoluluk').value = 25;
      updateWeightDisplay('taraftarMemnuniyet');
      updateWeightDisplay('taraftarEtki');
      updateWeightDisplay('taraftarMedya');
      updateWeightDisplay('taraftarDoluluk');
      updateWeightTotal(['taraftarMemnuniyet', 'taraftarEtki', 'taraftarMedya', 'taraftarDoluluk'], 'taraftarToplam');
      total = 100;
    } else {
      showToast('warning', 'Uyarı', `Ağırlıkların toplamı %100 olmalıdır. Şu an: %${total}. Lütfen ağırlıkları ayarlayın.`);
      // Toplamı güncelle
      updateWeightTotal(['taraftarMemnuniyet', 'taraftarEtki', 'taraftarMedya', 'taraftarDoluluk'], 'taraftarToplam');
      return;
    }
  }

  const yil = document.getElementById('taraftarChartYilFilter') ? document.getElementById('taraftarChartYilFilter').value || null : null;
  const tribun = null; // Tribün filtresi kaldırıldı

  // Tüm verileri al (filtreleme client-side yapılacak)
  const allData = await fetchAPI('/api/taraftar-gruplari/agirlikli-puan', {
    method: 'POST',
    body: JSON.stringify({
      kulup_id: 1,
      yil: null, // Tüm yılları al
      agirlik_memnuniyet: memnuniyet,
      agirlik_etki: etki,
      agirlik_medya: medya,
      agirlik_doluluk: doluluk
    })
  });

  console.log('Taraftar grupları API yanıtı:', allData);

  if (!allData || !Array.isArray(allData) || allData.length === 0) {
    console.warn('Taraftar grubu verisi bulunamadı veya boş. Veritabanında veri var mı kontrol edin.');
    // Boş veri durumunda bile grafikleri temizle
    destroyChart('taraftarChart');
    destroyChart('taraftarBarChart');
    const tbody = document.querySelector('#taraftarTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: var(--text-secondary);">Veri bulunamadı</td></tr>';
    }
    // Hata toast gösterme, sadece console'da uyar
    return;
  }

  // Filtreleme uygula - sadece yıl filtresi çizgi grafiği için
  let filteredData = allData;
  if (yil) {
    filteredData = allData.filter(t => t.yil == yil);
  }

  // ==================== ÇİZGİ GRAFİĞİ (Yıla göre tüm tribünler) ====================
  // Yıl filtresine göre çizgi grafiği - yıl seçilmediyse tüm yıllar için çizgi
  const selectedYil = yil || null;
  const allTribunler = [...new Set(allData.map(t => t.tribun_adi))].sort();

  // Grafik başlığını güncelle
  const chartTitleEl = document.getElementById('taraftarChartTitle');
  if (chartTitleEl) {
    if (selectedYil) {
      chartTitleEl.textContent = `${selectedYil} Yılı - Tüm Tribünler (Çizgi)`;
    } else {
      chartTitleEl.textContent = 'Yıllara Göre Tribün Karşılaştırması (Çizgi)';
    }
  }

  destroyChart('taraftarChart');

  let lineChartDatasets;
  if (selectedYil) {
    // Yıl seçildiyse: O yıldaki tüm tribünler
    const yilData = allData.filter(t => t.yil == selectedYil).sort((a, b) => b.agirlikli_puan - a.agirlikli_puan);
    lineChartDatasets = [{
      label: `${selectedYil} Yılı Ağırlıklı Puan`,
      data: allTribunler.map(tribun => {
        const item = yilData.find(t => t.tribun_adi === tribun);
        return item ? item.agirlikli_puan : null;
      }),
      backgroundColor: colors.cyan.bg.replace('0.7', '0.2'),
      borderColor: colors.cyan.border,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: colors.cyan.border,
      pointBorderColor: colors.cyan.border,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: colors.cyan.border,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2
    }];
  } else {
    // Yıl seçilmediyse: Her yıl için bir çizgi (tüm tribünler)
    const yillar = [2022, 2023, 2024];
    lineChartDatasets = yillar.map((yil, yilIndex) => {
      const yilData = allData.filter(t => t.yil == yil);
      return {
        label: `${yil} Yılı`,
        data: allTribunler.map(tribun => {
          const item = yilData.find(t => t.tribun_adi === tribun);
          return item ? item.agirlikli_puan : null;
        }),
        backgroundColor: chartColors[yilIndex % chartColors.length].replace('0.8', '0.1'),
        borderColor: chartColors[yilIndex % chartColors.length],
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: chartColors[yilIndex % chartColors.length],
        pointBorderColor: chartColors[yilIndex % chartColors.length],
        pointHoverRadius: 7
      };
    });
  }

  charts.taraftarChart = new Chart(document.getElementById('taraftarChart'), {
    type: 'line',
    data: {
      labels: allTribunler,
      datasets: lineChartDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y !== null ? context.parsed.y.toFixed(2) : 'Veri yok'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(45, 58, 79, 0.5)' }
        },
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });

  // ==================== SÜTUN GRAFİĞİ (Tüm tribünler, yıllar yan yana) ====================
  const yillar = [2022, 2023, 2024];
  const tribunlerForBar = [...new Set(allData.map(t => t.tribun_adi))].sort();

  destroyChart('taraftarBarChart');
  charts.taraftarBarChart = new Chart(document.getElementById('taraftarBarChart'), {
    type: 'bar',
    data: {
      labels: tribunlerForBar,
      datasets: yillar.map((yil, yilIndex) => {
        const yilDataForBar = allData.filter(t => t.yil == yil);
        return {
          label: `${yil} Yılı`,
          data: tribunlerForBar.map(tribun => {
            const item = yilDataForBar.find(t => t.tribun_adi === tribun);
            return item ? item.agirlikli_puan : null;
          }),
          backgroundColor: chartColors[yilIndex % chartColors.length],
          borderColor: chartColors[yilIndex % chartColors.length].replace('0.8', '1'),
          borderWidth: 2,
          borderRadius: 6
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y ? context.parsed.y.toFixed(2) : 'Veri yok'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(45, 58, 79, 0.5)' }
        },
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });

  // Tablo için verileri sırala
  let sortedData = [...filteredData];
  if (taraftarTribunSortActive) {
    // Tribün sıralaması aktifse, aynı tribündekileri alt alta getir
    sortedData.sort((a, b) => {
      // Önce tribüne göre sırala
      const tribunCompare = (a.tribun_adi || '').localeCompare(b.tribun_adi || '', 'tr');
      if (tribunCompare !== 0) return tribunCompare;
      // Aynı tribündeyse yıla göre azalan sırala
      if (b.yil !== a.yil) return b.yil - a.yil;
      // Aynı tribün ve yıldaysa ağırlıklı puana göre azalan sırala
      return b.agirlikli_puan - a.agirlikli_puan;
    });
  } else {
    // Normal sıralama: ağırlıklı puana göre
    sortedData.sort((a, b) => b.agirlikli_puan - a.agirlikli_puan);
  }

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(sortedData.length / taraftarPageSize);
  const startIndex = (taraftarCurrentPage - 1) * taraftarPageSize;
  const endIndex = startIndex + taraftarPageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const tbody = document.querySelector('#taraftarTable tbody');
  const paginationEl = document.getElementById('taraftarPagination');
  const prevBtn = document.getElementById('taraftarPrevBtn');
  const nextBtn = document.getElementById('taraftarNextBtn');
  const pageInfo = document.getElementById('taraftarPageInfo');

  if (tbody) {
    if (sortedData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Veri bulunamadı</td></tr>';
      if (paginationEl) paginationEl.style.display = 'none';
    } else {
      // Sayfalama kontrollerini göster
      if (paginationEl) paginationEl.style.display = 'flex';

      // Sayfa bilgisini güncelle
      if (pageInfo) {
        pageInfo.textContent = `Sayfa ${taraftarCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
      }

      // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya ayarla
      if (taraftarCurrentPage > totalPages && totalPages > 0) {
        taraftarCurrentPage = totalPages;
        const newStartIndex = (taraftarCurrentPage - 1) * taraftarPageSize;
        const newEndIndex = newStartIndex + taraftarPageSize;
        const newPaginatedData = sortedData.slice(newStartIndex, newEndIndex);
        tbody.innerHTML = newPaginatedData.map((t, i) => `
        <tr>
          <td>${newStartIndex + i + 1}</td>
          <td><strong>${t.tribun_adi}</strong></td>
          <td>${t.kapasite}</td>
          <td>${t.yil}</td>
          <td>${t.memnuniyet_puani}</td>
          <td>${t.taraftar_etki_puani}</td>
          <td>${t.medya_yorum_puani}</td>
          <td>${t.kapasite_doluluk}</td>
          <td>${t.varsayilan_puan}</td>
          <td><span class="score-badge ${getScoreBadgeClass(t.agirlikli_puan)}">${t.agirlikli_puan}</span></td>
        </tr>
      `).join('');
        if (pageInfo) pageInfo.textContent = `Sayfa ${taraftarCurrentPage} / ${totalPages} (Toplam ${sortedData.length} kayıt)`;
        if (prevBtn) prevBtn.disabled = taraftarCurrentPage === 1;
        if (nextBtn) nextBtn.disabled = true;
        // Tribün sütunu sıralama ikonunu güncelle ve event listener ekle
        const tribunHeader = document.querySelector('#taraftarTable th[data-sort="tribun"]');
        if (tribunHeader) {
          const sortIcon = tribunHeader.querySelector('.sort-icon');
          if (sortIcon) {
            sortIcon.textContent = taraftarTribunSortActive ? '↓' : '↕';
          }
          tribunHeader.style.color = taraftarTribunSortActive ? '#3b82f6' : '';
          tribunHeader.style.cursor = 'pointer';

          // Event listener ekle (eğer yoksa)
          if (!tribunHeader.dataset.listenerAdded) {
            tribunHeader.addEventListener('click', () => {
              taraftarTribunSortActive = !taraftarTribunSortActive;
              calculateTaraftarWeighted();
            });
            tribunHeader.dataset.listenerAdded = 'true';
          }
        }
        return; // Erken çık
      }

      // Önceki/Sonraki butonlarını güncelle
      if (prevBtn) {
        prevBtn.disabled = taraftarCurrentPage === 1;
      }
      if (nextBtn) {
        nextBtn.disabled = taraftarCurrentPage >= totalPages || totalPages === 0;
      }

      // Tabloyu doldur
      tbody.innerHTML = paginatedData.map((t, i) => `
        <tr>
          <td>${startIndex + i + 1}</td>
          <td><strong>${t.tribun_adi}</strong></td>
          <td>${t.kapasite}</td>
          <td>${t.yil}</td>
          <td>${t.memnuniyet_puani}</td>
          <td>${t.taraftar_etki_puani}</td>
          <td>${t.medya_yorum_puani}</td>
          <td>${t.kapasite_doluluk}</td>
          <td>${t.varsayilan_puan}</td>
          <td><span class="score-badge ${getScoreBadgeClass(t.agirlikli_puan)}">${t.agirlikli_puan}</span></td>
        </tr>
      `).join('');
    }
  }

  // Tribün sütunu sıralama ikonunu güncelle ve event listener ekle
  const tribunHeader = document.querySelector('#taraftarTable th[data-sort="tribun"]');
  if (tribunHeader) {
    const sortIcon = tribunHeader.querySelector('.sort-icon');
    if (sortIcon) {
      sortIcon.textContent = taraftarTribunSortActive ? '↓' : '↕';
    }
    tribunHeader.style.color = taraftarTribunSortActive ? '#3b82f6' : '';
    tribunHeader.style.cursor = 'pointer';

    // Event listener ekle (eğer yoksa)
    if (!tribunHeader.dataset.listenerAdded) {
      tribunHeader.addEventListener('click', () => {
        taraftarTribunSortActive = !taraftarTribunSortActive;
        calculateTaraftarWeighted();
      });
      tribunHeader.dataset.listenerAdded = 'true';
    }
  }
}

// ==================== Karsilastirma ====================
let karsilastirmaData = [];
let selectedAlternatifler = [];
let currentKategori = '';

// Pozisyon grupları
const pozisyonGruplari = {
  'Kaleci': ['Kaleci', 'GK', 'Goalkeeper'],
  'Defans': ['Defans', 'Defender', 'Stoper', 'Libero', 'CB', 'SW'],
  'Bek': ['Bek', 'Sol Bek', 'Sağ Bek', 'LB', 'RB', 'LWB', 'RWB'],
  'Ortasaha': ['Ortasaha', 'Midfielder', 'Defansif Ortasaha', 'Ofansif Ortasaha', 'Merkez Ortasaha', 'CM', 'CDM', 'CAM'],
  'Kanat': ['Kanat', 'Sol Kanat', 'Sağ Kanat', 'LM', 'RM', 'LW', 'RW'],
  'Forvet': ['Forvet', 'Forward', 'Santrafor', 'İkinci Forvet', 'Kanat Forvet', 'CF', 'ST', 'SS']
};

const kategoriConfig = {
  'oyuncular': {
    labelKey: 'oyuncu_adi',
    idKey: 'oyuncu_id',
    detailKey: 'pozisyon',
    filterKey: 'pozisyon',
    filterType: 'pozisyon',
    filterLabel: 'Pozisyon Grubu:',
    kriterler: [
      { id: 'fiziksel', label: 'Fiziksel Güç', key: 'fiziksel_guc' },
      { id: 'pozisyon', label: 'Pozisyon İhtiyacı', key: 'pozisyon_ihtiyaci' },
      { id: 'taktik', label: 'Taktik Uyum', key: 'taktik_uyum' },
      { id: 'saglik', label: 'Sağlık', key: 'saglik_puani' }
    ],
    apiEndpoint: '/api/oyuncular'
  },
  'sponsorlar': {
    labelKey: 'ad',
    idKey: 'sponsor_id',
    detailKey: 'sektor',
    kriterler: [
      { id: 'finansal', label: 'Finansal Katkı', key: 'finansal_katki' },
      { id: 'imaj', label: 'İmaj Puanı', key: 'imaj_puani' },
      { id: 'taraftar', label: 'Taraftar Uyumu', key: 'taraftar_uyumu' },
      { id: 'marka', label: 'Marka Değeri', key: 'marka_degeri' }
    ],
    apiEndpoint: '/api/sponsorlar'
  },
  'teknik-ekip': {
    labelKey: 'ad',
    idKey: 'personel_id',
    detailKey: 'gorev',
    filterKey: 'gorev',
    filterType: 'gorev',
    filterLabel: 'Görev:',
    kriterler: [
      { id: 'deneyim', label: 'Deneyim Puanı', key: 'deneyim_puani' },
      { id: 'basari', label: 'Başarı Puanı', key: 'basari_puani' },
      { id: 'uyum', label: 'Uyum Puanı', key: 'uyum_puani' }
    ],
    apiEndpoint: '/api/teknik-ekip'
  },
  'tesisler': {
    labelKey: 'ad',
    idKey: 'tesis_id',
    detailKey: null,
    kriterler: [
      { id: 'altyapi', label: 'Altyapı Kalitesi', key: 'altyapi_kalitesi' },
      { id: 'donanim', label: 'Donanım Kalitesi', key: 'donanim_kalitesi' },
      { id: 'ulasim', label: 'Ulaşım Kolaylığı', key: 'ulasim_kolayligi' },
      { id: 'konaklama', label: 'Konaklama Durumu', key: 'konaklama_durumu' }
    ],
    apiEndpoint: '/api/tesisler'
  },
  'taraftar-gruplari': {
    labelKey: 'tribun_adi',
    idKey: 'tribun_id',
    detailKey: 'yil',
    filterKey: 'yil',
    filterType: 'yil',
    filterLabel: 'Yıl:',
    kriterler: [
      { id: 'memnuniyet', label: 'Memnuniyet Puanı', key: 'memnuniyet_puani' },
      { id: 'etki', label: 'Taraftar Etki Puanı', key: 'taraftar_etki_puani' },
      { id: 'medya', label: 'Medya Yorum Puanı', key: 'medya_yorum_puani' },
      { id: 'doluluk', label: 'Kapasite Doluluk', key: 'kapasite_doluluk' }
    ],
    apiEndpoint: '/api/taraftar-gruplari'
  }
};

async function loadKarsilastirma() {
  // Reset state
  selectedAlternatifler = [];
  currentKategori = '';
  document.getElementById('karsilastirmaKategori').value = '';
  document.getElementById('stepAlternatifler').style.display = 'none';
  document.getElementById('stepAgirliklar').style.display = 'none';
  document.getElementById('stepKarsilastir').style.display = 'none';
  document.getElementById('comparisonResults').style.display = 'none';
}

async function onKategoriChange() {
  const kategori = document.getElementById('karsilastirmaKategori').value;

  if (!kategori) {
    document.getElementById('stepAlternatifler').style.display = 'none';
    document.getElementById('stepAgirliklar').style.display = 'none';
    document.getElementById('stepKarsilastir').style.display = 'none';
    document.getElementById('comparisonResults').style.display = 'none';
    document.getElementById('karsilastirmaFilter').style.display = 'none';
    return;
  }

  currentKategori = kategori;
  selectedAlternatifler = [];

  const config = kategoriConfig[kategori];

  // Filtre alanını göster/gizle ve doldur
  if (config.filterType) {
    await setupKarsilastirmaFilter(config);
    document.getElementById('karsilastirmaFilter').style.display = 'block';
  } else {
    document.getElementById('karsilastirmaFilter').style.display = 'none';
  }

  // Load data
  await loadKarsilastirmaData();

  // Render alternatives list
  renderAlternatifList();

  // Render weight sliders
  renderWeightSliders();

  // Show steps
  document.getElementById('stepAlternatifler').style.display = 'block';
  document.getElementById('stepAgirliklar').style.display = 'block';
  document.getElementById('stepKarsilastir').style.display = 'block';
  document.getElementById('comparisonResults').style.display = 'none';
}

async function setupKarsilastirmaFilter(config) {
  const filterLabel = document.getElementById('karsilastirmaFilterLabel');
  const filterSelect = document.getElementById('karsilastirmaFilterSelect');

  filterLabel.textContent = config.filterLabel;
  filterSelect.innerHTML = '<option value="">Tümü</option>';

  if (config.filterType === 'pozisyon') {
    // Pozisyon grupları için
    Object.keys(pozisyonGruplari).forEach(grup => {
      filterSelect.innerHTML += `<option value="${grup}">${grup}</option>`;
    });
  } else if (config.filterType === 'gorev') {
    // Görevler için
    const gorevler = await fetchAPI('/api/gorevler');
    if (gorevler) {
      gorevler.forEach(gorev => {
        filterSelect.innerHTML += `<option value="${gorev}">${gorev}</option>`;
      });
    }
  } else if (config.filterType === 'yil') {
    // Yıllar için
    try {
      const yillar = await fetchAPI('/api/taraftar-gruplari/yillar');
      if (yillar && Array.isArray(yillar) && yillar.length > 0) {
        yillar.forEach(yil => {
          filterSelect.innerHTML += `<option value="${yil}">${yil}</option>`;
        });
      } else {
        // Yedek: Veritabanından yılları çek
        const taraftarData = await fetchAPI('/api/taraftar-gruplari');
        if (taraftarData && Array.isArray(taraftarData)) {
          const uniqueYillar = [...new Set(taraftarData.map(t => t.yil))].sort((a, b) => b - a);
          uniqueYillar.forEach(yil => {
            filterSelect.innerHTML += `<option value="${yil}">${yil}</option>`;
          });
        }
      }
    } catch (error) {
      console.error('Yıllar yüklenirken hata:', error);
      // Hata durumunda veritabanından yılları çek
      try {
        const taraftarData = await fetchAPI('/api/taraftar-gruplari');
        if (taraftarData && Array.isArray(taraftarData)) {
          const uniqueYillar = [...new Set(taraftarData.map(t => t.yil))].sort((a, b) => b - a);
          uniqueYillar.forEach(yil => {
            filterSelect.innerHTML += `<option value="${yil}">${yil}</option>`;
          });
        }
      } catch (err) {
        console.error('Yıllar yüklenirken ikinci denemede hata:', err);
      }
    }
  }

  // Filtre değiştiğinde veriyi yeniden yükle
  filterSelect.onchange = async () => {
    selectedAlternatifler = [];
    await loadKarsilastirmaData();
    renderAlternatifList();
  };
}

async function loadKarsilastirmaData() {
  const config = kategoriConfig[currentKategori];
  if (!config) return;

  let data = await fetchAPI(config.apiEndpoint);

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn(`${currentKategori} için veri bulunamadı`);
    karsilastirmaData = [];
    return;
  }

  // Filtre uygula
  const filterValue = document.getElementById('karsilastirmaFilterSelect')?.value;
  if (filterValue && config.filterType) {
    if (config.filterType === 'pozisyon') {
      // Pozisyon grubuna göre filtrele (case-insensitive)
      const pozisyonlar = pozisyonGruplari[filterValue] || [];
      data = data.filter(item => {
        const itemPozisyon = (item[config.filterKey] || '').toString().trim().toLowerCase();
        if (!itemPozisyon) return false;

        // Özel durum: Forvet seçildiğinde sadece forvet pozisyonlarını göster, kanat oyuncularını gösterme
        if (filterValue === 'Forvet') {
          // Kanat pozisyonlarını hariç tut
          const kanatPozisyonlari = ['kanat', 'sol kanat', 'sağ kanat', 'sağ kanat', 'lm', 'rm', 'lw', 'rw'];
          if (kanatPozisyonlari.some(kp => itemPozisyon === kp || itemPozisyon.includes(kp))) {
            // Eğer sadece "kanat" ise (kanat forvet değilse) hariç tut
            if (!itemPozisyon.includes('forvet') && !itemPozisyon.includes('kanat forvet')) {
              return false;
            }
          }
        }

        // Özel durum: Kanat seçildiğinde sadece kanat pozisyonlarını göster, forvet oyuncularını gösterme
        if (filterValue === 'Kanat') {
          // Forvet pozisyonlarını hariç tut (kanat forvet hariç)
          const forvetPozisyonlari = ['forvet', 'forward', 'santrafor', 'ikinci forvet', 'cf', 'st', 'ss'];
          if (forvetPozisyonlari.some(fp => itemPozisyon === fp || itemPozisyon.includes(fp))) {
            // Eğer "kanat forvet" değilse hariç tut
            if (!itemPozisyon.includes('kanat')) {
              return false;
            }
          }
        }

        // Özel durum: Ortasaha seçildiğinde sadece ortasaha pozisyonlarını göster, defans oyuncularını gösterme
        if (filterValue === 'Ortasaha') {
          // Defans pozisyonlarını hariç tut (defansif ortasaha hariç)
          const defansPozisyonlari = ['defans', 'defender', 'stoper', 'libero', 'cb', 'sw', 'bek', 'sol bek', 'sağ bek', 'sağ bek', 'lb', 'rb', 'lwb', 'rwb'];
          if (defansPozisyonlari.some(dp => itemPozisyon === dp || itemPozisyon.includes(dp))) {
            // Eğer "defansif ortasaha" değilse hariç tut
            if (!itemPozisyon.includes('ortasaha') && !itemPozisyon.includes('defansif ortasaha')) {
              return false;
            }
          }
        }

        // Özel durum: Defans seçildiğinde sadece defans pozisyonlarını göster, ortasaha oyuncularını gösterme
        if (filterValue === 'Defans') {
          // Ortasaha pozisyonlarını hariç tut (defansif ortasaha hariç)
          const ortasahaPozisyonlari = ['ortasaha', 'midfielder', 'ofansif ortasaha', 'merkez ortasaha', 'cm', 'cam'];
          if (ortasahaPozisyonlari.some(op => itemPozisyon === op || itemPozisyon.includes(op))) {
            // Eğer "defansif ortasaha" değilse hariç tut
            if (!itemPozisyon.includes('defansif')) {
              return false;
            }
          }
        }

        // Her bir grup pozisyonu için kontrol et
        return pozisyonlar.some(p => {
          const grupPozisyon = p.toLowerCase().trim();

          // Tam eşleşme
          if (itemPozisyon === grupPozisyon) return true;

          // Item pozisyonu grup pozisyonunu içeriyor mu (örn: "Sol Kanat" içinde "Kanat" var)
          if (itemPozisyon.includes(grupPozisyon)) return true;

          // Grup pozisyonu item pozisyonunu içeriyor mu
          if (grupPozisyon.includes(itemPozisyon)) return true;

          // Özel durumlar: "Kanat" ve "Bek" için daha esnek eşleşme
          if (grupPozisyon === 'kanat' && (itemPozisyon.includes('kanat') || itemPozisyon === 'kanat')) return true;
          if (grupPozisyon === 'bek' && (itemPozisyon.includes('bek') || itemPozisyon === 'bek')) return true;

          return false;
        });
      });
    } else if (config.filterType === 'gorev') {
      // Göreve göre filtrele
      data = data.filter(item => item[config.filterKey] === filterValue);
    } else if (config.filterType === 'yil') {
      // Yıla göre filtrele
      data = data.filter(item => item[config.filterKey] == filterValue);
    }
  }

  karsilastirmaData = data || [];

  // Toplam alternatif sayısını güncelle
  updateSelectedCount();

  // Eğer veri yoksa uyarı göster ama hata gösterme
  if (karsilastirmaData.length === 0) {
    console.warn(`${currentKategori} için filtre sonrası veri bulunamadı`);
  }
}

function renderAlternatifList() {
  const config = kategoriConfig[currentKategori];
  const container = document.getElementById('alternatifList');

  // Toplam alternatif sayısını güncelle
  updateSelectedCount();

  container.innerHTML = karsilastirmaData.map(item => {
    const id = item[config.idKey];
    const name = item[config.labelKey];
    const detail = config.detailKey ? item[config.detailKey] : '';
    const score = item.toplam_puan;

    return `
      <div class="alternatif-item" data-id="${id}" onclick="toggleAlternatif(${id})">
        <div class="alternatif-checkbox"></div>
        <div class="alternatif-info">
          <div class="alternatif-name">${name}</div>
          ${detail ? `<div class="alternatif-detail">${detail}</div>` : ''}
        </div>
        <div class="alternatif-score">${score}</div>
      </div>
    `;
  }).join('');

  updateSelectedCount();
}

function toggleAlternatif(id) {
  const index = selectedAlternatifler.indexOf(id);

  if (index > -1) {
    // Remove
    selectedAlternatifler.splice(index, 1);
  } else {
    // Add (no max limit)
    selectedAlternatifler.push(id);
  }

  // Update UI
  document.querySelectorAll('.alternatif-item').forEach(el => {
    const itemId = parseInt(el.dataset.id);
    if (selectedAlternatifler.includes(itemId)) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }

    // Remove disabled class (no max limit)
    el.classList.remove('disabled');
  });

  updateSelectedCount();
}

function updateSelectedCount() {
  const selectedCountEl = document.getElementById('selectedCount');
  const totalAlternativesEl = document.getElementById('totalAlternatives');

  if (selectedCountEl) {
    selectedCountEl.textContent = selectedAlternatifler.length;
  }

  // Toplam alternatif sayısını güncelle (filtrelenmiş veri sayısı)
  if (totalAlternativesEl) {
    totalAlternativesEl.textContent = karsilastirmaData.length || 0;
  }

  // Enable/disable compare button
  const btn = document.getElementById('btnKarsilastir');
  btn.disabled = selectedAlternatifler.length < 2;
}

function renderWeightSliders() {
  const config = kategoriConfig[currentKategori];
  const container = document.getElementById('karsilastirmaSliders');
  const defaultWeight = Math.floor(100 / config.kriterler.length);

  container.innerHTML = config.kriterler.map((kriter, i) => {
    const weight = i === config.kriterler.length - 1
      ? 100 - (defaultWeight * (config.kriterler.length - 1))
      : defaultWeight;

    return `
      <div class="weight-slider-group">
        <label>${kriter.label}</label>
        <input type="range" id="kriter_${kriter.id}" min="0" max="100" value="${weight}" class="weight-slider" oninput="updateKarsilastirmaWeight()">
        <span class="weight-value">${weight}%</span>
      </div>
    `;
  }).join('');

  updateKarsilastirmaTotal();
}

function updateKarsilastirmaWeight() {
  const config = kategoriConfig[currentKategori];
  config.kriterler.forEach(kriter => {
    const slider = document.getElementById(`kriter_${kriter.id}`);
    const valueSpan = slider.nextElementSibling;
    valueSpan.textContent = `${slider.value}%`;
  });
  updateKarsilastirmaTotal();
}

function updateKarsilastirmaTotal() {
  const config = kategoriConfig[currentKategori];
  const total = config.kriterler.reduce((sum, kriter) => {
    return sum + parseInt(document.getElementById(`kriter_${kriter.id}`).value);
  }, 0);

  const totalEl = document.getElementById('karsilastirmaToplam');
  totalEl.textContent = `${total}%`;
  totalEl.className = 'total-value ' + (total === 100 ? 'valid' : 'invalid');
}

function getKarsilastirmaWeights() {
  const config = kategoriConfig[currentKategori];
  const weights = {};
  config.kriterler.forEach(kriter => {
    weights[kriter.id] = parseInt(document.getElementById(`kriter_${kriter.id}`).value);
  });
  return weights;
}

async function runComparison() {
  if (selectedAlternatifler.length < 2) {
    showToast('warning', 'Uyarı', 'En az 2 alternatif seçmelisiniz');
    return;
  }

  const config = kategoriConfig[currentKategori];
  const weights = getKarsilastirmaWeights();

  // Check if weights sum to 100
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight !== 100) {
    showToast('warning', 'Uyarı', 'Ağırlıkların toplamı %100 olmalıdır');
    return;
  }

  // Filter selected alternatives
  const selectedData = karsilastirmaData.filter(item =>
    selectedAlternatifler.includes(item[config.idKey])
  );

  // Calculate weighted scores
  const results = selectedData.map(item => {
    let weightedScore = 0;
    config.kriterler.forEach(kriter => {
      weightedScore += (item[kriter.key] * weights[kriter.id] / 100);
    });

    return {
      ...item,
      agirlikli_puan: Math.round(weightedScore * 100) / 100
    };
  });

  // Sort by weighted score
  results.sort((a, b) => b.agirlikli_puan - a.agirlikli_puan);

  // Kazananı bul
  const kazanan = results[0];

  // Senaryoyu veritabanına kaydet
  try {
    // Tablo adını enum formatına çevir
    let tabloAdi = currentKategori;
    if (currentKategori === 'oyuncular') tabloAdi = 'oyuncular';
    else if (currentKategori === 'sponsorlar') tabloAdi = 'sponsorlar';
    else if (currentKategori === 'teknik-ekip') tabloAdi = 'teknik_ekip';
    else if (currentKategori === 'tesisler') tabloAdi = 'tesisler';
    else if (currentKategori === 'taraftar-gruplari') tabloAdi = 'taraftar_gruplari';

    // Filtre değerini al
    const filterSelect = document.getElementById('karsilastirmaFilterSelect');
    const filtreDegeri = filterSelect ? filterSelect.value : '';

    const requestData = {
      kulup_id: 1,
      senaryo_adi: `${currentKategori} Karşılaştırması - ${new Date().toLocaleString('tr-TR')}`,
      tablo_adi: tabloAdi,
      filtre_degeri: filtreDegeri,
      aciklama: `${selectedAlternatifler.length} alternatif karşılaştırıldı`,
      secilen_alternatifler: selectedData.map(item => ({
        id: item[config.idKey],
        ad: item[config.labelKey]
      })),
      kullanilan_agirliklar: weights,
      sonuclar: results,
      kazanan_id: kazanan[config.idKey],
      kazanan_adi: kazanan[config.labelKey],
      kazanan_puan: kazanan.agirlikli_puan
    };

    console.log('Senaryo kaydediliyor...', requestData);

    const response = await fetch('/api/karsilastirma-senaryo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Senaryo kaydedilemedi:', response.status, errorData);
      showToast('warning', 'Uyarı', 'Senaryo kaydedilemedi: ' + errorData.substring(0, 100));
    } else {
      const result = await response.json();
      console.log('Senaryo başarıyla kaydedildi:', result);
    }
  } catch (error) {
    console.error('Senaryo kaydetme hatası:', error);
    showToast('error', 'Hata', 'Senaryo kaydedilirken hata oluştu: ' + error.message);
  }

  // Render results
  renderComparisonResults(results, config, weights);

  document.getElementById('comparisonResults').style.display = 'block';
  document.getElementById('comparisonResults').scrollIntoView({ behavior: 'smooth' });
}

function renderComparisonResults(results, config, weights) {
  // Bar Chart
  destroyChart('karsilastirmaBarChart');
  charts.karsilastirmaBarChart = new Chart(document.getElementById('karsilastirmaBarChart'), {
    type: 'bar',
    data: {
      labels: results.map(r => r[config.labelKey]),
      datasets: [{
        label: 'Ağırlıklı Puan',
        data: results.map(r => r.agirlikli_puan),
        backgroundColor: results.map((_, i) => i === 0 ? colors.green.bg : chartColors[i % chartColors.length]),
        borderColor: results.map((_, i) => i === 0 ? colors.green.border : chartColors[i % chartColors.length].replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(45, 58, 79, 0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Radar Chart
  destroyChart('karsilastirmaRadarChart');
  charts.karsilastirmaRadarChart = new Chart(document.getElementById('karsilastirmaRadarChart'), {
    type: 'radar',
    data: {
      labels: config.kriterler.map(k => k.label),
      datasets: results.map((r, i) => ({
        label: r[config.labelKey].split(' ').pop(),
        data: config.kriterler.map(k => r[k.key]),
        backgroundColor: chartColors[i].replace('0.8', '0.2'),
        borderColor: chartColors[i],
        borderWidth: 2,
        pointBackgroundColor: chartColors[i]
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, display: false },
          grid: { color: 'rgba(45, 58, 79, 0.5)' },
          angleLines: { color: 'rgba(45, 58, 79, 0.5)' }
        }
      },
      plugins: { legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } }
    }
  });

  // Table
  const thead = document.getElementById('karsilastirmaTableHead');
  const tbody = document.getElementById('karsilastirmaTableBody');

  thead.innerHTML = `
    <tr>
      <th>Sıra</th>
      <th>Ad</th>
      ${config.kriterler.map(k => `<th>${k.label} <span style="color: var(--accent-blue); font-size: 0.7rem;">(${weights[k.id]}%)</span></th>`).join('')}
      <th>Ağırlıklı Puan</th>
    </tr>
  `;

  tbody.innerHTML = results.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${r[config.labelKey]}</strong></td>
      ${config.kriterler.map(k => `<td>${r[k.key]}</td>`).join('')}
      <td><span class="score-badge ${getScoreBadgeClass(r.agirlikli_puan)}">${r.agirlikli_puan}</span></td>
    </tr>
  `).join('');
}

// ==================== Weight Sliders ====================
function initWeightSliders() {
  setupWeightGroup(['oyuncuFiziksel', 'oyuncuPozisyon', 'oyuncuTaktik', 'oyuncuSaglik'], 'oyuncuToplam');
  setupWeightGroup(['sponsorFinansal', 'sponsorImaj', 'sponsorTaraftar', 'sponsorMarka'], 'sponsorToplam');
  setupWeightGroup(['teknikDeneyim', 'teknikBasari', 'teknikUyum'], 'teknikToplam');
  setupWeightGroup(['tesisAltyapi', 'tesisDonanim', 'tesisUlasim', 'tesisKonaklama'], 'tesisToplam');
  setupWeightGroup(['taraftarMemnuniyet', 'taraftarEtki', 'taraftarMedya', 'taraftarDoluluk'], 'taraftarToplam');
}

function setupWeightGroup(sliderIds, totalId) {
  sliderIds.forEach(id => {
    const slider = document.getElementById(id);
    const valueSpan = slider.nextElementSibling;

    slider.addEventListener('input', () => {
      valueSpan.textContent = `${slider.value}%`;
      updateWeightTotal(sliderIds, totalId);
    });
  });
  updateWeightTotal(sliderIds, totalId);
}

function updateWeightDisplay(sliderId) {
  const slider = document.getElementById(sliderId);
  const valueSpan = slider.nextElementSibling;
  if (valueSpan && valueSpan.classList.contains('weight-value')) {
    valueSpan.textContent = `${slider.value}%`;
  }
}

function updateWeightTotal(sliderIds, totalId) {
  const total = sliderIds.reduce((sum, id) => sum + parseInt(document.getElementById(id).value), 0);
  const totalEl = document.getElementById(totalId);
  totalEl.textContent = `${total}%`;
  totalEl.className = 'total-value ' + (total === 100 ? 'valid' : 'invalid');
}

// ==================== Filters ====================
function initFilters() {
  document.getElementById('oyuncuPozisyonFilter').addEventListener('change', calculateOyuncuWeighted);
  document.getElementById('teknikGorevFilter').addEventListener('change', calculateTeknikWeighted);
}

// ==================== Buttons ====================
function initButtons() {
  document.getElementById('oyuncuApply').addEventListener('click', () => {
    oyuncuCurrentPage = 1; // Sayfayı sıfırla
    calculateOyuncuWeighted();
  });

  // Sayfalama butonları
  const oyuncuPrevBtn = document.getElementById('oyuncuPrevBtn');
  const oyuncuNextBtn = document.getElementById('oyuncuNextBtn');
  if (oyuncuPrevBtn) {
    oyuncuPrevBtn.addEventListener('click', () => {
      if (oyuncuCurrentPage > 1) {
        oyuncuCurrentPage--;
        calculateOyuncuWeighted();
      }
    });
  }
  if (oyuncuNextBtn) {
    oyuncuNextBtn.addEventListener('click', () => {
      // Sayfa numarasını artır, calculateOyuncuWeighted içinde kontrol edilecek
      oyuncuCurrentPage++;
      calculateOyuncuWeighted();
    });
  }
  document.getElementById('sponsorApply').addEventListener('click', () => {
    sponsorCurrentPage = 1; // Sayfayı sıfırla
    sponsorCurrentPage = 1; // Sayfayı sıfırla
    calculateSponsorWeighted();
  });

  // Sponsorlar sayfalama butonları
  const sponsorPrevBtn = document.getElementById('sponsorPrevBtn');
  const sponsorNextBtn = document.getElementById('sponsorNextBtn');
  if (sponsorPrevBtn) {
    sponsorPrevBtn.addEventListener('click', () => {
      if (sponsorCurrentPage > 1) {
        sponsorCurrentPage--;
        calculateSponsorWeighted();
      }
    });
  }
  if (sponsorNextBtn) {
    sponsorNextBtn.addEventListener('click', () => {
      sponsorCurrentPage++;
      calculateSponsorWeighted();
    });
  }
  document.getElementById('teknikApply').addEventListener('click', () => {
    teknikCurrentPage = 1; // Sayfayı sıfırla
    calculateTeknikWeighted();
  });
  document.getElementById('tesisApply').addEventListener('click', () => {
    tesisCurrentPage = 1; // Sayfayı sıfırla
    calculateTesisWeighted();
  });
  document.getElementById('taraftarApply').addEventListener('click', () => {
    taraftarCurrentPage = 1; // Sayfayı sıfırla
    calculateTaraftarWeighted();
  });

  // Teknik Ekip sayfalama butonları
  const teknikPrevBtn = document.getElementById('teknikPrevBtn');
  const teknikNextBtn = document.getElementById('teknikNextBtn');
  if (teknikPrevBtn) {
    teknikPrevBtn.addEventListener('click', () => {
      if (teknikCurrentPage > 1) {
        teknikCurrentPage--;
        calculateTeknikWeighted();
      }
    });
  }
  if (teknikNextBtn) {
    teknikNextBtn.addEventListener('click', () => {
      teknikCurrentPage++;
      calculateTeknikWeighted();
    });
  }

  // Tesisler sayfalama butonları
  const tesisPrevBtn = document.getElementById('tesisPrevBtn');
  const tesisNextBtn = document.getElementById('tesisNextBtn');
  if (tesisPrevBtn) {
    tesisPrevBtn.addEventListener('click', () => {
      if (tesisCurrentPage > 1) {
        tesisCurrentPage--;
        calculateTesisWeighted();
      }
    });
  }
  if (tesisNextBtn) {
    tesisNextBtn.addEventListener('click', () => {
      tesisCurrentPage++;
      calculateTesisWeighted();
    });
  }

  // Taraftar Grupları sayfalama butonları
  const taraftarPrevBtn = document.getElementById('taraftarPrevBtn');
  const taraftarNextBtn = document.getElementById('taraftarNextBtn');
  if (taraftarPrevBtn) {
    taraftarPrevBtn.addEventListener('click', () => {
      if (taraftarCurrentPage > 1) {
        taraftarCurrentPage--;
        calculateTaraftarWeighted();
      }
    });
  }
  if (taraftarNextBtn) {
    taraftarNextBtn.addEventListener('click', () => {
      taraftarCurrentPage++;
      calculateTaraftarWeighted();
    });
  }
  const taraftarChartYilFilter = document.getElementById('taraftarChartYilFilter');
  if (taraftarChartYilFilter) {
    taraftarChartYilFilter.addEventListener('change', calculateTaraftarWeighted);
  }

  // Karşılaştırma
  document.getElementById('karsilastirmaKategori').addEventListener('change', onKategoriChange);
  document.getElementById('btnKarsilastir').addEventListener('click', runComparison);
}
