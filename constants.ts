
import { TileType, CityStats } from './types';

export const GRID_SIZE = 128;
export const TILE_SIZE = 40;

// Definición de categorías con niveles de desbloqueo progresivos
export const CATEGORIES = {
  RESIDENCIAL: [
    TileType.RESIDENTIAL_TINY, TileType.RESIDENTIAL, TileType.RESIDENTIAL_SUBURB, TileType.RESIDENTIAL_APARTMENTS, 
    TileType.RESIDENTIAL_HIGH, TileType.RESIDENTIAL_LUXURY, TileType.RESIDENTIAL_ARCOLOGY
  ],
  TRABAJO: [
    TileType.COMMERCIAL_STALL, TileType.COMMERCIAL, TileType.COMMERCIAL_MALL, TileType.COMMERCIAL_HIGH, 
    TileType.OFFICE_TOWER, TileType.TECH_CAMPUS, TileType.MEGA_CASINO,
    TileType.FARM, TileType.INDUSTRIAL_WORKSHOP, TileType.INDUSTRIAL, TileType.INDUSTRIAL_HIGH, 
    TileType.BIO_TECH_LAB, TileType.AUTOMATED_FACTORY, TileType.AEROSPACE_HANGAR
  ],
  SERVICIOS: [
    TileType.ROAD, TileType.POWER_WIND, TileType.POWER_PLANT, TileType.POWER_SOLAR, TileType.POWER_PLANT_NUCLEAR, TileType.POWER_FUSION,
    TileType.WATER_TOWER, TileType.WATER_TREATMENT, TileType.DESALINATION_PLANT,
    TileType.RECYCLING, TileType.POLICE, TileType.POLICE_HQ, TileType.FIRE_STATION, TileType.FIRE_HQ,
    TileType.HOSPITAL_CLINIC, TileType.HOSPITAL, TileType.MEGA_HOSPITAL,
    TileType.SCHOOL, TileType.LIBRARY, TileType.HIGH_SCHOOL, TileType.UNIVERSITY, TileType.RESEARCH_LAB
  ],
  OCIO: [
    TileType.PARK_SMALL, TileType.DOG_PARK, TileType.PARK_LARGE, TileType.MUSEUM, TileType.ART_GALLERY, 
    TileType.STADIUM, TileType.THEME_PARK, TileType.VR_PLAZA
  ],
  TRANSPORTE: [
    TileType.SUBWAY, TileType.MAGLEV_STATION, TileType.AIRPORT, TileType.SPACE_PORT
  ]
};

// Función para calcular nivel de desbloqueo basado en el índice de la categoría
const getLevel = (index: number) => index < 5 ? 1 : (index - 3);

