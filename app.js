/* =========================================================
   PASS CORP — storefront logic
   Requires data.js to be loaded first (DEFAULT_CONTENT, icons,
   loadContent/saveContent, fmt/esc/etc).
========================================================= */

const STATE = {
  view: "home",           // home | shop | product | brands | about | contact
  activeCategory: "all",
  activeBrand: "all",
  sort: "featured",
  inStockOnly: false,
  selectedId: null,
  toast: "",
  scrolled: false,
  rfqOpen: false,
  rfqItems: [],
  mobileMenuOpen: false
};

function showToast(msg){
  STATE.toast = msg;
  render();
  setTimeout(() => { STATE.toast = ""; const t = document.getElementById("toast"); if (t) t.remove(); }, 2200);
}

/* ---------------- ACTIONS ---------------- */
const Actions = {
  goHome(){ STATE.view = "home"; STATE.mobileMenuOpen = false; window.scrollTo(0,0); render(); },
  goShop(cat, brand){ STATE.activeCategory = cat || "all"; STATE.activeBrand = brand || "all"; STATE.view = "shop"; STATE.mobileMenuOpen = false; window.scrollTo(0,0); render(); },
  goBrands(){ STATE.view = "brands"; STATE.mobileMenuOpen = false; window.scrollTo(0,0); render(); },
  goAbout(){ STATE.view = "about"; STATE.mobileMenuOpen = false; window.scrollTo(0,0); render(); },
  goContact(){ STATE.view = "contact"; STATE.mobileMenuOpen = false; window.scrollTo(0,0); render(); },
  toggleMobileMenu(){ STATE.mobileMenuOpen = !STATE.mobileMenuOpen; render(); },
  closeMobileMenu(){ STATE.mobileMenuOpen = false; render(); },
  setCategory(cat){ STATE.activeCategory = cat; render(); },
  setBrand(brand){ STATE.activeBrand = brand; render(); },
  setSort(v){ STATE.sort = v; render(); },
  toggleInStockOnly(){ STATE.inStockOnly = !STATE.inStockOnly; render(); },
  openProduct(id){ STATE.selectedId = id; STATE.view = "product"; STATE.mobileMenuOpen = false; window.scrollTo(0,0); render(); },
  downloadCatalog(){
    showToast("Downloading Official Product Catalogue PDF...");
    const a = document.createElement("a");
    a.href = "assets/Pass_Corp_Product_Catalogue.pdf";
    a.download = "Pass_Corp_Product_Catalogue.pdf";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  
  /* ---- INSTANT RFQ ENGINE ACTIONS ---- */
  openRFQ(productId, qty){
    STATE.rfqOpen = true;
    if (productId){
      const p = findProduct(productId);
      const cat = findCategory(p?.category);
      if (p && !STATE.rfqItems.some(i => i.id === p.id)){
        STATE.rfqItems.push({
          id: p.id,
          catId: p.category,
          catName: cat ? `${cat.emoji} ${cat.name}` : p.category,
          desc: `${p.name} (Brand: ${p.brand}${p.cert ? ' · ' + p.cert : ''})`,
          qty: qty || 20
        });
      }
    }
    render();
  },
  closeRFQ(){
    STATE.rfqOpen = false;
    render();
  },
  addToRFQ(productId, qty){
    const p = findProduct(productId);
    if (!p) return;
    const cat = findCategory(p.category);
    const existing = STATE.rfqItems.find(i => i.id === p.id);
    if (existing){
      existing.qty += (qty || 10);
    } else {
      STATE.rfqItems.push({
        id: p.id,
        catId: p.category,
        catName: cat ? `${cat.emoji} ${cat.name}` : p.category,
        desc: `${p.name} (Brand: ${p.brand})`,
        qty: qty || 20
      });
    }
    showToast(`Added to RFQ: ${p.name}`);
    render();
  },
  addCategoryRequirement(){
    const catSel = document.getElementById("rfq-new-cat");
    const descInp = document.getElementById("rfq-new-desc");
    const qtyInp = document.getElementById("rfq-new-qty");
    
    const catId = catSel ? catSel.value : "";
    const desc = descInp ? descInp.value.trim() : "";
    const qty = qtyInp ? parseInt(qtyInp.value) || 20 : 20;

    if (!catId){
      alert("Please select a Category first.");
      return;
    }

    const catObj = findCategory(catId);
    const catName = catObj ? `${catObj.emoji} ${catObj.name}` : (catId === "other" ? "📦 Custom Safety Item" : catId);
    const finalDesc = desc || (catObj ? `Standard industrial requirement (${catObj.blurb})` : "General requirement");

    STATE.rfqItems.push({
      id: "cat-" + Date.now() + "-" + Math.floor(Math.random()*1000),
      catId: catId,
      catName: catName,
      desc: finalDesc,
      qty: qty
    });

    render();
  },
  removeRFQItem(id){
    STATE.rfqItems = STATE.rfqItems.filter(i => i.id !== id);
    render();
  },
  updateRFQQty(id, delta){
    const item = STATE.rfqItems.find(i => i.id === id);
    if (item){
      item.qty = Math.max(1, item.qty + delta);
      render();
    }
  },
  submitRFQ(mode){
    const comp = (document.getElementById("rfq-comp")?.value || "").trim();
    const person = (document.getElementById("rfq-name")?.value || "").trim();
    const phone = (document.getElementById("rfq-phone")?.value || "").trim();
    const email = (document.getElementById("rfq-email")?.value || "").trim();
    const gstin = (document.getElementById("rfq-gst")?.value || "").trim();
    const city = (document.getElementById("rfq-city")?.value || "").trim();
    const notes = (document.getElementById("rfq-notes")?.value || "").trim();

    if (!comp || !phone){
      alert("Please enter Company Name and Mobile/WhatsApp number to submit quotation request.");
      return;
    }
    if (!STATE.rfqItems.length){
      alert("Please add at least 1 Category requirement to your quotation request.");
      return;
    }

    const refId = "RFQ-PASS-" + Math.floor(100000 + Math.random() * 900000);
    const itemLines = STATE.rfqItems.map((it, idx) => `${idx+1}. [${it.catName}] — ${it.desc} | Qty: ${it.qty} Nos`).join("\n");

    if (mode === "whatsapp"){
      const msg = `*OFFICIAL RFQ REQUEST* 📋\n*Ref ID:* ${refId}\n\n*Company:* ${comp}\n*Contact Person:* ${person || "Purchasing Team"}\n*Phone:* ${phone}\n*Email:* ${email || "N/A"}\n*GSTIN:* ${gstin || "N/A"}\n*Delivery Location:* ${city || "Pune / PCMC"}\n\n*REQUESTED CATEGORIES & SPECS:*\n${itemLines}\n\n*Special Notes / Urgency:* ${notes || "Immediate quotation requested"}\n\nPlease share official GST quotation with corporate pricing.`;
      window.open("https://wa.me/919767672497?text=" + encodeURIComponent(msg), "_blank");
      STATE.rfqOpen = false;
      showToast("Quotation Request Sent on WhatsApp!");
      render();
    } else if (mode === "email"){
      const body = `OFFICIAL RFQ REQUEST\nRef ID: ${refId}\n\nCompany: ${comp}\nContact Person: ${person || "Purchase Team"}\nPhone: ${phone}\nEmail: ${email || "N/A"}\nGSTIN: ${gstin || "N/A"}\nDelivery Location: ${city || "Pune / PCMC"}\n\nREQUESTED CATEGORIES & SPECS:\n${itemLines}\n\nNotes/Specs: ${notes || "Immediate quotation requested"}\n\nPlease send formal PDF quotation with lead times to ${email || phone}.`;
      window.open("mailto:sales@passcorp.in?subject=" + encodeURIComponent(`Official RFQ: ${comp} (${refId})`) + "&body=" + encodeURIComponent(body));
      STATE.rfqOpen = false;
      showToast("Email Client Opened for RFQ!");
      render();
    } else if (mode === "print"){
      window.print();
    }
  }
};
window.A = Actions;

/* ---------------- SMALL COMPONENTS ---------------- */
function productCard(p, revealDelay){
  const cat = findCategory(p.category) || { emoji:"🛡️", name:"" };
  const mediaHtml = p.img 
    ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" class="product-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="product-icon-circle" style="display:none">${cat.emoji}</div>`
    : `<div class="product-icon-circle">${cat.emoji}</div>`;

  return `
    <div class="product-card reveal" style="--reveal-delay:${revealDelay||0}ms" onclick="A.openProduct('${p.id}')">
      <div class="product-media">
        ${mediaHtml}
        ${p.bestseller ? '<span class="best-tag">Popular</span>' : ''}
        ${p.cert ? `<span class="cert-chip">${esc((p.cert||"").split(",")[0].split("/")[0])}</span>` : ''}
      </div>
      <div class="product-body">
        <p class="product-cat">${esc(p.brand)}</p>
        <p class="product-name">${esc(p.name)}</p>
        <div class="product-meta">${starRow(p.rating)}<span class="review-count">(${p.reviews})</span></div>
        <p class="price">${fmt(p.price)} <span style="font-size:10px;color:var(--ink-faint)">indicative</span></p>
      </div>
    </div>
  `;
}

/* ---------------- PAGE RENDERERS ---------------- */
function renderHeader(){
  return `
    <header class="header${STATE.scrolled?' is-scrolled':''}">
      <div class="header-inner">
        <div class="brand-lockup" onclick="A.goHome()">
          <img src="${LOGO_URI}" alt="Pass Corp" style="width:38px;height:38px;object-fit:contain;flex-shrink:0" />
          <div>
            <div class="brand-word">PASS CORP.</div>
            <div class="brand-tag">PRECISION <i>|</i> ASSURANCE <i>|</i> SAFETY <i>|</i> SOLUTION</div>
          </div>
        </div>
        <div class="header-right">
          <nav class="nav">
            <button class="nav-link${STATE.view==="home"?" active":""}" onclick="A.goHome()">Home</button>
            <button class="nav-link${STATE.view==="about"?" active":""}" onclick="A.goAbout()">About us</button>
            <button class="nav-link${STATE.view==="shop"?" active":""}" onclick="A.goShop('all')">Full Catalogue</button>
            <button class="nav-link${STATE.view==="brands"?" active":""}" onclick="A.goBrands()">Brands</button>
            <button class="nav-link" onclick="A.openRFQ()">Instant RFQ ${STATE.rfqItems.length ? `<span class="rfq-count-badge">${STATE.rfqItems.length}</span>` : ''}</button>
            <button class="nav-link${STATE.view==="contact"?" active":""}" onclick="A.goContact()">Contact us</button>
          </nav>
          <div class="header-actions">
            <button class="whatsapp-pill" onclick="A.openRFQ()">${icon("chat",15)} Get Quote ${STATE.rfqItems.length ? `<span class="rfq-count-badge">${STATE.rfqItems.length}</span>` : ''}</button>
            <button class="mobile-menu-btn" onclick="A.toggleMobileMenu()" aria-label="Menu">${STATE.mobileMenuOpen ? '✕' : '☰'}</button>
          </div>
        </div>
      </div>
      <div class="mobile-nav-drawer${STATE.mobileMenuOpen ? ' open' : ''}">
        <button class="mobile-nav-link${STATE.view==="home"?" active":""}" onclick="A.goHome()"><span>🏠 Home</span> ${icon("chevronRight",14)}</button>
        <button class="mobile-nav-link${STATE.view==="about"?" active":""}" onclick="A.goAbout()"><span>🏢 About PASS CORP.</span> ${icon("chevronRight",14)}</button>
        <button class="mobile-nav-link${STATE.view==="shop"?" active":""}" onclick="A.goShop('all')"><span>🛡️ Full Catalogue (186+ Products)</span> ${icon("chevronRight",14)}</button>
        <button class="mobile-nav-link${STATE.view==="brands"?" active":""}" onclick="A.goBrands()"><span>⭐ Authorised Brands</span> ${icon("chevronRight",14)}</button>
        <button class="mobile-nav-link" onclick="A.openRFQ();A.closeMobileMenu()"><span>⚡ Instant RFQ Engine</span> ${STATE.rfqItems.length ? `<span class="rfq-count-badge">${STATE.rfqItems.length}</span>` : icon("chevronRight",14)}</button>
        <button class="mobile-nav-link${STATE.view==="contact"?" active":""}" onclick="A.goContact()"><span>📞 Contact & Location</span> ${icon("chevronRight",14)}</button>
        <div style="padding-top:12px;margin-top:8px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px">
          <a class="btn-secondary" style="width:100%;justify-content:center;font-size:13px;padding:10px" href="assets/Pass_Corp_Product_Catalogue.pdf" download="Pass_Corp_Product_Catalogue.pdf" target="_blank">${icon("download",15)} Download 17-Page Catalogue PDF</a>
          <a class="btn-primary" style="width:100%;justify-content:center;background:#25D366;border-color:#25D366;font-size:13px;padding:10px" href="${whatsappHref('Hi PASS CORP, I have a bulk enquiry.')}" target="_blank" rel="noopener">${icon("chat",15)} Chat on WhatsApp</a>
        </div>
      </div>
    </header>
    <div class="top-strip"></div>
  `;
}

function renderFooter(){
  return `
    <footer class="footer">
      <div class="footer-grid">
        <div>
          <div class="brand-lockup" onclick="A.goHome()">
            <div style="width:44px;height:44px;background:#ffffff;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:4px;flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.25);">
              <img src="${LOGO_URI}" alt="Pass Corp" style="width:100%;height:100%;object-fit:contain" />
            </div>
            <div>
              <div class="brand-word" style="color:#ffffff;font-size:20px;font-weight:700">PASS CORP.</div>
              <div class="brand-tag" style="color:#FF6B6B">PRECISION <i style="color:#94A3B8">|</i> ASSURANCE <i style="color:#94A3B8">|</i> SAFETY <i style="color:#94A3B8">|</i> SOLUTION</div>
            </div>
          </div>
          <p style="margin-top:16px">Protecting people, passing safety. An authorised dealer and distributor of industrial PPE and workplace safety systems. This site is a live catalogue — call or email to order.</p>
        </div>
        <div>
          <h3>Catalogue</h3>
          ${CONTENT.categories.map(c => '<a onclick="A.goShop(\''+c.id+'\')">'+esc(c.name)+'</a>').join("")}
        </div>
        <div>
          <h3>Company</h3>
          <a onclick="A.goAbout()">About us</a>
          <a onclick="A.goBrands()">Authorised brands</a>
          <a onclick="A.goContact()">Bulk orders</a>
        </div>
        <div>
          <h3>Contact</h3>
          <div class="footer-contact">${icon("mapPin",14)}<span>${esc(CONTENT.company.address)}</span></div>
          <div class="footer-contact">${icon("phone",14)}<a href="tel:${esc(CONTENT.company.phone.replace(/[^0-9+]/g,''))}">${esc(CONTENT.company.phone)}</a></div>
          <div class="footer-contact">${icon("mail",14)}<a href="mailto:${esc(CONTENT.company.email)}">${esc(CONTENT.company.email)}</a></div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Pass Corp.</span>
        <div style="display:inline-flex;align-items:center;gap:18px;">
          <a href="quotation.html?secure=1" target="_blank" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer">${icon("box",13)} Quotor</a>
          <a href="admin.html" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer">${icon("settings",13)} Manage content</a>
        </div>
      </div>
    </footer>
  `;
}

function renderHome(){
  const bestsellers = CONTENT.products.filter(p => p.bestseller);
  return `
    <section class="hero">
      <div class="hero-grid">
        <div>
          <span class="eyebrow hero-eyebrow-in">${esc(CONTENT.hero.eyebrow)}</span>
          <h1 class="hero-title hero-title-in">${esc(CONTENT.hero.title)}</h1>
          <p class="hero-sub hero-sub-in">${esc(CONTENT.hero.subtitle)}</p>
          <div class="hero-ctas hero-ctas-in">
            <button class="btn-primary" onclick="A.goShop('all')">Browse 186+ Catalog ${icon("arrowRight",16)}</button>
            <a class="btn-secondary" style="display:inline-flex;align-items:center;gap:8px" href="assets/Pass_Corp_Product_Catalogue.pdf" download="Pass_Corp_Product_Catalogue.pdf" target="_blank">${icon("download",16)} Download Catalogue</a>
          </div>
        </div>
        <div class="hero-stamp-wrap"><img src="${LOGO_URI}" alt="Pass Corp" /></div>
      </div>
    </section>

    <div class="trust-bar">
      <div class="trust-inner">
        ${CONTENT.trust.map((t,i) => '<div class="trust-item reveal" style="--reveal-delay:'+(i*80)+'ms">'+icon(t.icon,18)+'<span><b>'+esc(t.b)+'</b> '+esc(t.t)+'</span></div>').join("")}
      </div>
    </div>

    <section class="section">
      <div class="section-header reveal"><h2 class="section-title">Browse by category</h2></div>
      <div class="category-strip">
        ${CONTENT.categories.slice(0,4).map((c,i) => `
          <button class="category-card reveal" style="--reveal-delay:${i*70}ms" onclick="A.goShop('${c.id}')">
            <div class="category-icon">${c.emoji}</div>
            <p>${esc(c.name)}</p><p>${esc(c.blurb)}</p>
          </button>`).join("")}
      </div>
      <div class="category-strip" style="margin-top:16px">
        ${CONTENT.categories.slice(4,8).map((c,i) => `
          <button class="category-card reveal" style="--reveal-delay:${i*70}ms" onclick="A.goShop('${c.id}')">
            <div class="category-icon">${c.emoji}</div>
            <p>${esc(c.name)}</p><p>${esc(c.blurb)}</p>
          </button>`).join("")}
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="section-header reveal">
        <h2 class="section-title">Popular items</h2>
        <button class="section-link" onclick="A.goShop('all')">View all ${icon("chevronRight",16)}</button>
      </div>
      <div class="product-grid">${bestsellers.map((p,i) => productCard(p,(i%4)*80)).join("")}</div>
    </section>
  `;
}

function renderShop(){
  let list = CONTENT.products.slice();
  if (STATE.activeCategory !== "all") list = list.filter(p => p.category === STATE.activeCategory);
  if (STATE.activeBrand && STATE.activeBrand !== "all") list = list.filter(p => p.brand.toLowerCase() === STATE.activeBrand.toLowerCase() || p.brand.includes(STATE.activeBrand));
  if (STATE.sort === "price-asc") list.sort((a,b)=>a.price-b.price);
  if (STATE.sort === "price-desc") list.sort((a,b)=>b.price-a.price);
  if (STATE.sort === "rating") list.sort((a,b)=>b.rating-a.rating);

  const catObj = findCategory(STATE.activeCategory);
  const title = STATE.activeBrand && STATE.activeBrand !== "all" 
    ? STATE.activeBrand + " Products" 
    : (STATE.activeCategory === "all" ? "Full Catalogue" : (catObj ? catObj.name : "Catalogue"));

  const allBrands = [...new Set(CONTENT.products.map(p => p.brand))];

  return `
    <div class="shop-header">
      <div class="breadcrumb" onclick="A.goHome()">${icon("arrowLeft",14)} Back to home</div>
      ${STATE.activeBrand && STATE.activeBrand !== "all" ? '<span class="eyebrow">Brand Filter Active</span>' : ''}
      <h1 class="hero-title" style="font-size:32px">${esc(title)}</h1>
      ${STATE.activeBrand && STATE.activeBrand !== "all" ? '<button class="btn-ghost" style="margin-top:10px" onclick="A.goShop(\'all\', \'all\')">Clear Brand Filter (Show All)</button>' : ''}
    </div>
    <div class="shop-layout">
      <aside>
        <p class="filter-title">Category</p>
        <button class="filter-option${STATE.activeCategory==="all"?" active":""}" onclick="A.setCategory('all')">All products <span class="filter-count">${CONTENT.products.length}</span></button>
        ${CONTENT.categories.map(c => '<button class="filter-option'+(STATE.activeCategory===c.id?" active":"")+'" onclick="A.setCategory(\''+c.id+'\')">'+esc(c.name)+' <span class="filter-count">'+CONTENT.products.filter(p=>p.category===c.id).length+'</span></button>').join("")}
      </aside>
      <div>
        <div class="sort-row">
          <span style="font-size:13px;color:var(--ink-muted)">${list.length} products</span>
          <select class="sort-select" onchange="A.setSort(this.value)">
            <option value="featured"${STATE.sort==="featured"?" selected":""}>Sort: Featured</option>
            <option value="price-asc"${STATE.sort==="price-asc"?" selected":""}>Price: Low to high</option>
            <option value="price-desc"${STATE.sort==="price-desc"?" selected":""}>Price: High to low</option>
            <option value="rating"${STATE.sort==="rating"?" selected":""}>Highest rated</option>
          </select>
        </div>
        <div class="shop-grid">${list.length ? list.map((p,i) => productCard(p,(i%6)*60)).join("") : '<div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--ink-muted)">No products found for this filter.<br><button class="btn-primary" style="margin-top:14px" onclick="A.goShop(\'all\',\'all\')">View all products</button></div>'}</div>
      </div>
    </div>
  `;
}

function renderProductDetail(){
  const p = findProduct(STATE.selectedId);
  if (!p) return '<div style="padding:80px 24px;text-align:center">Product not found. <a onclick="A.goShop(\'all\')" style="color:var(--accent);cursor:pointer">Back to catalogue</a></div>';
  const cat = findCategory(p.category) || { emoji:"🛡️" };
  const related = CONTENT.products.filter(r => r.category === p.category && r.id !== p.id).slice(0,3);
  const detailMediaHtml = p.img 
    ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" class="detail-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="detail-icon-circle" style="display:none">${cat.emoji}</div>`
    : `<div class="detail-icon-circle">${cat.emoji}</div>`;

  return `
    <div class="detail-layout">
      <div>
        <div class="breadcrumb" onclick="A.goShop('all')" style="margin-bottom:18px">${icon("arrowLeft",14)} Back to catalogue</div>
        <div class="detail-media reveal-scale reveal-visible">
          ${detailMediaHtml}
        </div>
      </div>
      <div>
        <p class="detail-cat">${esc(p.brand)} · ${esc(p.cert)}</p>
        <h1 class="detail-title">${esc(p.name)}</h1>
        <div class="detail-meta">${starRow(p.rating)}<span class="review-count">${p.rating} (${p.reviews} reviews)</span></div>
        <p class="detail-price-label">Indicative price</p>
        <p class="detail-price">${fmt(p.price)}</p>
        <p class="detail-desc">${esc(p.desc)}</p>
        <div class="enquire-row" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn-primary" style="background:#0C1B5C" onclick="A.openRFQ('${p.id}', 20)">⚡ Request Official RFQ</button>
          <button class="btn-secondary" onclick="A.addToRFQ('${p.id}', 10)">+ Add to RFQ List</button>
          <a class="whatsapp-pill" style="border-radius:6px;padding:12px 18px" href="${whatsappHref('Hi PASS CORP, I would like an official quotation for: ' + p.name)}" target="_blank" rel="noopener">${icon("chat",16)} Quick WhatsApp</a>
        </div>
        <p class="admin-note">Prices and availability are indicative and confirmed at the time of order/quotation. Contact us directly on WhatsApp or call.</p>
        <div class="spec-table">
          ${p.specs.map(s => '<div class="spec-row"><span class="spec-label">'+esc(s[0])+'</span><span class="spec-value">'+esc(s[1])+'</span></div>').join("")}
        </div>
        ${related.length ? `
          <div style="margin-top:40px">
            <p class="filter-title">You may also need</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              ${related.map(r => '<button onclick="A.openProduct(\''+r.id+'\')" style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:#fff;cursor:pointer;font-size:13px">'+esc(r.name)+' <span class="mono" style="color:var(--accent)">'+fmt(r.price)+'</span></button>').join("")}
            </div>
          </div>` : ''}
      </div>
    </div>
  `;
}

function renderAbout(){
  return `
    <div class="shop-header">
      <div class="breadcrumb" onclick="A.goHome()">${icon("arrowLeft",14)} Back to home</div>
      <span class="eyebrow">About Us</span>
      <h1 class="hero-title" style="font-size:36px">About <b>PASS CORP.</b></h1>
    </div>
    <div class="about-layout">
      <div class="about-card reveal">
        <p style="color:var(--ink);font-size:16px;line-height:1.8;margin-bottom:18px">
          At <b>PASS CORP.</b>, we're not just about checking boxes; we're about instilling confidence and driving excellence. We understand that in today's demanding world, reliability and safety are non-negotiable. That's why we've dedicated ourselves to providing a comprehensive suite of precision assurance, compliance, and solution-based services that empower businesses and organizations to thrive.
        </p>
        <p style="color:var(--ink-muted);font-size:15px;line-height:1.8">
          Our journey began with a simple but profound belief: that unwavering quality and strict adherence to safety and performance standards are the foundations of enduring success. From this core conviction, <b>PASS CORP.</b> was born—a dedicated partner committed to helping you achieve your highest aspirations while mitigating risk and ensuring compliance.
        </p>
      </div>

      <div style="margin:36px 0 20px" class="reveal">
        <h2 style="font-size:26px;font-weight:700">What Defines Us?</h2>
      </div>

      <div class="about-grid">
        <div class="about-feature reveal" style="--reveal-delay:0ms">
          <div class="about-feature-icon">🎯</div>
          <h3>Precision is in Our DNA</h3>
          <p>We don't settle for "close enough." Our meticulous attention to detail and rigorous processes ensure that every assessment, inspection, and analysis we conduct delivers results you can trust. We understand that accuracy is paramount, and we're committed to maintaining the highest levels of precision in everything we do.</p>
        </div>
        <div class="about-feature reveal" style="--reveal-delay:80ms">
          <div class="about-feature-icon">🤝</div>
          <h3>Assurance You Can Count On</h3>
          <p>We know that trust is earned, not given. That's why we're dedicated to providing independent, objective, and expert assurance services that build confidence among stakeholders, customers, and regulatory bodies alike. With <b>PASS CORP.</b>, you have the assurance that your operations, products, and services meet or exceed established standards.</p>
        </div>
        <div class="about-feature reveal" style="--reveal-delay:160ms">
          <div class="about-feature-icon">🛡️</div>
          <h3>Safety is Our Priority</h3>
          <p>In an increasingly complex world, safety is paramount. Our team of seasoned safety professionals works tirelessly to identify, assess, and mitigate risks across various industries and environments. Whether it's ensuring workplace safety compliance, conducting thorough safety audits, or developing customized safety protocols, we're dedicated to protecting your most valuable assets: your people and your reputation.</p>
        </div>
        <div class="about-feature reveal" style="--reveal-delay:240ms">
          <div class="about-feature-icon">💡</div>
          <h3>Tailored Solutions for Real-World Challenges</h3>
          <p>We recognize that every organization is unique, and a one-size-fits-all approach doesn't work. That's why we collaborate closely with our clients to understand their specific needs and develop tailored solutions that address their challenges effectively. From process improvement initiatives to custom quality management systems, we're here to help you achieve operational excellence.</p>
        </div>
      </div>

      <div class="about-card reveal" style="margin-top:28px">
        <h2 style="font-size:22px;color:var(--accent);margin-bottom:12px">Our Commitment to Excellence</h2>
        <p style="color:var(--ink-muted);font-size:15px;line-height:1.8">
          At <b>PASS CORP.</b>, excellence isn't just a goal; it's our standard. We're committed to continuous improvement, constantly refining our methodologies, investing in the latest technology, and developing our team's expertise. Our dedication to quality is reflected in every interaction, every report, and every solution we deliver.
        </p>
      </div>

      <div class="about-cta-box reveal" style="margin-top:28px">
        <h2 style="font-size:24px">Partnering for a Safer, More Secure, and Reliable Future</h2>
        <p style="color:var(--ink-muted);font-size:15px;line-height:1.7;margin-top:12px;max-width:760px;margin-left:auto;margin-right:auto">
          We invite you to experience the <b>PASS CORP.</b> difference. Whether you're seeking to enhance quality control, ensure regulatory compliance, improve safety standards, or streamline operations, we have the expertise and dedication to help you achieve your goals. Contact us today to learn more about how we can partner with you to build a brighter, safer, and more successful future.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
          <button class="btn-primary" onclick="A.goContact()">Contact Us Today ${icon("arrowRight",16)}</button>
          <a class="btn-secondary" style="background:#fff" href="${whatsappHref('Hi PASS CORP, I would like to partner with you.')}" target="_blank" rel="noopener">${icon("chat",15)} Chat on WhatsApp</a>
        </div>
      </div>
    </div>
  `;
}

function renderContact(){
  return `
    <div class="shop-header">
      <div class="breadcrumb" onclick="A.goHome()">${icon("arrowLeft",14)} Back to home</div>
      <span class="eyebrow">Get In Touch</span>
      <h1 class="hero-title" style="font-size:36px">Contact Pass Corp</h1>
    </div>
    <div class="contact-layout">
      <div class="contact-cards-grid">
        <div class="contact-card reveal">
          <div class="contact-card-icon">${icon("mapPin",24)}</div>
          <h3>Our Location</h3>
          <p style="color:var(--ink-muted);font-size:14px;margin-top:6px">${esc(CONTENT.company.address)}</p>
        </div>
        <div class="contact-card reveal">
          <div class="contact-card-icon">${icon("chat",24)}</div>
          <h3>WhatsApp Support</h3>
          <p style="color:var(--ink-muted);font-size:13px;margin:6px 0 12px">Instant enquiries & order updates</p>
          <a class="whatsapp-pill" style="display:inline-flex;width:fit-content" href="${whatsappHref('Hi, I have an enquiry.')}" target="_blank" rel="noopener">${icon("chat",15)} Chat ${esc(CONTENT.company.whatsapp)}</a>
        </div>
        <div class="contact-card reveal">
          <div class="contact-card-icon">${icon("phone",24)}</div>
          <h3>Direct Call</h3>
          <p style="color:var(--ink-muted);font-size:13px;margin:6px 0 12px">Speak directly with our team</p>
          <a class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;width:fit-content;padding:8px 16px" href="tel:${esc(CONTENT.company.phone)}">${icon("phone",14)} ${esc(CONTENT.company.phone)}</a>
        </div>
        <div class="contact-card reveal">
          <div class="contact-card-icon">${icon("mail",24)}</div>
          <h3>Email Us</h3>
          <p style="color:var(--ink-muted);font-size:13px;margin:6px 0 12px">Send formal RFQs and quotes</p>
          <a class="btn-ghost" style="display:inline-flex;align-items:center;gap:6px;width:fit-content" href="${mailHref('Product Inquiry')}">${icon("mail",14)} ${esc(CONTENT.company.email)}</a>
        </div>
      </div>

      <div class="contact-info-banner reveal">
        <div class="brand-lockup">
          <img src="${LOGO_URI}" alt="Pass Corp" style="width:44px;height:44px;object-fit:contain;flex-shrink:0" />
          <div>
            <div class="brand-word">PASS CORP.</div>
            <div class="brand-tag">PRECISION <i>|</i> ASSURANCE <i>|</i> SAFETY <i>|</i> SOLUTION</div>
          </div>
        </div>
        <p style="margin-top:14px;color:var(--ink-muted);font-size:14px;line-height:1.6">
          Need a quick quotation or bulk purchase consultation? Reach out to us directly through WhatsApp or phone call. Our team typically responds within a few minutes during business hours.
        </p>
      </div>
    </div>
  `;
}

function renderBrands(){
  const brandList = [
    { name: "Wild Bull", logo: "assets/brands/wildbull.jpg", desc: "Heavy-duty steel-toe safety footwear engineered for tough industrial shopfloors.", cert: "IS 15298 / EN ISO 20345" },
    { name: "Udyogi", logo: "assets/brands/udyogi.png", desc: "Specialist in double-density safety shoes, cut-resistant gloves, and eye protection.", cert: "IS 15298, EN 388, EN 166" },
    { name: "Karam", logo: "assets/brands/karam.png", desc: "India's premier fall arrest, safety helmets, and full body harness manufacturer.", cert: "IS 2925, EN 397, EN 361" },
    { name: "Honeywell", logo: "assets/brands/honeywell.png", desc: "Premium industrial safety spectacles, heavy-duty gloves, and PAPR systems.", cert: "EN 166, EN 388, EN 12941" },
    { name: "3M", logo: "assets/brands/3m.png", desc: "Global leader in hearing protection, fall safety systems, and respiratory gear.", cert: "EN 352-2, CE Certified" },
    { name: "New Pig", logo: "assets/brands/newpig.png", desc: "World-class chemical, oil and hazmat spill control absorbents and containment kits.", cert: "OSHA, EPA Compliant" },
    { name: "PERF", logo: "assets/brands/perf.png", desc: "Italian-engineered premium safety footwear with composite toe & puncture resistance.", cert: "EN ISO 20345 S3" },
    { name: "SafePro", logo: "assets/brands/safepro.png", desc: "Specialized fire safety, aluminized proximity suits, and emergency rescue gear.", cert: "EN 469, EN ISO 11612" },
    { name: "Unicare", logo: "assets/brands/unicare.png", desc: "Industrial emergency eye/facewash fountains, safety showers, and decontamination units.", cert: "IS 10592, ANSI Z358.1" },
    { name: "ReflectoSafe", logo: "assets/brands/reflectosafe.png", desc: "High-visibility reflective safety jackets, boiler suits, and road workwear.", cert: "EN ISO 20471 Class 2/3" },
    { name: "DPL", logo: "assets/brands/dpl.png", desc: "Specialized chemical and acid-alkali resistant industrial rubber and nitrile gloves.", cert: "EN 388, EN 374-1" },
    { name: "Powerlift", logo: "assets/brands/powerlift.png", desc: "Confined space rescue tripods, retrieval winches, and load lifting blocks.", cert: "EN 795, EN 1496" },
    { name: "Magnum", logo: "assets/brands/magnum.png", desc: "High performance industrial workwear, safety goggles, and eye protection gear.", cert: "EN 166 Certified" },
    { name: "UFS", logo: "assets/brands/ufs.png", desc: "Arc flash protective suits, 40 cal/cm² electrical protection hoods and shields.", cert: "NFPA 70E, ASTM F2178" },
    { name: "ATG", logo: "assets/brands/atg.png", desc: "World leader in dermatologically accredited intelligent hand protection.", cert: "EN 388, OEKO-TEX" },
    { name: "Lancer", logo: "assets/brands/lancer.png", desc: "Durable safety shoes, occupational footwear and industrial boots.", cert: "IS 15298 / EN ISO 20345" },
    { name: "Allen Cooper", logo: "assets/brands/allencooper.png", desc: "High-grade industrial leather safety footwear and steel-toe boots.", cert: "IS 15298, CE EN ISO 20345" },
    { name: "Hillson", logo: "assets/brands/hillson.png", desc: "Specialized safety gumboots and heavy industry work footwear.", cert: "IS 15298, EN 20345" },
    { name: "Leslico", logo: "assets/brands/leslico.png", desc: "Industrial safety equipment, welding protection and PPE gear.", cert: "IS, CE, EN Standards" },
    { name: "Jayco", logo: "assets/brands/jayco.png", desc: "Industrial safety equipment and extreme protection gear.", cert: "IS / EN Standards" },
    { name: "Fuel", logo: "assets/brands/fuel.png", desc: "Ergonomic industrial safety footwear and occupational boots.", cert: "IS 15298 / EN ISO 20345" },
    { name: "Solfir", logo: "assets/brands/solfir.png", desc: "Premium personal protective equipment and workplace safety products.", cert: "IS / EN Standards" },
    { name: "Utex", logo: "assets/brands/utex.jpg", desc: "Industrial protective wear, specialized technical textiles and safety apparel.", cert: "ISO & EN Standards" },
    { name: "GloveX", logo: "assets/brands/glovex.png", desc: "Advanced grip, cut-resistant and industrial safety gloves.", cert: "EN 388 Certified" },
    { name: "ADSSPL", logo: "assets/brands/adsspl.jpg", desc: "Add-On Safety & Surgicals certified occupational health and safety products.", cert: "IS / CE Standards" },
    { name: "Hicare", logo: "assets/brands/hicare.png", desc: "High performance thermal protective wear, flame retardant and arc flash suits.", cert: "EN ISO 11612, NFPA 2112" },
    { name: "DuPont", logo: "assets/brands/dupont.png", desc: "World leader in Tyvek chemical protective coveralls, Nomex & Kevlar hazard suits.", cert: "EN 14126, ISO 13982-1" },
    { name: "Ansell", logo: "assets/brands/ansell.webp", desc: "Global specialist in industrial safety gloves, barrier protection and chemical wear.", cert: "EN 388, EN 374" },
    { name: "Mallcom", logo: "assets/brands/mallcom.jpg", desc: "Integrated manufacturer of certified head-to-toe industrial PPE products.", cert: "IS / EN / CE Standards" },
    { name: "Venus", logo: "assets/brands/venus.jpg", desc: "High protection respiratory masks, particulate filtering respirators and safety gear.", cert: "IS 9473, NIOSH N95" },
    { name: "NeoSafe", logo: "assets/brands/neosafe.jpg", desc: "Engineered safety shoes, lightweight steel-toe and composite footwear.", cert: "IS 15298 / EN ISO 20345" }
  ];

  return `
    <div class="shop-header">
      <div class="breadcrumb" onclick="A.goHome()">${icon("arrowLeft",14)} Back to home</div>
      <span class="eyebrow">Authorised Brands & Partners</span>
      <h1 class="hero-title" style="font-size:36px">World-Class Safety Brands</h1>
      <p class="hero-sub" style="margin-top:8px">We are an authorised distributor and dealer for the world's most trusted PPE and workplace safety manufacturers.</p>
    </div>
    <div class="about-layout">
      <div class="brands-grid">
        ${brandList.map((b, i) => {
          const prods = CONTENT.products.filter(p => p.brand.toLowerCase() === b.name.toLowerCase() || p.brand.toLowerCase().includes(b.name.toLowerCase().split(' ')[0]));
          const count = prods.length;
          return `
            <div class="brand-card reveal" style="--reveal-delay:${(i%6)*40}ms" onclick="A.goShop('all', '${esc(b.name.split(' ')[0])}')" title="Click to view ${esc(b.name)} products">
              <div class="brand-card-top">
                <div class="brand-logo-wrap">
                  <img src="${b.logo}" alt="${esc(b.name)}" class="brand-logo-img" />
                </div>
                <div class="brand-info">
                  <h2 class="brand-title">${esc(b.name)}</h2>
                  <span class="brand-badge">${count} Products</span>
                </div>
              </div>
              <div class="brand-arrow">${icon("arrowRight",16)}</div>
            </div>
          `;
        }).join("")}
      </div>
      <div class="about-cta-box reveal" style="margin-top:36px">
        <h2>Looking for a specific brand or bulk quotation?</h2>
        <p style="color:var(--ink-muted);margin-top:6px">We provide instant pricing, certificates of conformity, and fast delivery for all brands.</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
          <a class="btn-primary" href="${whatsappHref('Hi, I want a quotation for authorised safety brands.')}" target="_blank" rel="noopener">${icon("chat",15)} Request Quote on WhatsApp</a>
          <button class="btn-secondary" style="background:#fff" onclick="A.goContact()">Contact Our Sales Team</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- INSTANT RFQ ENGINE MODAL ---------------- */
function renderRFQModal(){
  if (!STATE.rfqOpen) return "";
  
  const allProducts = CONTENT.products;
  const totalUnits = STATE.rfqItems.reduce((sum, item) => sum + (item.qty || 1), 0);

  return `
    <div class="modal-overlay" onclick="if(event.target===this) A.closeRFQ()">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <div class="rfq-engine-badge">⚡ INSTANT RFQ ENGINE</div>
            <h2 class="rfq-title">Request Official Quotation</h2>
            <p class="rfq-sub">Direct B2B Procurement Quotation with GST Invoice & Corporate Pricing.</p>
          </div>
          <button class="modal-close-btn" onclick="A.closeRFQ()" title="Close">&times;</button>
        </div>

        <div class="rfq-grid">
          <!-- Left Column: Company & Delivery Info -->
          <div>
            <div class="rfq-section-title">1. Organization Details</div>
            <div class="form-group">
              <label class="form-label">Company / Industrial Unit Name *</label>
              <input type="text" id="rfq-comp" class="form-input" placeholder="e.g. Tata Motors / Foxconn / Bharat Forge" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="form-group">
                <label class="form-label">Contact Person Name</label>
                <input type="text" id="rfq-name" class="form-input" placeholder="Purchase Manager / Name" />
              </div>
              <div class="form-group">
                <label class="form-label">GSTIN (Optional)</label>
                <input type="text" id="rfq-gst" class="form-input" placeholder="27AAAAA0000A1Z5" style="text-transform:uppercase" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="form-group">
                <label class="form-label">Mobile / WhatsApp Number *</label>
                <input type="tel" id="rfq-phone" class="form-input" placeholder="976767XXXX" required />
              </div>
              <div class="form-group">
                <label class="form-label">Official Work Email</label>
                <input type="email" id="rfq-email" class="form-input" placeholder="purchase@company.com" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Delivery Location / Industrial Area</label>
              <input type="text" id="rfq-city" class="form-input" placeholder="e.g. Chikhali / Chakan / Bhosari / Pune" />
            </div>
            <div class="form-group">
              <label class="form-label">Special Notes / Urgency</label>
              <textarea id="rfq-notes" class="form-textarea" rows="2" placeholder="e.g. Immediate delivery required / Need sample / Target brand preferences..."></textarea>
            </div>
          </div>

          <!-- Right Column: Category Requirements Cart -->
          <div>
            <div class="rfq-section-title">
              <span>2. Required Categories & Specs (${STATE.rfqItems.length})</span>
              <span style="font-size:12px;color:var(--accent);font-weight:700">${totalUnits} Total Units</span>
            </div>

            <!-- Category & Description Builder -->
            <div class="rfq-cat-builder">
              <div style="margin-bottom:8px">
                <select id="rfq-new-cat" class="form-select" style="font-weight:600">
                  <option value="">+ Select Safety Category...</option>
                  ${CONTENT.categories.map(c => `<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join("")}
                  <option value="other">📦 Other Safety Equipment</option>
                </select>
              </div>
              <div class="rfq-builder-grid">
                <input type="text" id="rfq-new-desc" class="form-input" placeholder="Model, product name, brand (Karam/3M), size/specs..." />
                <input type="number" id="rfq-new-qty" class="form-input" value="20" min="1" placeholder="Qty" title="Required Quantity" />
                <button type="button" class="btn-primary" style="padding:10px 14px;white-space:nowrap;font-size:13px" onclick="A.addCategoryRequirement()">+ Add</button>
              </div>
            </div>

            <div class="rfq-items-box">
              ${STATE.rfqItems.length ? STATE.rfqItems.map((item) => `
                <div class="rfq-item">
                  <div class="rfq-item-info">
                    <span class="rfq-item-tag">${esc(item.catName)}</span>
                    <div class="rfq-item-desc">${esc(item.desc)}</div>
                  </div>
                  <div class="rfq-qty-ctrl">
                    <button class="rfq-qty-btn" onclick="A.updateRFQQty('${item.id}', -5)">-</button>
                    <span class="rfq-qty-val">${item.qty}</span>
                    <button class="rfq-qty-btn" onclick="A.updateRFQQty('${item.id}', 5)">+</button>
                  </div>
                  <button class="rfq-del-btn" onclick="A.removeRFQItem('${item.id}')" title="Remove">&times;</button>
                </div>
              `).join("") : `
                <div class="rfq-empty">
                  <p style="font-size:24px;margin-bottom:6px">📋</p>
                  No categories added yet.<br>
                  Select a <b>Category</b> above, type <b>Model / Specs</b>, enter <b>Qty</b> and click <b>+ Add</b>.
                </div>
              `}
            </div>

            <!-- Submit Actions -->
            <div class="rfq-actions-row">
              <button class="rfq-btn-wa" onclick="A.submitRFQ('whatsapp')">
                ${icon("chat",16)} Send on WhatsApp
              </button>
              <button class="rfq-btn-mail" onclick="A.submitRFQ('email')">
                ${icon("mail",16)} Send via Email
              </button>
              <button class="rfq-btn-slip" onclick="A.submitRFQ('print')">
                ${icon("download",14)} Print / Download Quotation Slip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- MASTER RENDER ---------------- */
function pageBody(){
  switch(STATE.view){
    case "home": return renderHome();
    case "shop": return renderShop();
    case "brands": return renderBrands();
    case "about": return renderAbout();
    case "contact": return renderContact();
    case "product": return renderProductDetail();
    default: return renderHome();
  }
}

function render(){
  document.getElementById("app").innerHTML =
    renderHeader() +
    '<main>' + pageBody() + '</main>' +
    renderFooter() +
    renderRFQModal() +
    `
    <div class="mobile-bottom-bar">
      <a class="mobile-bar-btn-wa" href="${whatsappHref('Hi PASS CORP, I have an urgent enquiry.')}" target="_blank" rel="noopener">${icon("chat",16)} WhatsApp</a>
      <button class="mobile-bar-btn-rfq" onclick="A.openRFQ()">⚡ Instant RFQ ${STATE.rfqItems.length ? `(${STATE.rfqItems.length})` : ''}</button>
    </div>
    ` +
    (STATE.toast ? '<div class="toast" id="toast">'+icon("check",16)+' '+esc(STATE.toast)+'</div>' : '');
  setupReveal();
}

function setupReveal(){
  const els = document.querySelectorAll(".reveal:not(.reveal-visible)");
  if (!("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("reveal-visible"));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("reveal-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  els.forEach(el => obs.observe(el));
}

/* ---------------- INIT ---------------- */
window.addEventListener("scroll", () => {
  const nowScrolled = window.scrollY > 12;
  if (nowScrolled !== STATE.scrolled){
    STATE.scrolled = nowScrolled;
    const header = document.querySelector(".header");
    if (header) header.classList.toggle("is-scrolled", nowScrolled);
  }
}, { passive: true });

// Live 3-Way Synchronization Listener
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY || e.key === "passCorpContent_v8") {
    CONTENT = loadContent();
    render();
  }
});

CONTENT = loadContent();
render();
