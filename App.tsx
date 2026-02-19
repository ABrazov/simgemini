
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TileType, CityStats, AdvisorMessage } from './types';
import { GRID_SIZE, TILE_DATA, INITIAL_STATS, TILE_SIZE, CATEGORIES } from './constants';
import { getAdvisorFeedback } from './geminiService';

const LEVEL_THRESHOLDS = [100, 200, 300, 500, 750, 1000, 1200, 1500, 1800, 2000, 2500, 3000, 4000];

const REFRESH_OPTIONS = [
  { label: '2s', value: 2000 },
  { label: '1s', value: 1000 },
  { label: '0.5s', value: 500 },
  { label: '0.2s', value: 200 },
  { label: '0.1s', value: 100 }
];

const App: React.FC = () => {
  const [grid, setGrid] = useState<TileType[]>(() => 
    new Array(GRID_SIZE * GRID_SIZE).fill(TileType.EMPTY)
  );
  
  const [roadAccessMap, setRoadAccessMap] = useState<Uint8Array>(new Uint8Array(GRID_SIZE * GRID_SIZE));
  const activeIndicesRef = useRef<Set<number>>(new Set());

  const [stats, setStats] = useState<CityStats>(INITIAL_STATS);
  const [selectedTool, setSelectedTool] = useState<TileType>(TileType.ROAD);
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('RESIDENCIAL');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // Modos de tiempo y ajustes
  const [refreshRate, setRefreshRate] = useState(2000);
  const [hyperSpeedActive, setHyperSpeedActive] = useState(false);
  const [hyperTimeLeft, setHyperTimeLeft] = useState(0);
  const [hyperCooldown, setHyperCooldown] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    { text: "Motor optimizado, Alcalde. La ciudad corre ahora a máxima velocidad.", sender: 'SYSTEM', timestamp: Date.now() }
  ]);
  const [isConsulting, setIsConsulting] = useState(false);

  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.8 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Audio Context y Synth para música
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.connect(audioCtxRef.current.destination);
      gainNodeRef.current.gain.value = volume;
      
      const playDrone = (freq: number, startTime: number) => {
        if (!audioCtxRef.current || !gainNodeRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const g = audioCtxRef.current.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(0.05, startTime + 2);
        g.gain.linearRampToValueAtTime(0, startTime + 8);
        osc.connect(g);
        g.connect(gainNodeRef.current);
        osc.start(startTime);
        osc.stop(startTime + 8);
      };

      const loop = () => {
        if (!isMusicPlaying) return;
        const now = audioCtxRef.current!.currentTime;
        playDrone(110, now);
        playDrone(164.81, now + 2);
        playDrone(220, now + 4);
        setTimeout(loop, 6000);
      };
      loop();
    }
  }, [volume, isMusicPlaying]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current!.currentTime, 0.1);
    }
  }, [volume]);

  useEffect(() => {
    if (isMusicPlaying) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      initAudio();
    }
  }, [isMusicPlaying, initAudio]);

  const updateRoadAccess = useCallback((currentGrid: TileType[]) => {
    const newAccess = new Uint8Array(GRID_SIZE * GRID_SIZE);
    const roadIndices: number[] = [];
    for (let i = 0; i < currentGrid.length; i++) {
      if (currentGrid[i] === TileType.ROAD) {
        roadIndices.push(i);
        newAccess[i] = 1;
      }
    }
    for (const idx of roadIndices) {
      const x = idx % GRID_SIZE;
      const y = Math.floor(idx / GRID_SIZE);
      if (x > 0) newAccess[idx - 1] = 1;
      if (x < GRID_SIZE - 1) newAccess[idx + 1] = 1;
      if (y > 0) newAccess[idx - GRID_SIZE] = 1;
      if (y < GRID_SIZE - 1) newAccess[idx + GRID_SIZE] = 1;
    }
    setRoadAccessMap(newAccess);
  }, []);

  useEffect(() => {
    updateRoadAccess(grid);
  }, [grid, updateRoadAccess]);

  const saveGame = () => {
    const saveData = { grid, stats, camera, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(saveData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ciudad_save.json`;
    link.click();
  };

  const loadGame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.grid) {
          setGrid(data.grid);
          activeIndicesRef.current.clear();
          data.grid.forEach((t: TileType, i: number) => {
            if (t !== TileType.EMPTY) activeIndicesRef.current.add(i);
          });
        }
        if (data.stats) setStats(data.stats);
        if (data.camera) setCamera(data.camera);
      } catch (err) {
        console.error("Load failed", err);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (hyperSpeedActive) {
        setHyperTimeLeft(prev => {
          if (prev <= 1) {
            setHyperSpeedActive(false);
            setHyperCooldown(120);
            return 0;
          }
          return prev - 1;
        });
      } else if (hyperCooldown > 0) {
        setHyperCooldown(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [hyperSpeedActive, hyperCooldown]);

  const startHyperSpeed = () => {
    if (hyperCooldown === 0 && !hyperSpeedActive) {
      setHyperSpeedActive(true);
      setHyperTimeLeft(15);
      setMessages(prev => [{ text: "🚀 HIPERSALTO ACTIVADO: Tiempo x10 activado.", sender: 'SYSTEM', timestamp: Date.now() }, ...prev]);
    }
  };

  // Simulación
  useEffect(() => {
    let intervalTime = refreshRate;
    if (hyperSpeedActive) intervalTime = 250;

    // Escala basada en un "segundo" teórico de 2.5s para mantener ingresos por segundo.
    const economyScale = hyperSpeedActive ? 1 : (intervalTime / 2500);

    const timer = setInterval(() => {
      setStats(prev => {
        let pCap = 0, pUse = 0, inc = 0, pop = 0, jobs = 0, poll = 0;
        let happyBonus = 0, eduBonus = 0, healthBonus = 0;
        const isOverloaded = prev.powerUsage > prev.powerCapacity;

        activeIndicesRef.current.forEach(i => {
          const type = grid[i];
          const data = TILE_DATA[type];
          const isRoadSensitive = type !== TileType.ROAD && !type.includes('POWER') && !type.includes('WATER');
          const hasRoad = isRoadSensitive ? roadAccessMap[i] === 1 : true;
          const hasPower = data.power > 0 ? !isOverloaded : true;
          const active = hasRoad && hasPower;

          if (type.includes('POWER') || type.includes('SOLAR') || type.includes('WIND') || type.includes('FUSION')) {
            if (data.power < 0) pCap += Math.abs(data.power); else pUse += data.power;
          } else pUse += data.power;

          if (!active) {
            if (data.income < 0) inc += data.income * economyScale;
            return;
          }
          
          if (data.pop) pop += data.pop;
          if (data.jobs) jobs += data.jobs;
          if (data.pol) poll += data.pol;
          if (data.happy) happyBonus += data.happy;
          if (data.edu) eduBonus += data.edu;
          if (data.health) healthBonus += data.health;
          inc += data.income * economyScale;
        });

        const workforce = Math.floor(pop * 0.85);
        const employed = Math.min(workforce, jobs);
        const jobBalance = workforce > 0 ? employed / workforce : 1;
        const pollLevel = poll / (GRID_SIZE * 2); 
        
        let happy = 75 + (jobBalance * 25) + happyBonus;
        if (isOverloaded) happy -= 40;
        happy -= pollLevel / 4;

        const finalHappy = Math.max(0, Math.min(100, happy));
        
        let nextLevel = 1;
        for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
          if (pop >= LEVEL_THRESHOLDS[i]) nextLevel = i + 2;
          else break;
        }

        return {
          ...prev,
          day: prev.day + (1 * economyScale),
          money: prev.money + Math.floor(inc * (finalHappy / 100)),
          population: pop,
          jobs: jobs,
          powerCapacity: pCap,
          powerUsage: pUse,
          happiness: Math.floor(finalHappy),
          pollution: Math.floor(pollLevel),
          health: Math.floor(Math.min(100, prev.health * 0.95 + (100 - pollLevel) * 0.05)),
          education: Math.floor(Math.min(100, prev.education * 0.99 + (eduBonus / 200))),
          level: Math.min(99, nextLevel),
          demandR: Math.max(0, Math.min(100, (jobs - pop) * 3 + 40)),
          demandC: Math.max(0, Math.min(100, (pop * 0.4 - jobs * 0.2) + 20)),
          demandI: Math.max(0, Math.min(100, (pop - jobs) + 10)),
          employed: employed,
          workforce: workforce,
        };
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [grid, roadAccessMap, refreshRate, hyperSpeedActive]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const startX = Math.max(0, Math.floor(-camera.x / (TILE_SIZE * camera.zoom)));
    const startY = Math.max(0, Math.floor(-camera.y / (TILE_SIZE * camera.zoom)));
    const endX = Math.min(GRID_SIZE, startX + Math.ceil(canvas.width / (TILE_SIZE * camera.zoom)) + 1);
    const endY = Math.min(GRID_SIZE, startY + Math.ceil(canvas.height / (TILE_SIZE * camera.zoom)) + 1);

    ctx.beginPath();
    ctx.strokeStyle = hyperSpeedActive ? '#33415566' : '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = startX; x <= endX; x++) {
      ctx.moveTo(x * TILE_SIZE, startY * TILE_SIZE);
      ctx.lineTo(x * TILE_SIZE, endY * TILE_SIZE);
    }
    for (let y = startY; y <= endY; y++) {
      ctx.moveTo(startX * TILE_SIZE, y * TILE_SIZE);
      ctx.lineTo(endX * TILE_SIZE, y * TILE_SIZE);
    }
    ctx.stroke();

    const isBlackout = stats.powerUsage > stats.powerCapacity;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = y * GRID_SIZE + x;
        const type = grid[index];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (type !== TileType.EMPTY) {
          const data = TILE_DATA[type];
          const isRoadSensitive = type !== TileType.ROAD && !type.includes('POWER');
          const hasRoad = isRoadSensitive ? roadAccessMap[index] === 1 : true;
          const hasPower = data.power > 0 ? !isBlackout : true;
          const active = hasRoad && hasPower;
          
          ctx.fillStyle = active ? data.color : '#334155';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          if (data.icon) {
            ctx.font = `${TILE_SIZE * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = active ? '#ffffff' : '#94a3b8';
            ctx.fillText(data.icon, px + TILE_SIZE/2, py + TILE_SIZE/2 + 2);
            if (!active) {
              ctx.font = '12px Arial';
              ctx.fillText(!hasRoad ? '🚫' : '⚡', px + TILE_SIZE - 8, py + 8);
            }
          }
        }
        if (hoveredIdx === index && type === TileType.EMPTY) {
          const ghostData = TILE_DATA[selectedTool];
          ctx.fillStyle = ghostData.color + '66';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    
    if (hyperSpeedActive) {
      ctx.restore();
      ctx.save();
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      for(let i=0; i<5; i++){
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (Math.random()-0.5)*50, startY + (Math.random()-0.5)*50);
        ctx.stroke();
      }
    }
    ctx.restore();
  }, [camera, grid, roadAccessMap, hoveredIdx, selectedTool, stats.powerCapacity, stats.powerUsage, hyperSpeedActive]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    let animationId: number;
    const loop = () => {
      draw();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [draw]);

  const getGridCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;
    const gx = Math.floor(worldX / TILE_SIZE);
    const gy = Math.floor(worldY / TILE_SIZE);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return null;
    return { gx, gy, index: gy * GRID_SIZE + gx };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getGridCoords(e);
    setHoveredIdx(coords ? coords.index : null);
    if (isDragging.current) {
      setCamera(prev => ({ 
        ...prev, 
        x: prev.x + (e.clientX - lastMousePos.current.x), 
        y: prev.y + (e.clientY - lastMousePos.current.y) 
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const coords = getGridCoords(e);
    if (!coords) return;
    const data = TILE_DATA[selectedTool];
    if (stats.level < data.unlockLevel) return;
    if (stats.money < data.cost) return;
    setGrid(prev => {
      const next = [...prev];
      next[coords.index] = selectedTool;
      activeIndicesRef.current.add(coords.index);
      return next;
    });
    setStats(prev => ({ ...prev, money: prev.money - data.cost }));
  };

  const levelProgress = useMemo(() => {
    const currentLevelIdx = stats.level - 2;
    const startThreshold = currentLevelIdx >= 0 ? LEVEL_THRESHOLDS[currentLevelIdx] : 0;
    const nextThreshold = LEVEL_THRESHOLDS[currentLevelIdx + 1] || (startThreshold + 1000);
    const progress = ((stats.population - startThreshold) / (nextThreshold - startThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [stats.population, stats.level]);

  const isBlackout = stats.powerUsage > stats.powerCapacity;

  return (
    <div className="flex flex-col h-screen max-h-screen text-slate-100 font-sans bg-slate-950 overflow-hidden">
      {/* HUD Superior */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-3 flex items-center justify-between z-50 shadow-2xl shrink-0">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-purple-400 font-black uppercase">Nivel</span>
              <span className="text-lg font-bold leading-none">{stats.level}</span>
            </div>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-700" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-emerald-500 font-black uppercase">Fondos</span>
            <span className="text-lg font-mono text-emerald-400 font-bold">${stats.money.toLocaleString()}</span>
          </div>
          
          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[9px] text-blue-400 font-black uppercase">Población</span>
            <span className="text-lg font-mono text-blue-300">{stats.population.toLocaleString()}</span>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[9px] text-cyan-400 font-black uppercase">Trabajo / Paro</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-mono text-cyan-300" title="Empleados">{stats.employed.toLocaleString()}</span>
              <span className="text-xs font-mono text-red-400" title="En paro">{(stats.workforce - stats.employed).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[9px] text-orange-400 font-black uppercase tracking-widest">Felicidad</span>
            <span className={`text-lg font-mono ${isBlackout ? 'text-red-400' : ''}`}>{stats.happiness}%</span>
          </div>
        </div>

        {/* Archivos, Hipersalto y Ajustes */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-1.5 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800 items-center">
            <button onClick={saveGame} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-600/40 transition-all text-[10px] font-bold">💾</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all text-[10px] font-bold">📂</button>
            
            <div className="h-8 w-px bg-slate-800 mx-1" />

            <button onClick={startHyperSpeed} disabled={hyperCooldown > 0 || hyperSpeedActive} 
                className={`px-4 py-1.5 rounded-lg transition-all text-[10px] font-bold flex flex-col items-center min-w-[100px] border ${hyperSpeedActive ? 'bg-orange-600 border-orange-400 animate-pulse' : hyperCooldown > 0 ? 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-amber-500 border-orange-400 hover:scale-105 shadow-lg shadow-orange-900/20'}`}>
                <span className="leading-none">{hyperSpeedActive ? 'HIPERSALTO' : 'x10 SPEED'}</span>
                <span className="text-[8px] opacity-80">{hyperSpeedActive ? `${hyperTimeLeft}s` : hyperCooldown > 0 ? `ESPERA ${hyperCooldown}s` : '¡LISTO!'}</span>
                <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden rounded-b-lg">
                  <div className={`h-full transition-all duration-1000 ${hyperSpeedActive ? 'bg-white' : 'bg-orange-400'}`} style={{ width: `${hyperSpeedActive ? (hyperTimeLeft/15)*100 : ((120-hyperCooldown)/120)*100}%` }} />
                </div>
            </button>

            <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all text-sm">⚙️</button>
            
            <input type="file" ref={fileInputRef} onChange={loadGame} className="hidden" accept=".json" />
          </div>

          <div className="flex gap-1.5 items-end bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            <div className="flex flex-col items-center"><div className="w-2 bg-slate-800 h-6 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-green-500" style={{ height: `${stats.demandR}%` }} /></div><span className="text-[7px] text-green-500">R</span></div>
            <div className="flex flex-col items-center"><div className="w-2 bg-slate-800 h-6 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-blue-500" style={{ height: `${stats.demandC}%` }} /></div><span className="text-[7px] text-blue-500">T</span></div>
            <div className="flex flex-col items-center"><div className="w-2 bg-slate-800 h-6 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-yellow-500" style={{ height: `${stats.demandI}%` }} /></div><span className="text-[7px] text-yellow-500">I</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Menú Lateral */}
        <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/50">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-wider border-b-2 transition-all ${activeCategory === cat ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {CATEGORIES[activeCategory].map((type) => {
              const data = TILE_DATA[type];
              const isLocked = stats.level < data.unlockLevel;
              return (
                <button key={type} onClick={() => !isLocked && setSelectedTool(type as TileType)}
                  className={`w-full flex flex-col p-2 rounded-lg border transition-all text-left relative overflow-hidden ${isLocked ? 'opacity-30 grayscale bg-slate-950/20' : selectedTool === type ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-800/20 border-slate-700 hover:border-slate-500'}`}>
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold flex items-center gap-1.5"><span className="text-base">{isLocked ? '🔒' : data.icon}</span> {data.name}</span>
                    {!isLocked ? <span className="text-emerald-400 font-mono text-[9px] font-bold">${data.cost}</span> : <span className="text-[8px] text-slate-500 font-black">NVL {data.unlockLevel}</span>}
                  </div>
                  {!isLocked && <div className="text-[8px] text-slate-500 mt-0.5">{data.pop > 0 && `+${data.pop} Hab `}{data.jobs > 0 && `+${data.jobs} Trab`}</div>}
                </button>
              );
            })}
          </div>
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] space-y-1">
             <div className="flex justify-between">
                <span>Electricidad</span>
                <span className={isBlackout ? 'text-red-400 font-bold' : ''}>{stats.powerUsage}/{stats.powerCapacity}</span>
             </div>
             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${isBlackout ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (stats.powerUsage / (stats.powerCapacity || 1)) * 100)}%` }} />
             </div>
          </div>
        </div>

        {/* Viewport */}
        <div ref={containerRef} className="flex-1 bg-black relative overflow-hidden" 
             onContextMenu={(e) => e.preventDefault()}
             onMouseDown={(e) => { if (e.button === 1 || e.button === 2) { isDragging.current = true; lastMousePos.current = { x: e.clientX, y: e.clientY }; } }}
             onMouseMove={handleMouseMove}
             onMouseUp={() => isDragging.current = false}
             onWheel={(e) => setCamera(prev => ({ ...prev, zoom: Math.min(Math.max(0.1, prev.zoom - e.deltaY * 0.001), 5) }))}
             onClick={handleCanvasClick}>
          <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
        </div>

        {/* Asesor */}
        <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-[10px] font-black text-slate-500 uppercase">IA Asesora</h2>
            <button onClick={async () => {
              setIsConsulting(true);
              const feedback = await getAdvisorFeedback(stats, {});
              setMessages(prev => [{ text: feedback, sender: 'ADVISOR', timestamp: Date.now() }, ...prev]);
              setIsConsulting(false);
            }} disabled={isConsulting} className="text-[9px] font-bold bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">{isConsulting ? '...' : 'INFORME'}</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px] custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`p-2.5 rounded-lg border leading-snug animate-in fade-in slide-in-from-right-2 duration-300 ${msg.sender === 'ADVISOR' ? 'bg-blue-600/10 border-blue-500/30 text-blue-100' : 'bg-slate-800/40 border-slate-700 text-slate-400 italic'}`}>
                {msg.text}
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Ajustes */}
        {isSettingsOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Ajustes de Sistema</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Velocidad de Refresh */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Velocidad de Refresh (Visual)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {REFRESH_OPTIONS.map((opt) => (
                      <button 
                        key={opt.value}
                        onClick={() => setRefreshRate(opt.value)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${refreshRate === opt.value ? 'bg-emerald-600 border-emerald-400 shadow-lg shadow-emerald-900/20' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500 italic">Determina qué tan frecuente se actualizan los números en pantalla.</p>
                </div>

                {/* Música */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Música Ambiental</label>
                    <button 
                      onClick={() => setIsMusicPlaying(!isMusicPlaying)} 
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${isMusicPlaying ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {isMusicPlaying ? 'ENCENDIDA' : 'APAGADA'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                      <span>Volumen</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-700">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;