export const TILE_DATA: Record<TileType, any> = {
  [TileType.EMPTY]: { name: 'Despejado', cost: 0, power: 0, water: 0, income: 0, color: '#064e3b10', icon: '', pop: 0, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.ROAD]: { name: 'Carretera', cost: 20, power: 0, water: 0, income: -2, color: '#334155', icon: '🛣️', pop: 0, jobs: 0, pol: 0, unlockLevel: 1 },
  
  // RESIDENCIAL
  [TileType.RESIDENTIAL_TINY]: { name: 'Casas Pequeñas', cost: 40, power: 1, water: 1, income: 4, color: '#4ade80', icon: '🏕️', pop: 4, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL]: { name: 'Casas Básicas', cost: 100, power: 2, water: 1, income: 10, color: '#22c55e', icon: '🏠', pop: 10, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL_SUBURB]: { name: 'Suburbanas', cost: 240, power: 4, water: 2, income: 24, color: '#16a34a', icon: '🏡', pop: 25, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL_APARTMENTS]: { name: 'Apartamentos', cost: 600, power: 8, water: 4, income: 70, color: '#15803d', icon: '🏢', pop: 80, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL_HIGH]: { name: 'Bloque Pisos', cost: 1600, power: 20, water: 10, income: 200, color: '#14532d', icon: '🏢', pop: 250, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL_LUXURY]: { name: 'Torre Lujo', cost: 6000, power: 50, water: 25, income: 1000, color: '#064e3b', icon: '💎', pop: 600, jobs: 0, pol: 0, unlockLevel: 2 },
  [TileType.RESIDENTIAL_ARCOLOGY]: { name: 'Arcología', cost: 100000, power: 200, water: 100, income: 10000, color: '#0f172a', icon: '🪐', pop: 5000, jobs: 0, pol: -20, unlockLevel: 3 },

  // TRABAJO - COMERCIAL
  [TileType.COMMERCIAL_STALL]: { name: 'Puesto Callejero', cost: 80, power: 1, water: 1, income: 20, color: '#60a5fa', icon: '🌭', pop: 0, jobs: 2, pol: 1, unlockLevel: 1 },
  [TileType.COMMERCIAL]: { name: 'Comercio Local', cost: 200, power: 5, water: 2, income: 50, color: '#3b82f6', icon: '🛍️', pop: 0, jobs: 8, pol: 1, unlockLevel: 1 },
  [TileType.COMMERCIAL_MALL]: { name: 'Gran Centro', cost: 3000, power: 40, water: 20, income: 900, color: '#2563eb', icon: '🏬', pop: 0, jobs: 100, pol: 5, unlockLevel: 1 },
  [TileType.COMMERCIAL_HIGH]: { name: 'Distrito Negocios', cost: 10000, power: 100, water: 50, income: 3600, color: '#1d4ed8', icon: '🏙️', pop: 0, jobs: 400, pol: 10, unlockLevel: 1 },
  [TileType.OFFICE_TOWER]: { name: 'Torre Oficinas', cost: 6000, power: 100, water: 40, income: 3000, color: '#475569', icon: '🏢', jobs: 250, unlockLevel: 1 },
  [TileType.TECH_CAMPUS]: { name: 'Campus Tech', cost: 24000, power: 300, water: 100, income: 12000, color: '#1e3a8a', icon: '💻', jobs: 800, unlockLevel: 2 },
  [TileType.MEGA_CASINO]: { name: 'Mega Casino', cost: 50000, power: 500, water: 200, income: 30000, color: '#7e22ce', icon: '🎰', jobs: 1200, pol: 20, happy: 20, unlockLevel: 3 },

  // TRABAJO - INDUSTRIAL
  [TileType.FARM]: { name: 'Granja Eco', cost: 240, power: 1, water: 15, income: 30, color: '#4d7c0f', icon: '🚜', pop: 2, jobs: 5, pol: -2, unlockLevel: 4 },
  [TileType.INDUSTRIAL_WORKSHOP]: { name: 'Taller', cost: 160, power: 5, water: 2, income: 60, color: '#b45309', icon: '🛠️', pop: 0, jobs: 6, pol: 3, unlockLevel: 5 },
  [TileType.INDUSTRIAL]: { name: 'Industria', cost: 300, power: 15, water: 8, income: 120, color: '#ca8a04', icon: '🏭', pop: 0, jobs: 20, pol: 10, unlockLevel: 6 },
  [TileType.INDUSTRIAL_HIGH]: { name: 'Mega Fábrica', cost: 5000, power: 100, water: 80, income: 1600, color: '#a16207', icon: '🏭', pop: 0, jobs: 150, pol: 50, unlockLevel: 7 },
  [TileType.BIO_TECH_LAB]: { name: 'Lab Bio-Tech', cost: 16000, power: 200, water: 100, income: 7000, color: '#065f46', icon: '🧬', pop: 0, jobs: 300, pol: 5, unlockLevel: 8 },
  [TileType.AUTOMATED_FACTORY]: { name: 'Fábrica AI', cost: 30000, power: 500, water: 50, income: 24000, color: '#111827', icon: '🤖', pop: 0, jobs: 100, pol: 2, unlockLevel: 9 },
  [TileType.AEROSPACE_HANGAR]: { name: 'Aeroespacial', cost: 70000, power: 1000, water: 400, income: 50000, color: '#1e293b', icon: '🚀', pop: 0, jobs: 2000, pol: 15, unlockLevel: 10 },

  // ENERGÍA
  [TileType.POWER_WIND]: { name: 'Aerogenerador', cost: 1000, power: -40, water: 0, income: -20, color: '#94a3b8', icon: '🌬️', pol: 0, unlockLevel: 1 },
  [TileType.POWER_PLANT]: { name: 'Planta Carbón', cost: 2000, power: -250, water: 20, income: -200, color: '#ef4444', icon: '🏭', pol: 50, unlockLevel: 1 },
  [TileType.POWER_SOLAR]: { name: 'Granja Solar', cost: 6000, power: -300, water: 5, income: -120, color: '#facc15', icon: '☀️', pol: -10, unlockLevel: 1 },
  [TileType.POWER_PLANT_NUCLEAR]: { name: 'N. Fisión', cost: 30000, power: -3000, water: 500, income: -3000, color: '#dc2626', icon: '☢️', pol: 10, unlockLevel: 1 },
  [TileType.POWER_FUSION]: { name: 'N. Fusión', cost: 240000, power: -25000, water: 1000, income: -10000, color: '#3b82f6', icon: '⚛️', pol: 0, unlockLevel: 1 },

  // AGUA
  [TileType.WATER_TOWER]: { name: 'Torre Agua', cost: 800, power: 5, water: -100, income: -60, color: '#06b6d4', icon: '💧', pol: 0, unlockLevel: 1 },
  [TileType.WATER_TREATMENT]: { name: 'Depuradora', cost: 3000, power: 50, water: -500, income: -300, color: '#0891b2', icon: '⛲', pol: -10, unlockLevel: 2 },
  [TileType.DESALINATION_PLANT]: { name: 'Desaladora', cost: 24000, power: 400, water: -3000, income: -1600, color: '#0c4a6e', icon: '🌊', pol: 5, unlockLevel: 3 },

  // SERVICIOS
  [TileType.POLICE]: { name: 'Comisaría', cost: 2400, power: 20, water: 10, income: -400, color: '#1e40af', icon: '👮', radius: 12, crime: -30, unlockLevel: 4 },
  [TileType.POLICE_HQ]: { name: 'Cuartel Policía', cost: 16000, power: 100, water: 50, income: -2400, color: '#1e3a8a', icon: '🏢', radius: 30, crime: -80, unlockLevel: 5 },
  [TileType.FIRE_STATION]: { name: 'Bomberos', cost: 2000, power: 20, water: 40, income: -360, color: '#991b1b', icon: '🚒', radius: 12, fire: -30, unlockLevel: 6 },
  [TileType.FIRE_HQ]: { name: 'Estación Central', cost: 12000, power: 80, water: 150, income: -1800, color: '#7f1d1d', icon: '🚒', radius: 25, fire: -70, unlockLevel: 7 },
  [TileType.HOSPITAL_CLINIC]: { name: 'Clínica', cost: 3000, power: 30, water: 30, income: -600, color: '#fee2e2', icon: '🏥', health: 15, unlockLevel: 8 },
  [TileType.HOSPITAL]: { name: 'Hospital', cost: 8000, power: 100, water: 100, income: -1200, color: '#f8fafc', icon: '🏥', health: 40, unlockLevel: 9 },
  [TileType.MEGA_HOSPITAL]: { name: 'Centro Médico', cost: 40000, power: 400, water: 400, income: -6000, color: '#eff6ff', icon: '🏩', health: 90, unlockLevel: 10 },

  // EDUCACIÓN
  [TileType.SCHOOL]: { name: 'Escuela Primaria', cost: 1600, power: 25, water: 15, income: -500, color: '#d97706', icon: '🏫', edu: 20, unlockLevel: 11 },
  [TileType.LIBRARY]: { name: 'Biblioteca', cost: 2400, power: 10, water: 10, income: -200, color: '#b45309', icon: '📖', edu: 10, happy: 5, unlockLevel: 12 },
  [TileType.HIGH_SCHOOL]: { name: 'Instituto', cost: 7000, power: 60, water: 40, income: -1600, color: '#92400e', icon: '🏫', edu: 40, unlockLevel: 13 },
  [TileType.UNIVERSITY]: { name: 'Universidad', cost: 20000, power: 200, water: 150, income: -5000, color: '#78350f', icon: '🎓', edu: 80, unlockLevel: 14 },
  [TileType.RESEARCH_LAB]: { name: 'Centro I+D', cost: 80000, power: 1000, water: 200, income: -10000, color: '#1e40af', icon: '🧪', edu: 150, unlockLevel: 15 },

  // OCIO
  [TileType.PARK_SMALL]: { name: 'Plaza', cost: 600, power: 2, water: 5, income: -30, color: '#34d399', icon: '🌳', happy: 5, unlockLevel: 1 },
  [TileType.DOG_PARK]: { name: 'Parque Canino', cost: 1200, power: 5, water: 15, income: -50, color: '#10b981', icon: '🐕', happy: 8, unlockLevel: 1 },
  [TileType.PARK_LARGE]: { name: 'P. Central', cost: 4000, power: 10, water: 30, income: -160, color: '#059669', icon: '🌲', happy: 12, unlockLevel: 1 },
  [TileType.MUSEUM]: { name: 'Museo Nacional', cost: 10000, power: 80, water: 40, income: -800, color: '#8b5cf6', icon: '🏛️', happy: 15, edu: 10, unlockLevel: 1 },
  [TileType.ART_GALLERY]: { name: 'Galería Arte', cost: 14000, power: 60, water: 30, income: -600, color: '#a78bfa', icon: '🖼️', happy: 20, edu: 5, unlockLevel: 1 },
  [TileType.STADIUM]: { name: 'Estadio Olímpico', cost: 30000, power: 500, water: 300, income: 3000, color: '#fb923c', icon: '🏟️', happy: 45, unlockLevel: 2 },
  [TileType.THEME_PARK]: { name: 'Parque Atrac.', cost: 90000, power: 1200, water: 600, income: 16000, color: '#f472b6', icon: '🎡', happy: 80, unlockLevel: 3 },
  [TileType.VR_PLAZA]: { name: 'Plaza Virtual', cost: 160000, power: 2500, water: 100, income: -4000, color: '#2dd4bf', icon: '🕶️', happy: 120, unlockLevel: 4 },

  // INFRAESTRUCTURA
  [TileType.SUBWAY]: { name: 'Estación Metro', cost: 5000, power: 50, water: 10, income: -1000, color: '#a21caf', icon: '🚇', happy: 15, unlockLevel: 1 },
  [TileType.AIRPORT]: { name: 'Aeropuerto Int.', cost: 70000, power: 1500, water: 800, income: 20000, color: '#64748b', icon: '✈️', jobs: 1500, pol: 150, unlockLevel: 2 },
  [TileType.RECYCLING]: { name: 'Centro Reciclaje', cost: 5000, power: 100, water: 50, income: -400, color: '#2dd4bf', icon: '♻️', pol: -50, unlockLevel: 1 },
  [TileType.MAGLEV_STATION]: { name: 'Estación Maglev', cost: 130000, power: 2000, water: 200, income: 10000, color: '#312e81', icon: '🚄', happy: 40, unlockLevel: 3 },
  [TileType.SPACE_PORT]: { name: 'Puerto Espacial', cost: 500000, power: 10000, water: 5000, income: 200000, color: '#000000', icon: '☄️', jobs: 5000, pol: 300, unlockLevel: 5 },
};

export const INITIAL_STATS: CityStats = {
  money: 100000,
  population: 0,
  jobs: 0,
  happiness: 80,
  health: 80,
  education: 15,
  crime: 5,
  pollution: 0,
  powerCapacity: 0,
  powerUsage: 0,
  waterCapacity: 0,
  waterUsage: 0,
  day: 1,
  demandR: 50,
  demandC: 30,
  demandI: 20,
  level: 1
};
