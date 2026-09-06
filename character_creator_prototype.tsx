import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Camera, Image as ImageIcon, Upload, Check, ChevronRight } from 'lucide-react';

// --- DATA ARCHITECTURE ---
// This structure mimics how data would be organized in a Unity backend.
const initialCharacterState = {
  face: {
    eyes: { size: 50, width: 50, spacing: 50, height: 50, depth: 50, selectedSlot: null },
    nose: { width: 50, length: 50, height: 50, tip: 50, bridge: 50, selectedSlot: null },
    mouth: { width: 50, upperLip: 50, lowerLip: 50, thickness: 50, height: 50, selectedSlot: null },
    ears: { size: 50, position: 50, angle: 50, selectedSlot: null },
    shape: { width: 50, height: 50, jawWidth: 50, jawLength: 50, chinWidth: 50, chinLength: 50, cheekWidth: 50, cheekHeight: 50, selectedSlot: null }
  },
  body: {
    overall: { height: 50, width: 50, build: 50, muscle: 50, proportion: 50, selectedSlot: null },
    legs: { size: 50, length: 50, thighSize: 50, calfSize: 50, footSize: 50, selectedSlot: null },
    chest: { width: 50, depth: 50, size: 50, ribcageSize: 50, selectedSlot: null },
    shoulders: { width: 50, size: 50, height: 50, selectedSlot: null },
    arms: { size: 50, length: 50, upperArmSize: 50, forearmSize: 50, selectedSlot: null },
    waist: { width: 50, depth: 50, selectedSlot: null },
    belly: { size: 50, depth: 50, selectedSlot: null },
    hips: { width: 50, size: 50, selectedSlot: null },
    feet: { size: 50, length: 50, selectedSlot: null }
  },
  clothes: {
    tops: { selectedSlot: null },
    bottoms: { selectedSlot: null },
    shoes: { selectedSlot: null },
    accessories: { selectedSlot: null }
  }
};

const CATEGORIES = {
  FACE: ['Eyes', 'Nose', 'Mouth', 'Ears', 'Shape'],
  BODY: ['Overall', 'Legs', 'Chest', 'Shoulders', 'Arms', 'Waist', 'Belly', 'Hips', 'Feet'],
  CLOTHES: ['Tops', 'Bottoms', 'Shoes', 'Accessories']
};

// --- REUSABLE UI COMPONENTS ---

