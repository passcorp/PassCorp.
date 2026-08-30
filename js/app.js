// PASS CORP. - Master JavaScript Application
// Precision | Assurance | Safety | Solution

document.addEventListener('DOMContentLoaded', () => {
  // State
  const brands = window.trustedBrands || [];
  const categories = window.safetyCategories || [];
  const allProducts = window.catalogProducts || [];
  let currentCategory = 'all';
  let currentBrand = 'all';
  let searchQuery = '';
  let currentSort = 'featured';

  // DOM Elements
  const brandsGrid = document.getElementById('brands-grid');
  const categoriesGrid = document.getElementById('categories-grid');
  const productGrid = document.getElementById('product-grid');
  const productCountEl = document.getElementById('product-count');
  const searchInput = document.getElementById('search-input');
  const categoryPills = document.querySelectorAll('.category-pill');
  const sortSelect = document.getElementById('sort-select');
  const brandSelect = document.getElementById('brand-select');
  const quoteProductSelect = document.getElementById('quote-product-select');
  
  // Popup Modal Elements
  const quickViewModal = document.getElementById('quick-view-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalContainer = document.getElementById('modal-container');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // FAQ Accordion
  const faqContainer = document.getElementById('faq-container');

  // Quote Form
  const quoteForm = document.getElementById('quote-form');

  // Mobile Menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

  // 1. Render Trusted Brands Grid
  function renderBrands() {
    if (!brandsGrid) return;

    brandsGrid.innerHTML = brands.map(b => `
      <div 
        onclick="filterByBrand('${b.name}')"
        class="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-red-500/50 transition-all flex flex-col items-center justify-center text-center group cursor-pointer hover:-translate-y-1 shadow-md"
      >
        <div class="h-10 flex items-center justify-center font-black tracking-tight text-white text-base group-hover:text-red-400 transition-colors font-mono">
          ${b.logoText}
        </div>
        <div class="text-[11px] font-bold text-slate-300 mt-1">${b.name}</div>
        <div class="text-[10px] text-slate-300 leading-tight mt-0.5 line-clamp-1">${b.specialty}</div>
      </div>
    `).join('');

    // Populate brand select dropdown
    if (brandSelect) {
      brandSelect.innerHTML = `
        <option value="all">All Brands (${brands.length}+ Makes)</option>
        ${brands.map(b => `<option value="${b.name}">${b.name} - ${b.tag}</option>`).join('')}
      `;
    }
  }

  // 2. Render Categories Grid
  function renderCategories() {
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = categories.map((cat) => {
      const catProductCount = allProducts.filter(p => p.category === cat.id).length;
      const standardsChips = cat.standards.map(s => 
        `<span class="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-red-950/60 text-red-300 border border-red-800/40">${s}</span>`
      ).join('');

      return `
        <div 
          onclick="openCategoryPopup('${cat.id}')"
          class="glass-card rounded-2xl p-6 border border-slate-800 hover:border-red-500/60 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <!-- Subtle Accent Glow -->
          <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-red-600/10 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <div class="w-12 h-12 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <i data-lucide="${cat.icon}" class="w-6 h-6"></i>
              </div>
              <span class="text-xs font-mono font-semibold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                ${catProductCount}+ Models
              </span>
            </div>

            <h3 class="text-lg font-extrabold text-white group-hover:text-red-400 transition-colors mb-2 flex items-center gap-1.5">
              <span>${cat.name}</span>
              <i data-lucide="arrow-up-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400"></i>
            </h3>

            <p class="text-slate-400 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
              ${cat.tagline}
            </p>
          </div>

          <div>
            <div class="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 mb-4">
              ${standardsChips}
            </div>

            <button class="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-red-600 text-slate-200 hover:text-white border border-slate-800 hover:border-red-500 transition-all flex items-center justify-center gap-2">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>View ${cat.name}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  // 3. Render Product Catalog Grid
  function renderProducts() {
    if (!productGrid) return;

    let filtered = allProducts.filter(product => {
      const matchesCat = (currentCategory === 'all') || (product.category === currentCategory);
      const matchesBrand = (currentBrand === 'all') || (product.brand === currentBrand) || (product.name.toLowerCase().includes(currentBrand.toLowerCase()));
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.tagline.toLowerCase().includes(q) ||
        product.categoryName.toLowerCase().includes(q) ||
        product.badges.some(b => b.toLowerCase().includes(q));

      return matchesCat && matchesBrand && matchesSearch;
    });

    // Sorting
    if (currentSort === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (currentSort === 'brand') {
      filtered.sort((a, b) => a.brand.localeCompare(b.brand));
    } else if (currentSort === 'category') {
      filtered.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    } else {
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    // Update Counter
    if (productCountEl) {
      productCountEl.textContent = `Showing ${filtered.length} of ${allProducts.length} models`;
    }

    // Empty state
    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <i data-lucide="search-x" class="w-8 h-8 text-red-400"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-200 mb-2">No matching safety products found</h3>
          <p class="text-slate-400 max-w-md mx-auto mb-6 text-sm">Try clearing filters or search terms to browse the complete PASS CORP. catalogue.</p>
          <button id="reset-filter-btn" class="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition duration-200 cursor-pointer">
            Reset All Filters
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
        currentCategory = 'all';
        currentBrand = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (brandSelect) brandSelect.value = 'all';
        categoryPills.forEach(p => p.classList.toggle('active', p.dataset.category === 'all'));
        renderProducts();
      });
      return;
    }

    // Render cards
    productGrid.innerHTML = filtered.map(product => {
      const statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>${product.status}</span>`;

      const badgesHtml = product.badges.map(b => 
        `<span class="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-900/90 text-slate-300 border border-slate-700/60">${b}</span>`
      ).join('');

      const specEntries = Object.entries(product.specs).slice(0, 3);
      const specHtml = specEntries.map(([key, val]) => `
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
          <span class="text-slate-400">${key}</span>
          <span class="font-mono font-medium text-slate-200 text-right truncate max-w-[150px]">${val}</span>
        </div>
      `).join('');

      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800 hover:border-red-500/50">
          <!-- Image Header -->
          <div class="relative aspect-[16/10] overflow-hidden bg-slate-900 cursor-pointer" onclick="openProductPopup('${product.id}')">
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
            
            <div class="absolute top-3 left-3 flex gap-2">
              ${statusBadge}
            </div>

            <div class="absolute top-3 right-3 flex gap-1">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-950/90 text-blue-300 border border-blue-800/60">
                ${product.brand}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-600 text-white shadow-md">
                ${product.sku}
              </span>
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
              ${badgesHtml}
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">
                <span>${product.categoryName}</span>
                <span class="text-slate-400 font-mono text-[10px]">${product.brand}</span>
              </div>
              <h3 
                onclick="openProductPopup('${product.id}')"
                class="text-base font-extrabold text-white group-hover:text-red-400 transition-colors line-clamp-1 mb-1.5 cursor-pointer"
              >
                ${product.name}
              </h3>
              <p class="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">
                ${product.tagline}
              </p>

              <!-- Specs Highlights -->
              <div class="bg-slate-900/80 rounded-xl p-2.5 mb-4 border border-slate-800/80">
                ${specHtml}
              </div>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <button 
                onclick="openProductPopup('${product.id}')"
                class="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="eye" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Details</span>
              </button>
              
              <button 
                onclick="initiateQuote('${product.id}')"
                class="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>Get Quote</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  // 4. Category Details Popup Window
  window.openCategoryPopup = function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !quickViewModal) return;

    const catProducts = allProducts.filter(p => p.category === categoryId);

    const productsListHtml = catProducts.map(p => `
      <div class="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 hover:border-red-500/40">
        <div class="w-full sm:w-28 h-24 rounded-lg overflow-hidden bg-slate-950 shrink-0">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 text-center sm:text-left">
          <div class="flex items-center justify-center sm:justify-between gap-2 mb-1">
            <h4 class="text-sm font-bold text-white">${p.name}</h4>
            <div class="flex gap-1">
              <span class="font-mono text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">${p.brand}</span>
              <span class="font-mono text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">${p.sku}</span>
            </div>
          </div>
          <p class="text-slate-400 text-xs line-clamp-2 mb-2">${p.tagline}</p>
          <div class="flex flex-wrap gap-1 justify-center sm:justify-start">
            ${p.badges.map(b => `<span class="px-2 py-0.5 text-[10px] rounded bg-slate-900 text-slate-300 border border-slate-800">${b}</span>`).join('')}
          </div>
        </div>
        <div class="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
          <button 
            onclick="closePopup(); openProductPopup('${p.id}')"
            class="flex-1 sm:flex-initial py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Full Specs
          </button>
          <button 
            onclick="closePopup(); initiateQuote('${p.id}')"
            class="flex-1 sm:flex-initial py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-md transition"
          >
            Get Quote
          </button>
        </div>
      </div>
    `).join('');

    modalBody.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
              <i data-lucide="${category.icon}" class="w-7 h-7"></i>
            </div>
            <div>
              <div class="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">PASS CORP. PRODUCT CATEGORY</div>
              <h2 class="text-2xl sm:text-3xl font-black text-white">${category.name}</h2>
              <p class="text-slate-300 text-xs sm:text-sm mt-1">${category.tagline}</p>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-slate-300">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
            <span class="font-semibold">Compliance Standards:</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${category.standards.map(s => `<span class="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-red-600/20 text-red-300 border border-red-500/30">${s}</span>`).join('')}
          </div>
        </div>

        <p class="text-slate-300 text-sm leading-relaxed mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
          ${category.description}
        </p>

        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <i data-lucide="boxes" class="w-4 h-4 text-red-400"></i>
          <span>Available Models in ${category.name} (${catProducts.length})</span>
        </h3>

        <div class="space-y-3 mb-6 max-h-96 overflow-y-auto pr-1">
          ${productsListHtml}
        </div>

        <div class="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <a 
            href="https://wa.me/919767672497?text=${encodeURIComponent('Hello PASS CORP, I need quotation for ' + category.name + ' safety equipment.')}"
            target="_blank"
            class="w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 shadow-lg"
          >
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>Chat on WhatsApp for ${category.name}</span>
          </a>

          <div class="flex gap-2 w-full sm:w-auto">
            <button 
              onclick="closePopup(); filterByCategory('${category.id}')"
              class="flex-1 sm:flex-initial py-3 px-5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              Filter in Catalog
            </button>
            <button 
              onclick="closePopup()"
              class="py-3 px-5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    quickViewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      modalBackdrop.classList.remove('opacity-0');
      modalContainer.classList.remove('scale-95', 'opacity-0');
    }, 10);

    if (window.lucide) lucide.createIcons();
  };

  // 5. Single Product Details Popup Window
  window.openProductPopup = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !quickViewModal) return;

    const specsRows = Object.entries(product.specs).map(([key, val]) => `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition">
        <td class="py-3 px-4 text-xs font-medium text-slate-400 w-1/3">${key}</td>
        <td class="py-3 px-4 text-xs font-mono font-semibold text-slate-100">${val}</td>
      </tr>
    `).join('');

    const badgesHtml = product.badges.map(b => 
      `<span class="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-600/20 text-red-300 border border-red-500/30">${b}</span>`
    ).join('');

    const whatsappUrl = `https://wa.me/919767672497?text=${encodeURIComponent('Hello PASS CORP, I need formal wholesale quotation for: ' + product.name + ' (' + product.sku + ') Make: ' + product.brand)}`;

    modalBody.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-5 flex flex-col gap-4">
          <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
            <img id="modal-main-img" src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" />
            <div class="absolute top-3 left-3">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>${product.status}
              </span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div class="flex items-center gap-2 text-white font-bold">
              <i data-lucide="map-pin" class="w-4 h-4 text-red-400"></i>
              <span>Supplied from Chikhali, PCMC, Pune</span>
            </div>
            <p class="text-slate-400">Authorized industrial supply partner for ${product.brand}. Test certificates and GST invoice included.</p>
          </div>
        </div>

        <div class="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs font-bold text-red-400 uppercase tracking-wider">${product.categoryName}</span>
              <div class="flex gap-1.5">
                <span class="font-mono text-xs text-blue-300 bg-blue-950 border border-blue-800 px-2.5 py-1 rounded-md font-bold">${product.brand}</span>
                <span class="font-mono text-xs text-white bg-red-600 px-2.5 py-1 rounded-md font-bold">SKU: ${product.sku}</span>
              </div>
            </div>

            <h2 class="text-2xl lg:text-3xl font-black text-white mb-2">${product.name}</h2>
            <p class="text-xs font-semibold text-slate-300 mb-3">Make / Brand: <span class="text-red-400 font-bold">${product.brand}</span></p>
            
            <div class="flex flex-wrap gap-2 mb-4">
              ${badgesHtml}
            </div>

            <p class="text-slate-300 text-sm leading-relaxed mb-5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              ${product.description}
            </p>

            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <i data-lucide="clipboard-list" class="w-4 h-4 text-red-400"></i>
              <span>Official Catalogue Specifications</span>
            </h4>

            <div class="rounded-xl overflow-hidden border border-slate-800 mb-6 bg-slate-950/80 max-h-60 overflow-y-auto">
              <table class="w-full text-left border-collapse">
                <tbody>
                  ${specsRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
            <a 
              href="${whatsappUrl}" 
              target="_blank"
              class="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg flex items-center justify-center gap-2"
            >
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>WhatsApp Inquiry</span>
            </a>

            <button 
              onclick="closePopup(); initiateQuote('${product.id}')"
              class="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              <span>Request Formal Quote</span>
            </button>

            <button 
              onclick="closePopup()"
              class="py-3.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    quickViewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      modalBackdrop.classList.remove('opacity-0');
      modalContainer.classList.remove('scale-95', 'opacity-0');
    }, 10);

    if (window.lucide) lucide.createIcons();
  };

  window.closePopup = function() {
    if (!quickViewModal) return;
    modalBackdrop.classList.add('opacity-0');
    modalContainer.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      quickViewModal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 200);
  };

  modalCloseBtn?.addEventListener('click', closePopup);
  modalBackdrop?.addEventListener('click', closePopup);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !quickViewModal?.classList.contains('hidden')) {
      closePopup();
    }
  });

  // 6. Filter helper from categories / brands
  window.filterByCategory = function(catId) {
    currentCategory = catId;
    categoryPills.forEach(p => p.classList.toggle('active', p.dataset.category === catId));
    renderProducts();
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.filterByBrand = function(brandName) {
    currentBrand = brandName;
    if (brandSelect) brandSelect.value = brandName;
    renderProducts();
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 7. Category Pill Clicks
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.category || 'all';
      renderProducts();
    });
  });

  // 8. Live Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  // 9. Sort & Brand Selectors
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  if (brandSelect) {
    brandSelect.addEventListener('change', (e) => {
      currentBrand = e.target.value;
      renderProducts();
    });
  }

  // 10. Populate Quote Dropdown
  function populateProductDropdown() {
    if (!quoteProductSelect) return;
    quoteProductSelect.innerHTML = `
      <option value="">-- Select Safety Equipment / Brand (Optional) --</option>
      <option value="full-ppe-setup">Complete Plant PPE & Safety Setup</option>
      ${allProducts.map(p => `<option value="${p.sku}">${p.name} (${p.brand}) [${p.sku}]</option>`).join('')}
    `;
  }

  // 11. Quote Trigger
  window.initiateQuote = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product && quoteProductSelect) {
      quoteProductSelect.value = product.sku;
    }

    const quoteSection = document.getElementById('quote-section');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const quoteCard = document.getElementById('quote-card');
        if (quoteCard) {
          quoteCard.classList.add('ring-2', 'ring-red-500');
          setTimeout(() => quoteCard.classList.remove('ring-2', 'ring-red-500'), 1800);
        }
      }, 500);
    }
  };

  // 12. Handle Quote Form Submit
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Transmitting to PASS CORP. Sales Desk...</span>
      `;

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        quoteForm.reset();
        
        showToast(
          'Quote Request Received at PASS CORP.!',
          'Our sales team in PCMC Pune will review your specifications and send a formal commercial quotation within 2 business hours.',
          'success'
        );
      }, 1200);
    });
  }

  // 13. Toast System
  window.showToast = function(title, message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast max-w-sm w-full p-4 rounded-2xl bg-[#0a192f] border border-red-500/50 shadow-2xl flex items-start gap-3 text-sm';
    
    const icon = type === 'success' 
      ? '<div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><i data-lucide="check-circle-2" class="w-5 h-5"></i></div>'
      : '<div class="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0"><i data-lucide="info" class="w-5 h-5"></i></div>';

    toast.innerHTML = `
      ${icon}
      <div class="flex-1">
        <h5 class="font-bold text-white mb-0.5">${title}</h5>
        <p class="text-slate-300 text-xs leading-relaxed">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-1 cursor-pointer">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  // 14. FAQs Accordion
  function renderFaqs() {
    if (!faqContainer) return;
    const faqs = window.catalogFaqs || [];

    faqContainer.innerHTML = faqs.map((faq, index) => `
      <div class="faq-item glass-panel rounded-2xl p-5 border border-slate-800 hover:border-red-500/40 transition cursor-pointer" onclick="toggleFaq(${index})">
        <div class="flex items-center justify-between gap-4">
          <h4 class="text-base font-bold text-white flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs flex items-center justify-center font-mono">0${index + 1}</span>
            <span>${faq.q}</span>
          </h4>
          <i data-lucide="chevron-down" class="faq-icon w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0"></i>
        </div>
        <div class="faq-answer text-slate-300 text-sm leading-relaxed">
          ${faq.a}
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  window.toggleFaq = function(index) {
    const items = faqContainer.querySelectorAll('.faq-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.toggle('active');
      } else {
        item.classList.remove('active');
      }
    });
  };

  // 15. Testimonials Rendering
  function renderTestimonials() {
    const container = document.getElementById('testimonials-grid');
    if (!container) return;
    const testimonials = window.catalogTestimonials || [];

    container.innerHTML = testimonials.map(item => `
      <div class="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
        <div>
          <div class="flex text-amber-400 gap-1 mb-4">
            ${Array(item.rating).fill('<i data-lucide="star" class="w-4 h-4 fill-amber-400"></i>').join('')}
          </div>
          <p class="text-slate-300 text-xs sm:text-sm italic mb-6 leading-relaxed">
            "${item.quote}"
          </p>
        </div>

        <div class="flex items-center gap-3.5 pt-4 border-t border-slate-800/80">
          <img src="${item.avatar}" alt="${item.author}" class="w-11 h-11 rounded-full object-cover border border-red-500/40" />
          <div>
            <h5 class="text-sm font-bold text-white">${item.author}</h5>
            <p class="text-xs text-red-400 font-semibold">${item.role}</p>
            <p class="text-[11px] text-slate-400">${item.company}</p>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  // 16. Mobile Menu Toggle
  if (mobileMenuBtn && mobileMenu) {
    const toggleMenu = () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        mobileMenuOverlay?.classList.add('hidden');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.remove('hidden');
        mobileMenuOverlay?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);
    mobileMenuOverlay?.addEventListener('click', toggleMenu);
    
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenuOverlay?.classList.add('hidden');
        document.body.style.overflow = '';
      });
    });
  }

  // Initial Runs
  renderBrands();
  renderCategories();
  renderProducts();
  populateProductDropdown();
  renderFaqs();
  renderTestimonials();
});
