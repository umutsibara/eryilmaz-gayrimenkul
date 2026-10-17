/**
 * Eryılmaz Gayrimenkul - Ana Sayfa Mantığı (index.html)
 * Filtreleme, arama ve doğrudan ilan detay sayfasına (ilan.html?id=...) yönlendirme.
 */

document.addEventListener('DOMContentLoaded', () => {
  const listings = window.LISTINGS_DATA || [];
  const company = window.COMPANY_DATA || {};

  // Durum Yönetimi
  const state = {
    status: 'all',          // 'all', 'Satılık', 'Kiralık'
    category: 'all',        // 'all', 'Daire / Konut', 'Arsa & Bahçe', 'İşyeri & Ticari', 'Tarla & Arazi'
    neighborhood: 'all',    // Mahalle filtresi
    searchQuery: '',        // Arama metni
    sortBy: 'default'       // 'default', 'price-asc', 'price-desc', 'id-desc'
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

  // 1. Mahalle Seçeneklerini Doldur
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

    // Vitrin ilanını (3D Tour) her zaman en başta tut veya sıralamaya uygula
    if (state.sortBy === 'price-asc') {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (state.sortBy === 'price-desc') {
      result.sort((a, b) => b.priceNum - a.priceNum);
    } else if (state.sortBy === 'id-desc') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    } else {
      // Önerilen sıralamada featured (3D) olan en başta kalsın
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }

  // 4. Kartları Ekrana Bas (Her kart doğrudan ilan.html?id=... sayfasına gider)
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
      const detailUrl = `ilan.html?id=${item.id}`;

      return `
        <article class="listing-card ${item.isFeatured ? 'featured-card' : ''}" data-id="${item.id}">
          <a href="${detailUrl}" class="card-img-wrap">
            <img class="card-img" src="${mainImg}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='assets/icons/favicon.svg'">
            <span class="card-badge-status ${badgeClass}">${item.status}</span>
            <span class="card-badge-type">${item.category}</span>
            ${item.has3DTour ? `
              <span class="badge-3d-pulsing" style="position: absolute; bottom: 0.75rem; left: 0.75rem; z-index: 2;">
                🏡 3D Sanal Tur
              </span>
            ` : ''}
            <span class="card-badge-photos">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              ${imageCount}
            </span>
          </a>
          <div class="card-body">
            <div class="card-price">${item.price}</div>
            <h3 class="card-title">
              <a href="${detailUrl}" title="${escapeHtml(item.title)}">
                ${escapeHtml(item.title)}
              </a>
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
              <a href="${detailUrl}" class="btn btn-outline btn-sm">
                ${item.has3DTour ? '🏡 3D Tur & İncele' : 'İlanı İncele'}
              </a>
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

  // 5. Filtre Olay Dinleyicileri
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
});
