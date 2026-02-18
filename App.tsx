
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TileType, CityStats, AdvisorMessage } from './types';
import { GRID_SIZE, TILE_DATA, INITIAL_STATS, TILE_SIZE, CATEGORIES } from './constants';
import { getAdvisorFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [grid, setGrid] = useState<TileType[]>(() => 
    new Array(GRID_SIZE * GRID_SIZE).fill(TileType.EMPTY)
  );
  
  const [stats, setStats] = useState<CityStats>(INITIAL_STATS);
  const [selectedTool, setSelectedTool] = useState<TileType>(TileType.ROAD);
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('RESIDENCIAL');
  
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    { text: "Alcalde, la ciudad está en sus manos. Recuerde que los edificios necesitan estar junto a una carretera para funcionar.", sender: 'SYSTEM', timestamp: Date.now() }
  ]);
  const [isConsulting, setIsConsulting] = useState(false);

  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.8 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Función de Conectividad
  const isConnectedToRoad = useCallback((index: number, currentGrid: TileType[]) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    
    const neighbors = [
      { nx: x + 1, ny: y },
      { nx: x - 1, ny: y },
      { nx: x, ny: y + 1 },
      { nx: x, ny: y - 1 },
    ];

    return neighbors.some(n => 
      n.nx >= 0 && n.nx < GRID_SIZE && n.ny >= 0 && n.ny < GRID_SIZE && 
      currentGrid[n.ny * GRID_SIZE + n.nx] === TileType.ROAD
    );
  }, []);

  // Simulación Avanzada con Conectividad
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => {
        let pCap = 0, pUse = 0, wCap = 0, wUse = 0, inc = 0, pop = 0, jobs = 0, poll = 0;
        let happyBonus = 0;
        let eduBonus = 0;
        let healthBonus = 0;
        
        for (let i = 0; i < grid.length; i++) {
          const type = grid[i];
          if (type === TileType.EMPTY) continue;
          
          const data = TILE_DATA[type];
          
          // Las carreteras y servicios básicos de energía/agua no necesitan estar "conectados" para existir
          // pero los edificios zonales SI.
          const needsRoad = type !== TileType.ROAD && 
                            !type.includes('POWER') && 
                            !type.includes('WATER');
          
          const active = needsRoad ? isConnectedToRoad(i, grid) : true;

          if (!active) {
            // Un edificio desconectado sigue costando mantenimiento (income negativo)
            if (data.income < 0) inc += data.income;
            continue;
          }
          
          if (type.includes('POWER') || type === TileType.POWER_SOLAR || type === TileType.POWER_WIND || type === TileType.POWER_FUSION) {
            if (data.power < 0) pCap += Math.abs(data.power);
            else pUse += data.power;
          } else pUse += data.power;

          if (type.includes('WATER') || type === TileType.DESALINATION_PLANT) {
            if (data.water < 0) wCap += Math.abs(data.water);
            else wUse += data.water;
          } else wUse += data.water;

          if (data.pop) pop += data.pop;
          if (data.jobs) jobs += data.jobs;
          if (data.pol) poll += data.pol;
          if (data.happy) happyBonus += data.happy;
          if (data.edu) eduBonus += data.edu;
          if (data.health) healthBonus += data.health;
          
          inc += data.income;
        }

        const workforce = Math.floor(pop * 0.8);
        const employed = Math.min(workforce, jobs);
        const jobBalance = workforce > 0 ? employed / workforce : 1;
        
        const pollLevel = poll / (GRID_SIZE * 2); 
        const healthImpact = Math.max(0, 100 - pollLevel) + (healthBonus / 10);
        
        let happy = 70 + (jobBalance * 30) - (jobBalance < 0.8 ? (0.8 - jobBalance) * 100 : 0) + happyBonus;
        if (pUse > pCap) happy -= 30;
        if (wUse > wCap) happy -= 30;
        happy -= pollLevel / 10;

        const finalHappy = Math.max(0, Math.min(100, happy));
        const dR = Math.max(0, Math.min(100, (jobs - pop) * 3 + (finalHappy - 60)));
        const dC = Math.max(0, Math.min(100, (pop * 0.4 - jobs * 0.2) * 2));
        const dI = Math.max(0, Math.min(100, (pop - jobs) * 1.5));

        const nextLevel = Math.max(1, Math.floor(pop / 800) + 1);

        return {
          ...prev,
          day: prev.day + 1,
          money: prev.money + Math.floor(inc * (finalHappy / 100)),
          population: pop,
          jobs: jobs,
          powerCapacity: pCap,
          powerUsage: pUse,
          waterCapacity: wCap,
          waterUsage: wUse,
          happiness: Math.floor(finalHappy),
          pollution: Math.floor(pollLevel),
          demandR: dR,
          demandC: dC,
          demandI: dI,
          health: Math.floor(Math.min(100, prev.health * 0.95 + healthImpact * 0.05)),
          education: Math.floor(Math.min(100, prev.education * 0.98 + (eduBonus / 50))),
          level: Math.min(99, nextLevel)
        };
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [grid, isConnectedToRoad]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
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

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = y * GRID_SIZE + x;
        const type = grid[index];
        const data = TILE_DATA[type];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        const needsRoad = type !== TileType.ROAD && type !== TileType.EMPTY && !type.includes('POWER') && !type.includes('WATER');
        const active = needsRoad ? isConnectedToRoad(index, grid) : true;

        ctx.fillStyle = active ? data.color : '#475569'; // Gris si no está conectado
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        if (data.icon) {
          ctx.font = `${TILE_SIZE * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(data.icon, px + TILE_SIZE/2, py + TILE_SIZE/2 + 2);
          
          if (!active) {
            ctx.font = '12px Arial';
            ctx.fillText('🚫', px + TILE_SIZE - 8, py + 8);
          }
        }
      }
    }
    ctx.restore();
  }, [camera, grid, isConnectedToRoad]);

  useEffect(() => {
    const anim = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(anim);
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldX = (e.clientX - rect.left - camera.x) / camera.zoom;
    const worldY = (e.clientY - rect.top - camera.y) / camera.zoom;
    const gridX = Math.floor(worldX / TILE_SIZE);
    const gridY = Math.floor(worldY / TILE_SIZE);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      const index = gridY * GRID_SIZE + gridX;
      const data = TILE_DATA[selectedTool];
      
      if (stats.level < data.unlockLevel) {
        setMessages(prev => [{ text: `🔒 Este plano requiere prestigio Nivel ${data.unlockLevel}.`, sender: 'SYSTEM', timestamp: Date.now() }, ...prev]);
        return;
      }

      if (stats.money < data.cost) {
        setMessages(prev => [{ text: "💸 Fondos insuficientes.", sender: 'SYSTEM', timestamp: Date.now() }, ...prev]);
        return;
      }
      
      setGrid(prev => {
        const next = [...prev];
        next[index] = selectedTool;
        return next;
      });
      setStats(prev => ({ ...prev, money: prev.money - data.cost }));
    }
  };

  const workforce = Math.floor(stats.population * 0.8);
  const employed = Math.min(workforce, stats.jobs);
  const unemployed = workforce - employed;

  return (
    <div className="flex flex-col h-screen max-h-screen text-slate-100 font-sans bg-slate-950 overflow-hidden">
      {/* HUD Superior */}
      <div className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 p-4 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-full border border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] text-purple-400 font-black uppercase">Prestigio</span>
              <span className="text-xl font-bold">NVL {stats.level}</span>
            </div>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-1000" 
                style={{ width: `${(stats.population % 800) / 8}%` }} 
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-500 font-black uppercase">Presupuesto</span>
            <span className="text-xl font-mono text-emerald-400 font-bold">${stats.money.toLocaleString()}</span>
          </div>
          
          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Habitantes</span>
            <span className="text-xl font-mono text-blue-300">{stats.population.toLocaleString()}</span>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Mercado Laboral</span>
            <div className="flex gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-green-400">{employed.toLocaleString()}</span>
                <span className="text-[8px] uppercase text-slate-500">Empleados</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${unemployed > 0 ? 'text-red-400' : 'text-slate-500'}`}>{unemployed.toLocaleString()}</span>
                <span className="text-[8px] uppercase text-slate-500">Parados</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-4">
            <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Bienestar</span>
            <span className="text-xl font-mono">{stats.happiness}%</span>
          </div>
        </div>

        <div className="flex gap-2 items-end bg-slate-950/50 p-2 rounded-lg border border-slate-800">
          <div className="flex flex-col items-center">
             <div className="w-3 bg-slate-800 h-10 relative rounded-t overflow-hidden">
               <div className="absolute bottom-0 w-full bg-green-500 transition-all" style={{ height: `${stats.demandR}%` }} />
             </div>
             <span className="text-[8px] font-black text-green-500">R</span>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-3 bg-slate-800 h-10 relative rounded-t overflow-hidden">
               <div className="absolute bottom-0 w-full bg-blue-500 transition-all" style={{ height: `${stats.demandC}%` }} />
             </div>
             <span className="text-[8px] font-black text-blue-500">C</span>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-3 bg-slate-800 h-10 relative rounded-t overflow-hidden">
               <div className="absolute bottom-0 w-full bg-yellow-500 transition-all" style={{ height: `${stats.demandI}%` }} />
             </div>
             <span className="text-[8px] font-black text-yellow-500">I</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menú Lateral */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/50">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-3 px-1 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all ${activeCategory === cat ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {CATEGORIES[activeCategory].map((type) => {
              const data = TILE_DATA[type];
              const isLocked = stats.level < data.unlockLevel;
              return (
                <button
                  key={type}
                  onClick={() => !isLocked && setSelectedTool(type as TileType)}
                  className={`
                    w-full flex flex-col p-2.5 rounded-lg border transition-all text-left relative overflow-hidden
                    ${isLocked ? 'opacity-40 grayscale bg-slate-950/50 cursor-not-allowed border-slate-800' : 
                      selectedTool === type 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-800/20 border-slate-700 hover:border-slate-500'}
                  `}
                >
                  <div className="flex justify-between items-start w-full mb-0.5">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-100">
                      <span className="text-base">{isLocked ? '🔒' : data.icon}</span> {data.name}
                    </span>
                    {!isLocked ? <span className="text-emerald-400 font-mono text-[10px] font-bold">${data.cost.toLocaleString()}</span> : <span className="text-slate-500 text-[9px] font-black uppercase">NVL {data.unlockLevel}</span>}
                  </div>
                  
                  {!isLocked && (
                    <div className="flex flex-wrap gap-x-2 text-[8px] text-slate-500">
                      {data.pop > 0 && <span className="text-blue-400">Hab: +{data.pop}</span>}
                      {data.jobs > 0 && <span className="text-yellow-400">E: +{data.jobs}</span>}
                      {data.power < 0 && <span className="text-orange-400">⚡ +{Math.abs(data.power)}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-[8px] text-slate-500 uppercase font-black">
               <span>Energía</span>
               <span>{stats.powerCapacity > 0 ? Math.floor((stats.powerUsage / stats.powerCapacity) * 100) : 0}%</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full">
              <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, (stats.powerUsage / (stats.powerCapacity || 1)) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Viewport de Juego */}
        <div className="flex-1 bg-black relative overflow-hidden" 
             onContextMenu={(e) => e.preventDefault()}
             onMouseDown={(e) => {
               if (e.button === 1 || e.button === 2) {
                 isDragging.current = true;
                 lastMousePos.current = { x: e.clientX, y: e.clientY };
               }
             }}
             onMouseMove={(e) => {
               if (isDragging.current) {
                 setCamera(prev => ({ 
                   ...prev, 
                   x: prev.x + (e.clientX - lastMousePos.current.x), 
                   y: prev.y + (e.clientY - lastMousePos.current.y) 
                 }));
                 lastMousePos.current = { x: e.clientX, y: e.clientY };
               }
             }}
             onMouseUp={() => isDragging.current = false}
             onWheel={(e) => {
               const newZoom = Math.min(Math.max(0.1, camera.zoom - e.deltaY * 0.001), 5);
               setCamera(prev => ({ ...prev, zoom: newZoom }));
             }}
             onClick={handleCanvasClick}>
          <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
        </div>

        {/* Advisor */}
        <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Plan IA</h2>
            <button 
              onClick={async () => {
                setIsConsulting(true);
                const feedback = await getAdvisorFeedback(stats, {});
                setMessages(prev => [{ text: feedback, sender: 'ADVISOR', timestamp: Date.now() }, ...prev]);
                setIsConsulting(false);
              }}
              disabled={isConsulting}
              className="text-[8px] font-bold bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 transition-all"
            >
              {isConsulting ? '...' : 'Informe'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px] custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`p-2.5 rounded-lg border leading-tight ${msg.sender === 'ADVISOR' ? 'bg-blue-600/10 border-blue-500/30 text-blue-100' : 'bg-slate-800/40 border-slate-700 text-slate-400 italic'}`}>
                {msg.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
