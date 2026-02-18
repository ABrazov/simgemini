
import { GoogleGenAI } from "@google/genai";
import { CityStats } from "./types";

export async function getAdvisorFeedback(stats: CityStats, context: any): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Eres el asesor principal de una ciudad en un simulador tipo SimCity. 
      Estado actual de la ciudad:
      - Población: ${stats.population}
      - Dinero: $${stats.money}
      - Nivel: ${stats.level}
      - Felicidad: ${stats.happiness}%
      - Empleos: ${stats.jobs}
      - Capacidad Eléctrica: ${stats.powerCapacity}
      - Uso Eléctrico: ${stats.powerUsage}
      - Contaminación: ${stats.pollution}
      - Educación: ${stats.education}%
      - Salud: ${stats.health}%

      Analiza brevemente la situación y da un consejo corto y directo al Alcalde (máximo 2 frases). 
      Si hay sobrecarga eléctrica (${stats.powerUsage > stats.powerCapacity}), prioriza advertir sobre el apagón.
      Si hay mucho desempleo, sugiere zonas industriales o comerciales.
      Si la felicidad es baja, sugiere parques o servicios.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "No tengo comentarios en este momento, Alcalde.";
  } catch (error) {
    console.error("Error consultando al asesor:", error);
    return "La conexión con el ministerio de planificación se ha perdido temporalmente.";
  }
}
