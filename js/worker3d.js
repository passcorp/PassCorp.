// PASS CORP. - Interactive 3D PPE Worker Inspector

document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('worker-stage');
  const card = document.getElementById('worker-card');
  const hotspotsLayer = document.getElementById('worker-hotspots');
  const quickList = document.getElementById('hotspots-quick-list');

  const ppeData = [
    {
      id: "helmet",
      title: "Yellow Industrial Safety Helmet",
      standard: "IS 2925:1984 & EN 397:2012",
      brand: "Udyogi UI 1211 / Karam PN521",
      importance: "Zaroorat: Sar ko upar se girne wale heavy lohe ke pipe, patthar, structural collision aur 440V electrical shock se bachane ke liye sabse pehla aur mandatory safety gear hai.",
      top: "7%",
      left: "50%",
      tooltipClass: "tooltip-right",
      icon: "hard-hat",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40"
    },
    {
      id: "goggles",
      title: "Clear Polycarbonate Safety Goggles",
      standard: "EN 166 1B / ANSI Z87.1",
      brand: "Udyogi UD 71 / UD 30 Chemical",
      importance: "Zaroorat: Grinding karte waqt nikalne wali aag ki chingaari, fast speed metal burrs aur chemical splash se aankhon ki roshni ko permanent damage se bachata hai.",
      top: "13.5%",
      left: "50%",
      tooltipClass: "tooltip-left",
      icon: "glasses",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
    },
    {
      id: "earmuffs",
      title: "Industrial Ear Muffs (SNR 32dB)",
      standard: "EN 352-1 / ANSI S3.19",
      brand: "3M 1110 / EY22-1 / ET 40",
      importance: "Zaroorat: Heavy press machines, forging aur continuous generator noise se kaan ke parde phatne aur hearing loss hone se 100% protect karta hai.",
      top: "15%",
      left: "43%",
      tooltipClass: "tooltip-left",
      icon: "headphones",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40"
    },
    {
      id: "mask",
      title: "Particulate Safety Mask (FFP2)",
      standard: "IS 9473:2002 / NIOSH N95",
      brand: "Dustoguard FFP2 / Weldoguard",
      importance: "Zaroorat: Toxic welding fumes, silica dust, particulate matter aur chemical vapours ko phepdo (lungs) me jaane se rokta hai.",
      top: "19%",
      left: "50%",
      tooltipClass: "tooltip-right",
      icon: "wind",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    },
    {
      id: "jacket",
      title: "High-Visibility Reflective Jacket",
      standard: "EN ISO 20471 Class 3",
      brand: "ReflectoSafe Pro (Fluorescent Orange)",
      importance: "Zaroorat: Plant me moving forklifts, heavy cranes aur andhere me worker ko 300 meter dur se chamakta dikhata hai jisse collision accident zero ho sake.",
      top: "36%",
      left: "58%",
      tooltipClass: "tooltip-right",
      icon: "user-check",
      badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40"
    },
    {
      id: "harness",
      title: "Full Body Fall Arrest Safety Harness",
      standard: "IS 3521:1999 & EN 361:2002",
      brand: "UB 102 / Karam 5-Point Harness",
      importance: "Zaroorat: Scaffolding, unchai (height) aur roof par kaam karte waqt girne se instant fall arrest karta hai aur arrest forces ko safely body me distribute karta hai.",
      top: "32%",
      left: "47%",
      tooltipClass: "tooltip-left",
      icon: "anchor",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/40"
    },
    {
      id: "gloves",
      title: "Heavy Duty Cut Level 5 Gloves",
      standard: "EN 388 (4X44D) / EN 407",
      brand: "Udyogi HPU 5 / DPL Heavy Gauntlet",
      importance: "Zaroorat: Dhaar-daar sheet metal, sharp edges, wrench slips aur chemical solvents se haathon ko cut, burn ya puncture hone se bachata hai.",
      top: "53%",
      left: "41%",
      tooltipClass: "tooltip-left",
      icon: "shield",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40"
    },
    {
      id: "shoes",
      title: "Steel-Toe Industrial Safety Shoes",
      standard: "IS 15298 (Part 2) : 2016",
      brand: "Wild Bull Power DD / Udyogi Edge",
      importance: "Zaroorat: 200 Joules steel toe cap pairon par bhari lohe ka vajan girne se ungliyon ko crush hone se bachata hai aur oil-resistant anti-skid sole phisalne nahi deta.",
      top: "92%",
      left: "49%",
      tooltipClass: "tooltip-top",
      icon: "footprints",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/40"
    }
  ];

  // 1. Render Hotspots on the Worker Image
  if (hotspotsLayer) {
    hotspotsLayer.innerHTML = ppeData.map((item, idx) => {
      const whatsappUrl = `https://wa.me/919767672497?text=${encodeURIComponent('Hello PASS CORP, I need quotation & details for: ' + item.title + ' (' + item.brand + ')')}`;
      return `
        <div 
          id="hotspot-node-${item.id}"
          class="hotspot-point"
          style="top: ${item.top}; left: ${item.left};"
        >
          <div class="hotspot-radar">
            <div class="hotspot-dot"></div>
          </div>

          <div class="hotspot-card ${item.tooltipClass}">
            <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${item.badgeColor}">
                ${item.standard}
              </span>
              <span class="text-[10px] font-bold text-red-400 font-mono">PASS CORP.</span>
            </div>

            <h4 class="text-sm font-extrabold text-white mb-1">${item.title}</h4>
            <div class="text-[11px] font-semibold text-slate-300 mb-2">
              Make / Brand: <span class="text-white font-bold">${item.brand}</span>
            </div>

            <div class="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span class="text-red-400 font-bold">⚠️ Zaroorat Kyun Hai:</span><br/>
              ${item.importance}
            </div>

            <div class="flex gap-2">
              <a 
                href="${whatsappUrl}" 
                target="_blank"
                class="flex-1 py-2 px-3 rounded-lg text-center font-bold text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white transition flex items-center justify-center gap-1.5 shadow-md"
              >
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                <span>Inquire on WhatsApp</span>
              </a>

              <a 
                href="tel:+919767672497"
                class="py-2 px-3 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center shadow-md"
                title="Call Now"
              >
                <i data-lucide="phone" class="w-3.5 h-3.5"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  // 2. Render Left Quick List
  if (quickList) {
    quickList.innerHTML = ppeData.map((item) => `
      <button 
        onclick="triggerHotspot('${item.id}')"
        class="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/60 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
      >
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:scale-125 transition-transform"></span>
          <div>
            <div class="text-xs font-bold text-white group-hover:text-red-400 transition-colors">${item.title}</div>
            <div class="text-[10px] text-slate-400 font-mono">${item.brand}</div>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all"></i>
      </button>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  window.triggerHotspot = function(id) {
    document.querySelectorAll('.hotspot-point').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`hotspot-node-${id}`);
    if (target) {
      target.classList.add('active');
      setTimeout(() => target.classList.remove('active'), 5000);
    }
  };

  // 3. 3D Perspective Tilt on Mouse Movement (Parallax)
  if (stage && card) {
    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg tilt
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    stage.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  }
});
