/**
 * Eryılmaz Gayrimenkul - Ana Uygulama Mantığı
 * Geniş sinema modu fotoğraf tiyatrosu ve %100 ekranı kaplayan Lightbox desteği.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Veri Kontrolü
  const listings = window.LISTINGS_DATA || [];
  const company = window.COMPANY_DATA || {};

  // Durum Yönetimi
  const state = {
    status: 'all',          // 'all', 'Satılık', 'Kiralık'
    category: 'all',        // 'all', 'Daire / Konut', 'Arsa & Bahçe', 'İşyeri & Ticari', 'Tarla & Arazi'
    neighborhood: 'all',    // Mahalle filtresi
    searchQuery: '',        // Arama metni
    sortBy: 'default',      // 'default', 'price-asc', 'price-desc', 'id-desc'
    currentModalItem: null,
    currentImageIndex: 0,
    isLightboxOpen: false
  };

  // DOM Elemanları
  const listingsContainer = document.getElementById('listings-container');
  const resultsCountEl = document.getElementById('results-count');
  const searchInput = document.getElementById('search-input');
  const neighborhoodSelect = document.getElementById('neighborhood-select');
  const sortSelect = document.getElementById('sort-select');
  const resetBtn = document.getElementById('btn-reset-filters');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const categoryPills = document.querySelectorAll('.category-pill');

  // Modal DOM Elemanları
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const galleryStage = document.getElementById('gallery-stage');
  const galleryMainImg = document.getElementById('gallery-main-img');
  const galleryThumbs = document.getElementById('gallery-thumbs');
  const galleryCounter = document.getElementById('gallery-counter');
  const galleryPrevBtn = document.getElementById('gallery-prev-btn');
  const galleryNextBtn = document.getElementById('gallery-next-btn');
  const btnOpenLightbox = document.getElementById('btn-open-lightbox');

  const modalStatusBadge = document.getElementById('modal-status-badge');
  const modalCategoryBadge = document.getElementById('modal-category-badge');
  const modalIdPill = document.getElementById('modal-id-pill');
  const modalPrice = document.getElementById('modal-price');
  const modalTitle = document.getElementById('modal-title');
  const modalLoc = document.getElementById('modal-loc');
  const modalQuickChips = document.getElementById('modal-quick-chips');
  const modalSpecsGrid = document.getElementById('modal-specs-grid');
  const modalDesc = document.getElementById('modal-desc');
  const modalFeatures = document.getElementById('modal-features');
  const modalFeaturesTitle = document.getElementById('modal-features-title');
  const modalWaBtn = document.getElementById('modal-wa-btn');
  const modalCallBtn = document.getElementById('modal-call-btn');
  const modalShareBtn = document.getElementById('modal-share-btn');
  const toastEl = document.getElementById('toast');

  // Lightbox DOM Elemanları
  const lightboxFullscreen = document.getElementById('lightbox-fullscreen');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxTitleText = document.getElementById('lightbox-title-text');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxMainImg = document.getElementById('lightbox-main-img');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxThumbs = document.getElementById('lightbox-thumbs');

  // 1. Mahalle Seçeneklerini Dinamik Doldur
  function populateNeighborhoods() {
    if (!neighborhoodSelect) return;
    const neighborhoods = new Set();
    listings.forEach(item => {
      if (item.neighborhood) neighborhoods.add(item.neighborhood);
    });

    const sorted = Array.from(neighborhoods).sort((a, b) => a.localeCompare(b, 'tr'));
    sorted.forEach(nh => {
      const opt = document.createElement('option');
      opt.value = nh;
      opt.textContent = nh;
      neighborhoodSelect.appendChild(opt);
    });
  }

  // 2. Sekmelerdeki Sayıları Güncelle
  function updateTabCounts() {
    const total = listings.length;
    const satilikCount = listings.filter(i => i.status === 'Satılık').length;
    const kiralikCount = listings.filter(i => i.status === 'Kiralık').length;

    const countAll = document.getElementById('count-all');
    const countSatilik = document.getElementById('count-satilik');
    const countKiralik = document.getElementById('count-kiralik');

    if (countAll) countAll.textContent = `(${total})`;
    if (countSatilik) countSatilik.textContent = `(${satilikCount})`;
    if (countKiralik) countKiralik.textContent = `(${kiralikCount})`;
  }

  // 3. İlanları Filtrele & Sırala
  function getFilteredListings() {
    let result = listings.filter(item => {
      if (state.status !== 'all' && item.status !== state.status) {
        return false;
      }
      if (state.category !== 'all' && item.category !== state.category) {
        return false;
      }
      if (state.neighborhood !== 'all' && item.neighborhood !== state.neighborhood) {
        return false;
      }
      if (state.searchQuery.trim() !== '') {
        const q = state.searchQuery.toLocaleLowerCase('tr').trim();
        const searchCorpus = [
          item.title,
          item.locationDisplay,
          item.neighborhood,
          item.category,
          item.status,
          item.m2,
          item.rooms,
          item.price,
          item.id
        ].join(' ').toLocaleLowerCase('tr');

        if (!searchCorpus.includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (state.sortBy === 'price-asc') {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (state.sortBy === 'price-desc') {
      result.sort((a, b) => b.priceNum - a.priceNum);
    } else if (state.sortBy === 'id-desc') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }

  // 4. Kartları Ekrana Bas
  function renderListings() {
    const filtered = getFilteredListings();

    if (resultsCountEl) {
      resultsCountEl.innerHTML = `<span>${filtered.length}</span> ilan listeleniyor`;
    }

    if (!listingsContainer) return;

    if (filtered.length === 0) {
      listingsContainer.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>Aramanıza uygun ilan bulunamadı</h3>
          <p>Filtreleri temizleyerek veya arama kelimesini değiştirerek tekrar deneyebilirsiniz.</p>
          <button class="btn btn-outline" id="btn-empty-reset">Tüm Filtreleri Sıfırla</button>
        </div>
      `;
      const emptyReset = document.getElementById('btn-empty-reset');
      if (emptyReset) emptyReset.addEventListener('click', resetAllFilters);
      return;
    }

    listingsContainer.innerHTML = filtered.map(item => {
      const isSatilik = item.status === 'Satılık';
      const badgeClass = isSatilik ? 'badge-satilik' : 'badge-kiralik';
      const imageCount = item.images && item.images.length ? item.images.length : 1;
      const mainImg = item.mainImage || 'assets/icons/favicon.svg';

      return `
        <article class="listing-card" data-id="${item.id}">
          <div class="card-img-wrap" onclick="window.openDetail('${item.id}')">
            <img class="card-img" src="${mainImg}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='assets/icons/favicon.svg'">
            <span class="card-badge-status ${badgeClass}">${item.status}</span>
            <span class="card-badge-type">${item.category}</span>
            <span class="card-badge-photos">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              ${imageCount}
            </span>
          </div>
          <div class="card-body">
            <div class="card-price">${item.price}</div>
            <h3 class="card-title" onclick="window.openDetail('${item.id}')" title="${escapeHtml(item.title)}">
              ${escapeHtml(item.title)}
            </h3>
            <div class="card-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${escapeHtml(item.locationDisplay)}
            </div>
            <div class="card-meta-chips">
              ${item.m2 ? `
                <span class="meta-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"></path></svg>
                  ${escapeHtml(item.m2)}
                </span>
              ` : ''}
              ${item.rooms ? `
                <span class="meta-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                  ${escapeHtml(item.rooms)}
                </span>
              ` : ''}
              ${item.floor ? `
                <span class="meta-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  ${escapeHtml(item.floor)}. Kat
                </span>
              ` : ''}
            </div>
            <div class="card-footer">
              <button class="btn btn-outline btn-sm" onclick="window.openDetail('${item.id}')">
                İlanı İncele
              </button>
              <a class="btn btn-whatsapp btn-sm" href="https://wa.me/${company.whatsapp || '905544613618'}?text=${encodeURIComponent('Merhaba Muzaffer Bey, ' + item.title + ' (İlan No: ' + item.id + ') hakkında bilgi alabilir miyim?')}" target="_blank" rel="noopener">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 5. İlan Detay Modalı
  window.openDetail = function(id) {
    const item = listings.find(i => String(i.id) === String(id));
    if (!item) return;

    state.currentModalItem = item;
    state.currentImageIndex = 0;

    // Fotoğraflar
    const imgs = item.images && item.images.length > 0 ? item.images : [item.mainImage];
    updateGallery(imgs, 0);

    // Başlık, fiyat ve rozetler
    const isSatilik = item.status === 'Satılık';
    modalStatusBadge.textContent = item.status;
    modalStatusBadge.className = `card-badge-status ${isSatilik ? 'badge-satilik' : 'badge-kiralik'}`;
    modalCategoryBadge.textContent = item.category;
    modalIdPill.textContent = `İlan No: ${item.id}`;

    modalPrice.textContent = item.price;
    modalTitle.textContent = item.title;
    modalLoc.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <span>${escapeHtml(item.locationDisplay)}</span>
    `;

    // Hızlı Özet Çipleri
    const quickChips = [];
    if (item.m2) quickChips.push({ label: 'Alan', val: item.m2, icon: '📐' });
    if (item.rooms) quickChips.push({ label: 'Oda', val: item.rooms, icon: '🚪' });
    if (item.floor) quickChips.push({ label: 'Kat', val: `${item.floor}. Kat`, icon: '🏢' });
    quickChips.push({ label: 'Durum', val: item.status, icon: '🏷️' });

    modalQuickChips.innerHTML = quickChips.map(c => `
      <div class="quick-chip-box">
        <span>${c.icon}</span>
        <span>${escapeHtml(c.val)}</span>
      </div>
    `).join('');

    // Teknik Özellikler Izgarası
    const specs = [
      { label: 'İlan No', val: item.id },
      { label: 'Kategori', val: item.category },
      { label: 'Durum', val: item.status },
      { label: 'Brüt m²', val: item.m2 || '-' },
      { label: 'Oda Sayısı', val: item.rooms || '-' },
      { label: 'Bulunduğu Kat', val: item.floor ? `${item.floor}. Kat` : '-' },
      { label: 'İlan Tarihi', val: item.date || '-' }
    ];

    if (item.specs) {
      Object.keys(item.specs).forEach(k => {
        if (!['İlan No', 'Brüt m²', 'Oda Sayısı', 'Bulunduğu Kat', 'Güncelleme Tarihi'].includes(k)) {
          specs.push({ label: k, val: item.specs[k] });
        }
      });
    }

    modalSpecsGrid.innerHTML = specs.map(s => `
      <div class="spec-box">
        <span class="spec-label">${escapeHtml(s.label)}</span>
        <span class="spec-val">${escapeHtml(String(s.val))}</span>
      </div>
    `).join('');

    // Açıklama
    modalDesc.textContent = item.description || 'Detaylı bilgi için danışmanımızla iletişime geçiniz.';

    // İlan Özellikleri (Etiketler)
    if (item.features && item.features.length > 0) {
      modalFeatures.innerHTML = item.features.map(f => `
        <span class="modal-feature-pill">${escapeHtml(f)}</span>
      `).join('');
      modalFeatures.style.display = 'flex';
      if (modalFeaturesTitle) modalFeaturesTitle.style.display = 'block';
    } else {
      modalFeatures.style.display = 'none';
      if (modalFeaturesTitle) modalFeaturesTitle.style.display = 'none';
    }

    // Buton Eylemleri
    const waText = encodeURIComponent(`Merhaba Muzaffer Bey, web sitenizdeki "${item.title}" (İlan No: ${item.id}) hakkında detaylı bilgi almak istiyorum.`);
    modalWaBtn.href = `https://wa.me/${company.whatsapp || '905544613618'}?text=${waText}`;
    modalCallBtn.href = `tel:${company.phoneGsmClean || '905544613618'}`;

    // URL Hash Güncelle
    window.location.hash = `ilan-${item.id}`;

    // Modalı Göster
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Galeri Güncelleme
  function updateGallery(imgs, index) {
    if (!imgs || imgs.length === 0) return;
    state.currentImageIndex = index;

    galleryMainImg.src = imgs[index];
    galleryCounter.textContent = `${index + 1} / ${imgs.length}`;

    // Thumbnails
    if (galleryThumbs) {
      galleryThumbs.innerHTML = imgs.map((src, i) => `
        <div class="gallery-thumb-item ${i === index ? 'active' : ''}" onclick="window.selectGalleryImage(${i})">
          <img src="${src}" alt="Önizleme ${i + 1}" loading="lazy">
        </div>
      `).join('');

      const activeThumb = galleryThumbs.children[index];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  window.selectGalleryImage = function(index) {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    updateGallery(imgs, index);
  };

  function nextGalleryImage() {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    let nextIdx = state.currentImageIndex + 1;
    if (nextIdx >= imgs.length) nextIdx = 0;
    updateGallery(imgs, nextIdx);
  }

  function prevGalleryImage() {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    let prevIdx = state.currentImageIndex - 1;
    if (prevIdx < 0) prevIdx = imgs.length - 1;
    updateGallery(imgs, prevIdx);
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    state.currentModalItem = null;
    if (window.location.hash.startsWith('#ilan-')) {
      history.replaceState(null, null, ' ');
    }
  }

  // ================================================================
  // 6. YENİ: %100 EKRANI KAPLAYAN DEV LIGHTBOX (SİNEMA MODU)
  // ================================================================
  function openLightbox(index) {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    if (!imgs || imgs.length === 0) return;

    state.isLightboxOpen = true;
    updateLightbox(imgs, index !== undefined ? index : state.currentImageIndex);

    lightboxTitleText.textContent = state.currentModalItem.title;
    lightboxFullscreen.classList.add('active');
  }

  function closeLightbox() {
    state.isLightboxOpen = false;
    lightboxFullscreen.classList.remove('active');
  }

  function updateLightbox(imgs, index) {
    state.currentImageIndex = index;
    lightboxMainImg.src = imgs[index];
    lightboxCounter.textContent = `${index + 1} / ${imgs.length}`;

    // Lightbox thumbs
    if (lightboxThumbs) {
      lightboxThumbs.innerHTML = imgs.map((src, i) => `
        <div class="lightbox-thumb-item ${i === index ? 'active' : ''}" onclick="window.selectLightboxImage(${i})">
          <img src="${src}" alt="Küçük Önizleme ${i + 1}" loading="lazy">
        </div>
      `).join('');

      const activeThumb = lightboxThumbs.children[index];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    // Modal sahnesini de senkronize et
    updateGallery(imgs, index);
  }

  window.selectLightboxImage = function(index) {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    updateLightbox(imgs, index);
  };

  function nextLightboxImage() {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    let nextIdx = state.currentImageIndex + 1;
    if (nextIdx >= imgs.length) nextIdx = 0;
    updateLightbox(imgs, nextIdx);
  }

  function prevLightboxImage() {
    if (!state.currentModalItem) return;
    const imgs = state.currentModalItem.images || [state.currentModalItem.mainImage];
    let prevIdx = state.currentImageIndex - 1;
    if (prevIdx < 0) prevIdx = imgs.length - 1;
    updateLightbox(imgs, prevIdx);
  }

  // Fotoğrafa tıklandığında veya "Tam Ekran Büyüt" butonuna basıldığında
  if (galleryStage) {
    galleryStage.addEventListener('click', (e) => {
      // Ok butonlarına tıklandıysa lightbox açma
      if (e.target.closest('.gallery-nav-btn')) return;
      openLightbox(state.currentImageIndex);
    });
  }

  if (btnOpenLightbox) {
    btnOpenLightbox.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(state.currentImageIndex);
    });
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', prevLightboxImage);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', nextLightboxImage);

  // 7. Paylaşım Butonu
  if (modalShareBtn) {
    modalShareBtn.addEventListener('click', () => {
      const shareUrl = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: state.currentModalItem ? state.currentModalItem.title : 'Eryılmaz Gayrimenkul',
          url: shareUrl
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('İlan bağlantısı panoya kopyalandı!');
        }).catch(() => {
          showToast('Bağlantı kopyalanamadı.');
        });
      }
    });
  }

  // Toast Bildirim
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2500);
  }

  // 8. Filtre Olay Dinleyicileri
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.status = btn.dataset.status;
      renderListings();
    });
  });

  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.category = pill.dataset.category;
      renderListings();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderListings();
    });
  }

  if (neighborhoodSelect) {
    neighborhoodSelect.addEventListener('change', (e) => {
      state.neighborhood = e.target.value;
      renderListings();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderListings();
    });
  }

  function resetAllFilters() {
    state.status = 'all';
    state.category = 'all';
    state.neighborhood = 'all';
    state.searchQuery = '';
    state.sortBy = 'default';

    tabButtons.forEach(b => b.classList.remove('active'));
    if (tabButtons[0]) tabButtons[0].classList.add('active');

    categoryPills.forEach(p => p.classList.remove('active'));
    if (categoryPills[0]) categoryPills[0].classList.add('active');

    if (searchInput) searchInput.value = '';
    if (neighborhoodSelect) neighborhoodSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'default';

    renderListings();
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  // Galeri Butonları
  if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevGalleryImage(); });
  if (galleryNextBtn) galleryNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextGalleryImage(); });
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Klavye Navigasyonu
  document.addEventListener('keydown', (e) => {
    if (state.isLightboxOpen) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
      return;
    }

    if (modalOverlay.classList.contains('active')) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') nextGalleryImage();
      if (e.key === 'ArrowLeft') prevGalleryImage();
    }
  });

  // Hash ile doğrudan ilan açma desteği
  function checkUrlHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#ilan-')) {
      const id = hash.replace('#ilan-', '');
      window.openDetail(id);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Başlatma
  populateNeighborhoods();
  updateTabCounts();
  renderListings();
  checkUrlHash();
});
