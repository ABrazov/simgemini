
import { TileType, CityStats } from './types';

export const GRID_SIZE = 128;
export const TILE_SIZE = 40;

export const CATEGORIES = {
  RESIDENCIAL: [
    TileType.RESIDENTIAL_TRAILER, TileType.RESIDENTIAL_TINY, TileType.RESIDENTIAL, TileType.RESIDENTIAL_MODULAR,
    TileType.RESIDENTIAL_SUBURB, TileType.RESIDENTIAL_STUDENT, TileType.RESIDENTIAL_APARTMENTS, 
    TileType.RESIDENTIAL_GATED, TileType.RESIDENTIAL_HIGH, TileType.RESIDENTIAL_ECO, 
    TileType.RESIDENTIAL_LUXURY, TileType.RESIDENTIAL_PENTHOUSE, TileType.RESIDENTIAL_ARCOLOGY
  ],
  TRABAJO: [
    TileType.COMMERCIAL_STALL, TileType.COMMERCIAL_FASTFOOD, TileType.FARM, TileType.INDUSTRIAL_WORKSHOP,
    TileType.INDUSTRIAL_WAREHOUSE, TileType.COMMERCIAL, TileType.INDUSTRIAL, TileType.INDUSTRIAL_MINE,
    TileType.COMMERCIAL_OFFICE_SMALL, TileType.COMMERCIAL_CINEMA, TileType.COMMERCIAL_MALL, 
    TileType.INDUSTRIAL_HIGH, TileType.COMMERCIAL_HOTEL, TileType.OFFICE_TOWER, TileType.COMMERCIAL_HIGH, 
    TileType.INDUSTRIAL_CHEMICAL, TileType.TECH_CAMPUS, TileType.BIO_TECH_LAB, TileType.MEGA_CASINO,
    TileType.INDUSTRIAL_DATA_CENTER, TileType.AUTOMATED_FACTORY, TileType.AEROSPACE_HANGAR
  ],
  SERVICIOS: [
    TileType.ROAD, TileType.POWER_WIND, TileType.POWER_BIOMASS, TileType.POWER_PLANT, TileType.POWER_SOLAR, 
    TileType.POWER_GEOTHERMAL, TileType.WATER_PUMP, TileType.WATER_TOWER, TileType.POLICE_POST, TileType.POLICE, 
    TileType.FIRE_POST, TileType.FIRE_STATION, TileType.FIRST_AID, TileType.HOSPITAL_CLINIC,
    TileType.RECYCLING, TileType.POWER_PLANT_NUCLEAR, TileType.WATER_TREATMENT, TileType.FIRE_HQ,
    TileType.POLICE_HQ, TileType.HOSPITAL, TileType.POWER_FUSION, TileType.DESALINATION_PLANT, TileType.MEGA_HOSPITAL
  ],
  CULTURA: [
    TileType.SCHOOL, TileType.LIBRARY, TileType.HIGH_SCHOOL, TileType.UNIVERSITY, TileType.MUSEUM, 
    TileType.ART_GALLERY, TileType.RESEARCH_LAB, TileType.CULTURE_STATUE, TileType.CULTURE_OPERA, TileType.CULTURE_ZOO
  ],
  OCIO: [
    TileType.PARK_SMALL, TileType.LEISURE_SKATEPARK, TileType.DOG_PARK, TileType.LEISURE_POOL, 
    TileType.PARK_LARGE, TileType.LEISURE_BOTANICAL, TileType.STADIUM, TileType.THEME_PARK, TileType.VR_PLAZA
  ],
  TRANSPORTE: [
    TileType.TRANSPORT_BUS, TileType.SUBWAY, TileType.TRANSPORT_HELIPORT, TileType.AIRPORT, 
    TileType.MAGLEV_STATION, TileType.SPACE_PORT
  ]
};

