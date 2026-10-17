/**
   * ERYILMAZ GAYRİMENKUL - İlan Detay & 3D Vektörel Tur & Konum Motoru
   * Tasarım İlkeleri: Arial, Özel Doğal Palet (#81A6C6, #AACDDC, #F3E3D0, #D2C4B4), Sıfır Gradyan
   */

document.addEventListener('DOMContentLoaded', () => {
  // 1. URL parametresinden İlan ID'sini al
  const urlParams = new URLSearchParams(window.location.search);
  let listingId = urlParams.get('id');

  // Varsayılan olarak 595551 nolu ilanı göster (kullanıcı isteği doğrultusunda 3D ev turu olan ana ilan)
  if (!listingId) {
    listingId = '595551';
  }

  // Veri kontrolü
  if (!window.LISTINGS_DATA || !Array.isArray(window.LISTINGS_DATA)) {
    console.error('İlan verisi bulunamadı!');
    return;
  }

  let item = window.LISTINGS_DATA.find(x => String(x.id) === String(listingId));
  if (!item) {
    item = window.LISTINGS_DATA[0]; // fallback
  }

  // 2. Sayfa Başlığı ve Meta
  document.title = `${item.title} | ERYILMAZ GAYRİMENKUL`;
  const metaDesc = document.getElementById('page-meta-desc');
  if (metaDesc) metaDesc.content = `${item.title} - ${item.price} - ${item.locationDisplay}`;

  // 3. Breadcrumbs
  document.getElementById('bc-district').textContent = item.district || 'Turgutlu';
  document.getElementById('bc-neighborhood').textContent = item.neighborhood || 'Merkez';
  document.getElementById('bc-title').textContent = item.title;

  // 4. Sağ Panel: Fiyat, Başlık, Lokasyon ve İletişim
  document.getElementById('detail-price').textContent = item.price;
  const statusBadge = document.getElementById('detail-status');
  statusBadge.textContent = `${item.status} ${item.category ? '• ' + item.category : ''}`;
  if (item.status === 'Kiralık') {
    statusBadge.classList.add('kiralik');
  } else {
    statusBadge.classList.add('satilik');
  }

  document.getElementById('detail-title').textContent = item.title;
  document.getElementById('detail-location').querySelector('span').textContent = item.locationDisplay || `${item.district}, ${item.neighborhood}`;

  // WhatsApp Ön Mesajı
  const waUrl = `https://wa.me/905544613618?text=${encodeURIComponent(`Merhaba Muzaffer Bey, "${item.title}" (İlan No: ${item.id}) hakkında bilgi almak ve yer gösterimi talep etmek istiyorum: ${window.location.href}`)}`;
  const detailWaBtn = document.getElementById('btn-detail-wa');
  if (detailWaBtn) detailWaBtn.href = waUrl;
  const navWaBtn = document.getElementById('nav-wa-btn');
  if (navWaBtn) navWaBtn.href = waUrl;

  // 5. Hızlı Özellikler Özeti (Sağ Panel)
  const quickSpecsContainer = document.getElementById('quick-specs-container');
  quickSpecsContainer.innerHTML = '';

  const displaySpecs = [];
  if (item.specs && item.specs['İlan No']) displaySpecs.push({ k: 'İlan No', v: item.specs['İlan No'] });
  if (item.m2) displaySpecs.push({ k: 'Brüt Alan', v: item.m2 });
  if (item.specs && item.specs['Net m²']) displaySpecs.push({ k: 'Net Alan', v: item.specs['Net m²'] });
  if (item.rooms) displaySpecs.push({ k: 'Oda Sayısı', v: item.rooms });
  if (item.floor) displaySpecs.push({ k: 'Kat', v: item.floor });
  if (item.specs && item.specs['Isıtma']) displaySpecs.push({ k: 'Isıtma', v: item.specs['Isıtma'] });
  if (item.specs && item.specs['Bina Yaşı']) displaySpecs.push({ k: 'Bina Yaşı', v: item.specs['Bina Yaşı'] });
  if (item.specs && item.specs['Tapu Durumu']) displaySpecs.push({ k: 'Tapu', v: item.specs['Tapu Durumu'] });

  displaySpecs.forEach(spec => {
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `<span class="spec-key">${spec.k}:</span><span class="spec-val">${spec.v}</span>`;
    quickSpecsContainer.appendChild(row);
  });

  // 6. Sol Panel: Fotoğraf Galerisi Kurulumu
  const images = (item.images && item.images.length > 0) ? item.images : [item.mainImage || 'assets/img/eryilmaz-logo.jpg'];
  let currentImageIdx = 0;

  const mainImgEl = document.getElementById('detail-main-img');
  const counterEl = document.getElementById('photo-counter');
  const totalCountEl = document.getElementById('photo-total-count');
  const thumbsStrip = document.getElementById('photo-thumbs-strip');

  totalCountEl.textContent = images.length;

  function updateMainImage(idx) {
    currentImageIdx = (idx + images.length) % images.length;
    mainImgEl.style.opacity = '0.5';
    mainImgEl.src = images[currentImageIdx];
    mainImgEl.onload = () => { mainImgEl.style.opacity = '1'; };
    counterEl.textContent = `${currentImageIdx + 1} / ${images.length}`;

    // Aktif thumbnail vurgusu
    const allThumbs = thumbsStrip.querySelectorAll('.thumb-item');
    allThumbs.forEach((th, i) => {
      if (i === currentImageIdx) {
        th.classList.add('active');
        th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        th.classList.remove('active');
      }
    });
  }

  // Thumbnailleri oluştur
  thumbsStrip.innerHTML = '';
  images.forEach((imgUrl, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${imgUrl}" alt="Küçük resim ${idx + 1}" loading="lazy">`;
    thumb.addEventListener('click', () => updateMainImage(idx));
    thumbsStrip.appendChild(thumb);
  });

  document.getElementById('btn-photo-prev').addEventListener('click', () => updateMainImage(currentImageIdx - 1));
  document.getElementById('btn-photo-next').addEventListener('click', () => updateMainImage(currentImageIdx + 1));
  updateMainImage(0);

  // 7. 3D Vektörel Ev Turu Sekmesi ve Motoru
  const tabBtnPhotos = document.getElementById('tab-btn-photos');
  const tabBtn3D = document.getElementById('tab-btn-3d');
  const viewPhotosWrap = document.getElementById('view-photos-wrap');
  const view3DWrap = document.getElementById('view-3d-wrap');

  if (item.vectorRooms && item.vectorRooms.length > 0) {
    tabBtn3D.style.display = 'inline-flex';

    tabBtnPhotos.addEventListener('click', () => {
      tabBtnPhotos.classList.add('active');
      tabBtn3D.classList.remove('active');
      viewPhotosWrap.style.display = 'flex';
      view3DWrap.style.display = 'none';
    });

    tabBtn3D.addEventListener('click', () => {
      tabBtn3D.classList.add('active');
      tabBtnPhotos.classList.remove('active');
      viewPhotosWrap.style.display = 'none';
      view3DWrap.style.display = 'flex';
    });

    // 3D Vektörel Odalar Mantığı
    let currentRoomIdx = 0;
    const rooms = item.vectorRooms;
    const pillsList = document.getElementById('vector-pills-list');
    const svgMap = document.getElementById('isometric-svg-map');
    const roomPhotoOverlay = document.getElementById('room-photo-overlay');
    const roomPhotoImg = document.getElementById('room-photo-img');

    // Pill butonlarını oluştur
    pillsList.innerHTML = '';
    rooms.forEach((r, idx) => {
      const pill = document.createElement('button');
      pill.className = `room-nav-pill ${idx === 0 ? 'active' : ''}`;
      pill.textContent = `${r.name} (${r.area})`;
      pill.addEventListener('click', () => selectRoom(idx));
      pillsList.appendChild(pill);
    });

    function selectRoom(idx) {
      currentRoomIdx = (idx + rooms.length) % rooms.length;
      const room = rooms[currentRoomIdx];

      // SVG poligonlarını güncelle
      document.querySelectorAll('.room-polygon').forEach(poly => {
        poly.classList.remove('active-room');
      });
      const targetPoly = document.getElementById(`room-poly-${room.id}`);
      if (targetPoly) {
        targetPoly.classList.add('active-room');
      }

      // Alt bilgi kartını güncelle
      document.getElementById('active-room-name').textContent = `${room.name} (${room.area})`;
      document.getElementById('active-room-desc').textContent = room.desc;
      document.getElementById('active-room-thumb').src = room.image;

      // Pill aktiflik güncelle
      document.querySelectorAll('.room-nav-pill').forEach((btn, i) => {
        btn.classList.toggle('active', i === currentRoomIdx);
      });

      // Overlay açıksa fotoğrafı da değiştir
      if (roomPhotoOverlay.style.display === 'flex') {
        roomPhotoImg.src = room.image;
      }
    }

    // SVG içindeki oda poligonlarına ve kamera noktalarına tıklama
    document.querySelectorAll('.room-polygon').forEach(poly => {
      poly.addEventListener('click', (e) => {
        const id = e.target.id.replace('room-poly-', '');
        const foundIdx = rooms.findIndex(r => r.id === id);
        if (foundIdx !== -1) selectRoom(foundIdx);
      });
    });

    document.querySelectorAll('.room-hotspot').forEach(spot => {
      spot.addEventListener('click', () => {
        const id = spot.getAttribute('data-room');
        const foundIdx = rooms.findIndex(r => r.id === id);
        if (foundIdx !== -1) selectRoom(foundIdx);
      });
    });

    // Önceki / Sonraki butonları
    document.getElementById('btn-prev-room').addEventListener('click', () => selectRoom(currentRoomIdx - 1));
    document.getElementById('btn-next-room').addEventListener('click', () => selectRoom(currentRoomIdx + 1));

    // Odanın Gerçek Fotoğrafını İnceleme
    document.getElementById('btn-inspect-room-photo').addEventListener('click', () => {
      roomPhotoImg.src = rooms[currentRoomIdx].image;
      roomPhotoOverlay.style.display = 'flex';
    });
    document.getElementById('btn-close-room-photo').addEventListener('click', () => {
      roomPhotoOverlay.style.display = 'none';
    });

    // Kontrol butonları
    const btnIso = document.getElementById('btn-persp-iso');
    const btnTop = document.getElementById('btn-persp-top');
    const btnPerspPhoto = document.getElementById('btn-persp-photo');

    btnIso.addEventListener('click', () => {
      btnIso.classList.add('active');
      btnTop.classList.remove('active');
      btnPerspPhoto.classList.remove('active');
      svgMap.style.transform = 'perspective(800px) rotateX(25deg) rotateZ(-6deg) scale(0.96)';
      roomPhotoOverlay.style.display = 'none';
    });

    btnTop.addEventListener('click', () => {
      btnTop.classList.add('active');
      btnIso.classList.remove('active');
      btnPerspPhoto.classList.remove('active');
      svgMap.style.transform = 'none';
      roomPhotoOverlay.style.display = 'none';
    });

    btnPerspPhoto.addEventListener('click', () => {
      btnPerspPhoto.classList.add('active');
      btnIso.classList.remove('active');
      btnTop.classList.remove('active');
      roomPhotoImg.src = rooms[currentRoomIdx].image;
      roomPhotoOverlay.style.display = 'flex';
    });

    // Başlangıç seçimi
    selectRoom(0);
    // Varsayılan olarak izometrik perspektif uygula
    svgMap.style.transform = 'perspective(800px) rotateX(25deg) rotateZ(-6deg) scale(0.96)';
  }

  // 8. İlan Açıklaması ve Donanımlar
  document.getElementById('detail-desc').textContent = item.description || 'Açıklama bulunmuyor.';
  const featuresWrap = document.getElementById('detail-features');
  featuresWrap.innerHTML = '';
  const featuresList = (item.features && item.features.length > 0) 
    ? item.features 
    : ['Merkezi Konum', 'Ulaşıma Yakın', 'Geniş Cephe', 'Doğalgaz', 'Eryılmaz Emlak Güvencesi'];

  featuresList.forEach(feat => {
    const tag = document.createElement('span');
    tag.className = 'feature-tag';
    tag.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      ${feat}
    `;
    featuresWrap.appendChild(tag);
  });

  // 9. KONUM BİLGİSİ & ÇEVRESEL İMKANLAR (Ek2'deki Yapı: Telifsiz Leaflet & Turgutlu Verisi)
  document.getElementById('map-address-label').textContent = `Manisa, Turgutlu, ${item.neighborhood || 'Acarlar Mah.'} (Atatürk Bulvarı Mevkii)`;

  initTurgutluMap();

  // 10. Benzer İlanlar (Sayfa Altı)
  renderRelatedListings(item);
});

/**
 * Ek2 Referanslı Özgün ve Telifsiz Leaflet Konum Motoru
 */
function initTurgutluMap() {
  const mapElement = document.getElementById('turgutlu-leaflet-map');
  if (!mapElement || typeof L === 'undefined') return;

  // Turgutlu Atatürk Bulvarı merkez koordinatı
  const centerLat = 38.4981;
  const centerLng = 27.7027;

  // Leaflet Haritasını Başlat (CartoDB Positron: Telifsiz, yalın gri/bej tonlarında şık tasarım)
  const map = L.map('turgutlu-leaflet-map', {
    center: [centerLat, centerLng],
    zoom: 15,
    zoomControl: true,
    scrollWheelZoom: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Ek2'deki gibi Çevre Dairesi (Radius Circle - 450 metre çevre etki alanı)
  L.circle([centerLat, centerLng], {
    radius: 420,
    color: '#81A6C6',
    fillColor: '#81A6C6',
    fillOpacity: 0.12,
    weight: 2,
    dashArray: '4, 4'
  }).addTo(map);

  // Evin Konumu Merkez İkonu
  const homeIconHtml = `
    <div style="background:#81A6C6; width:38px; height:38px; border-radius:50%; border:3px solid #FFFFFF; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    </div>
  `;
  const homeMarkerIcon = L.divIcon({
    html: homeIconHtml,
    className: 'custom-home-pin',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  L.marker([centerLat, centerLng], { icon: homeMarkerIcon })
    .addTo(map)
    .bindPopup('<strong>Eryılmaz Portföyü</strong><br>Atatürk Bulvarı / Turgutlu')
    .openPopup();

  // Turgutlu Yerel POI (Önemli Noktalar) Verisi
  const poiData = [
    // Ulaşım
    { cat: 'ulasim', name: 'Atatürk Bulvarı Otobüs Durağı', dist: '80 m', time: '🚶 1 dk yürüme', lat: 38.4986, lng: 27.7033, color: '#81A6C6' },
    { cat: 'ulasim', name: 'Turgutlu Eski Garaj (İlçe Terminali)', dist: '450 m', time: '🚶 5 dk yürüme', lat: 38.4955, lng: 27.7050, color: '#81A6C6' },
    { cat: 'ulasim', name: 'Turgutlu TCDD Tren Garı', dist: '850 m', time: '🚶 10 dk yürüme', lat: 38.5020, lng: 27.6970, color: '#81A6C6' },
    { cat: 'ulasim', name: 'İzmir - Ankara E-96 Asfaltı Çıkışı', dist: '1.2 km', time: '🚗 2 dk sürüş', lat: 38.5065, lng: 27.7060, color: '#81A6C6' },

    // Sağlık Kurumları
    { cat: 'saglik', name: 'Turgutlu Devlet Hastanesi', dist: '1.4 km', time: '🚗 4 dk sürüş', lat: 38.5090, lng: 27.7120, color: '#D9534F' },
    { cat: 'saglik', name: '1 Nolu Bulvar Aile Sağlığı Merkezi', dist: '250 m', time: '🚶 3 dk yürüme', lat: 38.4965, lng: 27.7015, color: '#D9534F' },
    { cat: 'saglik', name: 'Merkez Bulvar Eczanesi', dist: '110 m', time: '🚶 1 dk yürüme', lat: 38.4975, lng: 27.7035, color: '#D9534F' },
    { cat: 'saglik', name: 'Ağız ve Diş Sağlığı Merkezi', dist: '900 m', time: '🚗 3 dk sürüş', lat: 38.5040, lng: 27.7080, color: '#D9534F' },

    // Eğitim Kurumları
    { cat: 'egitim', name: 'Cumhuriyet İlkokulu', dist: '320 m', time: '🚶 4 dk yürüme', lat: 38.4950, lng: 27.7010, color: '#8E44AD' },
    { cat: 'egitim', name: 'Turgutlu Anadolu Lisesi', dist: '650 m', time: '🚶 7 dk yürüme', lat: 38.4930, lng: 27.7055, color: '#8E44AD' },
    { cat: 'egitim', name: 'Senem Aka Anadolu Lisesi', dist: '800 m', time: '🚶 9 dk yürüme', lat: 38.5015, lng: 27.7090, color: '#8E44AD' },
    { cat: 'egitim', name: 'CBÜ Hasan Ferdi Teknoloji Fakültesi', dist: '1.5 km', time: '🚗 5 dk sürüş', lat: 38.5110, lng: 27.7150, color: '#8E44AD' },

    // Alışveriş & Sosyal
    { cat: 'alisveris', name: 'Tarihi Çarşamba Kapalı Pazarı', dist: '400 m', time: '🚶 5 dk yürüme', lat: 38.4955, lng: 27.6990, color: '#16A085' },
    { cat: 'alisveris', name: 'Kurumsal Marketler (A101/Bim/Migros)', dist: '70 m', time: '🚶 1 dk yürüme', lat: 38.4980, lng: 27.7018, color: '#16A085' },
    { cat: 'alisveris', name: 'Bulvar Çarşısı & Bankalar Caddesi', dist: '150 m', time: '🚶 2 dk yürüme', lat: 38.4990, lng: 27.7038, color: '#16A085' },
    { cat: 'alisveris', name: 'Atatürk Parkı & Sosyal Yaşam Alanı', dist: '220 m', time: '🚶 3 dk yürüme', lat: 38.4970, lng: 27.7045, color: '#16A085' }
  ];

  const markerInstances = [];

  // POI Markerlarını Haritaya Ekle
  poiData.forEach(poi => {
    const pinHtml = `
      <div style="background:${poi.color}; width:26px; height:26px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px;">
        ●
      </div>
    `;
    const icon = L.divIcon({
      html: pinHtml,
      className: 'poi-custom-pin',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const m = L.marker([poi.lat, poi.lng], { icon: icon })
      .addTo(map)
      .bindPopup(`<strong>${poi.name}</strong><br>${poi.time} (${poi.dist})`);

    markerInstances.push({ marker: m, data: poi });
  });

  // Ek2 Referanslı Liste Doldurma ve Kategori Filtreleme
  const poiContainer = document.getElementById('poi-items-container');
  const filterBtns = document.querySelectorAll('.poi-filter-btn');

  function filterPOIs(category) {
    // Buton aktiflik durumu
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-poi-category') === category);
    });

    // Listeyi temizle
    poiContainer.innerHTML = '';

    // Filtreleme
    const filtered = (category === 'all') 
      ? poiData 
      : poiData.filter(x => x.cat === category);

    // Harita markerlarını göster/gizle
    markerInstances.forEach(item => {
      if (category === 'all' || item.data.cat === category) {
        if (!map.hasLayer(item.marker)) map.addLayer(item.marker);
      } else {
        if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
      }
    });

    // Listeyi render et
    filtered.forEach(poi => {
      const card = document.createElement('div');
      card.className = 'poi-item-card';
      card.innerHTML = `
        <div class="poi-item-left">
          <div class="poi-icon-box ${poi.cat}">
            ${poi.cat === 'ulasim' ? '🚌' : poi.cat === 'saglik' ? '❤️' : poi.cat === 'egitim' ? '🎓' : '🛒'}
          </div>
          <div>
            <div class="poi-name">${poi.name}</div>
            <div style="font-size:10px; color:#6B7280;">${poi.time}</div>
          </div>
        </div>
        <div class="poi-dist-badge">${poi.dist}</div>
      `;

      card.addEventListener('click', () => {
        map.setView([poi.lat, poi.lng], 16, { animate: true });
        const targetMarker = markerInstances.find(x => x.data.name === poi.name);
        if (targetMarker) targetMarker.marker.openPopup();
      });

      poiContainer.appendChild(card);
    });
  }

  // Buton dinleyicileri
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterPOIs(btn.getAttribute('data-poi-category'));
    });
  });

  // İlk yüklemede tümünü listele
  filterPOIs('all');
}

/**
 * Sayfa Altındaki Benzer İlanları Render Et
 */
function renderRelatedListings(currentItem) {
  const grid = document.getElementById('related-listings-grid');
  if (!grid) return;

  const others = window.LISTINGS_DATA
    .filter(x => String(x.id) !== String(currentItem.id))
    .slice(0, 3);

  grid.innerHTML = '';
  others.forEach(item => {
    const card = document.createElement('a');
    card.href = `ilan.html?id=${item.id}`;
    card.className = 'listing-card';
    card.innerHTML = `
      <div class="card-media-wrap">
        <img class="card-img" src="${item.mainImage}" alt="${item.title}" loading="lazy">
        <div class="card-badges-top">
          <span class="card-badge badge-status ${item.status === 'Kiralık' ? 'kiralik' : 'satilik'}">${item.status}</span>
          ${item.has3DTour ? '<span class="card-badge badge-3d">3D Tur</span>' : ''}
        </div>
      </div>
      <div class="card-body">
        <div class="card-price-row">
          <div class="card-price">${item.price}</div>
          <div class="card-category">${item.category}</div>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <div class="card-location">📍 ${item.locationDisplay}</div>
        <div class="card-specs-row">
          <span>${item.rooms || 'Portföy'}</span>
          <span>${item.m2 || ''}</span>
          <span>${item.floor || ''}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}
