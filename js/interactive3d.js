// PASS CORP. - 3D Interactive 360° PPE Mannequin Engine
// Three.js powered interactive 3D engineer avatar with 8 dynamic PPE hotspots

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas3d-container');
  if (!container) return;

  // 1. Hotspot Definitions with Detailed Explanations
  const hotspotsData = [
    {
      id: "helmet",
      name: "Safety Helmet (IS 2925 / EN 397)",
      category: "Head Protection",
      make: "Udyogi UI 1211 / Karam PN521",
      importance: "Zaroorat: Sar ko upar se girne wale heavy lohe ke pipe, patthar, structural collision aur 440V electrical shock se bachane ke liye sabse pehla aur sabse anivarya safety gear hai.",
      position3D: new THREE.Vector3(0, 2.1, 0.1),
      icon: "hard-hat",
      color: "#f59e0b"
    },
    {
      id: "goggles",
      name: "Safety Goggles (EN 166 1B)",
      category: "Eye Protection",
      make: "Udyogi UD 71 / UD 30 Chemical",
      importance: "Zaroorat: Grinding karte waqt nikalne wali aag ki chingaari, fast speed metal burrs, aur chemical splash se aankhon ki roshni ko hamesha ke liye bachata hai.",
      position3D: new THREE.Vector3(0, 1.85, 0.35),
      icon: "glasses",
      color: "#06b6d4"
    },
    {
      id: "mask",
      name: "Dustoguard FFP2 / Gas Respirator",
      category: "Respiratory Safety",
      make: "Udyogi FFP2 / Gasguard Double",
      importance: "Zaroorat: Welding fumes, silica dust, aur toxic chemical gases ko phepdo (lungs) me jaane se rokta hai, jisse occupational asthma aur permanent lung damage nahi hota.",
      position3D: new THREE.Vector3(0, 1.65, 0.4),
      icon: "wind",
      color: "#10b981"
    },
    {
      id: "earmuff",
      name: "Industrial Ear Muff (SNR 32dB)",
      category: "Hearing Protection",
      make: "3M 1110 / EY22-1 / ET 40",
      importance: "Zaroorat: Heavy press machines, forging aur generators ke tez aawaz (noise) se kaan ke parde phatne aur sunne ki shamta (hearing loss) khatam hone se rokta hai.",
      position3D: new THREE.Vector3(0.42, 1.85, 0.05),
      icon: "headphones",
      color: "#eab308"
    },
    {
      id: "jacket",
      name: "High-Visibility Reflective Jacket",
      category: "Body Protection",
      make: "ReflectoSafe Pro Class 3 (EN ISO 20471)",
      importance: "Zaroorat: Plant me moving Forklifts, heavy cranes aur andhere me 360-degree par worker ko 300 meter dur se chamakta dikhata hai, jisse accident zero ho sake.",
      position3D: new THREE.Vector3(0, 0.95, 0.3),
      icon: "user-check",
      color: "#22c55e"
    },
    {
      id: "harness",
      name: "Full Body Fall Arrest Harness",
      category: "Height Safety",
      make: "UB 102 (IS 3521 / EN 361)",
      importance: "Zaroorat: Scaffolding, unchai (height) aur roofs par kaam karte waqt girne se instant fall arrest karta hai aur poore sharir me load safely distribute karta hai.",
      position3D: new THREE.Vector3(0, 0.4, 0.28),
      icon: "anchor",
      color: "#ef4444"
    },
    {
      id: "gloves",
      name: "Cut Level 5 Safety Gloves",
      category: "Hand Protection",
      make: "Udyogi HPU 5 / DPL Nitrile",
      importance: "Zaroorat: Dhaar-daar sheet metal, sharp burrs, glass aur chemical acid se haathon ko katne ya puncture hone se 100% suraksha deta hai.",
      position3D: new THREE.Vector3(-0.95, 0.25, 0.15),
      icon: "shield",
      color: "#3b82f6"
    },
    {
      id: "shoes",
      name: "Steel-Toe Safety Shoes (IS 15298)",
      category: "Foot Protection",
      make: "Wild Bull Power DD / Udyogi Edge",
      importance: "Zaroorat: 200 Joules steel toe cap pairon par bhari lohe ka vajan girne se ungliyon ko crush hone se bachata hai aur oil-resistant anti-skid sole phisalne nahi deta.",
      position3D: new THREE.Vector3(0.28, -1.6, 0.2),
      icon: "footprints",
      color: "#dc2626"
    }
  ];

  // 2. Three.js Scene Setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050b14, 0.08);

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.3, 5.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 3. Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const mainRedLight = new THREE.PointLight(0xdc2626, 3, 20);
  mainRedLight.position.set(3, 4, 3);
  scene.add(mainRedLight);

  const rimCyanLight = new THREE.PointLight(0x06b6d4, 3, 20);
  rimCyanLight.position.set(-3, 3, -3);
  scene.add(rimCyanLight);

  const floorLight = new THREE.PointLight(0x1d4ed8, 1.5, 15);
  floorLight.position.set(0, -2.5, 2);
  scene.add(floorLight);

  // 4. Floor Grid & Turntable Base
  const gridHelper = new THREE.GridHelper(8, 20, 0xdc2626, 0x1e3a63);
  gridHelper.position.y = -1.95;
  scene.add(gridHelper);

  const basePlatformGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.15, 32);
  const basePlatformMat = new THREE.MeshStandardMaterial({
    color: 0x0a192f,
    roughness: 0.3,
    metalness: 0.8
  });
  const platform = new THREE.Mesh(basePlatformGeo, basePlatformMat);
  platform.position.y = -1.9;
  scene.add(platform);

  // Platform Glowing Ring
  const ringGeo = new THREE.RingGeometry(1.5, 1.58, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = -1.82;
  scene.add(ringMesh);

  // 5. 3D Industrial Worker Avatar (Group)
  const avatarGroup = new THREE.Group();
  scene.add(avatarGroup);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.6 });
  const navySuitMat = new THREE.MeshStandardMaterial({ color: 0x0a2240, roughness: 0.7 });
  const highVisVestMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 }); // Neon Green Vest
  const reflectiveTapeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.9 }); // Silver Reflective
  const yellowHelmetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.4 }); // Yellow Helmet
  const goggleLensMat = new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7, roughness: 0.1, transmission: 0.8 });
  const leatherShoeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 }); // Black Safety Shoes
  const gloveBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
  const redHarnessMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

  // A. Torso & Body
  const torsoGeo = new THREE.BoxGeometry(0.9, 1.3, 0.45);
  const torso = new THREE.Mesh(torsoGeo, navySuitMat);
  torso.position.y = 0.8;
  avatarGroup.add(torso);

  // High-Vis Safety Jacket (Overlay on Torso)
  const vestGeo = new THREE.BoxGeometry(0.94, 1.25, 0.48);
  const vest = new THREE.Mesh(vestGeo, highVisVestMat);
  vest.position.y = 0.8;
  avatarGroup.add(vest);

  // Reflective Stripes on Vest (Front & Back)
  const stripeHGeo = new THREE.BoxGeometry(0.96, 0.1, 0.5);
  const stripeH = new THREE.Mesh(stripeHGeo, reflectiveTapeMat);
  stripeH.position.y = 0.65;
  avatarGroup.add(stripeH);

  const stripeV1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.27, 0.5), reflectiveTapeMat);
  stripeV1.position.set(-0.25, 0.8, 0);
  avatarGroup.add(stripeV1);

  const stripeV2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.27, 0.5), reflectiveTapeMat);
  stripeV2.position.set(0.25, 0.8, 0);
  avatarGroup.add(stripeV2);

  // B. Fall Arrest Safety Harness Straps
  const harnessWaist = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.12, 0.52), redHarnessMat);
  harnessWaist.position.y = 0.35;
  avatarGroup.add(harnessWaist);

  const dRingGeo = new THREE.TorusGeometry(0.08, 0.02, 16, 24);
  const dRingMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
  const dRing = new THREE.Mesh(dRingGeo, dRingMat);
  dRing.position.set(0, 1.1, -0.27);
  avatarGroup.add(dRing);

  // C. Head & Neck
  const neckGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.25, 16);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 1.55;
  avatarGroup.add(neck);

  const headGeo = new THREE.SphereGeometry(0.32, 24, 24);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.85;
  avatarGroup.add(head);

  // D. Safety Helmet (IS 2925)
  const helmetDomeGeo = new THREE.SphereGeometry(0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const helmetDome = new THREE.Mesh(helmetDomeGeo, yellowHelmetMat);
  helmetDome.position.y = 1.95;
  avatarGroup.add(helmetDome);

  const helmetBrimGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.04, 32);
  const helmetBrim = new THREE.Mesh(helmetBrimGeo, yellowHelmetMat);
  helmetBrim.position.set(0, 1.95, 0.06);
  avatarGroup.add(helmetBrim);

  // E. Safety Goggles (EN 166)
  const goggleFrameGeo = new THREE.BoxGeometry(0.48, 0.14, 0.18);
  const goggleFrame = new THREE.Mesh(goggleFrameGeo, goggleLensMat);
  goggleFrame.position.set(0, 1.86, 0.28);
  avatarGroup.add(goggleFrame);

  // F. Respiratory Safety Mask (FFP2)
  const maskGeo = new THREE.ConeGeometry(0.18, 0.22, 16);
  const maskMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.5 });
  const mask = new THREE.Mesh(maskGeo, maskMat);
  mask.rotation.x = Math.PI / 2;
  mask.position.set(0, 1.68, 0.32);
  avatarGroup.add(mask);

  // G. Industrial Ear Muffs
  const earmuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), redHarnessMat);
  earmuffL.rotation.z = Math.PI / 2;
  earmuffL.position.set(0.38, 1.85, 0);
  avatarGroup.add(earmuffL);

  const earmuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), redHarnessMat);
  earmuffR.rotation.z = Math.PI / 2;
  earmuffR.position.set(-0.38, 1.85, 0);
  avatarGroup.add(earmuffR);

  // H. Arms & Cut Resistant Gloves
  // Left Arm
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.1, 16), navySuitMat);
  armL.position.set(0.65, 0.7, 0);
  armL.rotation.z = -0.15;
  avatarGroup.add(armL);

  const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), gloveBlueMat);
  gloveL.position.set(0.78, 0.1, 0.05);
  avatarGroup.add(gloveL);

  // Right Arm (Forward Welcoming Position)
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.1, 16), navySuitMat);
  armR.position.set(-0.65, 0.7, 0);
  armR.rotation.z = 0.25;
  armR.rotation.x = -0.2;
  avatarGroup.add(armR);

  const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), gloveBlueMat);
  gloveR.position.set(-0.85, 0.15, 0.2);
  avatarGroup.add(gloveR);

  // I. Legs & Safety Shoes
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.5, 16), navySuitMat);
  legL.position.set(0.24, -0.65, 0);
  avatarGroup.add(legL);

  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.5, 16), navySuitMat);
  legR.position.set(-0.24, -0.65, 0);
  avatarGroup.add(legR);

  // Safety Shoes (Steel Toe)
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.25, 0.55);
  const shoeL = new THREE.Mesh(shoeGeo, leatherShoeMat);
  shoeL.position.set(0.24, -1.5, 0.12);
  avatarGroup.add(shoeL);

  const shoeR = new THREE.Mesh(shoeGeo, leatherShoeMat);
  shoeR.position.set(-0.24, -1.5, 0.12);
  avatarGroup.add(shoeR);

  // 6. Interactive HTML Hotspots Overlay Engine
  const hotspotsLayer = document.getElementById('hotspots-layer');

  function buildHotspotsHTML() {
    if (!hotspotsLayer) return;
    hotspotsLayer.innerHTML = hotspotsData.map((hs, index) => {
      const whatsappUrl = `https://wa.me/919767672497?text=${encodeURIComponent('Hello PASS CORP, I need quotation & details for: ' + hs.name)}`;
      return `
        <div id="hs-node-${hs.id}" class="hotspot-node" data-index="${index}">
          <div class="hotspot-pin">
            <div class="hotspot-pin-inner"></div>
          </div>
          <div class="hotspot-tooltip">
            <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">${hs.category}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900 text-blue-300">PASS CERTIFIED</span>
            </div>
            <h4 class="text-sm font-extrabold text-white mb-1">${hs.name}</h4>
            <div class="text-[11px] font-semibold text-slate-300 mb-2">Brands: <span class="text-white">${hs.make}</span></div>
            <p class="text-slate-300 text-xs leading-relaxed mb-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              ${hs.importance}
            </p>
            <div class="flex gap-2">
              <a 
                href="${whatsappUrl}" 
                target="_blank" 
                class="flex-1 py-2 px-3 rounded-lg text-center font-bold text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white transition flex items-center justify-center gap-1.5"
              >
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                <span>Inquire</span>
              </a>
              <a 
                href="tel:+919767672497" 
                class="py-2 px-3 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center"
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

  buildHotspotsHTML();

  // Populate interactive buttons sidebar
  const hotspotsListContainer = document.getElementById('hotspots-quick-list');
  if (hotspotsListContainer) {
    hotspotsListContainer.innerHTML = hotspotsData.map((hs, index) => `
      <button 
        onclick="highlightHotspot('${hs.id}', ${index})"
        class="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 transition-all flex items-center justify-between group cursor-pointer"
      >
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:animate-ping"></span>
          <div>
            <div class="text-xs font-bold text-white group-hover:text-red-400 transition-colors">${hs.name}</div>
            <div class="text-[10px] text-slate-400">${hs.category}</div>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors"></i>
      </button>
    `).join('');
    if (window.lucide) lucide.createIcons();
  }

  // 7. Dynamic Hotspot Screen Position Projection
  const tempV = new THREE.Vector3();
  function updateHotspotsScreenPosition() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    hotspotsData.forEach(hs => {
      const el = document.getElementById(`hs-node-${hs.id}`);
      if (!el) return;

      // Transform 3D local position to world space (considering avatarGroup rotation)
      tempV.copy(hs.position3D);
      tempV.applyMatrix4(avatarGroup.matrixWorld);

      // Check if point is on the front side facing the camera
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      
      // Project 3D vector to 2D screen coordinates
      tempV.project(camera);

      // Convert to CSS pixel coords
      const x = (tempV.x * 0.5 + 0.5) * width;
      const y = (-(tempV.y * 0.5) + 0.5) * height;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      // Hide or dim if rotated to the back
      const isBehind = tempV.z > 1;
      el.style.opacity = isBehind ? '0.2' : '1';
      el.style.pointerEvents = isBehind ? 'none' : 'auto';
    });
  }

  // 8. 360-Degree Mouse Drag & Touch Rotation Interaction
  let isDragging = false;
  let previousMouseX = 0;
  let targetRotation = 0;
  let autoRotate = true;

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    autoRotate = false;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMouseX;
    previousMouseX = e.clientX;
    avatarGroup.rotation.y += deltaX * 0.008;
    targetRotation = avatarGroup.rotation.y;
  });

  // Touch Support
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousMouseX = e.touches[0].clientX;
      autoRotate = false;
    }
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMouseX;
    previousMouseX = e.touches[0].clientX;
    avatarGroup.rotation.y += deltaX * 0.008;
    targetRotation = avatarGroup.rotation.y;
  });

  // Control Buttons
  const toggleRotateBtn = document.getElementById('toggle-rotate-btn');
  if (toggleRotateBtn) {
    toggleRotateBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      toggleRotateBtn.innerHTML = autoRotate 
        ? '<i data-lucide="pause" class="w-4 h-4"></i><span>Pause 360° Spin</span>'
        : '<i data-lucide="play" class="w-4 h-4"></i><span>Auto 360° Spin</span>';
      if (window.lucide) lucide.createIcons();
    });
  }

  const resetAngleBtn = document.getElementById('reset-angle-btn');
  if (resetAngleBtn) {
    resetAngleBtn.addEventListener('click', () => {
      avatarGroup.rotation.y = 0;
      targetRotation = 0;
    });
  }

  window.highlightHotspot = function(hsId, index) {
    const el = document.getElementById(`hs-node-${hsId}`);
    if (el) {
      document.querySelectorAll('.hotspot-node').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      autoRotate = false;
      setTimeout(() => el.classList.remove('active'), 5000);
    }
  };

  // 9. Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (autoRotate) {
      avatarGroup.rotation.y += delta * 0.45; // Smooth slow ambient spin
    }

    // Subtle gentle floating / breathing animation
    const time = clock.getElapsedTime();
    avatarGroup.position.y = Math.sin(time * 1.5) * 0.03;

    updateHotspotsScreenPosition();
    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
});
