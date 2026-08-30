/* =========================================================
   PASS CORP — CMS logic (admin.html)
   Requires data.js to be loaded first.
========================================================= */

const PASS_SECRET = "Pawanjali@241997";

const STATE = {
  authed: false,
  adminTab: "products",   // products | categories | content
  adminModal: null,       // {type:'product'|'category', id: string|null}
  loginError: "",
  toast: ""
};

function showToast(msg){
  STATE.toast = msg;
  render();
  setTimeout(() => { STATE.toast = ""; const t = document.getElementById("toast"); if (t) t.remove(); }, 2200);
}

/* ---------------- ACTIONS ---------------- */
const Actions = {
  loginSubmit(code){
    if (code === "Pawanjali@241997") {
      STATE.authed = true;
      STATE.loginError = "";
    } else {
      STATE.loginError = "Incorrect passcode. Try again.";
    }
    render();
  },
  logout(){ window.location.href = "index.html"; },
  /* ---- admin ---- */
  setAdminTab(tab){ STATE.adminTab = tab; render(); },
  openProductModal(id){ STATE.adminModal = { type:"product", id: id || null }; render(); },
  openCategoryModal(id){ STATE.adminModal = { type:"category", id: id || null }; render(); },
  closeModal(){ STATE.adminModal = null; render(); },
  deleteProduct(id){
    if (!confirm("Delete this product?")) return;
    CONTENT.products = CONTENT.products.filter(p => p.id !== id);
    saveContent();
    render();
  },
  deleteCategory(id){
    if (CONTENT.products.some(p => p.category === id)) { alert("Move or delete this category's products first."); return; }
    if (!confirm("Delete this category?")) return;
    CONTENT.categories = CONTENT.categories.filter(c => c.id !== id);
    saveContent();
    render();
  },
  saveProductForm(e, existingId){
    e.preventDefault();
    const fd = new FormData(e.target);
    const specsRaw = (fd.get("specs") || "").trim();
    const specs = specsRaw ? specsRaw.split("\n").map(line => {
      const idx = line.indexOf(":");
      return idx === -1 ? [line.trim(), ""] : [line.slice(0,idx).trim(), line.slice(idx+1).trim()];
    }).filter(pair => pair[0]) : [];
    const category = fd.get("category");
    const data = {
      id: existingId || (category + "-" + Math.random().toString(36).slice(2,8)),
      category: category,
      name: (fd.get("pname") || "").trim(),
      brand: (fd.get("brand") || "").trim(),
      cert: (fd.get("cert") || "").trim(),
      price: parseFloat(fd.get("price")) || 0,
      rating: Math.min(5, Math.max(0, parseFloat(fd.get("rating")) || 0)),
      reviews: parseInt(fd.get("reviews")) || 0,
      bestseller: fd.get("bestseller") !== null,
      stock: fd.get("stock") || "in",
      desc: (fd.get("desc") || "").trim(),
      specs
    };
    if (existingId) {
      const idx = CONTENT.products.findIndex(p => p.id === existingId);
      CONTENT.products[idx] = data;
    } else {
      CONTENT.products.push(data);
    }
    STATE.adminModal = null;
    saveContent();
    render();
  },
  saveCategoryForm(e, existingId){
    e.preventDefault();
    const fd = new FormData(e.target);
    const rawId = existingId || (fd.get("catid") || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-");
    const data = { id: rawId, name: (fd.get("cname")||"").trim(), blurb: (fd.get("blurb")||"").trim(), emoji: (fd.get("emoji")||"").trim() || "🛡️" };
    if (existingId) {
      const idx = CONTENT.categories.findIndex(c => c.id === existingId);
      CONTENT.categories[idx] = data;
    } else {
      if (CONTENT.categories.some(c => c.id === data.id)) { alert("A category with that ID already exists."); return; }
      CONTENT.categories.push(data);
    }
    STATE.adminModal = null;
    saveContent();
    render();
  },
  saveSiteContent(e){
    e.preventDefault();
    const fd = new FormData(e.target);
    CONTENT.hero.eyebrow = fd.get("eyebrow");
    CONTENT.hero.title = fd.get("title");
    CONTENT.hero.subtitle = fd.get("subtitle");
    CONTENT.company.address = fd.get("address");
    CONTENT.company.phone = fd.get("phone");
    CONTENT.company.whatsapp = fd.get("whatsapp");
    CONTENT.company.email = fd.get("email");
    CONTENT.company.tagline = fd.get("tagline");
    for (let i=0;i<4;i++){
      CONTENT.trust[i].b = fd.get("trustB"+i);
      CONTENT.trust[i].t = fd.get("trustT"+i);
      CONTENT.trust[i].icon = fd.get("trustIcon"+i);
    }
    saveContent();
    showToast("Site content saved");
  },
  resetContent(){
    if (!confirm("Reset all content to the original defaults? This cannot be undone.")) return;
    resetContentToDefaults();
    render();
  },
  exportContent(){
    const blob = new Blob([JSON.stringify(CONTENT, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pass-corp-content.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  importContent(fileInput){
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.products || !parsed.categories) throw new Error("bad shape");
        CONTENT = parsed;
        saveContent();
        showToast("Content imported");
      } catch (err) {
        alert("That file doesn't look like a valid Pass Corp content export.");
      }
    };
    reader.readAsText(file);
    fileInput.value = "";
  }
};
window.A = Actions;

/* ---------------- RENDERERS ---------------- */
function renderAdminLogin(){
  return `
    <div class="admin-login-wrap">
      <div class="admin-login-card">
        <div class="icon-circle">${icon("lock",22)}</div>
        <h2 style="font-size:20px">Manage content</h2>
        <p style="font-size:13px;color:var(--ink-muted);margin-top:8px">Enter the site passcode to edit products, stock status, categories and copy.</p>
        <form onsubmit="event.preventDefault(); A.loginSubmit(new FormData(this).get('code'))" style="margin-top:20px;text-align:left">
          <div class="form-group">
            <label class="form-label">Passcode</label>
            <input class="form-input" type="password" name="code" autofocus />
          </div>
          ${STATE.loginError ? '<p class="field-error" style="margin-bottom:10px">'+STATE.loginError+'</p>' : ''}
          <button class="btn-primary" style="width:100%;justify-content:center" type="submit">Sign in</button>
        </form>
        <a class="btn-ghost" style="margin-top:16px;display:inline-flex" href="index.html">${icon("arrowLeft",14)} Back to site</a>
      </div>
    </div>
  `;
}

function adminNav(){
  const tabs = [["products","box","Products"],["categories","grid","Categories"],["content","settings","Site content"]];
  return `
    <div class="admin-side">
      <a href="quotation.html?secure=1" target="_blank" style="background:#2563eb;color:#ffffff;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px 12px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;margin-bottom:12px;box-shadow:0 2px 8px rgba(37,99,235,0.3);text-align:center;">
        📄 Quotor ↗
      </a>
      ${tabs.map(t => '<button class="'+(STATE.adminTab===t[0]?"active":"")+'" onclick="A.setAdminTab(\''+t[0]+'\')">'+icon(t[1],16)+' '+t[2]+'</button>').join("")}
      <div style="height:1px;background:var(--line);margin:10px 0"></div>
      <button onclick="A.exportContent()">${icon("download",16)} Export JSON</button>
      <button onclick="document.getElementById('importFile').click()">${icon("upload",16)} Import JSON</button>
      <input type="file" id="importFile" accept="application/json" style="display:none" onchange="A.importContent(this)" />
      <button onclick="A.resetContent()">${icon("refresh",16)} Reset to defaults</button>
      <div style="height:1px;background:var(--line);margin:10px 0"></div>
      <button onclick="window.location.href='index.html'">${icon("eye",16)} View live site</button>
      <button onclick="A.logout()">${icon("logout",16)} Log out</button>
    </div>
  `;
}

function renderAdminProducts(){
  const rows = CONTENT.products.map(p => `
    <tr>
      <td><b>${esc(p.name)}</b><br><span style="color:var(--ink-faint);font-size:11px">${esc(p.id)}</span></td>
      <td>${esc((findCategory(p.category)||{name:p.category}).name)}</td>
      <td>${esc(p.brand)}</td>
      <td class="mono">${fmt(p.price)}</td>
      <td>${stockBadge(p.stock)}</td>
      <td>${p.bestseller ? '<span class="admin-badge">Popular</span>' : ''}</td>
      <td>
        <div class="admin-actions-cell">
          <button class="btn-ghost" onclick="A.openProductModal('${p.id}')">${icon("edit",14)}</button>
          <button class="btn-danger" onclick="A.deleteProduct('${p.id}')">${icon("trash",14)}</button>
        </div>
      </td>
    </tr>
  `).join("");
  return `
    <div class="admin-toolbar">
      <h2 style="font-size:20px">Products <span class="admin-badge">${CONTENT.products.length}</span></h2>
      <button class="btn-primary" onclick="A.openProductModal(null)">+ Add product</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>Product</th><th>Category</th><th>Brand</th><th>Price</th><th>Stock</th><th></th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderAdminCategories(){
  const rows = CONTENT.categories.map(c => `
    <tr>
      <td style="font-size:22px">${c.emoji}</td>
      <td><b>${esc(c.name)}</b><br><span style="color:var(--ink-faint);font-size:11px">${esc(c.id)}</span></td>
      <td>${esc(c.blurb)}</td>
      <td>${CONTENT.products.filter(p=>p.category===c.id).length} products</td>
      <td>
        <div class="admin-actions-cell">
          <button class="btn-ghost" onclick="A.openCategoryModal('${c.id}')">${icon("edit",14)}</button>
          <button class="btn-danger" onclick="A.deleteCategory('${c.id}')">${icon("trash",14)}</button>
        </div>
      </td>
    </tr>
  `).join("");
  return `
    <div class="admin-toolbar">
      <h2 style="font-size:20px">Categories <span class="admin-badge">${CONTENT.categories.length}</span></h2>
      <button class="btn-primary" onclick="A.openCategoryModal(null)">+ Add category</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>Icon</th><th>Name</th><th>Blurb</th><th>Products</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderAdminContent(){
  const h = CONTENT.hero, co = CONTENT.company, tr = CONTENT.trust;
  const iconOptions = ["shield","box","package","phone","check","star","mapPin"];
  return `
    <div class="admin-toolbar"><h2 style="font-size:20px">Site content</h2></div>
    <form onsubmit="A.saveSiteContent(event)">
      <div class="admin-card">
        <p class="filter-title">Hero section</p>
        <div class="form-group"><label class="form-label">Eyebrow</label><input class="form-input" name="eyebrow" value="${esc(h.eyebrow)}" /></div>
        <div class="form-group"><label class="form-label">Title</label><input class="form-input" name="title" value="${esc(h.title)}" /></div>
        <div class="form-group"><label class="form-label">Subtitle</label><textarea class="form-textarea" name="subtitle" rows="3">${esc(h.subtitle)}</textarea></div>
      </div>
      <div class="admin-card">
        <p class="filter-title">Trust bar (4 items)</p>
        ${tr.map((t,i) => `
          <div class="admin-form-grid" style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed var(--line)">
            <div class="form-group"><label class="form-label">Icon</label>
              <select class="form-select" name="trustIcon${i}">${iconOptions.map(o => '<option value="'+o+'"'+(t.icon===o?" selected":"")+'>'+o+'</option>').join("")}</select>
            </div>
            <div class="form-group"><label class="form-label">Bold label</label><input class="form-input" name="trustB${i}" value="${esc(t.b)}" /></div>
            <div class="form-group" style="grid-column:1/-1"><label class="form-label">Text</label><input class="form-input" name="trustT${i}" value="${esc(t.t)}" /></div>
          </div>
        `).join("")}
      </div>
      <div class="admin-card">
        <p class="filter-title">Company details</p>
        <div class="form-group"><label class="form-label">Address</label><input class="form-input" name="address" value="${esc(co.address)}" /></div>
        <div class="admin-form-grid">
          <div class="form-group"><label class="form-label">Phone</label><input class="form-input" name="phone" value="${esc(co.phone)}" /></div>
          <div class="form-group"><label class="form-label">WhatsApp number</label><input class="form-input" name="whatsapp" value="${esc(co.whatsapp)}" placeholder="10-digit number" /></div>
        </div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" name="email" value="${esc(co.email)}" /></div>
        <div class="form-group"><label class="form-label">Tagline</label><input class="form-input" name="tagline" value="${esc(co.tagline)}" /></div>
      </div>
      <button class="btn-primary" type="submit">${icon("check",16)} Save site content</button>
    </form>
  `;
}

function renderAdmin(){
  let body = "";
  if (STATE.adminTab === "products") body = renderAdminProducts();
  else if (STATE.adminTab === "categories") body = renderAdminCategories();
  else body = renderAdminContent();
  return `
    <div class="admin-shell">
      ${adminNav()}
      <div>${body}</div>
    </div>
    ${renderProductModal()}${renderCategoryModal()}
  `;
}

function renderProductModal(){
  if (!STATE.adminModal || STATE.adminModal.type !== "product") return "";
  const id = STATE.adminModal.id;
  const p = id ? findProduct(id) : { category: CONTENT.categories[0].id, name:"", brand:"", cert:"", price:0, rating:4.5, reviews:0, bestseller:false, stock:"in", desc:"", specs:[] };
  const specsText = (p.specs||[]).map(s => s[0]+": "+s[1]).join("\n");
  return `
    <div class="modal-overlay" onclick="if(event.target===this) A.closeModal()">
      <div class="modal-card">
        <div class="modal-head">
          <h3 style="font-size:18px">${id?"Edit product":"Add product"}</h3>
          <button class="icon-btn" onclick="A.closeModal()">${icon("x",18)}</button>
        </div>
        <form onsubmit="A.saveProductForm(event, ${id?("'"+id+"'"):'null'})">
          <div class="admin-form-grid">
            <div class="form-group"><label class="form-label">Category</label>
              <select class="form-select" name="category">${CONTENT.categories.map(c => '<option value="'+c.id+'"'+(p.category===c.id?" selected":"")+'>'+esc(c.name)+'</option>').join("")}</select>
            </div>
            <div class="form-group"><label class="form-label">Brand</label><input class="form-input" name="brand" value="${esc(p.brand)}" required /></div>
          </div>
          <div class="form-group"><label class="form-label">Product name</label><input class="form-input" name="pname" value="${esc(p.name)}" required /></div>
          <div class="admin-form-grid">
            <div class="form-group"><label class="form-label">Certification / standard</label><input class="form-input" name="cert" value="${esc(p.cert)}" /></div>
            <div class="form-group"><label class="form-label">Indicative price (₹)</label><input class="form-input" type="number" step="1" name="price" value="${p.price}" required /></div>
          </div>
          <div class="admin-form-grid">
            <div class="form-group"><label class="form-label">Stock status</label>
              <select class="form-select" name="stock">
                <option value="in"${p.stock==="in"?" selected":""}>In Stock</option>
                <option value="low"${p.stock==="low"?" selected":""}>Limited Stock</option>
                <option value="out"${p.stock==="out"?" selected":""}>Out of Stock</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Rating (0–5)</label><input class="form-input" type="number" step="0.1" min="0" max="5" name="rating" value="${p.rating}" /></div>
          </div>
          <div class="form-group"><label class="form-label">Reviews count</label><input class="form-input" type="number" name="reviews" value="${p.reviews}" style="max-width:160px" /></div>
          <div class="form-group checkbox-row"><input type="checkbox" name="bestseller" id="bs"${p.bestseller?" checked":""} /><label for="bs">Mark as popular</label></div>
          <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" name="desc" rows="3">${esc(p.desc)}</textarea></div>
          <div class="form-group">
            <label class="form-label">Specs — one per line, "Label: Value"</label>
            <textarea class="form-textarea" name="specs" rows="4" placeholder="Standard: EN 388&#10;Sizes: S – XL">${esc(specsText)}</textarea>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px">
            <button type="button" class="btn-secondary" onclick="A.closeModal()">Cancel</button>
            <button type="submit" class="btn-primary">Save product</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderCategoryModal(){
  if (!STATE.adminModal || STATE.adminModal.type !== "category") return "";
  const id = STATE.adminModal.id;
  const c = id ? findCategory(id) : { id:"", name:"", blurb:"", emoji:"🛡️" };
  return `
    <div class="modal-overlay" onclick="if(event.target===this) A.closeModal()">
      <div class="modal-card" style="max-width:420px">
        <div class="modal-head">
          <h3 style="font-size:18px">${id?"Edit category":"Add category"}</h3>
          <button class="icon-btn" onclick="A.closeModal()">${icon("x",18)}</button>
        </div>
        <form onsubmit="A.saveCategoryForm(event, ${id?("'"+id+"'"):'null'})">
          ${id ? '' : '<div class="form-group"><label class="form-label">ID (used internally, e.g. "shoes")</label><input class="form-input" name="catid" required /></div>'}
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" name="cname" value="${esc(c.name)}" required /></div>
          <div class="form-group"><label class="form-label">Blurb</label><input class="form-input" name="blurb" value="${esc(c.blurb)}" /></div>
          <div class="form-group"><label class="form-label">Emoji icon</label><input class="form-input" name="emoji" value="${esc(c.emoji)}" style="width:80px;font-size:20px;text-align:center" /></div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px">
            <button type="button" class="btn-secondary" onclick="A.closeModal()">Cancel</button>
            <button type="submit" class="btn-primary">Save category</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/* ---------------- MASTER RENDER ---------------- */
function render(){
  document.getElementById("app").innerHTML =
    renderAdminHeader() +
    '<main>' + (STATE.authed ? renderAdmin() : renderAdminLogin()) + '</main>' +
    (STATE.toast ? '<div class="toast" id="toast">'+icon("check",16)+' '+esc(STATE.toast)+'</div>' : '');
}

function renderAdminHeader(){
  return `
    <header class="header">
      <div class="header-inner">
        <div class="brand-lockup" onclick="window.location.href='index.html'">
          <img src="${LOGO_URI}" alt="Pass Corp" style="width:40px;height:40px;object-fit:contain;flex-shrink:0" />
          <div>
            <div class="brand-word">PASS <span style="font-weight:500">CORP.</span></div>
            <div class="brand-tag">MANAGE CONTENT</div>
          </div>
        </div>
        <div class="header-actions">
          <a class="btn-ghost" href="index.html">${icon("eye",14)} View live site</a>
        </div>
      </div>
    </header>
    <div class="top-strip"></div>
  `;
}

/* ---------------- INIT ---------------- */
CONTENT = loadContent();
render();
