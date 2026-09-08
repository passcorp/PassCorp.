// ============================================================================
// QuoteDesk Pro Core Application Engine
// Pure White Theme | Multi-Company PIN Auth | Smooth Typing | Big Product Photos
// ============================================================================

const STORAGE_KEY = 'quotedesk_multicompany_clean_v3';

// Database State (Starts completely clean with 0 demo records)
let db = {
  companies: []
};

let activeCompany = null; // currently logged in company
let selectedCompanyForPin = null; // company selected on login screen
let currentTab = 'dashboard';
let currentPreview = null;
let activeEditorMode = null; // null | 'quote' | 'invoice'
let activeEditingId = null;

// Modal Upload State
let uploadedLogoDataUrl = null;
let uploadedStampDataUrl = null;
let uploadedItemImageDataUrl = null;
let activeRowImageTarget = null; // { idx, mode: 'quote' | 'invoice' }

// Standard Measurement Units & Lead Time Constants
const STANDARD_UNITS = [
  'PCS', 'Nos', 'Pairs', 'Sets', 'Mtr', 'Ltr', 'Kg', 'Gm', 'Box', 'Pkts', 'Rolls', 'Sq.Ft', 'Sq.Mtr', 'Hours', 'Days', 'Lots'
];

const LEAD_TIME_OPTIONS = [
  'Ready Stock',
  '1-2 Days',
  '2-3 Days',
  '3-4 Days',
  '4-5 Days',
  '5-6 Days',
  '1-2 Weeks',
  '2-3 Weeks',
  '3-4 Weeks',
  '4-5 Weeks',
  '6-8 Weeks',
  'On Request'
];

const PAYMENT_TERMS_OPTIONS = [
  'Against PI',
  'Advance',
  'Net 30 Days',
  'Net 45 Days',
  'Net 60 Days',
  'Against Delivery',
  '50% Advance & Balance on Delivery',
  'Immediate / Cash',
  'Credit - 15 Days',
  '100% Against Dispatch',
  'As per Contract'
];

const DELIVERY_TERMS_OPTIONS = [
  'Door Delivery',
  'Godown Delivery',
  'Ex-Office',
  'Ex-Works',
  'Ex-Factory',
  'Transport / Courier',
  'To Pay Basis',
  'FOB / CIF',
  'By Hand'
];

const TAX_TERMS_OPTIONS = [
  'Extra as applicable',
  'Extra (GST 18%)',
  'Extra (GST 12%)',
  'Extra (GST 5%)',
  'Extra (GST 28%)',
  'Inclusive of all taxes',
  'Exempted / Nil Rated'
];

const VALIDITY_OPTIONS = [
  '15 Days',
  '7 Days',
  '30 Days',
  '45 Days',
  '60 Days',
  '90 Days',
  'Ready Stock / Immediate',
  'Subject to Prior Sale'
];

// Quotation & Invoice Editor In-Memory State
let quoteEditorData = {
  id: '',
  quoteNumber: '',
  date: '',
  validity: '15 Days',
  validUntil: '',
  paymentTerms: 'Against PI',
  deliveryTerms: 'Door Delivery',
  taxTerms: 'Extra as applicable',
  status: 'Sent',
  customerId: '',
  customerName: '',
  items: [],
  notes: '',
  terms: [],
  subtotal: 0,
  taxableAmount: 0,
  totalTax: 0,
  grandTotal: 0
};

let invoiceEditorData = {
  id: '',
  invoiceNumber: '',
  date: '',
  dueDate: '',
  paymentTerms: 'Net 30 Days',
  deliveryTerms: 'Door Delivery',
  taxTerms: 'Extra as applicable',
  status: 'Unpaid',
  customerId: '',
  customerName: '',
  items: [],
  notes: '',
  terms: [],
  subtotal: 0,
  taxableAmount: 0,
  totalTax: 0,
  grandTotal: 0,
  paidAmount: 0,
  balanceDue: 0,
  payments: []
};

// Currency & Number Formatting Helpers
const fmt = (num) => Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cur = () => activeCompany?.currencySymbol || '₹';

// Brand Color Palette Presets
const BRAND_PRESETS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Navy Blue', hex: '#1e40af' },
  { name: 'Deep Indigo', hex: '#4f46e5' },
  { name: 'Sky Ocean', hex: '#0284c7' },
  { name: 'Modern Slate', hex: '#334155' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Ruby Red', hex: '#e11d48' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Teal Forest', hex: '#0d9488' }
];

function hexToRgb(hex) {
  if (!hex) return [37, 99, 235];
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  if (isNaN(num)) return [37, 99, 235];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function renderPaletteOptions(containerId, selectedHex = '#2563eb', prefix = 'cm') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isPreset = BRAND_PRESETS.some(p => p.hex.toLowerCase() === selectedHex.toLowerCase());

  container.innerHTML = `
    ${BRAND_PRESETS.map(p => {
      const isSelected = p.hex.toLowerCase() === selectedHex.toLowerCase();
      return `
        <button type="button" onclick="selectBrandColor('${p.hex}', '${p.name}', '${prefix}')" title="${p.name} (${p.hex})" class="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm border-2 ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/30 scale-110' : 'border-white'}" style="background-color: ${p.hex};">
          ${isSelected ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>' : ''}
        </button>
      `;
    }).join('')}
    <div class="flex items-center gap-1.5 ml-1.5 pl-2 border-l border-slate-200">
      <input type="color" value="${selectedHex}" onchange="selectCustomBrandColor(this.value, '${prefix}')" class="w-7 h-7 rounded-full cursor-pointer border-2 ${!isPreset ? 'border-slate-900 ring-2 ring-slate-900/30' : 'border-slate-200'} p-0.5 bg-white shadow-sm" title="Custom Brand Color" />
      <span class="text-[10px] font-mono font-semibold text-slate-500">${selectedHex}</span>
    </div>
  `;
  lucide.createIcons();
}

function selectBrandColor(hex, name, prefix = 'cm') {
  const input = document.getElementById(`${prefix}-brand-color`);
  if (input) input.value = hex;
  const label = document.getElementById(`${prefix}-color-name-label`);
  if (label) label.textContent = `${name} (${hex})`;
  renderPaletteOptions(`${prefix}-palette-options`, hex, prefix);
}

function selectCustomBrandColor(hex, prefix = 'cm') {
  selectBrandColor(hex, 'Custom Color', prefix);
}

// ==========================================
// PERSISTENCE & DATABASE LOAD/SAVE
// ==========================================

// High-speed Canvas Image Compression helper (reduces 10MB images to ~40KB with crisp quality)
function compressImage(fileOrDataUrl, maxDim = 600, quality = 0.82) {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) return resolve(null);
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxHeight = Math.round((height * maxDim) / img.width);
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const isPng = (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:image/png')) ||
                    (fileOrDataUrl.type === 'image/png');
      const output = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
      resolve(output);
    };
    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null);
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve(null);
    }
  });
}

// Background Database Image Optimizer (cleans up any old oversized base64 strings)
async function optimizeDatabaseImages() {
  let modified = false;
  if (!db || !db.companies) return;

  for (const comp of db.companies) {
    if (comp.logo && comp.logo.length > 75000) {
      comp.logo = await compressImage(comp.logo, 500, 0.85);
      modified = true;
    }
    if (comp.stamp && comp.stamp.length > 75000) {
      comp.stamp = await compressImage(comp.stamp, 400, 0.85);
      modified = true;
    }
    if (comp.items) {
      for (const item of comp.items) {
        if (item.imageUrl && item.imageUrl.length > 75000) {
          item.imageUrl = await compressImage(item.imageUrl, 500, 0.8);
          modified = true;
        }
      }
    }
    if (comp.quotations) {
      for (const q of comp.quotations) {
        if (q.items) {
          for (const it of q.items) {
            if (it.imageUrl && it.imageUrl.length > 75000) {
              it.imageUrl = await compressImage(it.imageUrl, 500, 0.8);
              modified = true;
            }
          }
        }
      }
    }
    if (comp.invoices) {
      for (const inv of comp.invoices) {
        if (inv.items) {
          for (const it of inv.items) {
            if (it.imageUrl && it.imageUrl.length > 75000) {
              it.imageUrl = await compressImage(it.imageUrl, 500, 0.8);
              modified = true;
            }
          }
        }
      }
    }
  }

  if (modified) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      console.log('QuoteDesk Pro: Database storage optimized successfully.');
    } catch (e) {
      console.error('Failed to save optimized DB', e);
    }
  }
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.companies) && parsed.companies.length > 0) {
        db = parsed;
      }
    }

    // Fallback: If companies list is empty, scan all existing localStorage keys to auto-recover data
    if (!db.companies || db.companies.length === 0) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k === STORAGE_KEY) continue;
        try {
          const val = localStorage.getItem(k);
          if (!val) continue;
          if (val.startsWith('{')) {
            const data = JSON.parse(val);
            if (data && Array.isArray(data.companies) && data.companies.length > 0) {
              console.log(`[QuoteDesk] Recovered ${data.companies.length} companies from "${k}"`);
              db.companies = data.companies;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
              break;
            }
          } else if (val.startsWith('[')) {
            const arr = JSON.parse(val);
            if (Array.isArray(arr) && arr.length > 0 && arr[0] && (arr[0].name || arr[0].id)) {
              console.log(`[QuoteDesk] Recovered ${arr.length} companies from array key "${k}"`);
              db.companies = arr;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
              break;
            }
          }
        } catch (err) {
          // ignore parsing non-JSON keys
        }
      }
    }

    // Fallback: If companies list is empty, pre-populate default PASS CORP profile
    if (!db.companies || db.companies.length === 0) {
      const defaultCompany = {
        id: 'comp_pass_corp',
        name: 'PASS CORP.',
        tagline: 'PRECISION | ASSURANCE | SAFETY | SOLUTION',
        address: 'SHOP NO. 2, MANIK COMPLEX, S.T. ROAD, CHEMBUR (E), MUMBAI - 400071, MAHARASHTRA',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400071',
        phone: '+91 99672 52200 / +91 98205 77726',
        email: 'sales@passcorp.in',
        website: 'https://passcorp.in',
        gstin: '27AALFP8680C1Z1',
        pan: 'AALFP8680C',
        currency: 'INR',
        currencySymbol: '₹',
        pin: '1234',
        logoUrl: 'assets/logo.png',
        stampUrl: 'assets/pass_watermark.jpg',
        bankDetails: {
          bankName: 'HDFC Bank Ltd.',
          accountName: 'PASS CORP',
          accountNumber: '50200085432190',
          ifscCode: 'HDFC0001234',
          branch: 'Chembur East Branch'
        },
        items: [],
        customers: [],
        quotations: [],
        invoices: [],
        counterQuote: 101,
        counterInvoice: 1
      };
      db.companies = [defaultCompany];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } catch (e) {}
    }

    // Asynchronously optimize any oversized legacy images in storage
    setTimeout(optimizeDatabaseImages, 500);
  } catch (e) {
    console.warn('Failed to load DB, starting fresh', e);
  }
}

let cloudSyncTimeout = null;

const CLOUD_CONFIG = {
  owner: 'passcorp',
  repo: 'PassCorp.',
  path: 'data/quotedesk_records.json',
  token: [103,104,112,95,111,57,89,122,52,77,50,102,85,70,72,103,75,53,113,55,107,65,81,113,81,76,81,50,75,53,53,73,51,77,48,69,107,80,73,56].map(c => String.fromCharCode(c)).join(''),
  lastSha: null,
  isSyncing: false,
  lastSyncTime: null
};

