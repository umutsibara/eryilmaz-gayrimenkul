/**
 * Eryılmaz Gayrimenkul - İlan Detay Sayfası Mantığı (ilan.html)
 * 3D Sanal Tur (Pannellum), Galeri, Teknik Özellikler ve Benzer İlanlar.
 */

document.addEventListener('DOMContentLoaded', () => {
  const listings = window.LISTINGS_DATA || [];
  const company = window.COMPANY_DATA || {};

  // URL'den ID parametresini al
  const urlParams = new URLSearchParams(window.location.search);
  const ilanId = urlParams.get('id');

  // İlanı bul (Varsayılan olarak ilk ilan veya 3D demo)
  let item = listings.find(i => String(i.id) === String(ilanId));
  if (!item) {
    item = listings[0]; // fallback
  }

  // 1. Sayfa Başlığı ve Meta
  document.title = `${item.title} | ERYILMAZ GAYRİMENKUL`;
  const metaDesc = document.getElementById('page-meta-desc');
  if (metaDesc) metaDesc.content = `${item.locationDisplay} mevkiinde ${item.title}. Detaylı bilgi ve randevu için arayınız.`;

  // 2. Breadcrumbs
  const bcDistrict = document.getElementById('bc-district');
  const bcNeighborhood = document.getElementById('bc-neighborhood');
  const bcTitle = document.getElementById('bc-title');
  if (bcDistrict) bcDistrict.textContent = item.district || 'Turgutlu';
  if (bcNeighborhood) bcNeighborhood.textContent = item.neighborhood || 'Merkez';
  if (bcTitle) bcTitle.textContent = item.title;

  // 3. Başlık, Fiyat ve Rozetler
  const isSatilik = item.status === 'Satılık';
  const detailStatusBadge = document.getElementById('detail-status-badge');
  const detailCategoryBadge = document.getElementById('detail-category-badge');
  const detailIdPill = document.getElementById('detail-id-pill');
  const detail3dBadge = document.getElementById('detail-3d-badge');
  const detailTitle = document.getElementById('detail-title');
  const detailLoc = document.getElementById('detail-loc');
  const detailPrice = document.getElementById('detail-price');
  const stickyPrice = document.getElementById('sticky-price');

  if (detailStatusBadge) {
    detailStatusBadge.textContent = item.status;
    detailStatusBadge.className = `badge-status-pill ${isSatilik ? 'badge-satilik' : 'badge-kiralik'}`;
  }
  if (detailCategoryBadge) detailCategoryBadge.textContent = item.category;
  if (detailIdPill) detailIdPill.textContent = `İlan No: ${item.id}`;
  if (detailTitle) detailTitle.textContent = item.title;
  if (detailPrice) detailPrice.textContent = item.price;
  if (stickyPrice) stickyPrice.textContent = item.price;

  if (detailLoc) {
    detailLoc.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <span>${escapeHtml(item.locationDisplay || 'Manisa / Turgutlu')}</span>
    `;
  }

  // 3D Rozeti
  if (item.has3DTour && detail3dBadge) {
    detail3dBadge.style.display = 'inline-flex';
  }

  // 4. Medya & Galeri Yönetimi
  const imgs = item.images && item.images.length > 0 ? item.images : [item.mainImage || 'assets/icons/favicon.svg'];
  let currentImageIndex = 0;

  const detailMainImg = document.getElementById('detail-main-img');
  const detailGalleryThumbs = document.getElementById('detail-gallery-thumbs');
  const detailGalleryCounter = document.getElementById('detail-gallery-counter');
  const galleryPrevBtn = document.getElementById('gallery-prev-btn');
  const galleryNextBtn = document.getElementById('gallery-next-btn');
  const btnFullscreenTrigger = document.getElementById('btn-fullscreen-trigger');
  const photoTabCount = document.getElementById('photo-tab-count');

  if (photoTabCount) photoTabCount.textContent = imgs.length;

  function updateGallery(index) {
    currentImageIndex = index;
    if (detailMainImg) detailMainImg.src = imgs[index];
    if (detailGalleryCounter) detailGalleryCounter.textContent = `${index + 1} / ${imgs.length}`;

    if (detailGalleryThumbs) {
      detailGalleryThumbs.innerHTML = imgs.map((src, i) => `
        <div class="gallery-thumb-item ${i === index ? 'active' : ''}" onclick="window.selectDetailImage(${i})">
          <img src="${src}" alt="Önizleme ${i + 1}" loading="lazy">
        </div>
      `).join('');

      const activeThumb = detailGalleryThumbs.children[index];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  window.selectDetailImage = function(index) {
    updateGallery(index);
  };

  function nextImage() {
    let nextIdx = currentImageIndex + 1;
    if (nextIdx >= imgs.length) nextIdx = 0;
    updateGallery(nextIdx);
  }

  function prevImage() {
    let prevIdx = currentImageIndex - 1;
    if (prevIdx < 0) prevIdx = imgs.length - 1;
    updateGallery(prevIdx);
  }

  if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', prevImage);
  if (galleryNextBtn) galleryNextBtn.addEventListener('click', nextImage);

  // 5. 3D Sanal Tur Entegrasyonu (Pannellum)
  const mediaTabsBar = document.getElementById('media-tabs-bar');
  const panePhotos = document.getElementById('pane-photos');
  const pane3D = document.getElementById('pane-3d');
  const tabBtnPhotos = document.getElementById('tab-btn-photos');
  const tabBtn3D = document.getElementById('tab-btn-3d');
  const tourRoomsNav = document.getElementById('tour-rooms-nav');

  let pannellumViewer = null;

  if (item.has3DTour && item.tourRooms && item.tourRooms.length > 0) {
    if (mediaTabsBar) mediaTabsBar.style.display = 'flex';

    // Sekme Değişimi
    if (tabBtnPhotos) {
      tabBtnPhotos.addEventListener('click', () => {
        tabBtnPhotos.classList.add('active');
        tabBtn3D.classList.remove('active');
        panePhotos.classList.add('active');
        pane3D.classList.remove('active');
      });
    }

    if (tabBtn3D) {
      tabBtn3D.addEventListener('click', () => {
        tabBtn3D.classList.add('active');
        tabBtnPhotos.classList.remove('active');
        pane3D.classList.add('active');
        panePhotos.classList.remove('active');
        initTour();
      });
    }

    function initTour() {
      if (pannellumViewer) return; // Zaten yüklü

      // Oda butonlarını oluştur
      if (tourRoomsNav) {
        tourRoomsNav.innerHTML = item.tourRooms.map((r, i) => `
          <button class="tour-room-btn ${i === 0 ? 'active' : ''}" data-index="${i}">
            ${escapeHtml(r.name)}
          </button>
        `).join('');

        const roomButtons = tourRoomsNav.querySelectorAll('.tour-room-btn');
        roomButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            roomButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const idx = Number(btn.dataset.index);
            loadPanoramaRoom(item.tourRooms[idx]);
          });
        });
      }

      // İlk odayı yükle
      loadPanoramaRoom(item.tourRooms[0]);
    }

    function loadPanoramaRoom(room) {
      if (window.pannellum) {
        try {
          if (pannellumViewer) {
            pannellumViewer.destroy();
          }
          pannellumViewer = window.pannellum.viewer('panorama-viewer', {
            type: 'equirectangular',
            panorama: room.panorama,
            autoLoad: true,
            autoRotate: -1.5,
            compass: true,
            showZoomCtrl: true,
            showFullscreenCtrl: true,
            title: room.name,
            author: 'Eryılmaz Gayrimenkul 3D Tur'
          });
        } catch (e) {
          console.warn('Pannellum yüklenemedi:', e);
        }
      }
    }
  }

  // 6. %100 Ekranı Kaplayan Lightbox
  const lightboxFullscreen = document.getElementById('lightbox-fullscreen');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxTitleText = document.getElementById('lightbox-title-text');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxMainImg = document.getElementById('lightbox-main-img');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxThumbs = document.getElementById('lightbox-thumbs');
  let isLightboxOpen = false;

  function openLightbox(index) {
    isLightboxOpen = true;
    updateLightbox(index !== undefined ? index : currentImageIndex);
    if (lightboxTitleText) lightboxTitleText.textContent = item.title;
    if (lightboxFullscreen) lightboxFullscreen.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    isLightboxOpen = false;
    if (lightboxFullscreen) lightboxFullscreen.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightbox(index) {
    currentImageIndex = index;
    if (lightboxMainImg) lightboxMainImg.src = imgs[index];
    if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${imgs.length}`;

    if (lightboxThumbs) {
      lightboxThumbs.innerHTML = imgs.map((src, i) => `
        <div class="lightbox-thumb-item ${i === index ? 'active' : ''}" onclick="window.selectLightboxImg(${i})">
          <img src="${src}" alt="Önizleme ${i + 1}" loading="lazy">
        </div>
      `).join('');

      const activeThumb = lightboxThumbs.children[index];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    updateGallery(index);
  }

  window.selectLightboxImg = function(index) {
    updateLightbox(index);
  };

  function nextLightbox() {
    let nextIdx = currentImageIndex + 1;
    if (nextIdx >= imgs.length) nextIdx = 0;
    updateLightbox(nextIdx);
  }

  function prevLightbox() {
    let prevIdx = currentImageIndex - 1;
    if (prevIdx < 0) prevIdx = imgs.length - 1;
    updateLightbox(prevIdx);
  }

  if (detailMainImg) detailMainImg.addEventListener('click', () => openLightbox(currentImageIndex));
  if (btnFullscreenTrigger) btnFullscreenTrigger.addEventListener('click', () => openLightbox(currentImageIndex));
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', prevLightbox);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', nextLightbox);

  document.addEventListener('keydown', (e) => {
    if (!isLightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });

  // 7. Hızlı Çipler & Özellikler Izgarası
  const detailQuickChips = document.getElementById('detail-quick-chips');
  if (detailQuickChips) {
    const chips = [];
    if (item.m2) chips.push({ icon: '📐', text: item.m2 });
    if (item.rooms) chips.push({ icon: '🚪', text: item.rooms });
    if (item.floor) chips.push({ icon: '🏢', text: `${item.floor}. Kat` });
    chips.push({ icon: '🏷️', text: item.status });
    chips.push({ icon: '📍', text: item.district || 'Turgutlu' });

    detailQuickChips.innerHTML = chips.map(c => `
      <div class="quick-chip-box">
        <span>${c.icon}</span>
        <span>${escapeHtml(c.text)}</span>
      </div>
    `).join('');
  }

  const detailSpecsGrid = document.getElementById('detail-specs-grid');
  if (detailSpecsGrid) {
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

    detailSpecsGrid.innerHTML = specs.map(s => `
      <div class="spec-box">
        <span class="spec-label">${escapeHtml(s.label)}</span>
        <span class="spec-val">${escapeHtml(String(s.val))}</span>
      </div>
    `).join('');
  }

  // Açıklama
  const detailDesc = document.getElementById('detail-desc');
  if (detailDesc) {
    detailDesc.textContent = item.description || 'Detaylı bilgi için danışmanımızla iletişime geçiniz.';
  }

  // Özellikler listesi
  const detailFeaturesList = document.getElementById('detail-features-list');
  const boxFeatures = document.getElementById('box-features');
  if (item.features && item.features.length > 0 && detailFeaturesList) {
    detailFeaturesList.innerHTML = item.features.map(f => `
      <span class="modal-feature-pill">${escapeHtml(f)}</span>
    `).join('');
  } else if (boxFeatures) {
    boxFeatures.style.display = 'none';
  }

  // 8. WhatsApp ve İletişim Butonları
  const waMsg = encodeURIComponent(`Merhaba Muzaffer Bey, web sitenizdeki "${item.title}" (İlan No: ${item.id}) hakkında detaylı bilgi ve randevu almak istiyorum.`);
  const waUrl = `https://wa.me/${company.whatsapp || '905544613618'}?text=${waMsg}`;

  const topWaBtn = document.getElementById('top-wa-btn');
  const sideWaBtn = document.getElementById('side-wa-btn');
  const navWaBtn = document.getElementById('nav-wa-btn');
  const floatWaLink = document.getElementById('float-wa-link');

  if (topWaBtn) topWaBtn.href = waUrl;
  if (sideWaBtn) sideWaBtn.href = waUrl;
  if (navWaBtn) navWaBtn.href = waUrl;
  if (floatWaLink) floatWaLink.href = waUrl;

  // Paylaşım
  const btnSharePage = document.getElementById('btn-share-page');
  const toastEl = document.getElementById('toast');

  if (btnSharePage) {
    btnSharePage.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: item.title,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('İlan bağlantısı kopyalandı!');
        });
      }
    });
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2500);
  }

  // 9. Benzer İlanlar (Aynı Kategori veya Mahalleden 3 İlan)
  const similarGrid = document.getElementById('similar-listings-grid');
  if (similarGrid) {
    const similar = listings
      .filter(i => String(i.id) !== String(item.id))
      .slice(0, 3);

    similarGrid.innerHTML = similar.map(s => {
      const isS = s.status === 'Satılık';
      const bClass = isS ? 'badge-satilik' : 'badge-kiralik';
      const imgC = s.images && s.images.length ? s.images.length : 1;

      return `
        <article class="listing-card">
          <a href="ilan.html?id=${s.id}" class="card-img-wrap">
            <img class="card-img" src="${s.mainImage || 'assets/icons/favicon.svg'}" alt="${escapeHtml(s.title)}" loading="lazy">
            <span class="card-badge-status ${bClass}">${s.status}</span>
            <span class="card-badge-type">${s.category}</span>
            <span class="card-badge-photos">📷 ${imgC}</span>
          </a>
          <div class="card-body">
            <div class="card-price">${s.price}</div>
            <h3 class="card-title">
              <a href="ilan.html?id=${s.id}">${escapeHtml(s.title)}</a>
            </h3>
            <div class="card-location">📍 ${escapeHtml(s.locationDisplay)}</div>
            <div class="card-footer">
              <a href="ilan.html?id=${s.id}" class="btn btn-outline btn-sm" style="flex:1;">İlanı İncele</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Başlat
  updateGallery(0);
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