const SliderControl = ({ label, value, onChange }) => {
  // Format camelCase to Title Case (e.g., eyeSize -> Eye Size)
  const displayLabel = label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  
  return (
    <div className="mb-4 group">
      <div className="flex justify-between text-xs text-gray-400 mb-1 group-hover:text-gray-200 transition-colors">
        <span>{displayLabel}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="relative w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gray-400" 
          style={{ width: `${value}%` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

const ImageOptionGrid = ({ selectedId, onSelect }) => {
  // Generate 6 dummy slots for prototype
  const slots = Array.from({ length: 6 }, (_, i) => `slot-${i + 1}`);

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {slots.map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`
            aspect-square rounded-md border transition-all duration-200 relative overflow-hidden
            flex items-center justify-center bg-gray-800/50
            ${selectedId === id 
              ? 'border-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-700'}
          `}
        >
          {/* CSS Placeholder Pattern */}
          <div className="absolute inset-0 opacity-20" style={{
             backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
             backgroundSize: '8px 8px'
          }} />
          <ImageIcon size={20} className={selectedId === id ? 'text-gray-200' : 'text-gray-600'} />
          
          {selectedId === id && (
            <div className="absolute top-1 right-1 bg-gray-200 rounded-full p-0.5">
              <Check size={10} className="text-gray-900" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [activeMain, setActiveMain] = useState('FACE');
  const [activeSub, setActiveSub] = useState('Eyes');
  const [characterState, setCharacterState] = useState(initialCharacterState);
  
  // AI Face Feature State
  const [facePhoto, setFacePhoto] = useState(null);
  const [faceStatus, setFaceStatus] = useState('');

  // Handle changing main category
  const handleMainCategoryChange = (category) => {
    setActiveMain(category);
    setActiveSub(CATEGORIES[category][0]); // Reset to first subcategory
  };

  // Update central state
  const handleParameterChange = (key, value) => {
    setCharacterState(prev => {
      const newState = { ...prev };
      // Convert UI display name back to state key mapping
      const categoryKey = activeMain.toLowerCase();
      const subKey = activeSub.toLowerCase();
      
      if (!newState[categoryKey][subKey]) {
        newState[categoryKey][subKey] = {};
      }
      newState[categoryKey][subKey][key] = value;
      return newState;
    });
  };

  // Handle AI Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFacePhoto(event.target.result);
        setFaceStatus('Face image loaded. Ready to generate.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCharacter = () => {
    setFaceStatus('Applying character state... Character Generated.');
    setTimeout(() => setFaceStatus(''), 3000);
  };

  // Get current active parameters
  const activeParameters = characterState[activeMain.toLowerCase()]?.[activeSub.toLowerCase()] || {};

  return (
    <div className="h-screen w-screen bg-[#0a0a0c] text-gray-300 font-sans overflow-hidden select-none">
      
      {/* 3D VIEWPORT */}
      <div className="absolute inset-0 z-0">
        <Viewport3D characterState={characterState} />
      </div>

      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-light tracking-widest text-white/90">CHARACTER CREATOR</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Prototype Build v0.1</p>
        </div>
      </div>

      {/* LEFT NAVIGATION (Subcategories) */}
      <div className="absolute top-1/2 left-8 transform -translate-y-1/2 flex flex-col gap-2 z-10 w-48">
        {CATEGORIES[activeMain].map((subCat) => (
          <button
            key={subCat}
            onClick={() => setActiveSub(subCat)}
            className={`
              text-left px-4 py-3 rounded-lg text-sm tracking-wider transition-all duration-200 flex items-center justify-between
              ${activeSub === subCat 
                ? 'bg-gray-200 text-gray-900 font-medium shadow-lg' 
                : 'bg-gray-900/40 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-gray-800/50'}
              backdrop-blur-sm
            `}
          >
            {subCat.toUpperCase()}
            {activeSub === subCat && <ChevronRight size={16} />}
          </button>
        ))}
        
        {/* AI Face Upload Feature Area */}
        {activeMain === 'FACE' && (
          <div className="mt-8 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-4 shadow-xl">
             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">AI Face Gen</h3>
             
             {facePhoto ? (
               <div className="mb-3 relative group">
                 <img src={facePhoto} alt="Uploaded Face" className="w-full aspect-square object-cover rounded-lg border border-gray-700 opacity-70 group-hover:opacity-100 transition-opacity" />
                 <button onClick={() => setFacePhoto(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded text-xs hover:bg-red-500/50">X</button>
               </div>
             ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg cursor-pointer bg-gray-800/30 hover:bg-gray-800/50 transition-all mb-3 group">
                  <Upload size={20} className="text-gray-500 group-hover:text-gray-300 mb-2" />
                  <span className="text-[10px] text-gray-400 text-center px-2">UPLOAD PHOTO</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
             )}

             <button 
                onClick={handleGenerateCharacter}
                className="w-full py-2 bg-gray-200 hover:bg-white text-gray-900 rounded text-xs font-semibold tracking-wider transition-colors disabled:opacity-50"
                disabled={!facePhoto && faceStatus === ''}
              >
                GENERATE
             </button>
             {faceStatus && (
               <p className="text-[10px] text-gray-400 mt-2 leading-tight text-center">{faceStatus}</p>
             )}
          </div>
        )}
      </div>

      {/* RIGHT CUSTOMIZATION PANEL */}
      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 flex flex-col z-10 w-80 bg-[#121214]/80 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto customize-scrollbar">
        
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-6 sticky top-0 bg-[#121214]/90 z-20 backdrop-blur-md pt-2 -mt-2">
           <div className="w-2 h-6 bg-gray-400 rounded-sm"></div>
           <h2 className="text-xl font-medium tracking-wide text-gray-100">{activeSub.toUpperCase()}</h2>
        </div>

        {/* Dynamic Parameter Rendering */}
        <div className="flex-1 space-y-2">
          {Object.keys(activeParameters).map(key => {
            if (key === 'selectedSlot') {
              return (
                <div key="grid-section" className="mb-8">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Presets</p>
                  <ImageOptionGrid 
                    selectedId={activeParameters[key]} 
                    onSelect={(val) => handleParameterChange(key, val)} 
                  />
                </div>
              );
            }
            if (typeof activeParameters[key] === 'number') {
              return (
                <SliderControl 
                  key={key} 
                  label={key} 
                  value={activeParameters[key]} 
                  onChange={(val) => handleParameterChange(key, val)} 
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* BOTTOM NAVIGATION (Main Categories) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 p-1 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-full shadow-2xl">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => handleMainCategoryChange(cat)}
            className={`
              px-8 py-3 rounded-full text-sm tracking-widest font-medium transition-all duration-300
              ${activeMain === cat 
                ? 'bg-gray-200 text-gray-900 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .customize-scrollbar::-webkit-scrollbar { width: 4px; }
        .customize-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .customize-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .customize-scrollbar::-webkit-scrollbar-thumb:hover { background: #4B5563; }
      `}} />
    </div>
  );
}

// --- THREE.JS VIEWPORT COMPONENT ---
// Handles 3D rendering, scene setup, and custom mouse controls.

const Viewport3D = ({ characterState }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const characterGroupRef = useRef(null);
  const partsRef = useRef({}); // Store references to specific body parts to animate them

  // Mouse interaction state
  const interactionState = useRef({
    isPan: false,
    isRotate: false,
    lastMouseX: 0,
    lastMouseY: 0,
    panTarget: new THREE.Vector3(0, 1.2, 0)
  });

  useEffect(() => {
    if (!mountRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0c'); // Dark studio background
    scene.fog = new THREE.FogExp2('#0a0a0c', 0.05);
    sceneRef.current = scene;

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4); // Default view
    cameraRef.current = camera;

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. STUDIO ENVIRONMENT
    // Platform
    const platformGeo = new THREE.CylinderGeometry(2, 2, 0.1, 64);
    const platformMat = new THREE.MeshStandardMaterial({ 
      color: '#1a1a1c', 
      roughness: 0.8, 
      metalness: 0.2 
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.05;
    platform.receiveShadow = true;
    scene.add(platform);

    // Floor Grid (Subtle)
    const gridHelper = new THREE.GridHelper(20, 40, '#222222', '#111111');
    gridHelper.position.y = -0.04;
    scene.add(gridHelper);

    // Back wall (curved backdrop)
    const backdropGeo = new THREE.CylinderGeometry(10, 10, 10, 64, 1, true, -Math.PI/2, Math.PI);
    const backdropMat = new THREE.MeshStandardMaterial({
      color: '#0a0a0c',
      side: THREE.BackSide,
      roughness: 1,
      metalness: 0
    });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    scene.add(backdrop);

    // 5. LIGHTING (Studio setup)
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.5);
    keyLight.position.set(-2, 3, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#aaccff', 0.5);
    fillLight.position.set(2, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.SpotLight('#ffffff', 2);
    rimLight.position.set(0, 4, -3);
    rimLight.lookAt(0, 1, 0);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 1;
    scene.add(rimLight);

    // 6. CHARACTER PLACEHOLDER (Mannequin)
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // Base material for placeholder
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: '#d0d0d0', 
      roughness: 0.4, 
      metalness: 0.1 
    });

    // Helper to create body parts
    const createPart = (geo, y, z = 0, castShadow = true) => {
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.set(0, y, z);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      return mesh;
    };

    // Construct simple mannequin
    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.6, 32);
    const torso = createPart(torsoGeo, 1.1);
    characterGroup.add(torso);
    partsRef.current.torso = torso;

    const headGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const head = createPart(headGeo, 1.55, 0.02);
    characterGroup.add(head);
    partsRef.current.head = head;
    
    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16);
    const neck = createPart(neckGeo, 1.42);
    characterGroup.add(neck);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.8, 16);
    const leftLeg = createPart(legGeo, 0.4);
    leftLeg.position.x = -0.1;
    const rightLeg = createPart(legGeo, 0.4);
    rightLeg.position.x = 0.1;
    characterGroup.add(leftLeg, rightLeg);
    partsRef.current.legs = [leftLeg, rightLeg];

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.7, 16);
    const leftArm = createPart(armGeo, 1.05);
    leftArm.position.x = -0.28;
    leftArm.rotation.z = -0.1;
    const rightArm = createPart(armGeo, 1.05);
    rightArm.position.x = 0.28;
    rightArm.rotation.z = 0.1;
    characterGroup.add(leftArm, rightArm);
    partsRef.current.arms = [leftArm, rightArm];

    // 7. INTERACTION LOGIC (Custom Controls)
    const domElement = renderer.domElement;

    // Prevent context menu (so RMB works for dragging)
    const onContextMenu = (e) => e.preventDefault();
    domElement.addEventListener('contextmenu', onContextMenu);

    const onMouseDown = (e) => {
      if (e.button === 0) interactionState.current.isPan = true;    // LMB
      if (e.button === 2) interactionState.current.isRotate = true; // RMB
      
      interactionState.current.lastMouseX = e.clientX;
      interactionState.current.lastMouseY = e.clientY;
    };

    const onMouseUp = () => {
      interactionState.current.isPan = false;
      interactionState.current.isRotate = false;
    };

    const onMouseMove = (e) => {
      const { isPan, isRotate, lastMouseX, lastMouseY } = interactionState.current;
      
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;

      if (isRotate && characterGroupRef.current) {
        // RMB: Rotate Character around Y axis
        characterGroupRef.current.rotation.y += deltaX * 0.01;
      } 
      else if (isPan && cameraRef.current) {
        // LMB: Pan Camera (move target and camera)
        const panSpeed = 0.005;
        
        // Calculate camera right and up vectors to pan relative to view
        const right = new THREE.Vector3().crossVectors(cameraRef.current.up, cameraRef.current.getWorldDirection(new THREE.Vector3()).negate()).normalize();
        const up = new THREE.Vector3().copy(cameraRef.current.up).normalize();

        const panMove = right.multiplyScalar(-deltaX * panSpeed).add(up.multiplyScalar(deltaY * panSpeed));
        
        cameraRef.current.position.add(panMove);
        interactionState.current.panTarget.add(panMove);
        
        // Constrain Pan
        interactionState.current.panTarget.y = THREE.MathUtils.clamp(interactionState.current.panTarget.y, 0, 2);
        cameraRef.current.position.y = THREE.MathUtils.clamp(cameraRef.current.position.y, 0, 3);
      }

      interactionState.current.lastMouseX = e.clientX;
      interactionState.current.lastMouseY = e.clientY;
    };

    const onWheel = (e) => {
      if (!cameraRef.current) return;
      const zoomSpeed = 0.002;
      const minDistance = 1;
      const maxDistance = 6;
      
      const direction = new THREE.Vector3().subVectors(cameraRef.current.position, interactionState.current.panTarget).normalize();
      const distance = cameraRef.current.position.distanceTo(interactionState.current.panTarget);
      
      let newDistance = distance + e.deltaY * zoomSpeed;
      newDistance = THREE.MathUtils.clamp(newDistance, minDistance, maxDistance);
      
      cameraRef.current.position.copy(interactionState.current.panTarget).add(direction.multiplyScalar(newDistance));
    };

    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp); // window to catch releases outside
    window.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('wheel', onWheel);

    // 8. RENDER LOOP
    const animate = () => {
      requestAnimationFrame(animate);
      if (cameraRef.current && sceneRef.current) {
        cameraRef.current.lookAt(interactionState.current.panTarget);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // 9. RESIZE HANDLER
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('contextmenu', onContextMenu);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('wheel', onWheel);
      if (mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    };
  }, []);

  // 10. REACT TO STATE CHANGES
  // This demonstrates connecting UI state to 3D visual changes.
  useEffect(() => {
    if (!partsRef.current || !characterGroupRef.current) return;

    // Helper to map 0-100 state to a target scale (e.g., 50 -> 1.0)
    const mapVal = (val, minRange, maxRange) => {
      return minRange + (maxRange - minRange) * (val / 100);
    };

    // Apply specific state parameters to mannequin scale to prove pipeline
    
    // Overall Body Width/Height
    const bodyOverall = characterState.body.overall;
    const heightScale = mapVal(bodyOverall.height, 0.9, 1.1);
    const widthScale = mapVal(bodyOverall.width, 0.8, 1.2);
    characterGroupRef.current.scale.set(widthScale, heightScale, widthScale);

    // Face Shape (affects Head)
    const faceShape = characterState.face.shape;
    if (partsRef.current.head) {
       const headWidth = mapVal(faceShape.width, 0.8, 1.2);
       const headHeight = mapVal(faceShape.height, 0.9, 1.1);
       partsRef.current.head.scale.set(headWidth, headHeight, headWidth);
    }
    
    // Chest Width (affects torso X)
    const chest = characterState.body.chest;
    if (partsRef.current.torso) {
      partsRef.current.torso.scale.x = mapVal(chest.width, 0.7, 1.3);
      partsRef.current.torso.scale.z = mapVal(chest.depth, 0.8, 1.2);
    }

    // Arms
    const arms = characterState.body.arms;
    if (partsRef.current.arms) {
      const armSize = mapVal(arms.size, 0.7, 1.5);
      partsRef.current.arms.forEach(arm => arm.scale.set(armSize, 1, armSize));
    }

  }, [characterState]);

  return <div ref={mountRef} className="w-full h-full cursor-crosshair outline-none" tabIndex={0} />;
};