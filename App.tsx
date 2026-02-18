
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TileType, CityStats, AdvisorMessage } from './types';
import { GRID_SIZE, TILE_DATA, INITIAL_STATS, TILE_SIZE, CATEGORIES } from './constants';
import { getAdvisorFeedback } from './geminiService';

const App: React.FC = () => {
  const [grid, setGrid] = useState<TileType[]>(() => 
    new Array(GRID_SIZE * GRID_SIZE).fill(TileType.EMPTY)
  );
  
  // Mapa de bits para conectividad rápida (0: no acceso, 1: acceso a carretera)
  const [roadAccessMap, setRoadAccessMap] = useState<Uint8Array>(new Uint8Array(GRID_SIZE * GRID_SIZE));
  
  // Lista de índices que no están vacíos para acelerar la simulación
  const activeIndicesRef = useRef<Set<number>>(new Set());

  const [stats, setStats] = useState<CityStats>(INITIAL_STATS);
  const [selectedTool, setSelectedTool] = useState<TileType>(TileType.ROAD);
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('RESIDENCIAL');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
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

  // Recalcular el mapa de acceso a carreteras de forma eficiente
  const updateRoadAccess = useCallback((currentGrid: TileType[]) => {
    const newAccess = new Uint8Array(GRID_SIZE * GRID_SIZE);
    const roadIndices: number[] = [];
    
    // Primero identificamos todas las carreteras
    for (let i = 0; i < currentGrid.length; i++) {
      if (currentGrid[i] === TileType.ROAD) {
        roadIndices.push(i);
        newAccess[i] = 1; // La carretera tiene acceso a sí misma
      }
    }

    // Marcamos los vecinos de las carreteras como "conectados"
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

  // Actualizar acceso cada vez que el grid cambie
  useEffect(() => {
    updateRoadAccess(grid);
  }, [grid, updateRoadAccess]);

  // Persistencia
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
          // Reconstruir lista de índices activos
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

  // Simulación Optimizada: Solo procesa celdas activas
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => {
        let pCap = 0, pUse = 0, wCap = 0, wUse = 0, inc = 0, pop = 0, jobs = 0, poll = 0;
        let happyBonus = 0, eduBonus = 0, healthBonus = 0;
        
        // El estado de energía se basa en el ciclo anterior para evitar parpadeos
        const isOverloaded = prev.powerUsage > prev.powerCapacity;

        // Iteramos solo sobre las celdas que sabemos que tienen contenido
        activeIndicesRef.current.forEach(i => {
          const type = grid[i];
          const data = TILE_DATA[type];
          
          const isRoadSensitive = type !== TileType.ROAD && !type.includes('POWER') && !type.includes('WATER');
          const hasRoad = isRoadSensitive ? roadAccessMap[i] === 1 : true;
          // Si el edificio consume energía (data.power > 0) y hay sobrecarga, no tiene energía
          const hasPower = data.power > 0 ? !isOverloaded : true;

          // Un edificio funciona si tiene carretera y, si lo requiere, energía
          const active = hasRoad && hasPower;

          // Cálculo de capacidad y uso de energía (siempre se suma el uso potencial para mantener el HUD correcto)
          if (type.includes('POWER') || type.includes('SOLAR') || type.includes('WIND') || type.includes('FUSION') || type.includes('BIOMASS') || type.includes('GEOTHERMAL')) {
            if (data.power < 0) pCap += Math.abs(data.power); else pUse += data.power;
          } else {
            pUse += data.power;
          }

          if (!active) {
            // Los edificios inactivos por falta de servicios aún pueden costar mantenimiento (income negativo)
            if (data.income < 0) inc += data.income; 
            return;
          }
          
          if (data.pop) pop += data.pop;
          if (data.jobs) jobs += data.jobs;
          if (data.pol) poll += data.pol;
          if (data.happy) happyBonus += data.happy;
          if (data.edu) eduBonus += data.edu;
          if (data.health) healthBonus += data.health;
          inc += data.income;
        });

        const workforce = Math.floor(pop * 0.85);
        const employed = Math.min(workforce, jobs);
        const unemployed = Math.max(0, workforce - employed);
        const jobBalance = workforce > 0 ? employed / workforce : 1;
        
        const pollLevel = poll / (GRID_SIZE * 2); 
        let happy = 75 + (jobBalance * 25) - (unemployed > 100 ? 20 : 0) + happyBonus;
        if (isOverloaded) happy -= 40; // Penalización por falta de luz
        happy -= pollLevel / 4;

        const finalHappy = Math.max(0, Math.min(100, happy));
        const nextLevel = Math.max(1, Math.floor(pop / 1000) + 1);

        return {
          ...prev,
          day: prev.day + 1,
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
        };
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [grid, roadAccessMap]);

  // Dibujado Optimizado con Batching
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Viewport Culling
    const startX = Math.max(0, Math.floor(-camera.x / (TILE_SIZE * camera.zoom)));
    const startY = Math.max(0, Math.floor(-camera.y / (TILE_SIZE * camera.zoom)));
    const endX = Math.min(GRID_SIZE, startX + Math.ceil(canvas.width / (TILE_SIZE * camera.zoom)) + 1);
    const endY = Math.min(GRID_SIZE, startY + Math.ceil(canvas.height / (TILE_SIZE * camera.zoom)) + 1);

    // Dibujar Rejilla de Fondo (Batching)
    ctx.beginPath();
    ctx.strokeStyle = '#1e293b';
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

    // Dibujar Celdas Visibles
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
              // Mostrar icono de prohibido por carretera o rayo por falta de luz
              ctx.fillText(!hasRoad ? '🚫' : '⚡', px + TILE_SIZE - 8, py + 8);
            }
          }
        }

        // Ghost Tile
        if (hoveredIdx === index && type === TileType.EMPTY) {
          const ghostData = TILE_DATA[selectedTool];
          ctx.fillStyle = ghostData.color + '66';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    ctx.restore();
  }, [camera, grid, roadAccessMap, hoveredIdx, selectedTool, stats.powerCapacity, stats.powerUsage]);

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
    if (stats.level < data.unlockLevel) {
      setMessages(prev => [{ text: `🔒 Nivel ${data.unlockLevel} requerido.`, sender: 'SYSTEM', timestamp: Date.now() }, ...prev]);
      return;
    }
    if (stats.money < data.cost) {
      setMessages(prev => [{ text: "💸 Fondos insuficientes.", sender: 'SYSTEM', timestamp: Date.now() }, ...prev]);
      return;
    }
    
    setGrid(prev => {
      const next = [...prev];
      next[coords.index] = selectedTool;
      activeIndicesRef.current.add(coords.index);
      return next;
    });
    setStats(prev => ({ ...prev, money: prev.money - data.cost }));
  };

  const workforce = Math.floor(stats.population * 0.85);
  const employed = Math.min(workforce, stats.jobs);
  const unemployed = workforce - employed;
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
              <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-700" style={{ width: `${(stats.population % 1000) / 10}%` }} />
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
            <span className="text-[9px] text-yellow-500 font-black uppercase">Empleo</span>
            <div className="flex gap-3">
              <span className="text-xs font-bold text-green-400">👷 {employed.toLocaleString()}</span>
              <span className={`text-xs font-bold ${unemployed > 0 ? 'text-red-400' : 'text-slate-500'}`}>🚫 {unemployed.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[9px] text-orange-400 font-black uppercase tracking-widest">Felicidad</span>
            <span className={`text-lg font-mono ${isBlackout ? 'text-red-400' : ''}`}>{stats.happiness}%</span>
          </div>
        </div>

        {/* Archivos y RCI */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-1.5 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800">
            <button onClick={saveGame} className="px-3 py-1 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all text-[10px] font-bold">💾 GUARDAR</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all text-[10px] font-bold">📂 CARGAR</button>
            <input type="file" ref={fileInputRef} onChange={loadGame} className="hidden" accept=".json" />
          </div>

          <div className="flex gap-1.5 items-end bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            <div className="flex flex-col items-center"><div className="w-2 bg-slate-800 h-6 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-green-500" style={{ height: `${stats.demandR}%` }} /></div><span className="text-[7px] text-green-500">R</span></div>
            <div className="flex flex-col items-center"><div className="w-2 bg-slate-800 h-6 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-blue-500" style={{ height: `${stats.demandC}%` }} /></div><span className="text-[7px] text-blue-500">T</span></div>
            <div className="flex flex-col items-center"><div className="w-2 bg-slate-800 h-6 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-yellow-500" style={{ height: `${stats.demandI}%` }} /></div><span className="text-[7px] text-yellow-500">I</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
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
                <div className={`h-full transition-all duration-500 ${isBlackout ? 'bg-red-500' : 'bg-orange-500'}`} 
                     style={{ width: `${Math.min(100, (stats.powerUsage / (stats.powerCapacity || 1)) * 100)}%` }} />
             </div>
             {isBlackout && <div className="text-[8px] text-red-400 animate-pulse font-black uppercase text-center mt-1">⚠️ SOBRECARGA EN LA RED</div>}
          </div>
        </div>

        {/* Viewport de Juego */}
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
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