export const TILE_DATA: Record<TileType, any> = {
  [TileType.EMPTY]: { name: 'Despejado', cost: 0, power: 0, water: 0, income: 0, color: '#064e3b10', icon: '', pop: 0, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.ROAD]: { name: 'Carretera', cost: 10, power: 0, water: 0, income: -1, color: '#334155', icon: '🛣️', pop: 0, jobs: 0, pol: 0, unlockLevel: 1 },
  
  // RESIDENCIAL
  [TileType.RESIDENTIAL_TRAILER]: { name: 'Caravanas', cost: 20, power: 1, water: 1, income: 2, color: '#94a3b8', icon: '🚐', pop: 3, jobs: 0, pol: 1, unlockLevel: 1 },
  [TileType.RESIDENTIAL_TINY]: { name: 'Casas Pequeñas', cost: 40, power: 1, water: 1, income: 4, color: '#4ade80', icon: '🏕️', pop: 4, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL]: { name: 'Casas Básicas', cost: 100, power: 2, water: 1, income: 10, color: '#22c55e', icon: '🏠', pop: 10, jobs: 0, pol: 0, unlockLevel: 1 },
  [TileType.RESIDENTIAL_MODULAR]: { name: 'Vivienda Modular', cost: 180, power: 3, water: 2, income: 18, color: '#16a34a', icon: '📦', pop: 18, jobs: 0, pol: 0, unlockLevel: 2 },
  [TileType.RESIDENTIAL_SUBURB]: { name: 'Suburbanas', cost: 240, power: 4, water: 2, income: 24, color: '#16a34a', icon: '🏡', pop: 25, jobs: 0, pol: 0, unlockLevel: 2 },
  [TileType.RESIDENTIAL_STUDENT]: { name: 'Residencia Est.', cost: 400, power: 8, water: 5, income: 15, color: '#15803d', icon: '🎓', pop: 60, jobs: 0, pol: 2, unlockLevel: 3 },
  [TileType.RESIDENTIAL_APARTMENTS]: { name: 'Apartamentos', cost: 600, power: 8, water: 4, income: 70, color: '#15803d', icon: '🏢', pop: 80, jobs: 0, pol: 0, unlockLevel: 3 },
  [TileType.RESIDENTIAL_GATED]: { name: 'Com. Cerrada', cost: 1200, power: 15, water: 10, income: 150, color: '#14532d', icon: '💂', pop: 120, jobs: 0, pol: -5, unlockLevel: 4 },
  [TileType.RESIDENTIAL_HIGH]: { name: 'Bloque Pisos', cost: 1600, power: 20, water: 10, income: 200, color: '#14532d', icon: '🏢', pop: 250, jobs: 0, pol: 0, unlockLevel: 5 },
  [TileType.RESIDENTIAL_ECO]: { name: 'Bloque Eco', cost: 2500, power: 2, water: 2, income: 180, color: '#2dd4bf', icon: '🌿', pop: 200, jobs: 0, pol: -15, unlockLevel: 6 },
  [TileType.RESIDENTIAL_LUXURY]: { name: 'Torre Lujo', cost: 6000, power: 50, water: 25, income: 1000, color: '#064e3b', icon: '💎', pop: 600, jobs: 0, pol: 0, unlockLevel: 8 },
  [TileType.RESIDENTIAL_PENTHOUSE]: { name: 'Áticos Élite', cost: 15000, power: 80, water: 40, income: 2500, color: '#022c22', icon: '🥂', pop: 800, jobs: 0, pol: 0, unlockLevel: 10 },
  [TileType.RESIDENTIAL_ARCOLOGY]: { name: 'Arcología', cost: 100000, power: 200, water: 100, income: 10000, color: '#0f172a', icon: '🪐', pop: 5000, jobs: 0, pol: -20, unlockLevel: 15 },

  // TRABAJO
  [TileType.COMMERCIAL_STALL]: { name: 'Puesto Callejero', cost: 30, power: 1, water: 1, income: 15, color: '#60a5fa', icon: '🌭', pop: 0, jobs: 2, pol: 1, unlockLevel: 1 },
  [TileType.COMMERCIAL_FASTFOOD]: { name: 'Comida Rápida', cost: 120, power: 4, water: 3, income: 45, color: '#3b82f6', icon: '🍔', pop: 0, jobs: 12, pol: 3, unlockLevel: 1 },
  [TileType.FARM]: { name: 'Granja Eco', cost: 150, power: 1, water: 15, income: 30, color: '#4d7c0f', icon: '🚜', pop: 2, jobs: 8, pol: -2, unlockLevel: 1 },
  [TileType.INDUSTRIAL_WORKSHOP]: { name: 'Taller', cost: 160, power: 5, water: 2, income: 60, color: '#b45309', icon: '🛠️', pop: 0, jobs: 10, pol: 3, unlockLevel: 1 },
  [TileType.INDUSTRIAL_WAREHOUSE]: { name: 'Almacén', cost: 250, power: 8, water: 4, income: 90, color: '#d97706', icon: '📦', pop: 0, jobs: 25, pol: 2, unlockLevel: 2 },
  [TileType.COMMERCIAL]: { name: 'Comercio Local', cost: 200, power: 5, water: 2, income: 50, color: '#3b82f6', icon: '🛍️', pop: 0, jobs: 15, pol: 1, unlockLevel: 2 },
  [TileType.INDUSTRIAL]: { name: 'Industria', cost: 400, power: 15, water: 8, income: 150, color: '#ca8a04', icon: '🏭', pop: 0, jobs: 40, pol: 10, unlockLevel: 3 },
  [TileType.INDUSTRIAL_MINE]: { name: 'Mina', cost: 800, power: 30, water: 20, income: 400, color: '#451a03', icon: '⛏️', pop: 0, jobs: 80, pol: 35, unlockLevel: 3 },
  [TileType.COMMERCIAL_OFFICE_SMALL]: { name: 'Oficinas Pyme', cost: 1200, power: 25, water: 10, income: 350, color: '#475569', icon: '📄', pop: 0, jobs: 60, pol: 0, unlockLevel: 4 },
  [TileType.COMMERCIAL_CINEMA]: { name: 'Cine Multicine', cost: 2500, power: 45, water: 20, income: 600, color: '#6366f1', icon: '🎬', pop: 0, jobs: 40, pol: 1, unlockLevel: 4 },
  [TileType.COMMERCIAL_MALL]: { name: 'Gran Centro', cost: 4500, power: 60, water: 30, income: 1200, color: '#2563eb', icon: '🏬', pop: 0, jobs: 150, pol: 5, unlockLevel: 5 },
  [TileType.INDUSTRIAL_HIGH]: { name: 'Mega Fábrica', cost: 5000, power: 100, water: 80, income: 1600, color: '#a16207', icon: '🏭', pop: 0, jobs: 200, pol: 50, unlockLevel: 6 },
  [TileType.COMMERCIAL_HOTEL]: { name: 'Hotel Resort', cost: 8000, power: 120, water: 100, income: 2800, color: '#ec4899', icon: '🏨', pop: 0, jobs: 120, pol: 2, unlockLevel: 6 },
  [TileType.OFFICE_TOWER]: { name: 'Torre Oficinas', cost: 12000, power: 180, water: 50, income: 4500, color: '#1e293b', icon: '🏢', pop: 0, jobs: 400, pol: 0, unlockLevel: 7 },
  [TileType.COMMERCIAL_HIGH]: { name: 'Distrito Negocios', cost: 18000, power: 250, water: 80, income: 7000, color: '#1d4ed8', icon: '🏙️', pop: 0, jobs: 800, pol: 10, unlockLevel: 8 },
  [TileType.INDUSTRIAL_CHEMICAL]: { name: 'Planta Química', cost: 25000, power: 400, water: 300, income: 12000, color: '#3f6212', icon: '🧪', pop: 0, jobs: 600, pol: 150, unlockLevel: 9 },
  [TileType.TECH_CAMPUS]: { name: 'Campus Tech', cost: 35000, power: 500, water: 150, income: 15000, color: '#1e3a8a', icon: '💻', pop: 0, jobs: 1200, pol: 0, unlockLevel: 10 },
  [TileType.BIO_TECH_LAB]: { name: 'Lab Bio-Tech', cost: 45000, power: 300, water: 200, income: 20000, color: '#065f46', icon: '🧬', pop: 0, jobs: 500, pol: 5, unlockLevel: 11 },
  [TileType.MEGA_CASINO]: { name: 'Mega Casino', cost: 65000, power: 800, water: 400, income: 45000, color: '#7e22ce', icon: '🎰', pop: 0, jobs: 1500, pol: 20, unlockLevel: 12 },
  [TileType.INDUSTRIAL_DATA_CENTER]: { name: 'Centro Datos', cost: 80000, power: 2000, water: 500, income: 35000, color: '#0f172a', icon: '🖥️', pop: 0, jobs: 100, pol: 1, unlockLevel: 13 },
  [TileType.AUTOMATED_FACTORY]: { name: 'Fábrica AI', cost: 120000, power: 1500, water: 200, income: 60000, color: '#111827', icon: '🤖', pop: 0, jobs: 200, pol: 2, unlockLevel: 15 },
  [TileType.AEROSPACE_HANGAR]: { name: 'Aeroespacial', cost: 250000, power: 3000, water: 1000, income: 150000, color: '#1e293b', icon: '🚀', pop: 0, jobs: 3000, pol: 15, unlockLevel: 20 },

  // SERVICIOS
  [TileType.POWER_WIND]: { name: 'Aerogenerador', cost: 800, power: -40, water: 0, income: -20, color: '#94a3b8', icon: '🌬️', pol: 0, unlockLevel: 1 },
  [TileType.POWER_BIOMASS]: { name: 'Planta Biomasa', cost: 1500, power: -100, water: 30, income: -80, color: '#4ade80', icon: '🍂', pol: 5, unlockLevel: 1 },
  [TileType.POWER_PLANT]: { name: 'Planta Carbón', cost: 2000, power: -250, water: 20, income: -200, color: '#ef4444', icon: '🏭', pol: 50, unlockLevel: 2 },
  [TileType.POWER_SOLAR]: { name: 'Granja Solar', cost: 6000, power: -350, water: 5, income: -150, color: '#facc15', icon: '☀️', pol: -10, unlockLevel: 3 },
  [TileType.POWER_GEOTHERMAL]: { name: 'Geotérmica', cost: 12000, power: -800, water: 10, income: -400, color: '#991b1b', icon: '🌋', pol: 0, unlockLevel: 5 },
  [TileType.WATER_PUMP]: { name: 'Bomba Agua', cost: 500, power: 10, water: -80, income: -40, color: '#06b6d4', icon: '⛲', pol: 0, unlockLevel: 1 },
  [TileType.WATER_TOWER]: { name: 'Torre Agua', cost: 1200, power: 5, water: -250, income: -100, color: '#0891b2', icon: '💧', pol: 0, unlockLevel: 2 },
  [TileType.POLICE_POST]: { name: 'Puesto Control', cost: 600, power: 5, water: 2, income: -150, color: '#1e40af', icon: '🚨', crime: -10, unlockLevel: 1 },
  [TileType.POLICE]: { name: 'Comisaría', cost: 2500, power: 25, water: 10, income: -500, color: '#1e3a8a', icon: '👮', crime: -35, unlockLevel: 3 },
  [TileType.FIRE_POST]: { name: 'Puesto Fuego', cost: 500, power: 5, water: 10, income: -120, color: '#dc2626', icon: '🧯', fire: -10, unlockLevel: 1 },
  [TileType.FIRE_STATION]: { name: 'Bomberos', cost: 2200, power: 20, water: 50, income: -450, color: '#991b1b', icon: '🚒', fire: -40, unlockLevel: 3 },
  [TileType.FIRST_AID]: { name: 'Primeros Aux.', cost: 800, power: 10, water: 15, income: -200, color: '#fee2e2', icon: '🩹', health: 8, unlockLevel: 1 },
  [TileType.HOSPITAL_CLINIC]: { name: 'Clínica', cost: 3500, power: 40, water: 40, income: -800, color: '#fca5a5', icon: '🏥', health: 20, unlockLevel: 4 },
  [TileType.RECYCLING]: { name: 'Centro Reciclaje', cost: 6000, power: 120, water: 60, income: -500, color: '#2dd4bf', icon: '♻️', pol: -60, unlockLevel: 5 },
  [TileType.POWER_PLANT_NUCLEAR]: { name: 'N. Fisión', cost: 40000, power: -4000, water: 600, income: -5000, color: '#dc2626', icon: '☢️', pol: 15, unlockLevel: 8 },
  [TileType.WATER_TREATMENT]: { name: 'Depuradora', cost: 15000, power: 150, water: -1500, income: -1200, color: '#0e7490', icon: '💧', pol: -20, unlockLevel: 7 },
  [TileType.FIRE_HQ]: { name: 'Central Bomberos', cost: 20000, power: 100, water: 200, income: -2500, color: '#7f1d1d', icon: '🚒', fire: -100, unlockLevel: 10 },
  [TileType.POLICE_HQ]: { name: 'Central Policía', cost: 25000, power: 150, water: 100, income: -3500, color: '#1e3a8a', icon: '🏢', crime: -100, unlockLevel: 10 },
  [TileType.HOSPITAL]: { name: 'Hospital Gral.', cost: 30000, power: 250, water: 250, income: -5000, color: '#f1f5f9', icon: '🏩', health: 60, unlockLevel: 11 },
  [TileType.MEGA_HOSPITAL]: { name: 'Ctro. Médico AI', cost: 100000, power: 1000, water: 800, income: -15000, color: '#ffffff', icon: '🏥', health: 150, unlockLevel: 15 },
  [TileType.POWER_FUSION]: { name: 'N. Fusión', cost: 500000, power: -50000, water: 2000, income: -25000, color: '#3b82f6', icon: '⚛️', pol: 0, unlockLevel: 25 },
  [TileType.DESALINATION_PLANT]: { name: 'Desaladora', cost: 60000, power: 800, water: -8000, income: -6000, color: '#0369a1', icon: '🌊', pol: 5, unlockLevel: 12 },

  // CULTURA
  [TileType.CULTURE_STATUE]: { name: 'Estatua Fundador', cost: 500, power: 0, water: 0, income: -10, color: '#94a3b8', icon: '🗿', happy: 10, unlockLevel: 1 },
  [TileType.SCHOOL]: { name: 'Escuela Rural', cost: 1800, power: 30, water: 20, income: -600, color: '#d97706', icon: '🏫', edu: 25, unlockLevel: 2 },
  [TileType.LIBRARY]: { name: 'Biblioteca', cost: 2800, power: 15, water: 10, income: -250, color: '#b45309', icon: '📖', edu: 15, happy: 8, unlockLevel: 3 },
  [TileType.HIGH_SCHOOL]: { name: 'Instituto', cost: 9000, power: 80, water: 60, income: -2000, color: '#92400e', icon: '🏫', edu: 50, unlockLevel: 5 },
  [TileType.UNIVERSITY]: { name: 'Universidad', cost: 35000, power: 300, water: 200, income: -8000, color: '#78350f', icon: '🎓', edu: 120, unlockLevel: 8 },
  [TileType.MUSEUM]: { name: 'Museo Nacional', cost: 15000, power: 100, water: 50, income: -1200, color: '#8b5cf6', icon: '🏛️', happy: 20, edu: 15, unlockLevel: 6 },
  [TileType.ART_GALLERY]: { name: 'Galería Arte', cost: 18000, power: 80, water: 40, income: -1000, color: '#a78bfa', icon: '🖼️', happy: 25, edu: 8, unlockLevel: 7 },
  [TileType.CULTURE_OPERA]: { name: 'Ópera Real', cost: 60000, power: 400, water: 200, income: -5000, color: '#4c1d95', icon: '🎭', happy: 60, unlockLevel: 12 },
  [TileType.CULTURE_ZOO]: { name: 'Zoo Municipal', cost: 45000, power: 200, water: 1000, income: -4000, color: '#365314', icon: '🦁', happy: 50, edu: 10, unlockLevel: 10 },
  [TileType.RESEARCH_LAB]: { name: 'Ctro. I+D Tech', cost: 120000, power: 1500, water: 500, income: -20000, color: '#1e40af', icon: '🧪', edu: 250, unlockLevel: 16 },

  // OCIO
  [TileType.PARK_SMALL]: { name: 'Plaza', cost: 500, power: 2, water: 5, income: -30, color: '#34d399', icon: '🌳', happy: 10, unlockLevel: 1 },
  [TileType.LEISURE_SKATEPARK]: { name: 'Skatepark', cost: 800, power: 5, water: 2, income: -50, color: '#475569', icon: '🛹', happy: 15, unlockLevel: 1 },
  [TileType.DOG_PARK]: { name: 'Parque Canino', cost: 1200, power: 5, water: 15, income: -60, color: '#10b981', icon: '🐕', happy: 12, unlockLevel: 2 },
  [TileType.LEISURE_POOL]: { name: 'Piscina Pública', cost: 3500, power: 40, water: 300, income: -400, color: '#0ea5e9', icon: '🏊', happy: 25, health: 10, unlockLevel: 4 },
  [TileType.PARK_LARGE]: { name: 'P. Central', cost: 6000, power: 15, water: 50, income: -250, color: '#059669', icon: '🌲', happy: 35, unlockLevel: 5 },
  [TileType.LEISURE_BOTANICAL]: { name: 'Jardín Botánico', cost: 12000, power: 30, water: 500, income: -800, color: '#064e3b', icon: '🌺', happy: 50, pol: -30, unlockLevel: 8 },
  [TileType.STADIUM]: { name: 'Estadio', cost: 50000, power: 800, water: 600, income: 6000, color: '#fb923c', icon: '🏟️', happy: 80, unlockLevel: 10 },
  [TileType.THEME_PARK]: { name: 'P. Atracciones', cost: 150000, power: 2000, water: 1200, income: 25000, color: '#f472b6', icon: '🎡', happy: 150, unlockLevel: 15 },
  [TileType.VR_PLAZA]: { name: 'Plaza Virtual', cost: 250000, power: 4000, water: 200, income: -5000, color: '#2dd4bf', icon: '🕶️', happy: 300, unlockLevel: 20 },

  // TRANSPORTE
  [TileType.TRANSPORT_BUS]: { name: 'Terminal Bus', cost: 2000, power: 10, water: 5, income: -600, color: '#facc15', icon: '🚌', happy: 15, unlockLevel: 2 },
  [TileType.SUBWAY]: { name: 'Estación Metro', cost: 10000, power: 100, water: 20, income: -2500, color: '#a21caf', icon: '🚇', happy: 40, unlockLevel: 6 },
  [TileType.TRANSPORT_HELIPORT]: { name: 'Helipuerto', cost: 15000, power: 50, water: 10, income: 2000, color: '#64748b', icon: '🚁', happy: 20, unlockLevel: 10 },
  [TileType.AIRPORT]: { name: 'Aero. Internac.', cost: 120000, power: 2000, water: 1500, income: 45000, color: '#1e293b', icon: '✈️', jobs: 2000, pol: 200, unlockLevel: 14 },
  [TileType.MAGLEV_STATION]: { name: 'Estación Maglev', cost: 250000, power: 3000, water: 300, income: 20000, color: '#312e81', icon: '🚄', happy: 100, unlockLevel: 18 },
  [TileType.SPACE_PORT]: { name: 'Puerto Espacial', cost: 1000000, power: 20000, water: 10000, income: 500000, color: '#000000', icon: '☄️', jobs: 10000, pol: 500, unlockLevel: 30 },
};

export const INITIAL_STATS: CityStats = {
  money: 2500,
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
  level: 1,
  employed: 0,
  workforce: 0
};