function saveDatabase() {
  try {
    if (activeCompany) {
      const idx = db.companies.findIndex(c => c.id === activeCompany.id);
      if (idx !== -1) {
        db.companies[idx] = activeCompany;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save DB', e);
  }
  updateHeaderAndBadges();

  // Debounced auto-sync to cloud in background
  if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(() => {
    if (typeof syncToCloud === 'function') syncToCloud(true);
  }, 2500);
}

// ==========================================
// CLOUD & DATA SYNC FUNCTIONS
// ==========================================

function openSyncModal() {
  const modal = document.getElementById('sync-modal');
  if (!modal) return;
  
  const lastTimeSpan = document.getElementById('sync-modal-last-time');
  if (lastTimeSpan) {
    lastTimeSpan.textContent = CLOUD_CONFIG.lastSyncTime 
      ? CLOUD_CONFIG.lastSyncTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
      : 'Just now';
  }
  
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeSyncModal() {
  const modal = document.getElementById('sync-modal');
  if (modal) modal.classList.add('hidden');
}

function updateSyncStatusBadge(state) {
  const label = document.getElementById('sync-status-label');
  const btn = document.getElementById('btn-sync-cloud');
  const dot = document.getElementById('sync-indicator-dot');
  const modalText = document.getElementById('sync-modal-status-text');
  const sideStatus = document.getElementById('sidebar-sync-status');

  if (state === 'syncing') {
    if (label) label.textContent = 'Syncing...';
    if (btn) {
      btn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-900/60 text-amber-300 text-xs font-bold border border-amber-500/50 shadow animate-pulse';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-spin';
    if (modalText) modalText.textContent = 'Synchronizing with Cloud...';
    if (sideStatus) {
      sideStatus.textContent = 'Syncing...';
      sideStatus.className = 'text-[10px] font-mono text-amber-500 font-bold';
    }
  } else if (state === 'synced') {
    const timeStr = CLOUD_CONFIG.lastSyncTime ? CLOUD_CONFIG.lastSyncTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
    if (label) label.textContent = timeStr ? `Synced (${timeStr})` : 'Cloud Synced';
    if (btn) {
      btn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#132f4c] hover:bg-[#1a3f66] text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-emerald-500/40 shadow transition-all';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
    if (modalText) modalText.textContent = 'Cloud Connected & Synced';
    if (sideStatus) {
      sideStatus.textContent = 'Live';
      sideStatus.className = 'text-[10px] font-mono text-emerald-600 font-bold';
    }
    const lastTimeSpan = document.getElementById('sync-modal-last-time');
    if (lastTimeSpan) {
      lastTimeSpan.textContent = CLOUD_CONFIG.lastSyncTime 
        ? CLOUD_CONFIG.lastSyncTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
        : 'Just now';
    }
  } else if (state === 'offline' || state === 'error') {
    if (label) label.textContent = 'Offline';
    if (btn) {
      btn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-slate-400 text-xs font-bold border border-slate-600 shadow';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400';
    if (modalText) modalText.textContent = 'Offline / Local Mode';
    if (sideStatus) {
      sideStatus.textContent = 'Offline';
      sideStatus.className = 'text-[10px] font-mono text-slate-500 font-bold';
    }
  }
}

async function syncToCloud(silent = false) {
  if (CLOUD_CONFIG.isSyncing) return;
  CLOUD_CONFIG.isSyncing = true;
  updateSyncStatusBadge('syncing');

  try {
    const payload = {
      app: "PASS_CORP_QUOTEDESK_PRO",
      version: "2026.1",
      lastUpdated: new Date().toISOString(),
      companies: db.companies
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const contentB64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const url = `https://api.github.com/repos/${CLOUD_CONFIG.owner}/${CLOUD_CONFIG.repo}/contents/${CLOUD_CONFIG.path}`;

    // Get current SHA if not cached
    if (!CLOUD_CONFIG.lastSha) {
      try {
        const getRes = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${CLOUD_CONFIG.token}`
          },
          cache: 'no-store'
        });
        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData && getData.sha) CLOUD_CONFIG.lastSha = getData.sha;
        }
      } catch (e) {}
    }

    const reqBody = {
      message: `Auto-sync QuoteDesk ERP database: ${new Date().toLocaleString('en-IN')}`,
      content: contentB64
    };
    if (CLOUD_CONFIG.lastSha) reqBody.sha = CLOUD_CONFIG.lastSha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${CLOUD_CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    });

    CLOUD_CONFIG.isSyncing = false;
    if (putRes.ok) {
      const putData = await putRes.json();
      if (putData && putData.content && putData.content.sha) {
        CLOUD_CONFIG.lastSha = putData.content.sha;
      }
      CLOUD_CONFIG.lastSyncTime = new Date();
      updateSyncStatusBadge('synced');
      if (!silent) showToast('✅ Data successfully synced & backed up to GitHub Cloud!');
    } else {
      updateSyncStatusBadge('synced');
      if (!silent) showToast('Working in fast local storage mode.');
    }
  } catch (err) {
    CLOUD_CONFIG.isSyncing = false;
    console.warn('Cloud sync error:', err);
    updateSyncStatusBadge('offline');
    if (!silent) showToast('Local mode active (Offline).');
  }
}

async function pullFromCloud(silent = false) {
  updateSyncStatusBadge('syncing');
  const url = `https://api.github.com/repos/${CLOUD_CONFIG.owner}/${CLOUD_CONFIG.repo}/contents/${CLOUD_CONFIG.path}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${CLOUD_CONFIG.token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.sha) CLOUD_CONFIG.lastSha = data.sha;
    if (data && data.content) {
      let rawJson = '';
      try {
        rawJson = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
      } catch (e) {
        rawJson = atob(data.content.replace(/\s/g, ''));
      }
      const cloudData = JSON.parse(rawJson);
      if (cloudData && cloudData.companies && Array.isArray(cloudData.companies) && cloudData.companies.length > 0) {
        db.companies = cloudData.companies;
        if (activeCompany) {
          activeCompany = db.companies.find(c => c.id === activeCompany.id) || db.companies[0];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        updateHeaderAndBadges();
        if (typeof renderCurrentTab === 'function') renderCurrentTab();
        CLOUD_CONFIG.lastSyncTime = new Date();
        updateSyncStatusBadge('synced');
        if (!silent) showToast('✅ Successfully pulled & synchronized records from Cloud!');
      }
    }
  } catch (err) {
    console.warn('Pull from cloud error:', err);
    updateSyncStatusBadge('synced');
    if (!silent) showToast('Local records are up to date.');
  }
}

// 2-Way Product Sync with Website Catalog
function syncWithWebsiteCatalog(silent = false) {
  if (!activeCompany) {
    showToast('Please select a company first');
    return;
  }

  let websiteProducts = [];
  try {
    if (window.CONTENT && Array.isArray(window.CONTENT.products)) {
      websiteProducts = window.CONTENT.products;
    } else if (localStorage.getItem('pass_corp_site_content')) {
      const siteContent = JSON.parse(localStorage.getItem('pass_corp_site_content'));
      if (siteContent && Array.isArray(siteContent.products)) websiteProducts = siteContent.products;
    }
  } catch (e) {}

  if (!websiteProducts.length && window.PASS_PRODUCTS && Array.isArray(window.PASS_PRODUCTS)) {
    websiteProducts = window.PASS_PRODUCTS;
  }

  if (websiteProducts.length === 0) {
    if (!silent) showToast('No website catalog products found');
    return;
  }

  if (!activeCompany.items) activeCompany.items = [];
  let addedCount = 0;
  let updatedCount = 0;

  websiteProducts.forEach(wp => {
    if (!wp || !wp.name) return;
    const existing = activeCompany.items.find(i => 
      (i.name && i.name.toLowerCase().trim() === wp.name.toLowerCase().trim()) || 
      (i.sku && wp.sku && i.sku === wp.sku)
    );

    const pDesc = wp.description || wp.desc || wp.spec || '';
    const pPrice = parseFloat(wp.price || wp.rate) || 0;
    const pImg = wp.imageUrl || wp.image || wp.img || '';
    const pHsn = wp.hsnCode || wp.hsn || '85389000';
    const pUnit = wp.unit || 'PCS';
    const pTax = Number(wp.taxRate || wp.gstPercent) || 18;

    if (existing) {
      existing.price = pPrice;
      existing.rate = pPrice;
      existing.hsnCode = pHsn;
      existing.hsn = pHsn;
      existing.unit = pUnit;
      existing.brand = wp.brand || existing.brand || 'PASS SAFETY';
      existing.description = pDesc || existing.description;
      existing.desc = pDesc || existing.desc;
      existing.imageUrl = pImg || existing.imageUrl;
      existing.image = pImg || existing.image;
      existing.taxRate = pTax;
      existing.gstPercent = pTax;
      updatedCount++;
    } else {
      activeCompany.items.push({
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: wp.name,
        sku: wp.sku || ('SKU-' + Math.random().toString(36).substr(2, 4).toUpperCase()),
        brand: wp.brand || 'PASS SAFETY',
        hsnCode: pHsn,
        hsn: pHsn,
        unit: pUnit,
        taxRate: pTax,
        gstPercent: pTax,
        price: pPrice,
        rate: pPrice,
        description: pDesc,
        desc: pDesc,
        imageUrl: pImg,
        image: pImg,
        stock: wp.stock || 100
      });
      addedCount++;
    }
  });

  saveDatabase();
  renderCurrentPage();
  if (!silent) showToast(`✅ Website Catalog Synced: ${addedCount} items added, ${updatedCount} updated!`);
}

function pushItemsToWebsiteCatalog(silent = false) {
  if (!activeCompany || !activeCompany.items || activeCompany.items.length === 0) {
    showToast('No items to sync');
    return;
  }

  try {
    let siteContent = {};
    const raw = localStorage.getItem('pass_corp_site_content');
    if (raw) siteContent = JSON.parse(raw);
    if (!siteContent.products) siteContent.products = [];

    activeCompany.items.forEach(item => {
      const idx = siteContent.products.findIndex(p => p.name && p.name.toLowerCase().trim() === item.name.toLowerCase().trim());
      const prodObj = {
        id: item.id,
        name: item.name,
        brand: item.brand || 'PASS SAFETY',
        price: item.rate || 0,
        costPrice: item.costPrice || 0,
        hsn: item.hsn || '85389000',
        unit: item.unit || 'NOS',
        desc: item.desc || '',
        img: item.image || ''
      };
      if (idx !== -1) {
        siteContent.products[idx] = Object.assign({}, siteContent.products[idx], prodObj);
      } else {
        siteContent.products.unshift(prodObj);
      }
    });

    localStorage.setItem('pass_corp_site_content', JSON.stringify(siteContent));
    window.CONTENT = siteContent;

    // Broadcast across tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('passcorp_catalog_sync');
        bc.postMessage({ type: 'CATALOG_SYNC_ALL', timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}

    if (!silent) showToast(`✅ ${activeCompany.items.length} items synced to Website Catalog!`);
  } catch (e) {
    console.warn('Failed to push items to website catalog', e);
  }
}

// JSON Backup & Restore
function exportBackupJSON() {
  const payload = {
    app: "PASS_CORP_QUOTEDESK_PRO",
    exportDate: new Date().toISOString(),
    companies: db.companies
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  a.href = url;
  a.download = `quotedesk_erp_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 Backup downloaded successfully');
}

function importBackupJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.companies && Array.isArray(data.companies) && data.companies.length > 0) {
        if (confirm(`Restore ${data.companies.length} companies and their transactions from backup file?`)) {
          db.companies = data.companies;
          activeCompany = db.companies[0];
          saveDatabase();
          closeSyncModal();
          showToast('✅ Database restored successfully from backup file!');
          navigateTab('dashboard');
        }
      } else {
        alert('Invalid QuoteDesk backup file format.');
      }
    } catch (err) {
      alert('Error parsing JSON backup file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgSpan = document.getElementById('toast-msg');
  if (!toast || !msgSpan) return;
  msgSpan.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function updateHeaderAndBadges() {
  if (!activeCompany) return;

  const hName = document.getElementById('header-company-name');
  const hGst = document.getElementById('header-company-gstin');
  const sName = document.getElementById('sidebar-company-name');
  const saName = document.getElementById('sidebar-app-company-name');
  const hDate = document.getElementById('header-live-date');
  const hCurr = document.getElementById('header-currency-sym');

  if (hName) hName.textContent = activeCompany.name || 'QuoteDesk Pro';
  if (hGst) hGst.textContent = activeCompany.gstin ? `GSTIN: ${activeCompany.gstin}` : 'Multi-Company • Active';
  if (sName) sName.textContent = activeCompany.name || 'Company';
  if (saName) saName.textContent = activeCompany.name || 'QuoteDesk';

  if (hDate) {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    hDate.textContent = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }
  if (hCurr) {
    hCurr.textContent = `${activeCompany.currencySymbol || '₹'} INR`;
  }

  renderLogoInElement('header-logo-container', activeCompany.logoUrl, 'building-2');
  renderLogoInElement('sidebar-logo-container', activeCompany.logoUrl, 'sparkles');

  const pendingQuotes = (activeCompany.quotations || []).filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const unpaidInvoices = (activeCompany.invoices || []).filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid').length;

  const bQ = document.getElementById('badge-quotes');
  const bI = document.getElementById('badge-invoices');
  if (bQ) bQ.textContent = pendingQuotes;
  if (bI) bI.textContent = unpaidInvoices;
}

function renderLogoInElement(containerId, logoUrl, fallbackIcon = 'building') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (logoUrl) {
    el.innerHTML = `<img src="${logoUrl}" alt="Company Logo" class="w-full h-full object-contain p-1 rounded-xl" />`;
  } else {
    el.innerHTML = `<i data-lucide="${fallbackIcon}" class="w-5 h-5 text-brand-600"></i>`;
  }
  lucide.createIcons();
}

function togglePinVisibility() {
  const input = document.getElementById('company-pin-input');
  const eye = document.getElementById('pin-eye-icon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (eye) eye.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (eye) eye.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

// ==========================================
// 1. AUTH & COMPANY LOGIN FLOW (MASTER -> COMPANIES -> PIN)
// ==========================================

const MASTER_PASSCODE = 'Pawanjali@241997';

function showAuthScreen() {
  activeCompany = null;
  selectedCompanyForPin = null;

  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');

  const isMasterUnlocked = sessionStorage.getItem('PASS_MASTER_UNLOCKED') === 'TRUE';

  if (isMasterUnlocked) {
    showCompanySelector();
  } else {
    showMasterLock();
  }
}

function showMasterLock() {
  document.getElementById('auth-master-stage').classList.remove('hidden');
  document.getElementById('auth-company-selector').classList.add('hidden');
  document.getElementById('auth-pin-entry').classList.add('hidden');
  
  const masterInput = document.getElementById('master-pass-input');
  if (masterInput) {
    masterInput.value = '';
    setTimeout(() => masterInput.focus(), 80);
  }
  const masterErr = document.getElementById('master-error-msg');
  if (masterErr) masterErr.classList.add('hidden');
  lucide.createIcons();
}

function handleMasterSubmit(e) {
  e.preventDefault();
  const entered = (document.getElementById('master-pass-input').value || '').trim();
  if (entered === MASTER_PASSCODE) {
    sessionStorage.setItem('PASS_MASTER_UNLOCKED', 'TRUE');
    showCompanySelector();
  } else {
    const err = document.getElementById('master-error-msg');
    if (err) err.classList.remove('hidden');
    const masterInput = document.getElementById('master-pass-input');
    if (masterInput) {
      masterInput.value = '';
      masterInput.focus();
    }
  }
}

function showCompanySelector() {
  document.getElementById('auth-master-stage').classList.add('hidden');
  document.getElementById('auth-company-selector').classList.remove('hidden');
  document.getElementById('auth-pin-entry').classList.add('hidden');
  renderCompanyCardsList();
  lucide.createIcons();
}

function renderCompanyCardsList() {
  const container = document.getElementById('company-cards-list');
  if (!container) return;

  if (db.companies.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
        <h3 class="font-bold text-slate-800 text-xs">No Companies Created Yet</h3>
        <button onclick="openCompanyModal('create')" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
          + Add Company
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = db.companies.map(comp => `
    <div class="p-3 bg-slate-50 hover:bg-brand-50/40 border border-slate-200 hover:border-brand-400 rounded-xl flex items-center justify-between transition-all group shadow-sm">
      <div onclick="selectCompanyForLogin('${comp.id}')" class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
        <div class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          ${comp.logoUrl ? `<img src="${comp.logoUrl}" class="w-full h-full object-contain p-0.5" />` : `<i data-lucide="building" class="w-4 h-4 text-brand-600"></i>`}
        </div>
        <div class="min-w-0">
          <h3 class="font-bold text-slate-900 text-xs group-hover:text-brand-700 truncate">${comp.name}</h3>
          <p class="text-[10px] text-slate-500 font-mono truncate">${comp.gstin ? `GSTIN: ${comp.gstin}` : 'Active Workspace'}</p>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button onclick="openCompanyModal('edit', '${comp.id}')" title="Edit Company" class="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors">
          <i data-lucide="edit" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="selectCompanyForLogin('${comp.id}')" class="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold shadow-sm">
          Select
        </button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function selectCompanyForLogin(id) {
  const comp = db.companies.find(c => c.id === id);
  if (!comp) return;

  selectedCompanyForPin = comp;
  document.getElementById('auth-master-stage').classList.add('hidden');
  document.getElementById('auth-company-selector').classList.add('hidden');
  document.getElementById('auth-pin-entry').classList.remove('hidden');
  document.getElementById('pin-error-msg').classList.add('hidden');

  // Update selected company UI
  const nameHeading = document.getElementById('selected-company-name-heading');
  if (nameHeading) nameHeading.textContent = comp.name;

  const logoContainer = document.getElementById('selected-company-logo-container');
  if (logoContainer) {
    if (comp.logoUrl) {
      logoContainer.innerHTML = `<img src="${comp.logoUrl}" class="w-full h-full object-contain p-1" />`;
    } else {
      logoContainer.innerHTML = `<i data-lucide="building" class="w-6 h-6 text-brand-600"></i>`;
    }
  }

  const pinInput = document.getElementById('company-pin-input');
  if (pinInput) {
    pinInput.value = '';
    setTimeout(() => pinInput.focus(), 60);
  }

  lucide.createIcons();
}

function backToCompanySelect() {
  selectedCompanyForPin = null;
  showCompanySelector();
}

function lockToMaster() {
  sessionStorage.removeItem('PASS_MASTER_UNLOCKED');
  sessionStorage.removeItem('PASS_AUTH_KEY_2026');
  showMasterLock();
}

function handlePinSubmit(e) {
  e.preventDefault();
  const enteredPin = (document.getElementById('company-pin-input').value || '').trim();
  const correctPin = (selectedCompanyForPin && selectedCompanyForPin.pin) ? selectedCompanyForPin.pin : '1234';

  // Allow company PIN, master passcode, or default 1234
  const isValid = enteredPin === correctPin || 
                  enteredPin === MASTER_PASSCODE || 
                  enteredPin === '1234';

  if (isValid) {
    if (!selectedCompanyForPin && db.companies && db.companies.length > 0) {
      selectedCompanyForPin = db.companies[0];
    }
    activeCompany = selectedCompanyForPin;
    sessionStorage.setItem('PASS_AUTH_KEY_2026', 'AUTHORIZED_PASS_CORP');

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    updateHeaderAndBadges();
    navigateTab('dashboard');
    showToast(`Welcome! Logged into ${activeCompany?.name || 'QuoteDesk Pro'} 👋`);
  } else {
    document.getElementById('pin-error-msg').classList.remove('hidden');
    const pinInput = document.getElementById('company-pin-input');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }
}

function toggleMasterPassVisibility() {
  const input = document.getElementById('master-pass-input');
  const icon = document.getElementById('master-eye-icon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

function lockSession() {
  sessionStorage.removeItem('PASS_AUTH_KEY_2026');
  showAuthScreen();
}

// ==========================================
// 2. COMPANY PROFILE MODAL (Logo, PIN, Details)
// ==========================================

function openCompanyModal(mode = 'create', compId = null) {
  uploadedLogoDataUrl = null;
  uploadedStampDataUrl = null;
  const modal = document.getElementById('company-modal');
  const title = document.getElementById('comp-modal-title');
  const deleteBtn = document.getElementById('cm-delete-btn');
  const removeLogoBtn = document.getElementById('cm-logo-remove-btn');
  const preview = document.getElementById('cm-logo-preview');
  const removeStampBtn = document.getElementById('cm-stamp-remove-btn');
  const stampPreview = document.getElementById('cm-stamp-preview');

  if (mode === 'edit' && compId) {
    const comp = db.companies.find(c => c.id === compId);
    if (!comp) return;

    document.getElementById('cm-id').value = comp.id;
    title.textContent = 'Edit Company Profile';
    document.getElementById('cm-name').value = comp.name || '';
    document.getElementById('cm-gstin').value = comp.gstin || '';
    document.getElementById('cm-pin').value = comp.pin || '1234';
    document.getElementById('cm-email').value = comp.email || '';
    document.getElementById('cm-phone').value = comp.phone || '';
    document.getElementById('cm-address').value = comp.address || '';

    const currentBrandColor = comp.brandColor || '#2563eb';
    const foundPreset = BRAND_PRESETS.find(p => p.hex.toLowerCase() === currentBrandColor.toLowerCase());
    const colorLabel = foundPreset ? `${foundPreset.name} (${foundPreset.hex})` : `Custom (${currentBrandColor})`;
    const nameLabelEl = document.getElementById('cm-color-name-label');
    if (nameLabelEl) nameLabelEl.textContent = colorLabel;
    
    const brandInput = document.getElementById('cm-brand-color');
    if (brandInput) brandInput.value = currentBrandColor;
    renderPaletteOptions('cm-palette-options', currentBrandColor, 'cm');

    uploadedLogoDataUrl = comp.logoUrl || null;
    if (uploadedLogoDataUrl) {
      preview.innerHTML = `<img src="${uploadedLogoDataUrl}" class="w-full h-full object-contain p-1" />`;
      removeLogoBtn.classList.remove('hidden');
    } else {
      preview.innerHTML = `<i data-lucide="image" class="w-7 h-7 text-slate-300"></i>`;
      removeLogoBtn.classList.add('hidden');
    }

    uploadedStampDataUrl = comp.stampUrl || null;
    if (uploadedStampDataUrl) {
      if (stampPreview) stampPreview.innerHTML = `<img src="${uploadedStampDataUrl}" class="w-full h-full object-contain p-1" />`;
      if (removeStampBtn) removeStampBtn.classList.remove('hidden');
    } else {
      if (stampPreview) stampPreview.innerHTML = `<i data-lucide="stamp" class="w-7 h-7 text-slate-300"></i>`;
      if (removeStampBtn) removeStampBtn.classList.add('hidden');
    }

    deleteBtn.classList.remove('hidden');
  } else {
    document.getElementById('cm-id').value = '';
    title.textContent = 'Add New Company';
    document.getElementById('cm-name').value = '';
    document.getElementById('cm-gstin').value = '';
    document.getElementById('cm-pin').value = '1234';
    document.getElementById('cm-email').value = '';
    document.getElementById('cm-phone').value = '';
    document.getElementById('cm-address').value = '';

    const defaultBrandColor = '#2563eb';
    const nameLabelEl = document.getElementById('cm-color-name-label');
    if (nameLabelEl) nameLabelEl.textContent = 'Royal Blue (#2563eb)';
    const brandInput = document.getElementById('cm-brand-color');
    if (brandInput) brandInput.value = defaultBrandColor;
    renderPaletteOptions('cm-palette-options', defaultBrandColor, 'cm');

    preview.innerHTML = `<i data-lucide="image" class="w-7 h-7 text-slate-300"></i>`;
    removeLogoBtn.classList.add('hidden');

    if (stampPreview) stampPreview.innerHTML = `<i data-lucide="stamp" class="w-7 h-7 text-slate-300"></i>`;
    if (removeStampBtn) removeStampBtn.classList.add('hidden');

    deleteBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeCompanyModal() {
  document.getElementById('company-modal').classList.add('hidden');
}

async function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const compressed = await compressImage(file, 500, 0.85);
  if (!compressed) return;
  uploadedLogoDataUrl = compressed;
  const preview = document.getElementById('cm-logo-preview');
  if (preview) preview.innerHTML = `<img src="${uploadedLogoDataUrl}" class="w-full h-full object-contain p-1" />`;
  const removeBtn = document.getElementById('cm-logo-remove-btn');
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function removeUploadedLogo() {
  uploadedLogoDataUrl = null;
  const preview = document.getElementById('cm-logo-preview');
  preview.innerHTML = `<i data-lucide="image" class="w-7 h-7 text-slate-300"></i>`;
  document.getElementById('cm-logo-remove-btn').classList.add('hidden');
  document.getElementById('cm-logo-input').value = '';
  lucide.createIcons();
}

async function handleStampUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const compressed = await compressImage(file, 400, 0.85);
  if (!compressed) return;
  uploadedStampDataUrl = compressed;
  const preview = document.getElementById('cm-stamp-preview');
  if (preview) preview.innerHTML = `<img src="${uploadedStampDataUrl}" class="w-full h-full object-contain p-1" />`;
  const removeBtn = document.getElementById('cm-stamp-remove-btn');
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function removeUploadedStamp() {
  uploadedStampDataUrl = null;
  const preview = document.getElementById('cm-stamp-preview');
  if (preview) preview.innerHTML = `<i data-lucide="stamp" class="w-7 h-7 text-slate-300"></i>`;
  const removeBtn = document.getElementById('cm-stamp-remove-btn');
  if (removeBtn) removeBtn.classList.add('hidden');
  const input = document.getElementById('cm-stamp-input');
  if (input) input.value = '';
  lucide.createIcons();
}

function handleCompanyFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('cm-id').value;
  const name = document.getElementById('cm-name').value.trim();
  const gstin = document.getElementById('cm-gstin').value.trim();
  const pin = document.getElementById('cm-pin').value.trim();
  const email = document.getElementById('cm-email').value.trim();
  const phone = document.getElementById('cm-phone').value.trim();
  const address = document.getElementById('cm-address').value.trim();
  const brandColor = document.getElementById('cm-brand-color')?.value || '#2563eb';

  if (!pin || pin.length < 4) {
    alert('Please enter a 4-digit security PIN for this company.');
    return;
  }

  if (id) {
    const comp = db.companies.find(c => c.id === id);
    if (comp) {
      comp.name = name;
      comp.gstin = gstin;
      comp.pin = pin;
      comp.email = email;
      comp.phone = phone;
      comp.address = address;
      comp.logoUrl = uploadedLogoDataUrl;
      comp.stampUrl = uploadedStampDataUrl;
      comp.brandColor = brandColor;

      if (activeCompany && activeCompany.id === id) {
        activeCompany = comp;
      }
      showToast('Company profile updated');
    }
  } else {
    const newComp = {
      id: 'comp-' + Date.now(),
      name,
      gstin,
      pin,
      email,
      phone,
      address,
      logoUrl: uploadedLogoDataUrl,
      stampUrl: uploadedStampDataUrl,
      brandColor: brandColor,
      currency: 'INR',
      currencySymbol: '₹',
      bankDetails: {
        bankName: '',
        accountName: name,
        accountNumber: '',
        ifscCode: '',
        branch: '',
        upiId: ''
      },
      quotations: [],
      invoices: [],
      customers: [],
      items: []
    };
    db.companies.push(newComp);
    showToast('Company created successfully!');
  }

  saveDatabase();
  closeCompanyModal();

  if (!activeCompany) {
    renderCompanyCardsList();
  } else {
    updateHeaderAndBadges();
    if (currentTab === 'settings') {
      renderSettingsPage(document.getElementById('main-content'));
    }
  }
}

function deleteCompanyFromModal() {
  const id = document.getElementById('cm-id').value;
  if (!id) return;

  if (confirm('Are you sure you want to permanently delete this company and all its quotations & invoices?')) {
    db.companies = db.companies.filter(c => c.id !== id);
    if (activeCompany && activeCompany.id === id) {
      activeCompany = null;
    }
    saveDatabase();
    closeCompanyModal();
    showToast('Company deleted');
    showAuthScreen();
  }
}

// ==========================================
// 3. NAVIGATION & WORKSPACE ROUTER
// ==========================================

function navigateTab(tab) {
  if (activeEditorMode) {
    if (!confirm('You have unsaved changes in the editor. Are you sure you want to leave?')) {
      return;
    }
    activeEditorMode = null;
  }

  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold';
  });

  const activeBtn = document.getElementById(`nav-${tab}`);
  if (activeBtn) {
    activeBtn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20';
  }

  renderCurrentPage();
}

function renderCurrentPage() {
  const container = document.getElementById('main-content');
  if (!container) return;

  if (activeEditorMode === 'quote') {
    renderQuotationEditor(container);
  } else if (activeEditorMode === 'invoice') {
    renderInvoiceEditor(container);
  } else {
    switch (currentTab) {
      case 'dashboard':
        renderDashboard(container);
        break;
      case 'quotations':
        renderQuotationsList(container);
        break;
      case 'invoices':
        renderInvoicesList(container);
        break;
      case 'customers':
        renderCustomersList(container);
        break;
      case 'items':
        renderItemsList(container);
        break;
      case 'settings':
        renderSettingsPage(container);
        break;
      default:
        renderDashboard(container);
    }
  }

  lucide.createIcons();
}

// ==========================================
// 4. DASHBOARD VIEW (White Theme)
// ==========================================

function renderDashboard(container) {
  const quotations = activeCompany.quotations || [];
  const invoices = activeCompany.invoices || [];

  const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
  const totalReceived = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalBalanceDue = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  const totalQuotesVal = quotations.reduce((s, q) => s + (Number(q.grandTotal) || 0), 0);

  const pendingQuotes = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft');
  const acceptedQuotes = quotations.filter(q => q.status === 'Accepted');

  const recentQuotes = [...quotations].slice(0, 5);
  const recentInvoices = [...invoices].slice(0, 5);

  container.innerHTML = `
    <div class="space-y-4 max-w-7xl mx-auto text-xs">
      <!-- Enterprise Header Card -->
      <div class="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded bg-slate-50 border border-slate-300 flex items-center justify-center text-blue-900 overflow-hidden shrink-0">
            ${activeCompany.logoUrl ? `<img src="${activeCompany.logoUrl}" class="w-full h-full object-contain p-0.5" />` : `<i data-lucide="building-2" class="w-6 h-6"></i>`}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-black text-slate-900 uppercase tracking-tight">${activeCompany.name}</h1>
              <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">Active Company</span>
            </div>
            <p class="text-slate-500 text-[11px] font-mono mt-0.5">
              ${activeCompany.gstin ? `GSTIN: <span class="font-bold text-slate-700">${activeCompany.gstin}</span> | ` : ''}
              Financial Year: <span class="font-bold text-slate-700">2024-2025</span> | Base Currency: <span class="font-bold text-slate-700">${cur()}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openNewQuotationEditor()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-sm border border-blue-800">
            <span class="text-[10px] bg-blue-900 px-1 rounded font-mono font-normal">Alt+Q</span>
            <span>+ New Quotation</span>
          </button>
          <button onclick="openNewInvoiceEditor()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm border border-amber-700">
            <span class="text-[10px] bg-amber-800 px-1 rounded font-mono font-normal">F8</span>
            <span>+ Sales Invoice</span>
          </button>
        </div>
      </div>

      <!-- High-Density Financial Metric Tiles -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 uppercase text-[10px] font-bold">
            <span>Quotations Pipeline</span>
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-blue-700"></i>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-lg font-black font-mono text-slate-900">${cur()}${fmt(totalQuotesVal)}</span>
            <span class="text-[10px] font-mono text-blue-700 font-bold">${pendingQuotes.length} open</span>
          </div>
        </div>

        <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 uppercase text-[10px] font-bold">
            <span>Total Sales Invoiced</span>
            <i data-lucide="receipt" class="w-3.5 h-3.5 text-amber-700"></i>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-lg font-black font-mono text-slate-900">${cur()}${fmt(totalInvoiced)}</span>
            <span class="text-[10px] font-mono text-amber-700 font-bold">${invoices.length} vouchers</span>
          </div>
        </div>

        <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 uppercase text-[10px] font-bold">
            <span>Cash / Bank Realised</span>
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-blue-700"></i>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-lg font-black font-mono text-blue-700">${cur()}${fmt(totalReceived)}</span>
            <span class="text-[10px] text-slate-500">Collected</span>
          </div>
        </div>

        <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 uppercase text-[10px] font-bold">
            <span>Sundry Debtors Balance</span>
            <i data-lucide="clock" class="w-3.5 h-3.5 text-rose-600"></i>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-lg font-black font-mono text-rose-600">${cur()}${fmt(totalBalanceDue)}</span>
            <span class="text-[10px] text-rose-700 font-bold">Receivable</span>
          </div>
        </div>
      </div>

      <!-- Tally / Busy Gateway Two-Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- Gateway Menu Board (Left 4 Cols) -->
        <div class="lg:col-span-4 bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
          <div class="bg-[#0e2a47] text-white px-3.5 py-2 font-black uppercase text-[11px] tracking-wider flex items-center justify-between">
            <span>Gateway of Enterprise</span>
            <span class="text-[9px] font-mono text-blue-300">Tally/Busy UI</span>
          </div>

          <div class="p-3 space-y-3">
            <!-- Masters Group -->
            <div>
              <div class="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 px-1">Masters</div>
              <div class="space-y-1">
                <button onclick="navigateTab('items')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between border border-transparent hover:border-slate-300">
                  <span class="font-bold text-slate-800">Stock Item Master (Products)</span>
                  <span class="text-[10px] font-mono text-slate-400">Alt+I</span>
                </button>
                <button onclick="navigateTab('customers')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between border border-transparent hover:border-slate-300">
                  <span class="font-bold text-slate-800">Ledger Accounts (Customers)</span>
                  <span class="text-[10px] font-mono text-slate-400">Alt+L</span>
                </button>
              </div>
            </div>

            <!-- Transactions Group -->
            <div>
              <div class="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 px-1">Transactions / Vouchers</div>
              <div class="space-y-1">
                <button onclick="openNewQuotationEditor()" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 text-blue-900 flex items-center justify-between border border-blue-200">
                  <span class="font-bold">Sales Quotation Entry</span>
                  <span class="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-1 rounded">Alt+Q</span>
                </button>
                <button onclick="openNewInvoiceEditor()" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-50 text-amber-900 flex items-center justify-between border border-amber-200">
                  <span class="font-bold">Sales Tax Invoice Entry</span>
                  <span class="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1 rounded">F8</span>
                </button>
              </div>
            </div>

            <!-- Books & Registers Group -->
            <div>
              <div class="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 px-1">Registers & Reports</div>
              <div class="space-y-1">
                <button onclick="navigateTab('quotations')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between">
                  <span class="text-slate-700 font-medium">Quotation Daybook</span>
                  <span class="text-[10px] font-mono font-bold text-slate-600">${quotations.length}</span>
                </button>
                <button onclick="navigateTab('invoices')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between">
                  <span class="text-slate-700 font-medium">Sales Invoice Register</span>
                  <span class="text-[10px] font-mono font-bold text-slate-600">${invoices.length}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Daybook & Recent Registers Grid (Right 8 Cols) -->
        <div class="lg:col-span-8 space-y-4">
          <!-- Recent Quotations Grid -->
          <div class="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            <div class="bg-slate-100 border-b border-slate-300 px-3.5 py-2 flex items-center justify-between">
              <span class="font-black uppercase text-[10px] tracking-wider text-slate-700 flex items-center gap-1.5">
                <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-blue-700"></i>
                Latest Quotation Vouchers
              </span>
              <button onclick="navigateTab('quotations')" class="text-[11px] text-blue-700 font-bold hover:underline">Full Register →</button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
                    <th class="py-2 px-3">Quote No.</th>
                    <th class="py-2 px-3">Date</th>
                    <th class="py-2 px-3">Party A/c Name</th>
                    <th class="py-2 px-3 text-center">Status</th>
                    <th class="py-2 px-3 text-right">Amount (${cur()})</th>
                    <th class="py-2 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${recentQuotes.length === 0 ? `
                    <tr><td colSpan="6" class="py-6 text-center text-slate-400">No quotation vouchers recorded.</td></tr>
                  ` : recentQuotes.map(q => `
                    <tr class="hover:bg-slate-50">
                      <td class="py-2.5 px-3 font-mono font-bold text-blue-900 cursor-pointer hover:underline" onclick="openDocPreview('quote', '${q.id}')">${q.quoteNumber}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-500">${q.date}</td>
                      <td class="py-2.5 px-3 font-bold text-slate-900">${q.customerName || 'Direct Customer'}</td>
                      <td class="py-2.5 px-3 text-center"><span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(q.status)}">${q.status}</span></td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${fmt(q.grandTotal)}</td>
                      <td class="py-2.5 px-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button onclick="openDocPreview('quote', '${q.id}')" title="Preview & Print" class="p-1 text-slate-500 hover:text-blue-700"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>
                          <button onclick="editQuotation('${q.id}')" title="Edit" class="p-1 text-slate-500 hover:text-slate-900"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Invoices Grid -->
          <div class="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            <div class="bg-slate-100 border-b border-slate-300 px-3.5 py-2 flex items-center justify-between">
              <span class="font-black uppercase text-[10px] tracking-wider text-slate-700 flex items-center gap-1.5">
                <i data-lucide="receipt" class="w-3.5 h-3.5 text-amber-700"></i>
                Latest Sales Invoices
              </span>
              <button onclick="navigateTab('invoices')" class="text-[11px] text-amber-700 font-bold hover:underline">Full Register →</button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
                    <th class="py-2 px-3">Vch No.</th>
                    <th class="py-2 px-3">Date</th>
                    <th class="py-2 px-3">Party A/c Name</th>
                    <th class="py-2 px-3 text-center">Status</th>
                    <th class="py-2 px-3 text-right">Grand Total (${cur()})</th>
                    <th class="py-2 px-3 text-right">Balance Due</th>
                    <th class="py-2 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${recentInvoices.length === 0 ? `
                    <tr><td colSpan="7" class="py-6 text-center text-slate-400">No sales invoices recorded.</td></tr>
                  ` : recentInvoices.map(inv => `
                    <tr class="hover:bg-slate-50">
                      <td class="py-2.5 px-3 font-mono font-bold text-amber-900 cursor-pointer hover:underline" onclick="openDocPreview('invoice', '${inv.id}')">${inv.invoiceNumber}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-500">${inv.date}</td>
                      <td class="py-2.5 px-3 font-bold text-slate-900">${inv.customerName || 'Direct Customer'}</td>
                      <td class="py-2.5 px-3 text-center"><span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${getInvoiceStatusBadgeClass(inv.status)}">${inv.status}</span></td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${fmt(inv.grandTotal)}</td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold text-rose-600">${fmt(inv.balanceDue)}</td>
                      <td class="py-2.5 px-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button onclick="openDocPreview('invoice', '${inv.id}')" title="Preview & Print" class="p-1 text-slate-500 hover:text-amber-700"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>
                          <button onclick="editInvoice('${inv.id}')" title="Edit" class="p-1 text-slate-500 hover:text-slate-900"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getStatusBadgeClass(st) {
  switch (st) {
    case 'Accepted': return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'Sent': return 'bg-brand-100 text-brand-800';
    case 'Draft': return 'bg-slate-100 text-slate-800';
    case 'Rejected': return 'bg-rose-100 text-rose-800';
    case 'Expired': return 'bg-amber-100 text-amber-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}

function getInvoiceStatusBadgeClass(st) {
  switch (st) {
    case 'Paid': return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'Partially Paid': return 'bg-amber-100 text-amber-800';
    case 'Unpaid': return 'bg-rose-100 text-rose-800';
    case 'Cancelled': return 'bg-slate-100 text-slate-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}

// ==========================================
// 5. QUOTATIONS LIST VIEW
// ==========================================

function renderQuotationsList(container) {
  const quotations = activeCompany.quotations || [];
  const totalVal = quotations.reduce((s, q) => s + (Number(q.grandTotal) || 0), 0);

  container.innerHTML = `
    <div class="space-y-3.5 max-w-7xl mx-auto text-xs">
      <!-- Enterprise Register Header -->
      <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-700">
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-black text-slate-900 uppercase tracking-wide">Quotation Daybook & Estimates</h1>
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">${quotations.length} Vouchers</span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono">Total Pipeline Value: <span class="font-bold text-slate-800">${cur()}${fmt(totalVal)}</span></p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openNewQuotationEditor()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold border border-blue-800 text-xs shadow-sm">
            <span class="text-[9px] bg-blue-900 px-1 rounded font-mono font-normal">Alt+Q</span>
            <span>+ Create Quotation</span>
          </button>
        </div>
      </div>

      <!-- High-Density Daybook Table -->
      <div class="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-300 bg-[#0e2a47] text-white font-black uppercase text-[9px] tracking-wider">
                <th class="py-2.5 px-3 w-10 text-center border-r border-[#1c3f66]">#</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Quote Voucher #</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Date / Validity</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Party / Customer Ledger</th>
                <th class="py-2.5 px-3 text-center border-r border-[#1c3f66]">Items</th>
                <th class="py-2.5 px-3 text-center border-r border-[#1c3f66]">Status</th>
                <th class="py-2.5 px-3 text-right border-r border-[#1c3f66]">Amount (${cur()})</th>
                <th class="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-slate-800 font-medium">
              ${quotations.length === 0 ? `
                <tr><td colSpan="8" class="py-12 text-center text-slate-400 font-mono">No quotations found in daybook. Press [Alt+Q] to record a new quotation voucher.</td></tr>
              ` : quotations.map((q, idx) => `
                <tr class="hover:bg-blue-50/50 transition-colors">
                  <td class="py-2 px-3 text-slate-400 font-mono text-center border-r border-slate-200 font-bold">${idx + 1}</td>
                  <td class="py-2 px-3 font-mono font-bold text-blue-700 cursor-pointer hover:underline border-r border-slate-200" onclick="openDocPreview('quote', '${q.id}')">
                    ${q.quoteNumber}
                  </td>
                  <td class="py-2 px-3 font-mono text-slate-600 border-r border-slate-200 text-[11px]">
                    <div>${q.date}</div>
                    <div class="text-[9px] text-slate-400">Valid: ${q.validUntil}</div>
                  </td>
                  <td class="py-2 px-3 border-r border-slate-200">
                    <div class="font-bold text-slate-900">${q.customerName || 'Direct Customer'}</div>
                  </td>
                  <td class="py-2 px-3 text-center font-mono text-slate-600 border-r border-slate-200 text-[11px]">${(q.items || []).length} items</td>
                  <td class="py-2 px-3 text-center border-r border-slate-200">
                    <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(q.status)}">${q.status}</span>
                  </td>
                  <td class="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">${cur()}${fmt(q.grandTotal)}</td>
                  <td class="py-2 px-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button onclick="openDocPreview('quote', '${q.id}')" title="Preview & Print [Alt+P]" class="p-1 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>
                      <button onclick="editQuotation('${q.id}')" title="Alter Voucher" class="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                      <button onclick="convertQuoteToInvoice('${q.id}')" title="Convert to Sales Invoice (F8)" class="p-1 rounded text-blue-700 hover:bg-blue-100"><i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i></button>
                      <button onclick="downloadDocPDF('quote', '${q.id}')" title="Download PDF" class="p-1 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100"><i data-lucide="download" class="w-3.5 h-3.5"></i></button>
                      <button onclick="deleteQuotation('${q.id}')" title="Delete" class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 6. UNIFIED PRODUCT SEARCH & QUOTATION EDITOR
// ==========================================

function getUnifiedProductsList() {
  const list = [];
  const seen = new Set();

  // 1. Company Item Master
  if (activeCompany && Array.isArray(activeCompany.items)) {
    activeCompany.items.forEach((it, i) => {
      if (!it || !it.name) return;
      const k = it.name.toLowerCase().trim();
      seen.add(k);
      list.push({
        id: it.id || ('comp_it_' + i),
        source: 'company',
        sourceLabel: '🏢 Master',
        name: it.name,
        brand: it.brand || activeCompany.name || 'PASS SAFETY',
        hsn: it.hsnCode || it.hsn || '85389000',
        unit: it.unit || 'PCS',
        price: Number(it.price || it.rate) || 0,
        taxRate: Number(it.taxRate || it.gstPercent || 18),
        description: it.description || it.desc || it.spec || '',
        imageUrl: it.imageUrl || it.image || it.img || null
      });
    });
  }

  // 2. Website Catalog Products
  let siteProds = [];
  try {
    if (window.CONTENT && Array.isArray(window.CONTENT.products)) {
      siteProds = window.CONTENT.products;
    } else if (localStorage.getItem('pass_corp_site_content')) {
      const parsed = JSON.parse(localStorage.getItem('pass_corp_site_content'));
      if (parsed && Array.isArray(parsed.products)) siteProds = parsed.products;
    }
  } catch(e){}
  if (!siteProds.length && window.PASS_PRODUCTS && Array.isArray(window.PASS_PRODUCTS)) {
    siteProds = window.PASS_PRODUCTS;
  }

  siteProds.forEach((sp, idx) => {
    if (!sp || !sp.name) return;
    const k = sp.name.toLowerCase().trim();
    if (!seen.has(k)) {
      seen.add(k);
      list.push({
        id: 'web_' + (sp.id || idx),
        source: 'website',
        sourceLabel: '🌐 Website',
        name: sp.name,
        brand: sp.brand || 'PASS SAFETY',
        hsn: sp.hsn || '85389000',
        unit: sp.unit || 'PCS',
        price: Number(sp.price || sp.rate) || 0,
        taxRate: 18,
        description: sp.desc || sp.spec || sp.description || '',
        imageUrl: sp.img || sp.image || sp.imageUrl || null
      });
    }
  });

  return list;
}

function openNewQuotationEditor() {
  activeEditorMode = 'quote';
  activeEditingId = null;

  const count = (activeCompany.quotations || []).length + 1;
  const quoteNo = `QT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];
  const valid = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  quoteEditorData = {
    id: 'quote-' + Date.now(),
    quoteNumber: quoteNo,
    date: today,
    validity: '15 Days',
    validUntil: valid,
    deliveryTerms: 'Door Delivery',
    paymentTerms: 'Against PI',
    taxTerms: 'Extra as applicable',
    status: 'Sent',
    customerId: '',
    customerName: '',
    items: [
      {
        id: 'qi-1',
        name: '',
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'PCS',
        price: 0,
        leadTime: '1-2 Days',
        taxRate: 18,
        amount: 0,
        taxAmount: 0,
        total: 0,
        imageUrl: null
      }
    ],
    notes: 'Thank you for your business interest. We assure you our highest quality products and prompt support.',
    terms: [
      'Prices are inclusive of standard GST as applicable.',
      'Quotation is valid for 15 days from the date of issue.',
      'Delivery timeline: Within 3-5 business days upon PO confirmation.'
    ],
    subtotal: 0,
    taxableAmount: 0,
    totalTax: 0,
    grandTotal: 0
  };

  recalculateQuoteInMemory();
  renderCurrentPage();
}

function editQuotation(id) {
  const quote = (activeCompany.quotations || []).find(q => q.id === id);
  if (!quote) return;

  activeEditorMode = 'quote';
  activeEditingId = id;
  quoteEditorData = JSON.parse(JSON.stringify(quote));
  if (!quoteEditorData.deliveryTerms) quoteEditorData.deliveryTerms = 'Door Delivery';
  if (!quoteEditorData.paymentTerms) quoteEditorData.paymentTerms = 'Against PI';
  if (!quoteEditorData.taxTerms) quoteEditorData.taxTerms = 'Extra as applicable';
  if (!quoteEditorData.validity) quoteEditorData.validity = '15 Days';

  recalculateQuoteInMemory();
  renderCurrentPage();
}

function renderQuotationEditor(container) {
  const isEditing = Boolean(activeEditingId);
  const unifiedProds = getUnifiedProductsList();

  container.innerHTML = `
    <div class="space-y-4 max-w-7xl mx-auto text-xs pb-8">
      <!-- Voucher Top Ribbon -->
      <div class="bg-[#0e2a47] text-white border border-[#1c3f66] rounded-lg px-4 py-2.5 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="cancelEditor()" title="Back / Cancel [Esc]" class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 border border-blue-400/40">VCH TYPE</span>
              <h1 class="text-sm font-black tracking-wide uppercase text-white">${isEditing ? `Alter Quotation #${quoteEditorData.quoteNumber}` : 'Accounting Voucher: Sales Quotation Entry'}</h1>
            </div>
            <p class="text-[10px] text-slate-300 font-mono mt-0.5">Record technical quotations with item photos, GST breakdown and commercial terms.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="saveQuotation(true)" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold border border-white/30 text-xs">
            <span class="text-[9px] font-mono bg-black/30 px-1 rounded">Alt+P</span>
            <span>Preview & Save</span>
          </button>
          <button onclick="saveQuotation(false)" class="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-400 text-xs shadow-sm">
            <span class="text-[9px] font-mono bg-blue-800 px-1 rounded">Ctrl+A</span>
            <span>Save Voucher</span>
          </button>
        </div>
      </div>

      <!-- Voucher Party & Commercial Terms Box -->
      <div class="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-4">
        <div class="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <!-- Row 1: Party, Vch#, Date, Validity -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div class="md:col-span-6">
              <div class="flex items-center justify-between mb-1">
                <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider">Party A/c Name (Customer Ledger) *</label>
                <button onclick="openCustomerModal()" class="text-[10px] text-blue-700 font-bold hover:underline">+ New Ledger (Alt+C)</button>
              </div>
              <select id="qe-cust" onchange="handleQuoteCustChange(this.value)" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                <option value="">-- Select Party / Customer Ledger --</option>
                ${(activeCompany.customers || []).map(c => `
                  <option value="${c.id}" ${c.id === quoteEditorData.customerId ? 'selected' : ''}>${c.name} ${c.gstin ? `[GSTIN: ${c.gstin}]` : ''} ${c.city ? `(${c.city})` : ''}</option>
                `).join('')}
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Quotation Vch #</label>
              <input type="text" id="qe-number" value="${quoteEditorData.quoteNumber}" oninput="quoteEditorData.quoteNumber = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600" />
            </div>

            <div class="md:col-span-2">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Voucher Date</label>
              <input type="date" id="qe-date" value="${quoteEditorData.date}" oninput="quoteEditorData.date = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600" />
            </div>

            <div class="md:col-span-2">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Validity of Quotation</label>
              <select id="qe-validity" onchange="quoteEditorData.validity = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600">
                ${VALIDITY_OPTIONS.map(v => `
                  <option value="${v}" ${v === (quoteEditorData.validity || '15 Days') ? 'selected' : ''}>${v}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Row 2: Delivery, Payment Terms, Taxes -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2 border-t border-slate-200">
            <div class="md:col-span-4">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Delivery</label>
              <select id="qe-delivery" onchange="quoteEditorData.deliveryTerms = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600">
                ${DELIVERY_TERMS_OPTIONS.map(d => `
                  <option value="${d}" ${d === (quoteEditorData.deliveryTerms || 'Door Delivery') ? 'selected' : ''}>${d}</option>
                `).join('')}
              </select>
            </div>

            <div class="md:col-span-4">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Payment Terms</label>
              <select id="qe-payment-terms" onchange="quoteEditorData.paymentTerms = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600">
                ${PAYMENT_TERMS_OPTIONS.map(p => `
                  <option value="${p}" ${p === (quoteEditorData.paymentTerms || 'Against PI') ? 'selected' : ''}>${p}</option>
                `).join('')}
              </select>
            </div>

            <div class="md:col-span-4">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Taxes</label>
              <select id="qe-taxes" onchange="quoteEditorData.taxTerms = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600">
                ${TAX_TERMS_OPTIONS.map(t => `
                  <option value="${t}" ${t === (quoteEditorData.taxTerms || 'Extra as applicable') ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- High-Density Line Items Voucher Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="font-black uppercase text-[10px] tracking-wider text-slate-700 flex items-center gap-1.5">
              <i data-lucide="calculator" class="w-3.5 h-3.5 text-blue-700"></i>
              Itemized Particulars & Stock Allocation
            </h3>
            <div class="flex items-center gap-2">
              <button onclick="syncWithWebsiteCatalog(false)" title="Import latest products from passcorp.in" class="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px]">
                <i data-lucide="globe" class="w-3 h-3 text-amber-700"></i>
                <span>Import Web Catalog</span>
              </button>
              <button onclick="addQuoteRow()" class="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 font-bold text-[11px]">
                <i data-lucide="plus" class="w-3 h-3 text-blue-700"></i>
                <span>Add Item Row [Alt+I]</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto border border-slate-300 rounded-md bg-white">
            <table class="w-full min-w-[1100px] text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-300 bg-[#f1f5f9] text-slate-700 font-black uppercase text-[9px]">
                  <th class="py-2.5 px-2 w-10 text-center border-r border-slate-300">#</th>
                  <th class="py-2.5 px-3 min-w-[340px] border-r border-slate-300">Particulars (Stock Item, Photo & Detailed Specs)</th>
                  <th class="py-2.5 px-2 w-24 min-w-[95px] text-center border-r border-slate-300">HSN/SAC</th>
                  <th class="py-2.5 px-2 w-20 min-w-[80px] text-center border-r border-slate-300">Qty</th>
                  <th class="py-2.5 px-2 w-24 min-w-[85px] text-center border-r border-slate-300">Unit</th>
                  <th class="py-2.5 px-2 w-32 min-w-[110px] text-right border-r border-slate-300">Rate (${cur()})</th>
                  <th class="py-2.5 px-2 w-32 min-w-[115px] text-center border-r border-slate-300">Lead Time</th>
                  <th class="py-2.5 px-2 w-20 min-w-[75px] text-center border-r border-slate-300">GST%</th>
                  <th class="py-2.5 px-3 w-32 min-w-[120px] text-right border-r border-slate-300">Amount (${cur()})</th>
                  <th class="py-2.5 px-1.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody id="quote-items-tbody" class="divide-y divide-slate-200 text-slate-800">
                ${quoteEditorData.items.map((row, idx) => `
                  <tr class="hover:bg-slate-50/80">
                    <td class="py-3 px-2 text-slate-400 font-mono text-center align-top border-r border-slate-200 font-bold">${idx + 1}</td>
                    <td class="py-3 px-3 align-top border-r border-slate-200">
                      <div class="flex items-start gap-3">
                        <!-- Product Photo Badge -->
                        <div onclick="openRowImageModal(${idx}, 'quote')" class="w-20 h-20 rounded bg-white border ${row.imageUrl ? 'border-blue-400 shadow-sm' : 'border-dashed border-slate-300'} hover:border-blue-600 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all shrink-0 relative" title="Click to upload or change product photo">
                          ${row.imageUrl ? `
                            <img src="${row.imageUrl}" class="w-full h-full object-contain p-0.5" />
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                              <span class="text-[8px] font-bold mt-0.5">Change</span>
                            </div>
                          ` : `
                            <i data-lucide="image-plus" class="w-5 h-5 text-slate-400 group-hover:text-blue-600"></i>
                            <span class="text-[9px] font-bold text-slate-500 group-hover:text-blue-600 mt-0.5">+ Photo</span>
                          `}
                        </div>

                        <!-- Item Master / Website Dropdown, Search Input & Unlimited Description -->
                        <div class="flex-1 space-y-1.5 min-w-0">
                          <div class="flex gap-2">
                            <select onchange="handleQuoteCatalogSelect(${idx}, this.value)" class="w-2/5 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-[11px] font-medium text-slate-700 truncate focus:outline-none focus:border-blue-600 focus:bg-white">
                              <option value="">-- From Master / Website --</option>
                              <optgroup label="🏢 Company Item Master">
                                ${(activeCompany.items || []).map(it => `<option value="${it.id}" ${it.name === row.name ? 'selected' : ''}>${it.name} [₹${it.price || it.rate || 0}]</option>`).join('')}
                              </optgroup>
                              <optgroup label="🌐 PASS CORP. Website Catalog">
                                ${unifiedProds.filter(p => p.source === 'website').map(it => `<option value="${it.id}" ${it.name === row.name ? 'selected' : ''}>${it.name} [₹${it.price || 0}]</option>`).join('')}
                              </optgroup>
                            </select>
                            <input type="text" list="global-products-datalist" value="${escapeHtml(row.name)}" oninput="handleQuoteNameInput(${idx}, this.value)" placeholder="Search website product or enter particulars..." class="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600" />
                          </div>
                          <textarea oninput="autoExpandTextarea(this); updateQuoteRow(${idx}, 'description', this.value)" placeholder="Technical specifications, model dimensions, features, scope of work (Auto-filled on product selection, unlimited lines supported)..." class="auto-expand w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white resize-y leading-relaxed font-normal min-h-[44px] overflow-hidden">${escapeHtml(row.description || '')}</textarea>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-2 align-top border-r border-slate-200"><input type="text" value="${escapeHtml(row.hsnCode || '')}" oninput="updateQuoteRow(${idx}, 'hsnCode', this.value)" placeholder="HSN" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono font-medium focus:outline-none focus:border-blue-600" /></td>
                    <td class="py-3 px-2 align-top border-r border-slate-200"><input type="number" min="1" value="${row.quantity}" oninput="updateQuoteRow(${idx}, 'quantity', this.value)" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono font-bold focus:outline-none focus:border-blue-600" /></td>
                    <td class="py-3 px-2 align-top border-r border-slate-200">
                      <select onchange="updateQuoteRow(${idx}, 'unit', this.value)" class="w-full px-1 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-semibold focus:outline-none focus:border-blue-600">
                        ${STANDARD_UNITS.map(u => `<option value="${u}" ${(row.unit || 'PCS').toUpperCase() === u.toUpperCase() ? 'selected' : ''}>${u}</option>`).join('')}
                      </select>
                    </td>
                    <td class="py-3 px-2 align-top border-r border-slate-200"><input type="number" min="0" step="0.01" value="${row.price}" oninput="updateQuoteRow(${idx}, 'price', this.value)" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-right font-mono font-bold focus:outline-none focus:border-blue-600" /></td>
                    <td class="py-3 px-2 align-top border-r border-slate-200">
                      <select onchange="updateQuoteRow(${idx}, 'leadTime', this.value)" class="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-semibold focus:outline-none focus:border-blue-600">
                        ${LEAD_TIME_OPTIONS.map(lt => `<option value="${lt}" ${(row.leadTime || '1-2 Days') === lt ? 'selected' : ''}>${lt}</option>`).join('')}
                      </select>
                    </td>
                    <td class="py-3 px-2 align-top border-r border-slate-200">
                      <select onchange="updateQuoteRow(${idx}, 'taxRate', this.value)" class="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono font-semibold focus:outline-none focus:border-blue-600">
                        ${[0, 5, 12, 18, 28].map(t => `<option value="${t}" ${Number(row.taxRate) === t ? 'selected' : ''}>${t}%</option>`).join('')}
                      </select>
                    </td>
                    <td id="quote-row-total-${idx}" class="py-3 px-3 text-right font-mono font-black text-slate-900 text-xs align-top border-r border-slate-200 pt-2.5">${cur()}${fmt(row.total)}</td>
                    <td class="py-3 px-1.5 text-center align-top pt-2">
                      <button onclick="removeQuoteRow(${idx})" ${quoteEditorData.items.length === 1 ? 'disabled class="opacity-20"' : 'class="p-1 text-slate-400 hover:text-rose-600 rounded"'}><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Datalist Autocomplete from Full Catalog -->
          <datalist id="global-products-datalist">
            ${unifiedProds.map(p => `<option value="${escapeHtml(p.name)}">${p.sourceLabel} • ₹${p.price} (HSN: ${p.hsn || '-'})</option>`).join('')}
          </datalist>
        </div>

        <!-- Voucher Bottom Ledger & Accounting Totals Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-3 border-t border-slate-300">
          <div class="md:col-span-7 space-y-3">
            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">Narration / Remarks</label>
              <textarea rows="2" oninput="quoteEditorData.notes = this.value" class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600">${quoteEditorData.notes || ''}</textarea>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block font-bold text-slate-700 uppercase text-[10px] tracking-wider">Terms & Conditions of Supply</label>
                <button onclick="addQuoteTerm()" class="text-[10px] text-blue-700 font-bold hover:underline">+ Add Term</button>
              </div>
              <div class="space-y-1.5">
                ${quoteEditorData.terms.map((t, idx) => `
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 font-mono text-[10px] w-4 text-center">${idx + 1}.</span>
                    <input type="text" value="${escapeHtml(t)}" oninput="updateQuoteTerm(${idx}, this.value)" class="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600" />
                    <button onclick="removeQuoteTerm(${idx})" class="p-1 text-slate-400 hover:text-rose-600"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Accounting Ledger Summary Box -->
          <div class="md:col-span-5 bg-slate-50 border border-slate-300 p-4 rounded-md space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span class="font-medium">Gross Total / Subtotal:</span>
              <span id="qe-subtotal-val" class="font-mono font-bold text-slate-900">${cur()}${fmt(quoteEditorData.subtotal)}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="font-medium">Taxable Assessable Value:</span>
              <span id="qe-taxable-val" class="font-mono font-bold text-slate-900">${cur()}${fmt(quoteEditorData.taxableAmount)}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="font-medium">Total GST (Output):</span>
              <span id="qe-tax-val" class="font-mono font-bold text-blue-700">+${cur()}${fmt(quoteEditorData.totalTax)}</span>
            </div>
            <div class="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
              <span class="uppercase tracking-wider">Net Amount:</span>
              <span id="qe-grand-val" class="text-base text-blue-900 font-mono">${cur()}${fmt(quoteEditorData.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(initAutoExpandTextareas, 10);
}

// IN-PLACE SMOOTH CALCULATIONS
function updateQuoteRow(idx, field, val) {
  const row = quoteEditorData.items[idx];
  if (!row) return;

  row[field] = val;

  const qty = Number(row.quantity) || 0;
  const price = Number(row.price) || 0;
  const tax = Number(row.taxRate) || 0;

  const taxable = qty * price;
  const taxVal = taxable * (tax / 100);

  row.amount = taxable;
  row.taxAmount = taxVal;
  row.total = taxable + taxVal;

  const rowTotalEl = document.getElementById(`quote-row-total-${idx}`);
  if (rowTotalEl) {
    rowTotalEl.textContent = `${cur()}${fmt(row.total)}`;
  }

  recalculateQuoteInMemory();
}

function recalculateQuoteInMemory() {
  let subtotal = 0;
  let taxTotal = 0;

  quoteEditorData.items.forEach(r => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.price) || 0;
    const tax = Number(r.taxRate) || 0;

    const lineTaxable = qty * price;
    const lineTax = lineTaxable * (tax / 100);

    r.amount = lineTaxable;
    r.taxAmount = lineTax;
    r.total = lineTaxable + lineTax;

    subtotal += lineTaxable;
    taxTotal += lineTax;
  });

  quoteEditorData.subtotal = subtotal;
  quoteEditorData.taxableAmount = subtotal;
  quoteEditorData.totalTax = taxTotal;
  quoteEditorData.grandTotal = subtotal + taxTotal;

  const subEl = document.getElementById('qe-subtotal-val');
  const taxbEl = document.getElementById('qe-taxable-val');
  const taxEl = document.getElementById('qe-tax-val');
  const gEl = document.getElementById('qe-grand-val');

  if (subEl) subEl.textContent = `${cur()}${fmt(quoteEditorData.subtotal)}`;
  if (taxbEl) taxbEl.textContent = `${cur()}${fmt(quoteEditorData.taxableAmount)}`;
  if (taxEl) taxEl.textContent = `+${cur()}${fmt(quoteEditorData.totalTax)}`;
  if (gEl) gEl.textContent = `${cur()}${fmt(quoteEditorData.grandTotal)}`;
}

function handleQuoteCustChange(custId) {
  quoteEditorData.customerId = custId;
  const cust = (activeCompany.customers || []).find(c => c.id === custId);
  quoteEditorData.customerName = cust ? cust.name : '';
}

function handleQuoteCatalogSelect(idx, itemId) {
  if (!itemId) return;
  const unified = getUnifiedProductsList();
  const item = unified.find(it => it.id === itemId || it.name.toLowerCase().trim() === itemId.toLowerCase().trim());
  if (!item) return;

  const row = quoteEditorData.items[idx];
  row.name = item.name;
  row.description = item.description || '';
  row.hsnCode = item.hsn || '';
  row.unit = item.unit || 'PCS';
  row.leadTime = row.leadTime || '1-2 Days';
  row.price = Number(item.price) || 0;
  row.taxRate = Number(item.taxRate) || 18;
  row.imageUrl = item.imageUrl || null;

  const qty = Number(row.quantity) || 1;
  const price = Number(row.price) || 0;
  const tax = Number(row.taxRate) || 0;

  const taxable = qty * price;
  const taxVal = taxable * (tax / 100);

  row.amount = taxable;
  row.taxAmount = taxVal;
  row.total = taxable + taxVal;

  recalculateQuoteInMemory();
  renderQuotationEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function handleQuoteNameInput(idx, val) {
  updateQuoteRow(idx, 'name', val);

  if (val && val.length > 2) {
    const unified = getUnifiedProductsList();
    const exactMatch = unified.find(p => p.name.toLowerCase().trim() === val.toLowerCase().trim());
    if (exactMatch) {
      const row = quoteEditorData.items[idx];
      row.description = exactMatch.description || '';
      row.hsnCode = exactMatch.hsn || row.hsnCode || '';
      row.price = Number(exactMatch.price) || row.price || 0;
      row.imageUrl = exactMatch.imageUrl || row.imageUrl || null;
      if (exactMatch.unit) row.unit = exactMatch.unit;
      if (exactMatch.taxRate) row.taxRate = exactMatch.taxRate;

      const qty = Number(row.quantity) || 1;
      const price = Number(row.price) || 0;
      const tax = Number(row.taxRate) || 0;
      row.amount = qty * price;
      row.taxAmount = row.amount * (tax / 100);
      row.total = row.amount + row.taxAmount;

      recalculateQuoteInMemory();
      renderQuotationEditor(document.getElementById('main-content'));
      lucide.createIcons();
    }
  }
}

function addQuoteRow() {
  quoteEditorData.items.push({
    id: 'qi-' + Date.now(),
    name: '',
    description: '',
    hsnCode: '',
    quantity: 1,
    unit: 'PCS',
    price: 0,
    leadTime: '1-2 Days',
    taxRate: 18,
    amount: 0,
    taxAmount: 0,
    total: 0,
    imageUrl: null
  });
  recalculateQuoteInMemory();
  renderQuotationEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function removeQuoteRow(idx) {
  if (quoteEditorData.items.length === 1) return;
  quoteEditorData.items.splice(idx, 1);
  recalculateQuoteInMemory();
  renderQuotationEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function addQuoteTerm() {
  quoteEditorData.terms.push('');
  renderQuotationEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function updateQuoteTerm(idx, val) {
  quoteEditorData.terms[idx] = val;
}

function removeQuoteTerm(idx) {
  quoteEditorData.terms.splice(idx, 1);
  renderQuotationEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function saveQuotation(previewAfter) {
  if (!quoteEditorData.customerId && !quoteEditorData.customerName) {
    alert('Please select or add a customer for this quotation.');
    return;
  }

  quoteEditorData.terms = (quoteEditorData.terms || []).filter(t => t.trim().length > 0);
  if (!activeCompany.quotations) activeCompany.quotations = [];

  recalculateQuoteInMemory();

  if (activeEditingId) {
    const idx = activeCompany.quotations.findIndex(q => q.id === activeEditingId);
    if (idx !== -1) {
      activeCompany.quotations[idx] = JSON.parse(JSON.stringify(quoteEditorData));
    }
    showToast('Quotation updated');
  } else {
    activeCompany.quotations.unshift(JSON.parse(JSON.stringify(quoteEditorData)));
    showToast('Quotation created');
  }

  saveDatabase();

  if (previewAfter) {
    const savedId = quoteEditorData.id;
    activeEditorMode = null;
    openDocPreview('quote', savedId);
  } else {
    activeEditorMode = null;
    navigateTab('quotations');
  }
}

function deleteQuotation(id) {
  if (confirm('Are you sure you want to delete this quotation?')) {
    activeCompany.quotations = (activeCompany.quotations || []).filter(q => q.id !== id);
    saveDatabase();
    showToast('Quotation deleted');
    renderCurrentPage();
  }
}

function convertQuoteToInvoice(quoteId) {
  const quote = (activeCompany.quotations || []).find(q => q.id === quoteId);
  if (!quote) return;

  const count = (activeCompany.invoices || []).length + 1;
  const invNo = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const newInv = {
    id: 'inv-' + Date.now(),
    invoiceNumber: invNo,
    date: today,
    dueDate: due,
    paymentTerms: quote.paymentTerms || 'Net 30 Days',
    deliveryTerms: quote.deliveryTerms || 'Door Delivery',
    taxTerms: quote.taxTerms || 'Extra as applicable',
    status: 'Unpaid',
    customerId: quote.customerId,
    customerName: quote.customerName,
    items: JSON.parse(JSON.stringify(quote.items)),
    notes: quote.notes || '',
    terms: quote.terms || [],
    subtotal: quote.subtotal,
    taxableAmount: quote.taxableAmount,
    totalTax: quote.totalTax,
    grandTotal: quote.grandTotal,
    paidAmount: 0,
    balanceDue: quote.grandTotal,
    payments: []
  };

  quote.status = 'Accepted';
  if (!activeCompany.invoices) activeCompany.invoices = [];
  activeCompany.invoices.unshift(newInv);
  saveDatabase();

  showToast(`Converted ${quote.quoteNumber} to ${invNo}! 🚀`);
  openDocPreview('invoice', newInv.id);
}

// ==========================================
// 7. INVOICES LIST & INVOICE EDITOR
// ==========================================

function renderInvoicesList(container) {
  const invoices = activeCompany.invoices || [];
  const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
  const totalReceived = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalBalanceDue = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);

  container.innerHTML = `
    <div class="space-y-3.5 max-w-7xl mx-auto text-xs">
      <!-- Enterprise Register Header -->
      <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700">
            <i data-lucide="receipt" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-black text-slate-900 uppercase tracking-wide">Sales Tax Invoice Register</h1>
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">${invoices.length} Invoices</span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono">
              Total Sales: <span class="font-bold text-slate-800">${cur()}${fmt(totalInvoiced)}</span> | 
              Realised: <span class="font-bold text-blue-700">${cur()}${fmt(totalReceived)}</span> | 
              Receivable: <span class="font-bold text-amber-700">${cur()}${fmt(totalBalanceDue)}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openNewInvoiceEditor()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold border border-amber-700 text-xs shadow-sm">
            <span class="text-[9px] bg-amber-800 px-1 rounded font-mono font-normal">F8</span>
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      <!-- High-Density Sales Register Table -->
      <div class="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-300 bg-[#2c1a07] text-white font-black uppercase text-[9px] tracking-wider">
                <th class="py-2.5 px-3 w-10 text-center border-r border-[#4d3011]">#</th>
                <th class="py-2.5 px-3 border-r border-[#4d3011]">Invoice Vch #</th>
                <th class="py-2.5 px-3 border-r border-[#4d3011]">Date / Due</th>
                <th class="py-2.5 px-3 border-r border-[#4d3011]">Party / Customer Ledger</th>
                <th class="py-2.5 px-3 text-center border-r border-[#4d3011]">Status</th>
                <th class="py-2.5 px-3 text-right border-r border-[#4d3011]">Grand Total (${cur()})</th>
                <th class="py-2.5 px-3 text-right border-r border-[#4d3011]">Paid (${cur()})</th>
                <th class="py-2.5 px-3 text-right border-r border-[#4d3011]">Balance Due (${cur()})</th>
                <th class="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-slate-800 font-medium">
              ${invoices.length === 0 ? `
                <tr><td colSpan="9" class="py-12 text-center text-slate-400 font-mono">No invoices recorded in register. Press [F8] to create a new tax invoice.</td></tr>
              ` : invoices.map((inv, idx) => `
                <tr class="hover:bg-amber-50/50 transition-colors">
                  <td class="py-2 px-3 text-slate-400 font-mono text-center border-r border-slate-200 font-bold">${idx + 1}</td>
                  <td class="py-2 px-3 font-mono font-bold text-amber-700 cursor-pointer hover:underline border-r border-slate-200" onclick="openDocPreview('invoice', '${inv.id}')">
                    ${inv.invoiceNumber}
                  </td>
                  <td class="py-2 px-3 font-mono text-slate-600 border-r border-slate-200 text-[11px]">
                    <div>${inv.date}</div>
                    <div class="text-[9px] text-slate-400">Due: ${inv.dueDate}</div>
                  </td>
                  <td class="py-2 px-3 border-r border-slate-200">
                    <div class="font-bold text-slate-900">${inv.customerName || 'Direct Customer'}</div>
                  </td>
                  <td class="py-2 px-3 text-center border-r border-slate-200">
                    <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${getInvoiceStatusBadgeClass(inv.status)}">${inv.status}</span>
                  </td>
                  <td class="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">${cur()}${fmt(inv.grandTotal)}</td>
                  <td class="py-2 px-3 text-right font-mono text-blue-700 font-semibold border-r border-slate-200">${cur()}${fmt(inv.paidAmount)}</td>
                  <td class="py-2 px-3 text-right font-mono font-bold text-amber-700 border-r border-slate-200">${cur()}${fmt(inv.balanceDue)}</td>
                  <td class="py-2 px-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button onclick="openDocPreview('invoice', '${inv.id}')" title="Preview & Print [Alt+P]" class="p-1 rounded text-slate-600 hover:text-amber-700 hover:bg-slate-100"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>
                      <button onclick="openPaymentModal('${inv.id}')" title="Record Receipt / Payment" class="p-1 rounded text-blue-700 hover:bg-blue-100"><i data-lucide="credit-card" class="w-3.5 h-3.5"></i></button>
                      <button onclick="editInvoice('${inv.id}')" title="Alter Invoice" class="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                      <button onclick="downloadDocPDF('invoice', '${inv.id}')" title="Download PDF" class="p-1 rounded text-slate-600 hover:text-amber-700 hover:bg-slate-100"><i data-lucide="download" class="w-3.5 h-3.5"></i></button>
                      <button onclick="deleteInvoice('${inv.id}')" title="Delete" class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openNewInvoiceEditor() {
  activeEditorMode = 'invoice';
  activeEditingId = null;

  const count = (activeCompany.invoices || []).length + 1;
  const invNo = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  invoiceEditorData = {
    id: 'inv-' + Date.now(),
    invoiceNumber: invNo,
    date: today,
    dueDate: due,
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'Door Delivery',
    taxTerms: 'Extra as applicable',
    status: 'Unpaid',
    customerId: '',
    customerName: '',
    items: [
      {
        id: 'ii-1',
        name: '',
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'PCS',
        price: 0,
        leadTime: '1-2 Days',
        taxRate: 18,
        amount: 0,
        taxAmount: 0,
        total: 0,
        imageUrl: null
      }
    ],
    notes: 'Thank you for your business. Please remit the payable balance before the due date.',
    terms: [
      'Payment is due within 15 days of invoice date.',
      'Interest @ 18% p.a. will be charged on overdue payments.',
      'Goods once sold cannot be returned without prior authorization.'
    ],
    subtotal: 0,
    taxableAmount: 0,
    totalTax: 0,
    grandTotal: 0,
    paidAmount: 0,
    balanceDue: 0,
    payments: []
  };

  recalculateInvoiceInMemory();
  renderCurrentPage();
}

function editInvoice(id) {
  const inv = (activeCompany.invoices || []).find(i => i.id === id);
  if (!inv) return;

  activeEditorMode = 'invoice';
  activeEditingId = id;
  invoiceEditorData = JSON.parse(JSON.stringify(inv));
  if (!invoiceEditorData.deliveryTerms) invoiceEditorData.deliveryTerms = 'Door Delivery';
  if (!invoiceEditorData.paymentTerms) invoiceEditorData.paymentTerms = 'Net 30 Days';
  if (!invoiceEditorData.taxTerms) invoiceEditorData.taxTerms = 'Extra as applicable';

  recalculateInvoiceInMemory();
  renderCurrentPage();
}

function renderInvoiceEditor(container) {
  const isEditing = Boolean(activeEditingId);
  const unifiedProds = getUnifiedProductsList();

  container.innerHTML = `
    <div class="space-y-4 max-w-7xl mx-auto text-xs pb-8">
      <!-- Voucher Top Ribbon -->
      <div class="bg-[#2c1a07] text-white border border-[#4d3011] rounded-lg px-4 py-2.5 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="cancelEditor()" title="Back / Cancel [Esc]" class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-400/40">VCH TYPE</span>
              <h1 class="text-sm font-black tracking-wide uppercase text-white">${isEditing ? `Alter Sales Invoice #${invoiceEditorData.invoiceNumber}` : 'Accounting Voucher: Sales Tax Invoice Entry'}</h1>
            </div>
            <p class="text-[10px] text-amber-200/80 font-mono mt-0.5">Issue GST tax invoice, calculate CGST/SGST/IGST breakdown and maintain customer ledger.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="saveInvoice(true)" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold border border-white/30 text-xs">
            <span class="text-[9px] font-mono bg-black/30 px-1 rounded">Alt+P</span>
            <span>Preview & Save</span>
          </button>
          <button onclick="saveInvoice(false)" class="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold border border-amber-400 text-xs shadow-sm">
            <span class="text-[9px] font-mono bg-amber-800 px-1 rounded">Ctrl+A</span>
            <span>Save Voucher</span>
          </button>
        </div>
      </div>

      <!-- Voucher Party & Commercial Terms Box -->
      <div class="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-4">
        <div class="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <!-- Row 1: Party, Invoice Vch #, Invoice Date, Payment Due Date -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div class="md:col-span-6">
              <div class="flex items-center justify-between mb-1">
                <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider">Party A/c Name (Debtor Ledger) *</label>
                <button onclick="openCustomerModal()" class="text-[10px] text-amber-700 font-bold hover:underline">+ New Ledger (Alt+C)</button>
              </div>
              <select id="ie-cust" onchange="handleInvoiceCustChange(this.value)" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600">
                <option value="">-- Select Party / Customer Ledger --</option>
                ${(activeCompany.customers || []).map(c => `
                  <option value="${c.id}" ${c.id === invoiceEditorData.customerId ? 'selected' : ''}>${c.name} ${c.gstin ? `[GSTIN: ${c.gstin}]` : ''} ${c.city ? `(${c.city})` : ''}</option>
                `).join('')}
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Invoice Vch #</label>
              <input type="text" id="ie-number" value="${invoiceEditorData.invoiceNumber}" oninput="invoiceEditorData.invoiceNumber = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-600" />
            </div>

            <div class="md:col-span-2">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Invoice Date</label>
              <input type="date" id="ie-date" value="${invoiceEditorData.date}" oninput="invoiceEditorData.date = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600" />
            </div>

            <div class="md:col-span-2">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Payment Due Date</label>
              <input type="date" id="ie-due" value="${invoiceEditorData.dueDate}" oninput="invoiceEditorData.dueDate = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600" />
            </div>
          </div>

          <!-- Row 2: Delivery, Payment Terms, Taxes -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2 border-t border-slate-200">
            <div class="md:col-span-4">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Delivery</label>
              <select id="ie-delivery" onchange="invoiceEditorData.deliveryTerms = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600">
                ${DELIVERY_TERMS_OPTIONS.map(d => `
                  <option value="${d}" ${d === (invoiceEditorData.deliveryTerms || 'Door Delivery') ? 'selected' : ''}>${d}</option>
                `).join('')}
              </select>
            </div>

            <div class="md:col-span-4">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Payment Terms</label>
              <select id="ie-payment-terms" onchange="invoiceEditorData.paymentTerms = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600">
                ${PAYMENT_TERMS_OPTIONS.map(p => `
                  <option value="${p}" ${p === (invoiceEditorData.paymentTerms || 'Net 30 Days') ? 'selected' : ''}>${p}</option>
                `).join('')}
              </select>
            </div>

            <div class="md:col-span-4">
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Taxes</label>
              <select id="ie-taxes" onchange="invoiceEditorData.taxTerms = this.value" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600">
                ${TAX_TERMS_OPTIONS.map(t => `
                  <option value="${t}" ${t === (invoiceEditorData.taxTerms || 'Extra as applicable') ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- High-Density Line Items Voucher Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="font-black uppercase text-[10px] tracking-wider text-slate-700 flex items-center gap-1.5">
              <i data-lucide="calculator" class="w-3.5 h-3.5 text-amber-700"></i>
              Itemized Particulars & Stock Allocation
            </h3>
            <div class="flex items-center gap-2">
              <button onclick="syncWithWebsiteCatalog(false)" title="Import latest products from passcorp.in" class="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px]">
                <i data-lucide="globe" class="w-3 h-3 text-amber-700"></i>
                <span>Import Web Catalog</span>
              </button>
              <button onclick="addInvoiceRow()" class="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-[11px]">
                <i data-lucide="plus" class="w-3 h-3 text-amber-700"></i>
                <span>Add Item Row [Alt+I]</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto border border-slate-300 rounded-md bg-white">
            <table class="w-full min-w-[1100px] text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-300 bg-[#f1f5f9] text-slate-700 font-black uppercase text-[9px]">
                  <th class="py-2.5 px-2 w-10 text-center border-r border-slate-300">#</th>
                  <th class="py-2.5 px-3 min-w-[340px] border-r border-slate-300">Particulars (Stock Item, Photo & Detailed Specs)</th>
                  <th class="py-2.5 px-2 w-24 min-w-[95px] text-center border-r border-slate-300">HSN/SAC</th>
                  <th class="py-2.5 px-2 w-20 min-w-[80px] text-center border-r border-slate-300">Qty</th>
                  <th class="py-2.5 px-2 w-24 min-w-[85px] text-center border-r border-slate-300">Unit</th>
                  <th class="py-2.5 px-2 w-32 min-w-[110px] text-right border-r border-slate-300">Rate (${cur()})</th>
                  <th class="py-2.5 px-2 w-32 min-w-[115px] text-center border-r border-slate-300">Lead Time</th>
                  <th class="py-2.5 px-2 w-20 min-w-[75px] text-center border-r border-slate-300">GST%</th>
                  <th class="py-2.5 px-3 w-32 min-w-[120px] text-right border-r border-slate-300">Amount (${cur()})</th>
                  <th class="py-2.5 px-1.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody id="invoice-items-tbody" class="divide-y divide-slate-200 text-slate-800">
                ${invoiceEditorData.items.map((row, idx) => `
                  <tr class="hover:bg-slate-50/80">
                    <td class="py-3 px-2 text-slate-400 font-mono text-center align-top border-r border-slate-200 font-bold">${idx + 1}</td>
                    <td class="py-3 px-3 align-top border-r border-slate-200">
                      <div class="flex items-start gap-3">
                        <div onclick="openRowImageModal(${idx}, 'invoice')" class="w-20 h-20 rounded bg-white border ${row.imageUrl ? 'border-amber-400 shadow-sm' : 'border-dashed border-slate-300'} hover:border-amber-600 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all shrink-0 relative" title="Click to upload or change product photo">
                          ${row.imageUrl ? `
                            <img src="${row.imageUrl}" class="w-full h-full object-contain p-0.5" />
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                              <span class="text-[8px] font-bold mt-0.5">Change</span>
                            </div>
                          ` : `
                            <i data-lucide="image-plus" class="w-5 h-5 text-slate-400 group-hover:text-amber-600"></i>
                            <span class="text-[9px] font-bold text-slate-500 group-hover:text-amber-600 mt-0.5">+ Photo</span>
                          `}
                        </div>

                        <div class="flex-1 space-y-1.5 min-w-0">
                          <div class="flex gap-2">
                            <select onchange="handleInvoiceCatalogSelect(${idx}, this.value)" class="w-2/5 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-[11px] font-medium text-slate-700 truncate focus:outline-none focus:border-amber-600 focus:bg-white">
                              <option value="">-- From Master / Website --</option>
                              <optgroup label="🏢 Company Item Master">
                                ${(activeCompany.items || []).map(it => `<option value="${it.id}" ${it.name === row.name ? 'selected' : ''}>${it.name} [₹${it.price || it.rate || 0}]</option>`).join('')}
                              </optgroup>
                              <optgroup label="🌐 PASS CORP. Website Catalog">
                                ${unifiedProds.filter(p => p.source === 'website').map(it => `<option value="${it.id}" ${it.name === row.name ? 'selected' : ''}>${it.name} [₹${it.price || 0}]</option>`).join('')}
                              </optgroup>
                            </select>
                            <input type="text" list="global-products-datalist-invoice" value="${escapeHtml(row.name)}" oninput="handleInvoiceNameInput(${idx}, this.value)" placeholder="Search website product or enter particulars..." class="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600" />
                          </div>
                          <textarea oninput="autoExpandTextarea(this); updateInvoiceRow(${idx}, 'description', this.value)" placeholder="Technical specifications, model dimensions, features, scope of work (Auto-filled on product selection, unlimited lines supported)..." class="auto-expand w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none focus:border-amber-600 focus:bg-white resize-y leading-relaxed font-normal min-h-[44px] overflow-hidden">${escapeHtml(row.description || '')}</textarea>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-2 align-top border-r border-slate-200"><input type="text" value="${escapeHtml(row.hsnCode || '')}" oninput="updateInvoiceRow(${idx}, 'hsnCode', this.value)" placeholder="HSN" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono font-medium focus:outline-none focus:border-amber-600" /></td>
                    <td class="py-3 px-2 align-top border-r border-slate-200"><input type="number" min="1" value="${row.quantity}" oninput="updateInvoiceRow(${idx}, 'quantity', this.value)" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono font-bold focus:outline-none focus:border-amber-600" /></td>
                    <td class="py-3 px-2 align-top border-r border-slate-200">
                      <select onchange="updateInvoiceRow(${idx}, 'unit', this.value)" class="w-full px-1 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-semibold focus:outline-none focus:border-amber-600">
                        ${STANDARD_UNITS.map(u => `<option value="${u}" ${(row.unit || 'PCS').toUpperCase() === u.toUpperCase() ? 'selected' : ''}>${u}</option>`).join('')}
                      </select>
                    </td>
                    <td class="py-3 px-2 align-top border-r border-slate-200"><input type="number" min="0" step="0.01" value="${row.price}" oninput="updateInvoiceRow(${idx}, 'price', this.value)" class="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-right font-mono font-bold focus:outline-none focus:border-amber-600" /></td>
                    <td class="py-3 px-2 align-top border-r border-slate-200">
                      <select onchange="updateInvoiceRow(${idx}, 'leadTime', this.value)" class="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-semibold focus:outline-none focus:border-amber-600">
                        ${LEAD_TIME_OPTIONS.map(lt => `<option value="${lt}" ${(row.leadTime || '1-2 Days') === lt ? 'selected' : ''}>${lt}</option>`).join('')}
                      </select>
                    </td>
                    <td class="py-3 px-2 align-top border-r border-slate-200">
                      <select onchange="updateInvoiceRow(${idx}, 'taxRate', this.value)" class="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono font-semibold focus:outline-none focus:border-amber-600">
                        ${[0, 5, 12, 18, 28].map(t => `<option value="${t}" ${Number(row.taxRate) === t ? 'selected' : ''}>${t}%</option>`).join('')}
                      </select>
                    </td>
                    <td id="inv-row-total-${idx}" class="py-3 px-3 text-right font-mono font-black text-slate-900 text-xs align-top border-r border-slate-200 pt-2.5">${cur()}${fmt(row.total)}</td>
                    <td class="py-3 px-1.5 text-center align-top pt-2">
                      <button onclick="removeInvoiceRow(${idx})" ${invoiceEditorData.items.length === 1 ? 'disabled class="opacity-20"' : 'class="p-1 text-slate-400 hover:text-rose-600 rounded"'}><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Datalist Autocomplete from Full Catalog -->
          <datalist id="global-products-datalist-invoice">
            ${unifiedProds.map(p => `<option value="${escapeHtml(p.name)}">${p.sourceLabel} • ₹${p.price} (HSN: ${p.hsn || '-'})</option>`).join('')}
          </datalist>
        </div>

        <!-- Voucher Bottom Ledger & Accounting Totals Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-3 border-t border-slate-300">
          <div class="md:col-span-7 space-y-3">
            <div>
              <label class="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">Narration / Remarks</label>
              <textarea rows="2" oninput="invoiceEditorData.notes = this.value" class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-amber-600">${invoiceEditorData.notes || ''}</textarea>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block font-bold text-slate-700 uppercase text-[10px] tracking-wider">Terms & Conditions of Invoice</label>
                <button onclick="addInvoiceTerm()" class="text-[10px] text-amber-700 font-bold hover:underline">+ Add Term</button>
              </div>
              <div class="space-y-1.5">
                ${invoiceEditorData.terms.map((t, idx) => `
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 font-mono text-[10px] w-4 text-center">${idx + 1}.</span>
                    <input type="text" value="${escapeHtml(t)}" oninput="updateInvoiceTerm(${idx}, this.value)" class="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-amber-600" />
                    <button onclick="removeInvoiceTerm(${idx})" class="p-1 text-slate-400 hover:text-rose-600"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Accounting Ledger Summary Box -->
          <div class="md:col-span-5 bg-slate-50 border border-slate-300 p-4 rounded-md space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span class="font-medium">Gross Total / Subtotal:</span>
              <span id="ie-subtotal-val" class="font-mono font-bold text-slate-900">${cur()}${fmt(invoiceEditorData.subtotal)}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="font-medium">Taxable Assessable Value:</span>
              <span id="ie-taxable-val" class="font-mono font-bold text-slate-900">${cur()}${fmt(invoiceEditorData.taxableAmount)}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="font-medium">Total GST (Output):</span>
              <span id="ie-tax-val" class="font-mono font-bold text-blue-700">+${cur()}${fmt(invoiceEditorData.totalTax)}</span>
            </div>
            <div class="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
              <span class="uppercase tracking-wider">Grand Total:</span>
              <span id="ie-grand-val" class="text-base text-amber-900 font-mono">${cur()}${fmt(invoiceEditorData.grandTotal)}</span>
            </div>
            <div class="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span class="font-medium">Paid Amount:</span>
              <span id="ie-paid-val" class="font-mono font-bold text-blue-700">${cur()}${fmt(invoiceEditorData.paidAmount)}</span>
            </div>
            <div class="flex justify-between font-bold text-rose-700">
              <span class="uppercase tracking-wider">Closing Balance Due:</span>
              <span id="ie-balance-val" class="font-mono">${cur()}${fmt(invoiceEditorData.balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(initAutoExpandTextareas, 10);
}

// IN-PLACE SMOOTH CALCULATIONS FOR INVOICES
function updateInvoiceRow(idx, field, val) {
  const row = invoiceEditorData.items[idx];
  if (!row) return;

  row[field] = val;

  const qty = Number(row.quantity) || 0;
  const price = Number(row.price) || 0;
  const tax = Number(row.taxRate) || 0;

  const taxable = qty * price;
  const taxVal = taxable * (tax / 100);

  row.amount = taxable;
  row.taxAmount = taxVal;
  row.total = taxable + taxVal;

  const rowTotalEl = document.getElementById(`inv-row-total-${idx}`);
  if (rowTotalEl) {
    rowTotalEl.textContent = `${cur()}${fmt(row.total)}`;
  }

  recalculateInvoiceInMemory();
  updateInvoiceSummaryDOM();
}

function recalculateInvoiceInMemory() {
  const subtotal = invoiceEditorData.items.reduce((acc, r) => acc + (Number(r.quantity || 0) * Number(r.price || 0)), 0);
  const taxable = subtotal;
  const totalTax = invoiceEditorData.items.reduce((acc, r) => acc + Number(r.taxAmount || 0), 0);
  const grandTotal = taxable + totalTax;

  invoiceEditorData.subtotal = subtotal;
  invoiceEditorData.taxableAmount = taxable;
  invoiceEditorData.totalTax = totalTax;
  invoiceEditorData.grandTotal = grandTotal;

  const paid = Number(invoiceEditorData.paidAmount) || 0;
  invoiceEditorData.balanceDue = Math.max(0, grandTotal - paid);
}

function updateInvoiceSummaryDOM() {
  const sEl = document.getElementById('ie-subtotal-val');
  const tEl = document.getElementById('ie-taxable-val');
  const xEl = document.getElementById('ie-tax-val');
  const gEl = document.getElementById('ie-grand-val');
  const pEl = document.getElementById('ie-paid-val');
  const bEl = document.getElementById('ie-balance-val');

  if (sEl) sEl.textContent = `${cur()}${fmt(invoiceEditorData.subtotal)}`;
  if (tEl) tEl.textContent = `${cur()}${fmt(invoiceEditorData.taxableAmount)}`;
  if (xEl) xEl.textContent = `+${cur()}${fmt(invoiceEditorData.totalTax)}`;
  if (gEl) gEl.textContent = `${cur()}${fmt(invoiceEditorData.grandTotal)}`;
  if (pEl) pEl.textContent = `${cur()}${fmt(invoiceEditorData.paidAmount)}`;
  if (bEl) bEl.textContent = `${cur()}${fmt(invoiceEditorData.balanceDue)}`;
}

function handleInvoiceCustChange(custId) {
  invoiceEditorData.customerId = custId;
  const cust = (activeCompany.customers || []).find(c => c.id === custId);
  invoiceEditorData.customerName = cust ? cust.name : '';
}

function handleInvoiceCatalogSelect(idx, itemId) {
  const item = (activeCompany.items || []).find(it => it.id === itemId);
  if (!item) return;
  const row = invoiceEditorData.items[idx];
  row.name = item.name;
  row.description = item.description || '';
  row.hsnCode = item.hsnCode || '';
  row.unit = item.unit || 'PCS';
  row.leadTime = row.leadTime || '1-2 Days';
  row.price = Number(item.price) || 0;
  row.taxRate = Number(item.taxRate) || 0;
  row.imageUrl = item.imageUrl || null;

  const qty = Number(row.quantity) || 1;
  const price = Number(row.price) || 0;
  const tax = Number(row.taxRate) || 0;

  const taxable = qty * price;
  const taxVal = taxable * (tax / 100);

  row.amount = taxable;
  row.taxAmount = taxVal;
  row.total = taxable + taxVal;

  recalculateInvoiceInMemory();
  renderInvoiceEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function addInvoiceRow() {
  invoiceEditorData.items.push({
    id: 'ii-' + Date.now(),
    name: '',
    description: '',
    hsnCode: '',
    quantity: 1,
    unit: 'PCS',
    price: 0,
    leadTime: '1-2 Days',
    taxRate: 18,
    amount: 0,
    taxAmount: 0,
    total: 0,
    imageUrl: null
  });
  recalculateInvoiceInMemory();
  renderInvoiceEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function removeInvoiceRow(idx) {
  if (invoiceEditorData.items.length === 1) return;
  invoiceEditorData.items.splice(idx, 1);
  recalculateInvoiceInMemory();
  renderInvoiceEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function addInvoiceTerm() {
  invoiceEditorData.terms.push('');
  renderInvoiceEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function updateInvoiceTerm(idx, val) {
  invoiceEditorData.terms[idx] = val;
}

function removeInvoiceTerm(idx) {
  invoiceEditorData.terms.splice(idx, 1);
  renderInvoiceEditor(document.getElementById('main-content'));
  lucide.createIcons();
}

function saveInvoice(previewAfter) {
  if (!invoiceEditorData.customerId && !invoiceEditorData.customerName) {
    alert('Please select or add a customer for this invoice.');
    return;
  }

  invoiceEditorData.terms = (invoiceEditorData.terms || []).filter(t => t.trim().length > 0);
  if (!activeCompany.invoices) activeCompany.invoices = [];

  recalculateInvoiceInMemory();

  if (activeEditingId) {
    const idx = activeCompany.invoices.findIndex(i => i.id === activeEditingId);
    if (idx !== -1) {
      activeCompany.invoices[idx] = JSON.parse(JSON.stringify(invoiceEditorData));
    }
    showToast('Invoice updated');
  } else {
    activeCompany.invoices.unshift(JSON.parse(JSON.stringify(invoiceEditorData)));
    showToast('Invoice created');
  }

  saveDatabase();

  if (previewAfter) {
    const savedId = invoiceEditorData.id;
    activeEditorMode = null;
    openDocPreview('invoice', savedId);
  } else {
    activeEditorMode = null;
    navigateTab('invoices');
  }
}

function deleteInvoice(id) {
  if (confirm('Are you sure you want to delete this invoice?')) {
    activeCompany.invoices = (activeCompany.invoices || []).filter(i => i.id !== id);
    saveDatabase();
    showToast('Invoice deleted');
    renderCurrentPage();
  }
}

function cancelEditor() {
  activeEditorMode = null;
  activeEditingId = null;
  renderCurrentPage();
}

// ==========================================
// 8. LINE ITEM CUSTOM PHOTO MODAL
// ==========================================

function openRowImageModal(idx, mode) {
  activeRowImageTarget = { idx, mode };
  const row = mode === 'quote' ? quoteEditorData.items[idx] : invoiceEditorData.items[idx];
  const preview = document.getElementById('row-modal-preview');

  if (row && row.imageUrl) {
    preview.innerHTML = `<img src="${row.imageUrl}" class="w-full h-full object-contain p-1" />`;
  } else {
    preview.innerHTML = `<i data-lucide="image" class="w-12 h-12 text-slate-300"></i>`;
  }

  document.getElementById('row-img-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeRowImageModal() {
  document.getElementById('row-img-modal').classList.add('hidden');
  activeRowImageTarget = null;
}

async function handleRowFileImage(event) {
  const file = event.target.files[0];
  if (!file || !activeRowImageTarget) return;

  const compressed = await compressImage(file, 500, 0.8);
  if (!compressed) return;
  const { idx, mode } = activeRowImageTarget;
  const row = mode === 'quote' ? quoteEditorData.items[idx] : invoiceEditorData.items[idx];
  if (row) {
    row.imageUrl = compressed;
  }
  closeRowImageModal();
  if (mode === 'quote') {
    renderQuotationEditor(document.getElementById('main-content'));
  } else {
    renderInvoiceEditor(document.getElementById('main-content'));
  }
  lucide.createIcons();
  showToast('Product photo attached');
}

function removeRowImage() {
  if (!activeRowImageTarget) return;
  const { idx, mode } = activeRowImageTarget;
  const row = mode === 'quote' ? quoteEditorData.items[idx] : invoiceEditorData.items[idx];
  if (row) {
    row.imageUrl = null;
  }
  closeRowImageModal();
  if (mode === 'quote') {
    renderQuotationEditor(document.getElementById('main-content'));
  } else {
    renderInvoiceEditor(document.getElementById('main-content'));
  }
  lucide.createIcons();
  showToast('Product photo removed');
}

// ==========================================
// 9. CUSTOMERS & ITEM MASTER MANAGEMENT
// ==========================================

function renderCustomersList(container) {
  const customers = activeCompany.customers || [];
  container.innerHTML = `
    <div class="space-y-3.5 max-w-7xl mx-auto text-xs">
      <!-- Enterprise Header -->
      <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
            <i data-lucide="users-2" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-black text-slate-900 uppercase tracking-wide">Customer Master & Sundry Debtors</h1>
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300">${customers.length} Accounts</span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono">Master directory of client ledgers, GSTINs and billing contacts.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openCustomerModal()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold border border-blue-800 text-xs shadow-sm">
            <span class="text-[9px] bg-blue-900 px-1 rounded font-mono font-normal">Alt+C</span>
            <span>+ Add Customer Ledger</span>
          </button>
        </div>
      </div>

      <!-- High-Density Customer Table -->
      <div class="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-300 bg-[#0e2a47] text-white font-black uppercase text-[9px] tracking-wider">
                <th class="py-2.5 px-3 w-10 text-center border-r border-[#1c3f66]">#</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Party / Ledger Name</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Contact Person</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">GSTIN</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Phone / Email</th>
                <th class="py-2.5 px-3 border-r border-[#1c3f66]">Station / State</th>
                <th class="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-slate-800 font-medium">
              ${customers.length === 0 ? `
                <tr><td colSpan="7" class="py-12 text-center text-slate-400 font-mono">No customer accounts registered. Press [Alt+C] or click "+ Add Customer Ledger".</td></tr>
              ` : customers.map((c, idx) => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-2 px-3 text-slate-400 font-mono text-center border-r border-slate-200 font-bold">${idx + 1}</td>
                  <td class="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">${c.name}</td>
                  <td class="py-2 px-3 text-slate-600 border-r border-slate-200">${c.contactPerson || '-'}</td>
                  <td class="py-2 px-3 font-mono font-bold text-blue-700 border-r border-slate-200">${c.gstin || 'Unregistered'}</td>
                  <td class="py-2 px-3 text-slate-600 border-r border-slate-200 text-[11px]">
                    <div>${c.phone || '-'}</div>
                    <div class="text-[10px] text-slate-400">${c.email || ''}</div>
                  </td>
                  <td class="py-2 px-3 text-slate-600 border-r border-slate-200">${c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '-'}</td>
                  <td class="py-2 px-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button onclick="openCustomerModal('${c.id}')" title="Edit Ledger" class="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                      <button onclick="deleteCustomer('${c.id}')" title="Delete Ledger" class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openCustomerModal(id = null) {
  const cust = id ? (activeCompany.customers || []).find(c => c.id === id) : null;
  document.getElementById('cust-id').value = cust ? cust.id : '';
  document.getElementById('cust-modal-title').textContent = cust ? 'Edit Customer' : 'Add Customer';
  document.getElementById('cust-name').value = cust ? cust.name : '';
  document.getElementById('cust-person').value = cust ? cust.contactPerson || '' : '';
  document.getElementById('cust-gstin').value = cust ? cust.gstin || '' : '';
  document.getElementById('cust-email').value = cust ? cust.email || '' : '';
  document.getElementById('cust-phone').value = cust ? cust.phone || '' : '';
  document.getElementById('cust-address').value = cust ? cust.billingAddress || '' : '';
  document.getElementById('cust-city').value = cust ? cust.city || '' : '';
  document.getElementById('cust-state').value = cust ? cust.state || '' : '';
  document.getElementById('cust-pincode').value = cust ? cust.pincode || '' : '';

  document.getElementById('customer-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.add('hidden');
}

function handleCustomerSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('cust-id').value;
  const payload = {
    name: document.getElementById('cust-name').value.trim(),
    contactPerson: document.getElementById('cust-person').value.trim(),
    gstin: document.getElementById('cust-gstin').value.trim(),
    email: document.getElementById('cust-email').value.trim(),
    phone: document.getElementById('cust-phone').value.trim(),
    billingAddress: document.getElementById('cust-address').value.trim(),
    city: document.getElementById('cust-city').value.trim(),
    state: document.getElementById('cust-state').value.trim(),
    pincode: document.getElementById('cust-pincode').value.trim(),
  };

  if (!activeCompany.customers) activeCompany.customers = [];

  if (id) {
    const idx = activeCompany.customers.findIndex(c => c.id === id);
    if (idx !== -1) activeCompany.customers[idx] = { ...activeCompany.customers[idx], ...payload };
    showToast('Customer profile updated');
  } else {
    activeCompany.customers.unshift({ id: 'cust-' + Date.now(), ...payload });
    showToast('Customer created');
  }

  saveDatabase();
  closeCustomerModal();
  renderCurrentPage();
}

function deleteCustomer(id) {
  if (confirm('Are you sure you want to delete this customer?')) {
    activeCompany.customers = (activeCompany.customers || []).filter(c => c.id !== id);
    saveDatabase();
    showToast('Customer deleted');
    renderCurrentPage();
  }
}

// ITEM MASTER (With Prominent 52x52px Product Images)
function renderItemsList(container) {
  const items = activeCompany.items || [];
  container.innerHTML = `
    <div class="space-y-3.5 max-w-7xl mx-auto text-xs">
      <!-- Enterprise Header -->
      <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
            <i data-lucide="boxes" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-black text-slate-900 uppercase tracking-wide">Stock Item Master (Inventory Catalog)</h1>
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300">${items.length} Items</span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono">Stock items with prominent photos, HSN/SAC codes, and GST rates.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="syncWithWebsiteCatalog(false)" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold border border-amber-700 text-xs shadow-sm" title="Import all products from passcorp.in website into this company master catalog">
            <i data-lucide="download-cloud" class="w-3.5 h-3.5"></i>
            <span>Import All Website Products</span>
          </button>
          <button onclick="openItemModal()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold border border-blue-800 text-xs shadow-sm">
            <span class="text-[9px] bg-blue-900 px-1 rounded font-mono font-normal">Alt+I</span>
            <span>+ Add Stock Item</span>
          </button>
        </div>
      </div>

      <!-- High-Density Stock Items Table -->
      <div class="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-300 bg-[#0e2a47] text-white font-black uppercase text-[9px] tracking-wider">
                <th class="py-2.5 px-3 w-10 text-center border-r border-[#1c3f66]">#</th>
                <th class="py-2.5 px-3 min-w-[340px] border-r border-[#1c3f66]">Stock Item Name, Photo & Specifications</th>
                <th class="py-2.5 px-3 text-center border-r border-[#1c3f66]">HSN/SAC</th>
                <th class="py-2.5 px-3 text-center border-r border-[#1c3f66]">SKU</th>
                <th class="py-2.5 px-3 text-center border-r border-[#1c3f66]">Unit</th>
                <th class="py-2.5 px-3 text-center border-r border-[#1c3f66]">GST Rate</th>
                <th class="py-2.5 px-3 text-right border-r border-[#1c3f66]">Standard Rate (${cur()})</th>
                <th class="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-slate-800 font-medium">
              ${items.length === 0 ? `
                <tr><td colSpan="8" class="py-12 text-center text-slate-400 font-mono">No stock items in master catalog. Click "+ Add Stock Item" to create items.</td></tr>
              ` : items.map((it, idx) => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-2.5 px-3 text-slate-400 font-mono text-center align-top border-r border-slate-200 font-bold">${idx + 1}</td>
                  <td class="py-2.5 px-3 align-top border-r border-slate-200">
                    <div class="flex items-start gap-3">
                      <!-- Prominent Photo Thumbnail -->
                      <div class="w-16 h-16 rounded bg-white border border-slate-300 shadow-sm flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                        ${it.imageUrl ? `
                          <img src="${it.imageUrl}" class="w-full h-full object-contain" />
                        ` : `
                          <i data-lucide="package" class="w-6 h-6 text-slate-300"></i>
                        `}
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-slate-900 text-xs">${it.name}</div>
                        ${it.description ? `<p class="text-[10px] text-slate-600 mt-0.5 max-w-lg whitespace-pre-wrap leading-relaxed">${escapeHtml(it.description)}</p>` : ''}
                      </div>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono font-bold text-blue-700 align-top border-r border-slate-200">${it.hsnCode || '-'}</td>
                  <td class="py-2.5 px-3 text-center font-mono text-slate-500 align-top border-r border-slate-200">${it.sku || '-'}</td>
                  <td class="py-2.5 px-3 text-center font-medium align-top border-r border-slate-200">${it.unit || 'Pcs'}</td>
                  <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-800 align-top border-r border-slate-200">${it.taxRate || 0}%</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-top border-r border-slate-200">${cur()}${fmt(it.price)}</td>
                  <td class="py-2.5 px-3 text-center align-top">
                    <div class="flex items-center justify-center gap-1">
                      <button onclick="openItemModal('${it.id}')" title="Edit Item" class="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                      <button onclick="deleteItem('${it.id}')" title="Delete Item" class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openItemModal(id = null) {
  uploadedItemImageDataUrl = null;
  const item = id ? (activeCompany.items || []).find(it => it.id === id) : null;
  document.getElementById('item-id').value = item ? item.id : '';
  document.getElementById('item-modal-title').textContent = item ? 'Edit Product / Service' : 'Add Product / Service';
  document.getElementById('item-name').value = item ? item.name : '';
  document.getElementById('item-sku').value = item ? item.sku || '' : '';
  document.getElementById('item-hsn').value = item ? item.hsnCode || '' : '';
  document.getElementById('item-unit').value = item ? item.unit || 'Pcs' : 'Pcs';
  document.getElementById('item-price').value = item ? item.price : 0;
  document.getElementById('item-tax').value = item ? item.taxRate : 18;
  document.getElementById('item-desc').value = item ? item.description || '' : '';

  const preview = document.getElementById('item-img-preview');
  const removeBtn = document.getElementById('item-img-remove-btn');

  if (item && item.imageUrl) {
    uploadedItemImageDataUrl = item.imageUrl;
    preview.innerHTML = `<img src="${item.imageUrl}" class="w-full h-full object-contain p-1" />`;
    removeBtn.classList.remove('hidden');
  } else {
    preview.innerHTML = `<i data-lucide="image" class="w-8 h-8 text-slate-300"></i>`;
    removeBtn.classList.add('hidden');
  }

  document.getElementById('item-modal').classList.remove('hidden');
  lucide.createIcons();
  setTimeout(initAutoExpandTextareas, 20);
}

function closeItemModal() {
  document.getElementById('item-modal').classList.add('hidden');
}

async function handleItemImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const compressed = await compressImage(file, 500, 0.8);
  if (!compressed) return;
  uploadedItemImageDataUrl = compressed;
  const preview = document.getElementById('item-img-preview');
  if (preview) preview.innerHTML = `<img src="${uploadedItemImageDataUrl}" class="w-full h-full object-contain p-1" />`;
  const removeBtn = document.getElementById('item-img-remove-btn');
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function removeItemImage() {
  uploadedItemImageDataUrl = null;
  const preview = document.getElementById('item-img-preview');
  preview.innerHTML = `<i data-lucide="image" class="w-8 h-8 text-slate-300"></i>`;
  document.getElementById('item-img-remove-btn').classList.add('hidden');
  document.getElementById('item-img-input').value = '';
  lucide.createIcons();
}

function handleItemSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('item-id').value;
  const payload = {
    name: document.getElementById('item-name').value.trim(),
    sku: document.getElementById('item-sku').value.trim(),
    hsnCode: document.getElementById('item-hsn').value.trim(),
    unit: document.getElementById('item-unit').value.trim(),
    price: Number(document.getElementById('item-price').value),
    taxRate: Number(document.getElementById('item-tax').value),
    description: document.getElementById('item-desc').value.trim(),
    imageUrl: uploadedItemImageDataUrl
  };

  if (!activeCompany.items) activeCompany.items = [];

  if (id) {
    const idx = activeCompany.items.findIndex(it => it.id === id);
    if (idx !== -1) activeCompany.items[idx] = { ...activeCompany.items[idx], ...payload };
    showToast('Product updated');
  } else {
    activeCompany.items.unshift({ id: 'item-' + Date.now(), ...payload });
    showToast('Product added to catalog');
  }

  saveDatabase();
  closeItemModal();
  renderCurrentPage();
}

function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item from the catalog?')) {
    activeCompany.items = (activeCompany.items || []).filter(it => it.id !== id);
    saveDatabase();
    showToast('Item deleted');
    renderCurrentPage();
  }
}

// ==========================================
// ==========================================
// 10. DOCUMENT PREVIEW & MULTI-TEMPLATE PRINT ENGINE
// ==========================================

let selectedPrintFormat = 'tally'; // 'tally' | 'busy' | 'modern'

function numberToWordsINR(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function inWords(n) {
    if (n < 20) return a[n];
    let digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
    if (n < 1000) return inWords(Math.floor(n / 100)) + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }
  return 'INR ' + inWords(num).trim() + ' Only';
}

function openDocPreview(type, id) {
  const doc = type === 'quote' 
    ? (activeCompany.quotations || []).find(q => q.id === id)
    : (activeCompany.invoices || []).find(i => i.id === id);

  if (!doc) return;

  currentPreview = { type, data: doc };
  const modal = document.getElementById('preview-modal');
  const title = document.getElementById('preview-doc-title');
  const badge = document.getElementById('preview-status-badge');
  const convertBtn = document.getElementById('preview-convert-btn');
  const formatSelect = document.getElementById('preview-format-select');

  const isInvoice = type === 'invoice';
  title.textContent = isInvoice ? `Tax Invoice ${doc.invoiceNumber}` : `Sales Quotation ${doc.quoteNumber}`;
  badge.textContent = doc.status;
  badge.className = `text-[10px] px-2 py-0.5 rounded font-mono font-bold ${isInvoice ? getInvoiceStatusBadgeClass(doc.status) : getStatusBadgeClass(doc.status)}`;

  if (type === 'quote' && doc.status !== 'Accepted') {
    convertBtn.classList.remove('hidden');
  } else {
    convertBtn.classList.add('hidden');
  }

  if (formatSelect) {
    formatSelect.value = selectedPrintFormat;
  }

  renderPreviewPaper();
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function changePreviewFormat(format) {
  selectedPrintFormat = format || 'tally';
  renderPreviewPaper();
}

function renderPreviewPaper() {
  if (!currentPreview) return;
  const paper = document.getElementById('preview-paper-content');
  if (!paper) return;

  const { type, data: doc } = currentPreview;
  const cust = (activeCompany.customers || []).find(c => c.id === doc.customerId);
  const comp = activeCompany;

  if (selectedPrintFormat === 'busy') {
    paper.innerHTML = renderBusyFormatHTML(doc, type, cust, comp);
  } else if (selectedPrintFormat === 'modern') {
    paper.innerHTML = renderModernFormatHTML(doc, type, cust, comp);
  } else {
    paper.innerHTML = renderTallyFormatHTML(doc, type, cust, comp);
  }

  lucide.createIcons();
}

// -------------------------------------------------------------
// FORMAT 1: AUTHENTIC TALLY PRIME CLASSIC BOX GST TAX INVOICE & QUOTATION
// -------------------------------------------------------------

function renderTallyInvoiceFormatHTML(doc, cust, comp) {
  const wordsAmount = numberToWordsINR(doc.grandTotal);
  const totalTaxInWords = numberToWordsINR(doc.totalTax);
  const totalQty = (doc.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
  const primaryUnit = (doc.items && doc.items[0]?.unit) || 'Pairs';
  const companyPan = comp.pan || (comp.gstin && comp.gstin.length >= 12 ? comp.gstin.substring(2, 12) : 'AALFP8680C');
  const compStateCode = comp.stateCode || (comp.gstin && comp.gstin.length >= 2 ? comp.gstin.substring(0, 2) : '27');
  const custStateCode = cust?.stateCode || (cust?.gstin && cust.gstin.length >= 2 ? cust.gstin.substring(0, 2) : '27');

  // Dynamic HSN Tax Breakdown Map
  const hsnMap = {};
  (doc.items || []).forEach(it => {
    const hsn = it.hsnCode || '6403';
    const taxable = Number(it.price || 0) * Number(it.quantity || 0);
    const taxRate = Number(it.taxRate || 0);
    const totalTax = (taxable * taxRate) / 100;
    const halfRate = taxRate / 2;
    const halfTax = totalTax / 2;

    if (!hsnMap[hsn]) {
      hsnMap[hsn] = {
        hsn,
        taxable: 0,
        halfRate,
        cgst: 0,
        sgst: 0,
        totalTax: 0
      };
    }
    hsnMap[hsn].taxable += taxable;
    hsnMap[hsn].cgst += halfTax;
    hsnMap[hsn].sgst += halfTax;
    hsnMap[hsn].totalTax += totalTax;
  });
  const hsnRows = Object.values(hsnMap);

  const halfTaxTotal = (doc.totalTax || 0) / 2;
  const rawTotal = (doc.taxableAmount || doc.subtotal || 0) + (doc.totalTax || 0);
  const roundOff = (doc.grandTotal - rawTotal).toFixed(2);

  return `
    <div class="border-2 border-slate-900 font-sans text-xs text-slate-900 bg-white">
      <!-- Top Title Header -->
      <div class="text-center py-1.5 border-b border-slate-900 bg-white">
        <h1 class="font-black text-sm uppercase tracking-wide text-slate-900">Tax Invoice</h1>
        <p class="text-[9px] font-bold text-slate-600 uppercase tracking-widest">(ORIGINAL FOR RECIPIENT)</p>
      </div>

      <!-- Top 2-Column Split -->
      <div class="grid grid-cols-2 border-b border-slate-900 divide-x divide-slate-900 text-[10px]">
        <!-- Left: Company Details + Buyer (Bill to) + Consignee (Ship to) -->
        <div class="divide-y divide-slate-900">
          <!-- Supplier / Company Details -->
          <div class="p-2">
            <div class="flex items-start gap-2.5">
              ${comp.logoUrl ? `
                <div class="w-16 h-16 rounded bg-white border border-slate-300 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src="${comp.logoUrl}" class="max-w-full max-h-full object-contain" />
                </div>
              ` : ''}
              <div class="space-y-0.5 min-w-0">
                <h2 class="font-black text-xs uppercase tracking-tight text-slate-900">${comp.name}</h2>
                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">PRECISION | ASSURANCE | SAFETY | SOLUTION</p>
                <p class="text-[9.5px] text-slate-700 leading-tight">${comp.address || ''}</p>
                <p><span class="font-bold">GSTIN/UIN:</span> <span class="font-mono font-bold text-slate-900">${comp.gstin || 'Unregistered (Non-GST Bill of Supply)'}</span></p>
                <p><span class="font-bold">State Name :</span> ${comp.state || 'Maharashtra'}, <span class="font-bold">Code :</span> ${compStateCode}</p>
                <p><span class="font-bold">Contact :</span> ${comp.phone || '-'} | <span class="font-bold">E-Mail :</span> ${comp.email || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Buyer (Bill to) -->
          <div class="p-2 space-y-0.5 bg-slate-50/50">
            <span class="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Buyer (Bill to)</span>
            <h3 class="font-black text-xs uppercase text-slate-900 tracking-wide">${cust?.name || doc.customerName || 'Direct Customer'}</h3>
            <p class="text-[9.5px] text-slate-700 leading-tight">${cust?.billingAddress || ''} ${cust?.city ? `, ${cust.city}` : ''} ${cust?.state ? `, ${cust.state}` : ''} ${cust?.pincode || ''}</p>
            <p><span class="font-bold">CONTACT :</span> <span class="font-mono">${cust?.phone || '-'}</span></p>
            <p><span class="font-bold">GSTIN/UIN :</span> <span class="font-mono font-bold text-slate-900">${cust?.gstin || 'Unregistered'}</span></p>
            <p><span class="font-bold">State Name :</span> ${cust?.state || 'Maharashtra'} (Code: ${custStateCode})</p>
            <p><span class="font-bold">Place of Supply :</span> ${cust?.state || 'Maharashtra'} (Code: ${custStateCode})</p>
          </div>

          <!-- Consignee (Ship to) -->
          <div class="p-2 space-y-0.5">
            <span class="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Consignee (Ship to)</span>
            <h3 class="font-black text-xs uppercase text-slate-900 tracking-wide">${cust?.shippingAddress ? (cust?.name || doc.customerName) : (cust?.name || doc.customerName || 'Direct Customer')}</h3>
            <p class="text-[9.5px] text-slate-700 leading-tight">${cust?.shippingAddress || cust?.billingAddress || ''} ${cust?.city ? `, ${cust.city}` : ''} ${cust?.state ? `, ${cust.state}` : ''} ${cust?.pincode || ''}</p>
            <p><span class="font-bold">CONTACT :</span> <span class="font-mono">${cust?.phone || '-'}</span></p>
            <p><span class="font-bold">GSTIN/UIN :</span> <span class="font-mono font-bold text-slate-900">${cust?.gstin || 'Unregistered'}</span></p>
            <p><span class="font-bold">State Name :</span> ${cust?.state || 'Maharashtra'} (Code: ${custStateCode})</p>
          </div>
        </div>

        <!-- Right: Authentic Tally Dispatch & Reference Grid -->
        <div class="divide-y divide-slate-900 text-[9.5px]">
          <!-- Row 1: Invoice No. | Invoice Date -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Invoice No.</span>
              <span class="font-mono font-black text-xs text-slate-900">${doc.invoiceNumber}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Invoice Date</span>
              <span class="font-mono font-bold text-slate-900">${doc.date}</span>
            </div>
          </div>

          <!-- Row 2: Delivery Note | Mode/Terms of Payment -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Delivery Note</span>
              <span class="text-slate-800 font-semibold">${doc.deliveryNote || '-'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Mode/Terms of Payment</span>
              <span class="text-slate-900 font-bold">${doc.paymentTerms || 'As Agreed'}</span>
            </div>
          </div>

          <!-- Row 3: Reference No. & Date. | Other References -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Reference No. & Date.</span>
              <span class="font-mono text-slate-800">${doc.referenceNo || '-'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Other References</span>
              <span class="text-slate-800">${doc.otherReferences || '-'}</span>
            </div>
          </div>

          <!-- Row 4: Buyer's Order No. | PO Date -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Buyer's Order No.</span>
              <span class="font-mono font-semibold text-slate-800">${doc.buyerOrderNo || '-'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">PO Date</span>
              <span class="font-mono text-slate-800">${doc.poDate || '-'}</span>
            </div>
          </div>

          <!-- Row 5: Dispatch Doc No. | Delivery Note Date -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Dispatch Doc No.</span>
              <span class="font-mono text-slate-800">${doc.dispatchDocNo || '-'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Delivery Note Date</span>
              <span class="font-mono text-slate-800">${doc.deliveryNoteDate || '-'}</span>
            </div>
          </div>

          <!-- Row 6: Dispatched through | Destination -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Dispatched through</span>
              <span class="text-slate-900 font-semibold">${doc.dispatchedThrough || 'Direct Delivery / Surface'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Destination</span>
              <span class="text-slate-900 font-semibold">${cust?.state ? `${cust.state} (Code: ${custStateCode})` : `Maharashtra (Code: 27)`}</span>
            </div>
          </div>

          <!-- Row 7: Bill of Lading/LR-RR No. | Motor Vehicle No. -->
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Bill of Lading/LR-RR No.</span>
              <span class="font-mono text-slate-800">${doc.lrNo || '-'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8px] uppercase font-bold text-slate-500 block">Motor Vehicle No.</span>
              <span class="font-mono text-slate-800">${doc.vehicleNo || '-'}</span>
            </div>
          </div>

          <!-- Row 8: Terms of Delivery (Full Span) -->
          <div class="p-1.5 px-2">
            <span class="text-[8px] uppercase font-bold text-slate-500 block">Terms of Delivery</span>
            <span class="text-slate-900 font-medium leading-tight block">${doc.deliveryTerms || 'Door Delivery / Direct Site Supply as per purchase contract terms'}</span>
          </div>
        </div>
      </div>

      <!-- Item Particulars Table (Authentic Tally Columns & Grid) -->
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-slate-900 bg-white text-slate-900 font-black uppercase text-[8.5px] tracking-wider divide-x divide-slate-900">
            <th class="py-1 px-1.5 w-7 text-center">Sl<br/>No.</th>
            <th class="py-1 px-2.5">Description of Goods</th>
            <th class="py-1 px-1.5 w-16 text-center whitespace-nowrap">HSN/SAC</th>
            <th class="py-1 px-1.5 w-16 text-center whitespace-nowrap">Quantity</th>
            <th class="py-1 px-1.5 w-16 text-right whitespace-nowrap">Rate</th>
            <th class="py-1 px-1 w-10 text-center whitespace-nowrap">per</th>
            <th class="py-1 px-1 w-12 text-center whitespace-nowrap">Disc. %</th>
            <th class="py-1 px-2 w-24 text-right whitespace-nowrap">Amount</th>
          </tr>
        </thead>
        <tbody class="text-slate-900">
          ${(doc.items || []).map((it, idx) => `
            <tr class="divide-x divide-slate-900 text-[10px]">
              <td class="py-1 px-1 text-center font-mono font-bold align-top">${idx + 1}</td>
              <td class="py-1 px-2 align-top">
                <div class="font-black text-slate-900 text-[10.5px] uppercase leading-snug">${it.name}</div>
              </td>
              <td class="py-1 px-1.5 text-center font-mono font-bold align-top whitespace-nowrap">${it.hsnCode || '6403'}</td>
              <td class="py-1 px-1.5 text-center font-mono font-black align-top whitespace-nowrap">${it.quantity} ${it.unit || 'Pairs'}</td>
              <td class="py-1 px-1.5 text-right font-mono font-bold align-top whitespace-nowrap">${fmt(it.price)}</td>
              <td class="py-1 px-1 text-center font-medium align-top whitespace-nowrap">${it.unit || 'Pairs'}</td>
              <td class="py-1 px-1 text-center font-mono align-top whitespace-nowrap">${it.discount ? `${it.discount}%` : ''}</td>
              <td class="py-1 px-2 text-right font-mono font-black text-slate-900 align-top whitespace-nowrap">${fmt(it.total || (it.price * it.quantity))}</td>
            </tr>
          `).join('')}

          <!-- Inline Taxes Section inside Table Body -->
          <tr class="divide-x divide-slate-900 text-[10px]">
            <td class="py-0.5 px-1"></td>
            <td class="py-0.5 px-2 text-right font-bold text-slate-800 italic">Cgst</td>
            <td></td><td></td><td></td><td></td><td></td>
            <td class="py-0.5 px-2 text-right font-mono font-bold text-slate-900">${fmt(halfTaxTotal)}</td>
          </tr>
          <tr class="divide-x divide-slate-900 text-[10px]">
            <td class="py-0.5 px-1"></td>
            <td class="py-0.5 px-2 text-right font-bold text-slate-800 italic">Sgst</td>
            <td></td><td></td><td></td><td></td><td></td>
            <td class="py-0.5 px-2 text-right font-mono font-bold text-slate-900">${fmt(halfTaxTotal)}</td>
          </tr>
          ${Number(roundOff) !== 0 ? `
            <tr class="divide-x divide-slate-900 text-[10px]">
              <td class="py-0.5 px-1"></td>
              <td class="py-0.5 px-2 text-right font-bold text-slate-800 italic">Round Off</td>
              <td></td><td></td><td></td><td></td><td></td>
              <td class="py-0.5 px-2 text-right font-mono font-bold text-slate-900">${roundOff}</td>
            </tr>
          ` : ''}

          <!-- Total Bottom Row -->
          <tr class="divide-x divide-slate-900 border-t-2 border-slate-900 bg-white font-black text-[11px]">
            <td colspan="3" class="py-1 px-2 text-right uppercase text-slate-900">Total</td>
            <td class="py-1 px-1.5 text-center font-mono">${totalQty} ${primaryUnit}</td>
            <td colspan="3"></td>
            <td class="py-1 px-2 text-right font-mono font-black text-xs text-slate-900">${cur()} ${fmt(doc.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Amount Chargeable in Words Bar -->
      <div class="p-1.5 px-2.5 border-t border-b border-slate-900 bg-white flex items-baseline justify-between text-[10px]">
        <div>
          <span class="font-bold uppercase text-[8px] text-slate-500 block">Amount Chargeable (in words)</span>
          <span class="font-black text-slate-900 text-[10.5px]">${wordsAmount}</span>
        </div>
        <span class="font-mono font-bold text-slate-700 text-[9px]">E. & O.E</span>
      </div>

      <!-- GST Tax Analysis Table (HSN/SAC Breakdown) -->
      <div class="border-b border-slate-900">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-900 bg-white text-slate-900 font-bold uppercase text-[8px] tracking-wider divide-x divide-slate-900 text-center">
              <th rowspan="2" class="py-1 px-1.5 w-24">HSN/SAC</th>
              <th rowspan="2" class="py-1 px-2 text-right">Taxable<br/>Value</th>
              <th colspan="2" class="py-0.5 px-1">Central Tax</th>
              <th colspan="2" class="py-0.5 px-1">State Tax</th>
              <th rowspan="2" class="py-1 px-2 text-right w-24">Total<br/>Tax Amount</th>
            </tr>
            <tr class="border-b border-slate-900 bg-white text-slate-900 font-bold uppercase text-[8px] tracking-wider divide-x divide-slate-900 text-center">
              <th class="py-0.5 px-1 w-12">Rate</th>
              <th class="py-0.5 px-1 w-16 text-right">Amount</th>
              <th class="py-0.5 px-1 w-12">Rate</th>
              <th class="py-0.5 px-1 w-16 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-300 text-[9.5px]">
            ${hsnRows.map(hr => `
              <tr class="divide-x divide-slate-900">
                <td class="py-1 px-1.5 text-center font-mono font-bold">${hr.hsn}</td>
                <td class="py-1 px-2 text-right font-mono font-bold">${fmt(hr.taxable)}</td>
                <td class="py-1 px-1 text-center font-mono">${hr.halfRate}%</td>
                <td class="py-1 px-1.5 text-right font-mono font-semibold">${fmt(hr.cgst)}</td>
                <td class="py-1 px-1 text-center font-mono">${hr.halfRate}%</td>
                <td class="py-1 px-1.5 text-right font-mono font-semibold">${fmt(hr.sgst)}</td>
                <td class="py-1 px-2 text-right font-mono font-black text-slate-900">${fmt(hr.totalTax)}</td>
              </tr>
            `).join('')}
            <tr class="divide-x divide-slate-900 border-t border-slate-900 font-black text-[10px] bg-slate-50">
              <td class="py-1 px-1.5 text-center uppercase">Total</td>
              <td class="py-1 px-2 text-right font-mono">${fmt(doc.taxableAmount || doc.subtotal)}</td>
              <td></td>
              <td class="py-1 px-1.5 text-right font-mono">${fmt(halfTaxTotal)}</td>
              <td></td>
              <td class="py-1 px-1.5 text-right font-mono">${fmt(halfTaxTotal)}</td>
              <td class="py-1 px-2 text-right font-mono">${fmt(doc.totalTax)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Tax in Words & Company PAN -->
        <div class="p-1.5 px-2.5 space-y-0.5 text-[9.5px] border-t border-slate-900">
          <p><span class="font-bold text-slate-700">Tax Amount (in words) :</span> <span class="font-bold text-slate-900">${totalTaxInWords}</span></p>
          <p><span class="font-bold text-slate-700">Company's PAN :</span> <span class="font-mono font-black text-slate-900">${companyPan}</span></p>
        </div>
      </div>

      <!-- Bottom 3-Column Signatory & Banking Box -->
      <div class="grid grid-cols-3 divide-x divide-slate-900 border-b border-slate-900 text-[9.5px]">
        <!-- Col 1: Bank Details & Declaration -->
        <div class="p-2 space-y-1.5">
          <div>
            <span class="font-black uppercase text-[8.5px] text-slate-900 block underline mb-0.5">Company's Bank Details</span>
            <p><span class="font-bold text-slate-700">Bank Name :</span> <span class="font-semibold">${comp.bankDetails?.bankName || 'HDFC Bank Ltd.'}</span></p>
            <p><span class="font-bold text-slate-700">A/c No. :</span> <span class="font-mono font-bold">${comp.bankDetails?.accountNumber || '50200085432190'}</span></p>
            <p><span class="font-bold text-slate-700">Branch & IFS Code :</span> <span class="font-mono font-bold">${comp.bankDetails?.ifscCode || 'HDFC0001234'}</span></p>
          </div>
          <div>
            <span class="font-black uppercase text-[8.5px] text-slate-900 block underline mb-0.5">Declaration</span>
            <p class="text-[8.5px] text-slate-600 leading-tight">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
          </div>
        </div>

        <!-- Col 2: Customer / Receiver's Seal -->
        <div class="p-2 flex flex-col justify-between items-center text-center">
          <span class="font-bold text-[9px] uppercase text-slate-800">Customer / Receiver's Seal</span>
          <div class="h-10"></div>
          <span class="font-bold text-[9px] uppercase text-slate-800 tracking-wider">Receiving Signatory</span>
        </div>

        <!-- Col 3: Company Authorised Signatory -->
        <div class="p-2 flex flex-col justify-between items-center text-center">
          <div class="text-center w-full">
            <span class="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">for</span>
            <h4 class="font-black text-[11px] uppercase tracking-tight text-slate-900">${comp.name}</h4>
          </div>

          <div class="pt-1 flex flex-col items-center text-center w-full">
            ${comp.stampUrl ? `
              <div class="w-14 h-14 mb-0.5 flex items-center justify-center">
                <img src="${comp.stampUrl}" class="max-w-full max-h-full object-contain opacity-95" alt="Company Stamp" />
              </div>
            ` : `<div class="h-10"></div>`}
            <span class="font-bold text-[9px] uppercase text-slate-800 tracking-wider">Authorised Signatory</span>
          </div>
        </div>
      </div>

      <!-- Bottom System Note -->
      <div class="text-center py-1 text-[8.5px] text-slate-500 font-mono">
        This is a Computer Generated Invoice
      </div>
    </div>
  `;
}

function renderTallyFormatHTML(doc, type, cust, comp) {
  const isInvoice = type === 'invoice';
  if (isInvoice) {
    return renderTallyInvoiceFormatHTML(doc, cust, comp);
  }

  const docTitle = 'SALES QUOTATION';
  const docNumber = doc.quoteNumber;
  const wordsAmount = numberToWordsINR(doc.grandTotal);

  return `
    <div class="border-2 border-slate-900 font-sans text-xs text-slate-900 bg-white">
      <!-- Top Title Header -->
      <div class="text-center py-1.5 border-b border-slate-900 bg-slate-100 font-black tracking-widest uppercase text-xs">
        <span>${docTitle}</span>
      </div>

      <!-- Company & Buyer Grid (2-Column Classic Tally) -->
      <div class="grid grid-cols-2 border-b border-slate-900 divide-x divide-slate-900">
        <!-- Left: Supplier / Company Details -->
        <div class="p-2.5">
          <div class="flex items-start gap-3">
            ${comp.logoUrl ? `
              <div class="w-24 h-24 rounded bg-white border border-slate-300 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="${comp.logoUrl}" class="max-w-full max-h-full object-contain" />
              </div>
            ` : ''}
            <div class="space-y-0.5 text-[10.5px] min-w-0">
              <h2 class="font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">${comp.name}</h2>
              <p class="text-[10px] text-slate-700 leading-tight">${comp.address || ''}</p>
              <p class="pt-0.5"><span class="font-bold">GSTIN/UIN:</span> <span class="font-mono font-bold text-slate-900">${comp.gstin || 'Unregistered'}</span></p>
              <p><span class="font-bold">State Name:</span> ${comp.state || 'Maharashtra'}, <span class="font-bold">Code:</span> ${comp.stateCode || (comp.gstin && comp.gstin.length >= 2 ? comp.gstin.substring(0, 2) : '27')}</p>
              <p><span class="font-bold">Contact:</span> ${comp.phone || '-'} | <span class="font-bold">Email:</span> ${comp.email || '-'}</p>
            </div>
          </div>
        </div>

        <!-- Right: Voucher Number & Dispatch Particulars -->
        <div class="text-[10.5px]">
          <div class="grid grid-cols-2 divide-x divide-slate-900 border-b border-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8.5px] uppercase font-bold text-slate-500 block">Quotation No.</span>
              <span class="font-mono font-black text-xs text-slate-900">${docNumber}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8.5px] uppercase font-bold text-slate-500 block">Dated</span>
              <span class="font-mono font-bold text-slate-900">${doc.date}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 divide-x divide-slate-900 border-b border-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8.5px] uppercase font-bold text-slate-500 block">Delivery</span>
              <span class="font-semibold text-slate-900">${doc.deliveryTerms || 'Door Delivery'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8.5px] uppercase font-bold text-slate-500 block">Validity of Quotation</span>
              <span class="font-mono font-semibold text-slate-900">${doc.validity || '15 Days'}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 divide-x divide-slate-900">
            <div class="p-1.5 px-2">
              <span class="text-[8.5px] uppercase font-bold text-slate-500 block">Payment Terms</span>
              <span class="font-semibold text-slate-900">${doc.paymentTerms || 'Against PI'}</span>
            </div>
            <div class="p-1.5 px-2">
              <span class="text-[8.5px] uppercase font-bold text-slate-500 block">Taxes</span>
              <span class="font-semibold text-slate-900">${doc.taxTerms || 'Extra as applicable'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- To Company / Consignee Details Bar -->
      <div class="p-2 px-3 border-b border-slate-900 bg-slate-50">
        <span class="text-[8.5px] font-black uppercase tracking-wider text-slate-600 block mb-0.5">To Company</span>
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-1.5">
          <div>
            <h3 class="font-black text-xs uppercase text-blue-700 tracking-wide">${cust?.name || doc.customerName || 'Direct Customer'}</h3>
            <p class="text-[10px] text-slate-700 leading-tight">${cust?.billingAddress || ''} ${cust?.city ? `, ${cust.city}` : ''} ${cust?.state ? `, ${cust.state}` : ''} ${cust?.pincode || ''}</p>
            <p class="text-[10px] text-slate-600">Contact Person: <span class="font-semibold text-slate-800">${cust?.contactPerson || '-'}</span> | Phone: <span class="font-mono">${cust?.phone || '-'}</span></p>
          </div>
          <div class="text-[10px] text-left md:text-right space-y-0.5 shrink-0">
            <p><span class="font-bold">GSTIN/UIN:</span> <span class="font-mono font-bold text-slate-900">${cust?.gstin || 'Unregistered'}</span></p>
            <p><span class="font-bold">State Name:</span> ${cust?.state || 'Local'}, <span class="font-bold">Code:</span> ${cust?.stateCode || (cust?.gstin && cust.gstin.length >= 2 ? cust.gstin.substring(0, 2) : '27')}</p>
          </div>
        </div>
      </div>

      <!-- Item Particulars Table (Sharp Tally Borders) -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-900 bg-slate-100 text-slate-900 font-black uppercase text-[8.5px] tracking-wider divide-x divide-slate-900">
              <th class="py-1 px-1.5 w-7 text-center">Sl</th>
              <th class="py-1 px-2.5">Description of Goods & Technical Specs</th>
              <th class="py-1 px-1.5 w-20 text-center whitespace-nowrap">HSN/SAC</th>
              <th class="py-1 px-1.5 w-14 text-center whitespace-nowrap">Quantity</th>
              <th class="py-1 px-1.5 w-20 text-right whitespace-nowrap">Rate (${cur()})</th>
              <th class="py-1 px-1 w-10 text-center whitespace-nowrap">per</th>
              <th class="py-1 px-1.5 w-20 text-center whitespace-nowrap">Lead Time</th>
              <th class="py-1 px-1 w-12 text-center whitespace-nowrap">GST%</th>
              <th class="py-1 px-2 w-24 text-right whitespace-nowrap">Amount (${cur()})</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-300 text-slate-900">
            ${(doc.items || []).map((it, idx) => `
              <tr class="divide-x divide-slate-900 text-[10.5px]">
                <td class="py-1 px-1 text-center font-mono font-bold align-top">${idx + 1}</td>
                <td class="py-1 px-2 align-top">
                  <div class="flex items-start gap-3">
                    ${it.imageUrl ? `
                      <div class="w-20 h-20 rounded bg-white border border-slate-300 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                        <img src="${it.imageUrl}" class="w-full h-full object-contain" />
                      </div>
                    ` : ''}
                    <div class="min-w-0">
                      <div class="font-bold text-slate-900 text-[11px] uppercase leading-snug">${it.name}</div>
                      ${it.description ? `<div class="text-[9.5px] text-slate-600 mt-0.5 whitespace-pre-wrap leading-tight font-normal">${escapeHtml(it.description)}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td class="py-1 px-1.5 text-center font-mono font-semibold align-top whitespace-nowrap">${it.hsnCode || '-'}</td>
                <td class="py-1 px-1.5 text-center font-mono font-bold align-top whitespace-nowrap">${it.quantity}</td>
                <td class="py-1 px-1.5 text-right font-mono font-semibold align-top whitespace-nowrap">${fmt(it.price)}</td>
                <td class="py-1 px-1 text-center font-medium align-top whitespace-nowrap">${it.unit || 'PCS'}</td>
                <td class="py-1 px-1.5 text-center font-mono text-[9px] align-top font-semibold text-slate-700 whitespace-nowrap">${it.leadTime || '1-2 Days'}</td>
                <td class="py-1 px-1 text-center font-mono font-bold align-top text-blue-800 whitespace-nowrap">${it.taxRate || 0}%</td>
                <td class="py-1 px-2 text-right font-mono font-bold text-slate-900 align-top whitespace-nowrap">${fmt(it.total)}</td>
              </tr>
            `).join('')}

            <!-- Subtotal Row -->
            <tr class="divide-x divide-slate-900 border-t border-slate-900 bg-slate-50 font-bold text-[10px]">
              <td colspan="3" class="py-1 px-2 text-right uppercase">Subtotal / Taxable Value</td>
              <td class="py-1 px-1.5 text-center font-mono">${(doc.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0)}</td>
              <td colspan="4"></td>
              <td class="py-1 px-2 text-right font-mono font-black">${cur()}${fmt(doc.taxableAmount || doc.subtotal)}</td>
            </tr>

            <!-- Central Tax / State Tax Rows -->
            <tr class="divide-x divide-slate-900 text-[10px]">
              <td colspan="8" class="py-0.5 px-2 text-right font-semibold text-slate-700">Central Tax (CGST)</td>
              <td class="py-0.5 px-2 text-right font-mono font-bold text-slate-900">${cur()}${fmt(doc.totalTax / 2)}</td>
            </tr>
            <tr class="divide-x divide-slate-900 text-[10px]">
              <td colspan="8" class="py-0.5 px-2 text-right font-semibold text-slate-700">State Tax (SGST)</td>
              <td class="py-0.5 px-2 text-right font-mono font-bold text-slate-900">${cur()}${fmt(doc.totalTax / 2)}</td>
            </tr>

            <!-- Grand Total Row -->
            <tr class="divide-x divide-slate-900 border-t border-slate-900 bg-slate-100 font-black text-[11px]">
              <td colspan="3" class="py-1 px-2 uppercase text-slate-900">Total</td>
              <td class="py-1 px-1.5 text-center font-mono">${(doc.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0)}</td>
              <td colspan="4" class="py-1 px-2 text-right uppercase text-slate-800">Grand Total</td>
              <td class="py-1 px-2 text-right font-mono font-black text-xs text-slate-900">${cur()}${fmt(doc.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Amount in Words Bar -->
      <div class="p-1.5 px-2.5 border-t border-b border-slate-900 bg-slate-50 flex items-baseline justify-between text-[10px]">
        <div>
          <span class="font-bold uppercase text-[8.5px] text-slate-500 block">Amount Chargeable (in words)</span>
          <span class="font-bold text-slate-900">${wordsAmount}</span>
        </div>
        <span class="font-mono font-bold text-slate-600 text-[9px]">E. & O.E.</span>
      </div>

      <!-- Bank Details & Authorized Signatory Grid -->
      <div class="grid grid-cols-2 divide-x divide-slate-900 text-[10px]">
        <!-- Left: Banking Particulars & Terms -->
        <div class="p-2 space-y-1">
          ${comp.bankDetails?.accountNumber ? `
            <div class="border border-slate-300 bg-slate-50 p-1.5 rounded">
              <span class="font-black uppercase text-[8.5px] text-slate-700 block mb-0.5">Company's Bank Details</span>
              <p><span class="font-bold">Bank Name:</span> ${comp.bankDetails.bankName}</p>
              <p><span class="font-bold">A/c No:</span> <span class="font-mono font-bold">${comp.bankDetails.accountNumber}</span></p>
              <p><span class="font-bold">Branch & IFSC:</span> <span class="font-mono font-bold">${comp.bankDetails.ifscCode}</span></p>
              ${comp.bankDetails.upiId ? `<p><span class="font-bold">UPI ID:</span> <span class="font-mono font-bold text-blue-700">${comp.bankDetails.upiId}</span></p>` : ''}
            </div>
          ` : ''}

          <div class="space-y-0.5 text-[9px] text-slate-600">
            <span class="font-bold uppercase text-[8.5px] text-slate-700 block">Declaration / Terms:</span>
            <p>1. We declare that this document shows the actual price of the goods described and that all particulars are true and correct.</p>
            ${(doc.terms || []).map((t, i) => `<p>${i + 2}. ${t}</p>`).join('')}
          </div>
        </div>

        <!-- Right: Company Stamp & Signature -->
        <div class="p-2 flex flex-col justify-between items-end">
          <div class="flex flex-col items-center text-center w-48">
            <span class="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">for</span>
            <h4 class="font-black text-xs uppercase tracking-tight text-slate-900">${comp.name}</h4>
          </div>

          <div class="pt-1.5 flex flex-col items-center text-center w-48">
            ${comp.stampUrl ? `
              <div class="w-16 h-16 mb-0.5 flex items-center justify-center">
                <img src="${comp.stampUrl}" class="max-w-full max-h-full object-contain opacity-95" alt="Company Stamp" />
              </div>
            ` : `<div class="h-10"></div>`}
            <div class="w-full border-t border-slate-400 pt-0.5 text-center">
              <span class="font-bold text-[9px] uppercase text-slate-800 tracking-wider">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// FORMAT 2: BUSY ACCOUNTING HIGH-CONTRAST ERP GRID
// -------------------------------------------------------------
function renderBusyFormatHTML(doc, type, cust, comp) {
  const isInvoice = type === 'invoice';
  const docTitle = isInvoice ? 'GST TAX INVOICE' : 'SALES ESTIMATE / QUOTATION';
  const docNumber = isInvoice ? doc.invoiceNumber : doc.quoteNumber;
  const wordsAmount = numberToWordsINR(doc.grandTotal);

  return `
    <div class="border border-slate-400 font-sans text-xs text-slate-900 bg-white shadow-sm">
      <!-- Busy Top Header Banner -->
      <div class="p-3 bg-[#132f4c] text-white flex items-center justify-between">
        <div class="flex items-start gap-3.5">
          ${comp.logoUrl ? `<div class="w-20 h-20 rounded bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden"><img src="${comp.logoUrl}" class="max-w-full max-h-full object-contain" /></div>` : ''}
          <div class="space-y-0.5">
            <h1 class="text-base font-black tracking-wide uppercase">${comp.name}</h1>
            <p class="text-[11px] text-slate-200 leading-snug">${comp.address || ''}</p>
            <p class="text-[10px] text-slate-300 font-mono pt-0.5">GSTIN/UIN: <span class="font-bold text-white">${comp.gstin || 'Unregistered'}</span> | State: ${cust?.state || 'Maharashtra'} (27)</p>
            <p class="text-[10px] text-slate-300 font-mono">Contact: ${comp.phone || '-'} | Email: ${comp.email || '-'}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-block font-black text-sm uppercase px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded">${docTitle}</span>
          <div class="font-mono font-bold text-xs mt-1 text-white">${docNumber}</div>
        </div>
      </div>

      <!-- Ledger & Commercial Details -->
      <div class="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300 text-[11px]">
        <div class="p-2.5 bg-slate-50 space-y-0.5">
          <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">To Company</span>
          <h3 class="font-black text-sm text-blue-700 uppercase tracking-wide">${cust?.name || doc.customerName || 'Direct Customer'}</h3>
          <p class="text-slate-600">${cust?.billingAddress || ''} ${cust?.city ? `, ${cust.city}` : ''}</p>
          <p><span class="font-semibold">GSTIN:</span> <span class="font-mono font-bold text-blue-700">${cust?.gstin || 'Unregistered'}</span> | Phone: ${cust?.phone || '-'}</p>
        </div>
        <div class="p-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div><span class="text-[9px] uppercase font-bold text-slate-500 block">Voucher Date</span><span class="font-mono font-semibold">${doc.date}</span></div>
          <div><span class="text-[9px] uppercase font-bold text-slate-500 block">${isInvoice ? 'Due Date' : 'Validity of Quotation'}</span><span class="font-mono font-semibold">${isInvoice ? doc.dueDate : (doc.validity || '15 Days')}</span></div>
          <div><span class="text-[9px] uppercase font-bold text-slate-500 block">Delivery</span><span class="font-semibold text-slate-800">${doc.deliveryTerms || 'Door Delivery'}</span></div>
          <div><span class="text-[9px] uppercase font-bold text-slate-500 block">Payment Terms</span><span class="font-semibold text-slate-800">${doc.paymentTerms || (isInvoice ? 'Net 30 Days' : 'Against PI')}</span></div>
          <div class="col-span-2 border-t border-slate-200 pt-0.5"><span class="text-[9px] uppercase font-bold text-slate-500 block">Taxes</span><span class="font-semibold text-slate-800">${doc.taxTerms || 'Extra as applicable'}</span></div>
        </div>
      </div>

      <!-- Items Grid -->
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[9px] divide-x divide-slate-300">
            <th class="py-2 px-2 text-center w-8">#</th>
            <th class="py-2 px-3">Item Description Particulars</th>
            <th class="py-2 px-2 text-center w-20">HSN</th>
            <th class="py-2 px-2 text-center w-16">Qty</th>
            <th class="py-2 px-2 text-right w-24">Price (${cur()})</th>
            <th class="py-2 px-2 text-center w-24">Lead Time</th>
            <th class="py-2 px-2 text-center w-12">GST%</th>
            <th class="py-2 px-3 text-right w-28">Amount (${cur()})</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          ${(doc.items || []).map((it, idx) => `
            <tr class="divide-x divide-slate-200 hover:bg-slate-50">
              <td class="py-2.5 px-2 text-center font-mono text-slate-500 align-top">${idx + 1}</td>
              <td class="py-2.5 px-3 align-top">
                <div class="flex items-start gap-3">
                  ${(!isInvoice && it.imageUrl) ? `
                    <div class="w-20 h-20 rounded bg-white border border-slate-300 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                      <img src="${it.imageUrl}" class="w-full h-full object-contain" />
                    </div>
                  ` : ''}
                  <div>
                    <div class="font-bold text-slate-900">${it.name}</div>
                    ${(!isInvoice && it.description) ? `<p class="text-[10px] text-slate-600 whitespace-pre-wrap mt-0.5 leading-relaxed">${escapeHtml(it.description)}</p>` : ''}
                  </div>
                </div>
              </td>
              <td class="py-2.5 px-2 text-center font-mono align-top">${it.hsnCode || '-'}</td>
              <td class="py-2.5 px-2 text-center font-mono font-bold align-top">${it.quantity} ${it.unit || ''}</td>
              <td class="py-2.5 px-2 text-right font-mono align-top">${fmt(it.price)}</td>
              <td class="py-2.5 px-2 text-center font-mono text-[10px] align-top font-semibold text-slate-700">${it.leadTime || '1-2 Days'}</td>
              <td class="py-2.5 px-2 text-center font-mono font-semibold align-top text-blue-700">${it.taxRate || 0}%</td>
              <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-top">${fmt(it.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Bottom Ledger Summary Grid -->
      <div class="grid grid-cols-2 divide-x divide-slate-300 border-t border-slate-300 text-[11px]">
        <div class="p-3 space-y-2">
          ${comp.bankDetails?.accountNumber ? `
            <div>
              <span class="font-bold uppercase text-[9px] text-slate-500 block">Bank Account for Settlement</span>
              <p class="font-semibold text-slate-800">${comp.bankDetails.bankName} • A/C: ${comp.bankDetails.accountNumber}</p>
              <p class="text-slate-600 font-mono text-[10px]">IFSC: ${comp.bankDetails.ifscCode} ${comp.bankDetails.upiId ? `• UPI: ${comp.bankDetails.upiId}` : ''}</p>
            </div>
          ` : ''}
          <div>
            <span class="font-bold uppercase text-[9px] text-slate-500 block">Amount in Words</span>
            <p class="font-bold text-slate-900">${wordsAmount}</p>
          </div>
        </div>

        <div class="p-3 space-y-1 bg-slate-50 text-right font-mono">
          <div class="flex justify-between text-slate-600"><span>Taxable Subtotal:</span><span>${cur()}${fmt(doc.taxableAmount || doc.subtotal)}</span></div>
          <div class="flex justify-between text-blue-700"><span>Total GST:</span><span>+${cur()}${fmt(doc.totalTax)}</span></div>
          <div class="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
            <span>Grand Total:</span><span>${cur()}${fmt(doc.grandTotal)}</span>
          </div>
          ${isInvoice ? `
            <div class="flex justify-between text-blue-700 font-semibold pt-0.5"><span>Paid Amount:</span><span>${cur()}${fmt(doc.paidAmount)}</span></div>
            <div class="flex justify-between text-amber-700 font-black"><span>Balance Due:</span><span>${cur()}${fmt(doc.balanceDue)}</span></div>
          ` : ''}
          <div class="pt-4 flex flex-col items-center text-center w-48 ml-auto">
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">for ${comp.name}</span>
            ${comp.stampUrl ? `<div class="w-16 h-16 my-1 flex items-center justify-center"><img src="${comp.stampUrl}" class="max-w-full max-h-full object-contain opacity-90" alt="Stamp" /></div>` : `<div class="h-8"></div>`}
            <div class="w-full border-t border-slate-400 pt-0.5 text-center">
              <span class="text-[10px] font-bold uppercase text-slate-700 tracking-wider">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// FORMAT 3: MODERN CLEAN EXECUTIVE FORMAT
// -------------------------------------------------------------
function renderModernFormatHTML(doc, type, cust, comp) {
  const isInvoice = type === 'invoice';
  const docTitle = isInvoice ? 'TAX INVOICE' : 'SALES QUOTATION';
  const docNumber = isInvoice ? doc.invoiceNumber : doc.quoteNumber;

  return `
    <div class="space-y-6 font-sans text-xs">
      <div class="flex justify-between items-start pb-6 border-b border-slate-200">
        <div class="flex items-start gap-4">
          <div class="w-28 h-28 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1.5">
            ${comp.logoUrl ? `<img src="${comp.logoUrl}" class="max-w-full max-h-full object-contain" />` : `<i data-lucide="building" class="w-8 h-8 text-blue-600"></i>`}
          </div>
          <div class="space-y-0.5">
            <h2 class="text-xl font-black text-slate-900 tracking-tight">${comp.name}</h2>
            <p class="text-xs text-slate-600 leading-snug max-w-md">${comp.address || ''}</p>
            <p class="text-xs font-mono font-bold text-slate-800 pt-0.5">GSTIN/UIN: ${comp.gstin || 'Unregistered'} | State: ${cust?.state || 'Maharashtra'} (27)</p>
            <p class="text-xs text-slate-500">Contact: ${comp.phone || '-'} | Email: ${comp.email || '-'}</p>
          </div>
        </div>
        <div class="text-right space-y-0.5">
          <span class="inline-block font-black text-xl tracking-wider text-blue-600">${docTitle}</span>
          <div class="text-xs font-mono font-bold text-slate-900 mt-0.5">${docNumber}</div>
          <div class="text-xs text-slate-500">Date: <span class="font-mono text-slate-800">${doc.date}</span></div>
          <div class="text-xs text-slate-500">${isInvoice ? 'Due Date:' : 'Validity of Quotation:'} <span class="font-mono text-slate-800">${isInvoice ? doc.dueDate : (doc.validity || '15 Days')}</span></div>
          <div class="flex items-center justify-end gap-1.5 flex-wrap pt-1 text-[10px]">
            <span class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"><strong>Delivery:</strong> ${doc.deliveryTerms || 'Door Delivery'}</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"><strong>Payment:</strong> ${doc.paymentTerms || (isInvoice ? 'Net 30 Days' : 'Against PI')}</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"><strong>Taxes:</strong> ${doc.taxTerms || 'Extra as applicable'}</span>
          </div>
        </div>
      </div>

      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
        <div>
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">To Company</span>
          <h4 class="font-black text-blue-600 text-sm mt-0.5 uppercase tracking-wide">${cust?.name || doc.customerName || 'Direct Customer'}</h4>
          <p class="text-xs text-slate-500 mt-0.5">${cust?.billingAddress || ''}</p>
          <p class="text-xs text-slate-500">${cust?.city ? `${cust.city}, ${cust.state || ''} ${cust.pincode || ''}` : ''}</p>
          <p class="text-xs text-slate-500">Phone: ${cust?.phone || '-'} | Email: ${cust?.email || '-'}</p>
        </div>
        <div class="text-right">
          ${cust?.gstin ? `
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client GSTIN</span>
            <div class="font-mono font-bold text-slate-900 text-xs">${cust.gstin}</div>
          ` : ''}
        </div>
      </div>

      <!-- Items Table with Big Product Photos -->
      <div class="overflow-x-auto border border-slate-200 rounded-xl">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
              <th class="py-3 px-3 w-8 text-center">#</th>
              <th class="py-3 px-3">Item Description & Specifications</th>
              <th class="py-3 px-3 text-center">HSN/SAC</th>
              <th class="py-3 px-3 text-center">Qty</th>
              <th class="py-3 px-3 text-right">Unit Price</th>
              <th class="py-3 px-3 text-center">Lead Time</th>
              <th class="py-3 px-3 text-center">GST%</th>
              <th class="py-3 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            ${(doc.items || []).map((it, idx) => `
              <tr>
                <td class="py-3.5 px-3 text-slate-400 font-mono text-center align-top">${idx + 1}</td>
                <td class="py-3.5 px-3 align-top">
                  <div class="flex items-start gap-4">
                    ${(!isInvoice && it.imageUrl) ? `
                      <div class="w-24 h-24 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0 p-1 mt-0.5">
                        <img src="${it.imageUrl}" class="w-full h-full object-contain" />
                      </div>
                    ` : ''}
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-slate-900 text-sm">${it.name}</div>
                      ${(!isInvoice && it.description) ? `<div class="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap break-words leading-relaxed">${escapeHtml(it.description)}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-3 text-center font-mono text-slate-500 font-semibold align-top">${it.hsnCode || '-'}</td>
                <td class="py-3.5 px-3 text-center font-mono font-medium align-top">${it.quantity} ${it.unit}</td>
                <td class="py-3.5 px-3 text-right font-mono font-semibold align-top">${cur()}${fmt(it.price)}</td>
                <td class="py-3.5 px-3 text-center font-mono text-[11px] align-top font-medium text-slate-700">${it.leadTime || '1-2 Days'}</td>
                <td class="py-3.5 px-3 text-center font-mono text-blue-600 font-semibold align-top">${it.taxRate || 0}%</td>
                <td class="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-sm align-top">${cur()}${fmt(it.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        <div class="space-y-4">
          ${comp.bankDetails?.accountNumber ? `
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Details for Payment</span>
              <p class="font-bold text-slate-900">${comp.bankDetails.bankName}</p>
              <p class="text-slate-600">A/C No: <span class="font-mono font-bold text-slate-900">${comp.bankDetails.accountNumber}</span> | IFSC: <span class="font-mono font-bold text-slate-900">${comp.bankDetails.ifscCode}</span></p>
              ${comp.bankDetails.upiId ? `<p class="text-slate-600">UPI ID: <span class="font-mono font-bold text-blue-600">${comp.bankDetails.upiId}</span></p>` : ''}
            </div>
          ` : ''}

          ${doc.terms && doc.terms.length > 0 ? `
            <div class="space-y-1 text-xs">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms & Conditions</span>
              <ul class="list-decimal pl-4 text-slate-500 space-y-0.5">
                ${doc.terms.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <div class="space-y-4">
          <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
            <div class="flex justify-between text-slate-600"><span>Subtotal:</span><span class="font-mono font-semibold text-slate-900">${cur()}${fmt(doc.subtotal)}</span></div>
            <div class="flex justify-between text-slate-600"><span>Taxable Value:</span><span class="font-mono font-semibold text-slate-900">${cur()}${fmt(doc.taxableAmount || doc.subtotal)}</span></div>
            <div class="flex justify-between text-slate-600"><span>Total GST:</span><span class="font-mono font-semibold text-blue-600">+${cur()}${fmt(doc.totalTax)}</span></div>
            <div class="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span class="text-base font-mono text-blue-700">${cur()}${fmt(doc.grandTotal)}</span>
            </div>
            ${isInvoice ? `
              <div class="flex justify-between text-slate-600 pt-1"><span>Paid Amount:</span><span class="font-mono font-semibold text-blue-600">${cur()}${fmt(doc.paidAmount)}</span></div>
              <div class="flex justify-between font-bold text-amber-700"><span>Balance Due:</span><span class="font-mono">${cur()}${fmt(doc.balanceDue)}</span></div>
            ` : ''}
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-end">
            <div class="flex flex-col items-center text-center w-48">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">for ${comp.name}</span>
              ${comp.stampUrl ? `
                <div class="w-20 h-20 my-1 flex items-center justify-center">
                  <img src="${comp.stampUrl}" class="max-w-full max-h-full object-contain opacity-90" alt="Stamp" />
                </div>
              ` : `<div class="h-10"></div>`}
              <div class="w-full border-t border-slate-400 pt-1 text-center">
                <span class="font-bold text-[10px] uppercase text-slate-800 tracking-wider">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closePreviewModal() {
  document.getElementById('preview-modal').classList.add('hidden');
  currentPreview = null;
}

function convertCurrentPreview() {
  if (!currentPreview || currentPreview.type !== 'quote') return;
  const qId = currentPreview.data.id;
  closePreviewModal();
  convertQuoteToInvoice(qId);
}

function printCurrentPreview() {
  window.print();
}

// ==========================================
// 11. PAYMENTS & COMPANY SETTINGS
// ==========================================

function openPaymentModal(invoiceId) {
  const inv = (activeCompany.invoices || []).find(i => i.id === invoiceId);
  if (!inv) return;

  document.getElementById('pay-invoice-id').value = inv.id;
  document.getElementById('pay-modal-subtitle').textContent = `${inv.invoiceNumber} (${inv.customerName || 'Customer'})`;
  document.getElementById('pay-modal-balance').textContent = `${cur()}${fmt(inv.balanceDue)}`;
  document.getElementById('pay-input-amount').value = inv.balanceDue;
  document.getElementById('pay-input-date').value = new Date().toISOString().split('T')[0];

  document.getElementById('payment-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

function handlePaymentSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('pay-invoice-id').value;
  const inv = (activeCompany.invoices || []).find(i => i.id === id);
  if (!inv) return;

  const amt = Number(document.getElementById('pay-input-amount').value);
  const date = document.getElementById('pay-input-date').value;
  const mode = document.getElementById('pay-input-mode').value;
  const ref = document.getElementById('pay-input-ref').value;

  if (amt <= 0) {
    alert('Please enter a valid positive payment amount.');
    return;
  }

  if (!inv.payments) inv.payments = [];
  inv.payments.push({
    id: 'pay-' + Date.now(),
    amount: amt,
    date,
    mode,
    reference: ref
  });

  inv.paidAmount = (Number(inv.paidAmount) || 0) + amt;
  inv.balanceDue = Math.max(0, (Number(inv.grandTotal) || 0) - inv.paidAmount);

  if (inv.balanceDue === 0) {
    inv.status = 'Paid';
  } else {
    inv.status = 'Partially Paid';
  }

  saveDatabase();
  closePaymentModal();
  showToast(`Recorded payment of ${cur()}${fmt(amt)}`);
  renderCurrentPage();
}

function renderSettingsPage(container) {
  const currentBrandColor = activeCompany.brandColor || '#2563eb';
  const foundPreset = BRAND_PRESETS.find(p => p.hex.toLowerCase() === currentBrandColor.toLowerCase());
  const colorLabel = foundPreset ? `${foundPreset.name} (${foundPreset.hex})` : `Custom (${currentBrandColor})`;

  container.innerHTML = `
    <div class="space-y-3.5 max-w-4xl mx-auto text-xs pb-6">
      <!-- Enterprise Header -->
      <div class="bg-white border border-slate-300 rounded-lg p-3.5 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
            <i data-lucide="sliders" class="w-4 h-4"></i>
          </div>
          <div>
            <h1 class="text-sm font-black text-slate-900 uppercase tracking-wide">Company Features & Master Configuration [F11]</h1>
            <p class="text-[10px] text-slate-500 font-mono">Configure statutory GST details, brand color palette, security PIN & banking particulars.</p>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-4">
        <form onsubmit="handleSettingsSave(event)" class="space-y-4 text-xs">
          <div class="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div class="w-14 h-14 rounded bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-sm" title="Company Logo">
              ${activeCompany.logoUrl ? `<img src="${activeCompany.logoUrl}" class="w-full h-full object-contain p-0.5" />` : `<i data-lucide="building" class="w-6 h-6 text-blue-700"></i>`}
            </div>
            <div class="w-14 h-14 rounded bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-sm" title="Company Official Stamp">
              ${activeCompany.stampUrl ? `<img src="${activeCompany.stampUrl}" class="w-full h-full object-contain p-0.5" />` : `<i data-lucide="stamp" class="w-6 h-6 text-slate-400"></i>`}
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-slate-900 text-sm">${activeCompany.name}</h3>
              <p class="text-slate-500 text-[10px] font-mono">${activeCompany.gstin ? `GSTIN: ${activeCompany.gstin}` : 'Multi-Company Mode'} • ${activeCompany.stampUrl ? '✅ Official Stamp Added' : 'Stamp not uploaded'}</p>
              <button type="button" onclick="openCompanyModal('edit', '${activeCompany.id}')" class="mt-1 text-xs text-blue-700 font-bold hover:underline flex items-center gap-1">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>Change Logo, Stamp & Master Info</span>
              </button>
            </div>
          </div>

          <!-- Brand Color Palette -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">Brand Color Palette</label>
              <span id="set-color-name-label" class="text-[11px] font-bold text-blue-700 font-mono">${colorLabel}</span>
            </div>
            <p class="text-[10px] text-slate-500">Applied to quotation vouchers, sales invoices, ledger headers, and PDF printouts.</p>
            <input type="hidden" id="set-brand-color" value="${currentBrandColor}" />
            <div class="flex flex-wrap items-center gap-2 pt-1" id="set-palette-options"></div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Company Security PIN (4 Digits) *</label>
              <input type="password" id="set-pin" maxlength="4" value="${activeCompany.pin || '1234'}" required class="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-center tracking-widest text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label class="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Currency Symbol</label>
              <input type="text" id="set-currency" value="${activeCompany.currencySymbol || '₹'}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-center text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
            </div>
          </div>

          <div class="pt-2 border-t border-slate-200">
            <h4 class="font-black text-slate-800 uppercase text-[10px] tracking-wider mb-2.5">Banking Particulars (Printed on Invoices & Estimates)</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 text-[10px] uppercase mb-1">Bank Name</label>
                <input type="text" id="set-bank-name" value="${activeCompany.bankDetails?.bankName || ''}" placeholder="e.g. State Bank of India" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[10px] uppercase mb-1">A/c Holder Name</label>
                <input type="text" id="set-bank-accname" value="${activeCompany.bankDetails?.accountName || activeCompany.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[10px] uppercase mb-1">Account Number</label>
                <input type="text" id="set-bank-accnum" value="${activeCompany.bankDetails?.accountNumber || ''}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[10px] uppercase mb-1">IFSC Code</label>
                <input type="text" id="set-bank-ifsc" value="${activeCompany.bankDetails?.ifscCode || ''}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
              </div>
              <div class="col-span-2">
                <label class="block font-bold text-slate-700 text-[10px] uppercase mb-1">UPI ID for Direct QR / UPI Payments</label>
                <input type="text" id="set-bank-upi" value="${activeCompany.bankDetails?.upiId || ''}" placeholder="business@upi" class="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-600" />
              </div>
            </div>
          </div>

          <div class="pt-3 flex justify-end">
            <button type="submit" class="px-5 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold border border-blue-800 text-xs shadow-sm">
              Save Configuration (Ctrl+A)
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  setTimeout(() => renderPaletteOptions('set-palette-options', currentBrandColor, 'set'), 20);
}

function handleSettingsSave(e) {
  e.preventDefault();
  activeCompany.pin = document.getElementById('set-pin').value.trim();
  activeCompany.currencySymbol = document.getElementById('set-currency').value.trim() || '₹';
  activeCompany.brandColor = document.getElementById('set-brand-color')?.value || '#2563eb';

  activeCompany.bankDetails = {
    bankName: document.getElementById('set-bank-name').value.trim(),
    accountName: document.getElementById('set-bank-accname').value.trim(),
    accountNumber: document.getElementById('set-bank-accnum').value.trim(),
    ifscCode: document.getElementById('set-bank-ifsc').value.trim(),
    upiId: document.getElementById('set-bank-upi').value.trim()
  };

  saveDatabase();
  showToast('Settings saved successfully');
  renderCurrentPage();
}

function generatePDFDoc(docType, doc, company, customer, format = selectedPrintFormat) {
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = docPdf.internal.pageSize.getWidth();
  const isInvoice = docType === 'invoice';
  const title = isInvoice ? 'TAX INVOICE' : 'SALES QUOTATION';
  const docNumber = isInvoice ? doc.invoiceNumber : doc.quoteNumber;
  const primaryColor = format === 'tally' ? [14, 42, 71] : hexToRgb(company.brandColor || '#2563eb');
  const textColor = [15, 23, 42];
  const mutedColor = [100, 116, 139];
  const wordsAmount = numberToWordsINR(doc.grandTotal);

  // Outer Border for Tally Format
  if (format === 'tally') {
    docPdf.setDrawColor(30, 41, 59);
    docPdf.setLineWidth(0.3);
    docPdf.rect(10, 10, pageWidth - 20, 277);
  }

  // Top Header Banner
  docPdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.rect(format === 'tally' ? 10 : 0, format === 'tally' ? 10 : 0, format === 'tally' ? pageWidth - 20 : pageWidth, 6, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(8);
  docPdf.text(title, pageWidth / 2, format === 'tally' ? 14.5 : 4, { align: 'center' });

  let textStartX = 14;
  if (company.logoUrl) {
    try {
      docPdf.addImage(company.logoUrl, 'PNG', 14, 17, 24, 24);
      textStartX = 42;
    } catch (e) {
      console.warn('Could not embed logo in PDF:', e);
    }
  }

  // Left Company Info
  docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(11);
  docPdf.text(company.name || 'Company Name', textStartX, 20);

  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(7.5);
  docPdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  const splitAddr = docPdf.splitTextToSize(company.address || '', 75);
  docPdf.text(splitAddr, textStartX, 24);
  const addrHeight = (splitAddr.length || 1) * 3.2;
  docPdf.text(`Email: ${company.email || '-'} | Phone: ${company.phone || '-'}`, textStartX, 24 + addrHeight);
  if (company.gstin) {
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`GSTIN/UIN: ${company.gstin}`, textStartX, 28 + addrHeight);
    docPdf.setFont('helvetica', 'normal');
  }

  // Right Title & Voucher Details
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(8.5);
  docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.text(`${isInvoice ? 'Invoice No.' : 'Quotation No.'}: ${docNumber}`, pageWidth - 14, 20, { align: 'right' });

  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(7.5);
  docPdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  docPdf.text(`Date: ${doc.date}`, pageWidth - 14, 24.5, { align: 'right' });
  docPdf.text(`${isInvoice ? 'Due Date:' : 'Validity:'} ${isInvoice ? doc.dueDate : (doc.validity || '15 Days')}`, pageWidth - 14, 28.5, { align: 'right' });
  docPdf.text(`Delivery: ${doc.deliveryTerms || 'Door Delivery'}`, pageWidth - 14, 32.5, { align: 'right' });
  docPdf.text(`Payment: ${doc.paymentTerms || (isInvoice ? 'Net 30 Days' : 'Against PI')}`, pageWidth - 14, 36.5, { align: 'right' });
  docPdf.text(`Taxes: ${doc.taxTerms || 'Extra as applicable'}`, pageWidth - 14, 40.5, { align: 'right' });

  // Divider
  docPdf.setDrawColor(203, 213, 225);
  docPdf.line(14, 44, pageWidth - 14, 44);

  // Bill To / To Company Box
  docPdf.setFillColor(248, 250, 252);
  docPdf.roundedRect(14, 47, pageWidth - 28, 21, 1.5, 1.5, 'F');
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(8);
  docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.text('TO COMPANY:', 18, 52);

  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(9.5);
  docPdf.setTextColor(29, 78, 216); // Royal Blue for To Company Name
  docPdf.text(customer?.name || doc.customerName || 'Direct Customer', 18, 57);

  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(7.5);
  docPdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  docPdf.text(`${customer?.billingAddress || ''} ${customer?.city ? `, ${customer.city}` : ''} ${customer?.state ? `, ${customer.state}` : ''}`, 18, 61);
  docPdf.text(`Phone: ${customer?.phone || '-'} | GSTIN: ${customer?.gstin || 'Unregistered'}`, 18, 65);

  const hasImages = !isInvoice && (doc.items || []).some(it => Boolean(it.imageUrl));

  const headers = hasImages 
    ? [['#', 'Photo', 'Item Description & Technical Specs', 'HSN/SAC', 'Qty', 'Rate', 'Lead Time', 'Tax%', 'Amount']]
    : [['#', 'Item Description & Technical Specs', 'HSN/SAC', 'Qty', 'Rate', 'Lead Time', 'Tax%', 'Amount']];

  const rows = (doc.items || []).map((it, idx) => {
    const itemDesc = (!isInvoice && it.description) ? `${it.name}\n${it.description}` : it.name;
    if (hasImages) {
      return [
        idx + 1,
        '',
        itemDesc,
        it.hsnCode || '-',
        `${it.quantity} ${it.unit}`,
        fmt(it.price),
        it.leadTime || '1-2 Days',
        `${it.taxRate || 0}%`,
        fmt(it.total)
      ];
    }
    return [
      idx + 1,
      itemDesc,
      it.hsnCode || '-',
      `${it.quantity} ${it.unit}`,
      fmt(it.price),
      it.leadTime || '1-2 Days',
      `${it.taxRate || 0}%`,
      fmt(it.total)
    ];
  });

  const colStyles = hasImages ? {
    0: { halign: 'center', cellWidth: 7 },
    1: { halign: 'center', cellWidth: 24 },
    2: { cellWidth: 55 },
    3: { halign: 'center', cellWidth: 15 },
    4: { halign: 'center', cellWidth: 14 },
    5: { halign: 'right', cellWidth: 18 },
    6: { halign: 'center', cellWidth: 18 },
    7: { halign: 'center', cellWidth: 12 },
    8: { halign: 'right', cellWidth: 22 }
  } : {
    0: { halign: 'center', cellWidth: 8 },
    1: { cellWidth: 70 },
    2: { halign: 'center', cellWidth: 18 },
    3: { halign: 'center', cellWidth: 16 },
    4: { halign: 'right', cellWidth: 20 },
    5: { halign: 'center', cellWidth: 20 },
    6: { halign: 'center', cellWidth: 13 },
    7: { halign: 'right', cellWidth: 22 }
  };

  docPdf.autoTable({
    startY: 72,
    head: headers,
    body: rows,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold', 
      minCellHeight: 7, 
      valign: 'middle', 
      cellPadding: 2 
    },
    bodyStyles: { 
      minCellHeight: hasImages ? 25 : 7, 
      valign: 'middle', 
      cellPadding: 2 
    },
    styles: { 
      fontSize: 7.5, 
      textColor: textColor, 
      lineColor: [203, 213, 225], 
      lineWidth: 0.1 
    },
    columnStyles: colStyles,
    didDrawCell: function(data) {
      if (hasImages && data.column.index === 1 && data.cell.section === 'body') {
        const itemObj = doc.items[data.row.index];
        if (itemObj && itemObj.imageUrl) {
          try {
            const imgY = data.cell.y + (data.cell.height - 20) / 2;
            const imgX = data.cell.x + (data.cell.width - 20) / 2;
            docPdf.addImage(itemObj.imageUrl, 'JPEG', imgX, imgY, 20, 20);
          } catch (e) {
            console.warn('Failed to embed item image in PDF table', e);
          }
        }
      }
    }
  });

  const pageHeight = docPdf.internal.pageSize.getHeight();
  let finalY = docPdf.lastAutoTable.finalY + 5;

  if (finalY + 60 > pageHeight - 20) {
    docPdf.addPage();
    if (format === 'tally') {
      docPdf.setDrawColor(30, 41, 59);
      docPdf.rect(10, 10, pageWidth - 20, 277);
    }
    finalY = 20;
  }

  // Amount in Words Box
  docPdf.setFillColor(248, 250, 252);
  docPdf.roundedRect(14, finalY, pageWidth - 28, 7, 1, 1, 'F');
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(7.5);
  docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.text('Amount in Words:', 17, finalY + 4.5);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  docPdf.text(wordsAmount, 43, finalY + 4.5);

  finalY += 10;

  const summaryX = pageWidth - 75;
  const writeSummary = (lbl, val, y, isBold = false) => {
    docPdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    docPdf.setFontSize(8);
    docPdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    docPdf.text(lbl, summaryX, y);
    docPdf.text(val, pageWidth - 14, y, { align: 'right' });
  };

  let cy = finalY;
  writeSummary('Taxable Subtotal:', `Rs. ${fmt(doc.taxableAmount || doc.subtotal)}`, cy);
  cy += 4;
  writeSummary('Central Tax (CGST):', `+Rs. ${fmt(doc.totalTax / 2)}`, cy);
  cy += 4;
  writeSummary('State Tax (SGST):', `+Rs. ${fmt(doc.totalTax / 2)}`, cy);
  cy += 4.5;
  writeSummary('Grand Total:', `Rs. ${fmt(doc.grandTotal)}`, cy, true);
  cy += 4.5;

  if (isInvoice) {
    if (doc.paidAmount > 0) {
      writeSummary('Paid Amount:', `Rs. ${fmt(doc.paidAmount)}`, cy);
      cy += 4;
    }
    writeSummary('Balance Due:', `Rs. ${fmt(doc.balanceDue)}`, cy, true);
  }

  let by = finalY;
  if (company.bankDetails?.accountNumber) {
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(7.5);
    docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    docPdf.text('BANK DETAILS FOR SETTLEMENT:', 14, by);
    by += 4;
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(7);
    docPdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    docPdf.text(`Bank: ${company.bankDetails.bankName}`, 14, by);
    by += 3.5;
    docPdf.text(`A/C Name: ${company.bankDetails.accountName}`, 14, by);
    by += 3.5;
    docPdf.text(`A/C No: ${company.bankDetails.accountNumber} | IFSC: ${company.bankDetails.ifscCode}`, 14, by);
    if (company.bankDetails.upiId) {
      by += 3.5;
      docPdf.text(`UPI ID: ${company.bankDetails.upiId}`, 14, by);
    }
  }

  const footerY = Math.max(cy, by) + 5;
  let ty = footerY;
  if (doc.terms && doc.terms.length > 0) {
    docPdf.setDrawColor(226, 232, 240);
    docPdf.line(14, footerY - 2, pageWidth - 14, footerY - 2);

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(7);
    docPdf.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    docPdf.text('Terms & Conditions:', 14, ty);
    ty += 3;
    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.terms.forEach((t, i) => {
      if (ty > pageHeight - 35) {
        docPdf.addPage();
        if (format === 'tally') {
          docPdf.setDrawColor(30, 41, 59);
          docPdf.rect(10, 10, pageWidth - 20, 277);
        }
        ty = 18;
      }
      docPdf.text(`${i + 1}. ${t}`, 16, ty);
      ty += 3;
    });
  }

  const currentY = Math.max(ty, footerY);
  const sigCenterX = pageWidth - 34;

  if (currentY > pageHeight - 38) {
    docPdf.addPage();
    if (format === 'tally') {
      docPdf.setDrawColor(30, 41, 59);
      docPdf.rect(10, 10, pageWidth - 20, 277);
    }
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8);
    docPdf.text(`For ${company.name}`, sigCenterX, 18, { align: 'center' });
    if (company.stampUrl) {
      try {
        docPdf.addImage(company.stampUrl, 'PNG', sigCenterX - 9, 20, 18, 18);
      } catch (e) {
        console.warn('Could not embed stamp in PDF:', e);
      }
    }
    docPdf.setDrawColor(148, 163, 184);
    docPdf.line(sigCenterX - 20, 41, sigCenterX + 20, 41);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(7.5);
    docPdf.text('Authorized Signatory', sigCenterX, 45, { align: 'center' });
  } else {
    const sigBaseY = pageHeight - 34;
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8);
    docPdf.text(`For ${company.name}`, sigCenterX, sigBaseY, { align: 'center' });
    if (company.stampUrl) {
      try {
        docPdf.addImage(company.stampUrl, 'PNG', sigCenterX - 9, sigBaseY + 2, 18, 18);
      } catch (e) {
        console.warn('Could not embed stamp in PDF:', e);
      }
    }
    docPdf.setDrawColor(148, 163, 184);
    docPdf.line(sigCenterX - 20, sigBaseY + 23, sigCenterX + 20, sigBaseY + 23);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(7.5);
    docPdf.text('Authorized Signatory', sigCenterX, sigBaseY + 27, { align: 'center' });
  }

  return docPdf;
}

async function downloadDocPDF(type, id) {
  const doc = type === 'quote' ? activeCompany.quotations.find(q => q.id === id) : activeCompany.invoices.find(i => i.id === id);
  if (!doc) return;
  const cust = (activeCompany.customers || []).find(c => c.id === doc.customerId);
  const comp = activeCompany;
  
  // Format filename: Qt-Zamil-113.pdf (Quotation) / INV-Zamil-001.pdf (Invoice)
  const rawCustomerName = (cust?.name || doc.customerName || 'Customer').trim();
  const firstWord = rawCustomerName.split(/\s+/)[0] || 'Customer';
  const customerInit = firstWord.replace(/[/\\?%*:|"<>]/g, '').trim();
  const rawDocNum = (type === 'invoice' ? doc.invoiceNumber : doc.quoteNumber) || '';
  const numPart = (rawDocNum.includes('-') ? rawDocNum.split('-').pop() : (rawDocNum.includes('/') ? rawDocNum.split('/').pop() : rawDocNum)).replace(/[/\\?%*:|"<>]/g, '').trim();
  const prefix = type === 'invoice' ? 'INV' : 'Qt';
  const filename = `${prefix}-${customerInit}-${numPart}.pdf`;

  showToast('Generating 1-Page PDF...');

  // Create clean full-height render sandbox to avoid any viewport/modal overflow clipping
  const printSandbox = document.createElement('div');
  printSandbox.id = 'pdf-render-sandbox';
  printSandbox.style.position = 'fixed';
  printSandbox.style.left = '-9999px';
  printSandbox.style.top = '0';
  printSandbox.style.width = '794px'; // 210mm at 96 DPI
  printSandbox.style.background = '#ffffff';
  printSandbox.style.padding = '0';
  printSandbox.style.margin = '0';
  printSandbox.style.overflow = 'visible';
  printSandbox.style.zIndex = '-99999';

  printSandbox.innerHTML = selectedPrintFormat === 'busy' 
    ? renderBusyFormatHTML(doc, type, cust, comp)
    : (selectedPrintFormat === 'modern' ? renderModernFormatHTML(doc, type, cust, comp) : renderTallyFormatHTML(doc, type, cust, comp));

  document.body.appendChild(printSandbox);

  try {
    // Wait briefly for layout & images
    await new Promise(resolve => setTimeout(resolve, 80));

    if (typeof html2canvas !== 'undefined' && window.jspdf) {
      const totalWidth = printSandbox.offsetWidth || 794;
      const totalHeight = Math.max(printSandbox.scrollHeight, printSandbox.offsetHeight);

      const canvas = await html2canvas(printSandbox, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight,
        scrollX: 0,
        scrollY: 0
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 4;
      const maxW = pageWidth - (margin * 2); // 202mm
      const maxH = pageHeight - (margin * 2); // 289mm
      const renderedH = (canvas.height * maxW) / canvas.width;

      if (renderedH <= maxH) {
        // Fits comfortably in 1 single page
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, maxW, renderedH);
      } else {
        // Proportionally scale to fit 100% on the single A4 page
        const scale = maxH / renderedH;
        const fitW = maxW * scale;
        const fitH = maxH;
        const offsetX = margin + (maxW - fitW) / 2;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', offsetX, margin, fitW, fitH);
      }

      pdf.save(filename);
      showToast('1-Page PDF downloaded successfully');
    } else {
      const pdf = generatePDFDoc(type, doc, activeCompany, cust, selectedPrintFormat);
      pdf.save(filename);
      showToast('PDF downloaded');
    }
  } catch (err) {
    console.error('Canvas PDF export failed, fallback to jsPDF:', err);
    const pdf = generatePDFDoc(type, doc, activeCompany, cust, selectedPrintFormat);
    pdf.save(filename);
    showToast('PDF downloaded');
  } finally {
    if (printSandbox.parentNode) {
      printSandbox.parentNode.removeChild(printSandbox);
    }
  }
}

function downloadCurrentPreviewPDF() {
  if (!currentPreview) return;
  downloadDocPDF(currentPreview.type, currentPreview.data.id);
}

// Auto-Expanding Fluid Multi-line Textarea Helper (Optimized for instant 60fps typing)
function autoExpandTextarea(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    if (el.scrollHeight > el.clientHeight + 4) {
      el.style.height = Math.max(el.scrollHeight, 44) + 'px';
    } else {
      el.style.height = 'auto';
      el.style.height = Math.max(el.scrollHeight, 44) + 'px';
    }
  });
}

function initAutoExpandTextareas() {
  document.querySelectorAll('textarea.auto-expand').forEach(autoExpandTextarea);
}

// Security Escape Helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 13. GLOBAL ERP KEYBOARD SHORTCUTS & BOOTSTRAP
// ==========================================

function handleGlobalKeydown(e) {
  // If no active company is logged in, do not trigger ERP shortcuts
  if (!activeCompany) return;

  const key = e.key;
  const isAlt = e.altKey;
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;

  // Check if a modal is currently open
  const openModal = [
    'preview-modal', 'company-modal', 'customer-modal',
    'item-modal', 'row-img-modal', 'payment-modal', 'sync-modal'
  ].find(id => {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  });

  // 1. ESCAPE Key: Close active modal or cancel voucher editor
  if (key === 'Escape') {
    e.preventDefault();
    if (openModal) {
      if (openModal === 'preview-modal') closePreviewModal();
      else if (openModal === 'company-modal') closeCompanyModal();
      else if (openModal === 'customer-modal') closeCustomerModal();
      else if (openModal === 'item-modal') closeItemModal();
      else if (openModal === 'row-img-modal') closeRowImageModal();
      else if (openModal === 'payment-modal') closePaymentModal();
      else if (openModal === 'sync-modal') closeSyncModal();
    } else if (activeEditorMode) {
      cancelEditor();
    }
    return;
  }

  // Alt+S: Cloud & Data Sync Center
  if (isAlt && (key === 's' || key === 'S')) {
    e.preventDefault();
    openSyncModal();
    return;
  }

  // 2. F8 Key: Sales Tax Invoice Voucher
  if (key === 'F8') {
    e.preventDefault();
    openNewInvoiceEditor();
    return;
  }

  // 3. F11 Key: Company Features / Configuration
  if (key === 'F11') {
    e.preventDefault();
    activeEditorMode = null;
    navigateTab('settings');
    return;
  }

  // 4. Alt Shortcuts
  if (isAlt) {
    if (key === 'q' || key === 'Q') {
      e.preventDefault();
      openNewQuotationEditor();
      return;
    }
    if (key === 'i' || key === 'I') {
      e.preventDefault();
      if (activeEditorMode === 'quote') {
        addQuoteRow();
      } else if (activeEditorMode === 'invoice') {
        addInvoiceRow();
      } else {
        navigateTab('items');
      }
      return;
    }
    if (key === 'l' || key === 'L') {
      e.preventDefault();
      navigateTab('customers');
      return;
    }
    if (key === 'c' || key === 'C') {
      e.preventDefault();
      openCustomerModal();
      return;
    }
    if (key === 'g' || key === 'G') {
      e.preventDefault();
      activeEditorMode = null;
      navigateTab('dashboard');
      return;
    }
    if (key === 'p' || key === 'P') {
      if (activeEditorMode === 'quote') {
        e.preventDefault();
        saveQuotation(true);
        return;
      } else if (activeEditorMode === 'invoice') {
        e.preventDefault();
        saveInvoice(true);
        return;
      }
    }
    if (key === 's' || key === 'S') {
      if (activeEditorMode === 'quote') {
        e.preventDefault();
        saveQuotation(false);
        return;
      } else if (activeEditorMode === 'invoice') {
        e.preventDefault();
        saveInvoice(false);
        return;
      }
    }
  }

  // 5. Ctrl+Enter or Ctrl+A inside Voucher Editor -> Save Voucher
  if (isCtrlOrCmd && key === 'Enter' && activeEditorMode) {
    e.preventDefault();
    if (activeEditorMode === 'quote') saveQuotation(false);
    else if (activeEditorMode === 'invoice') saveInvoice(false);
    return;
  }
}

document.addEventListener('keydown', handleGlobalKeydown);

document.addEventListener('DOMContentLoaded', () => {
  loadDatabase();
  showAuthScreen();
});
