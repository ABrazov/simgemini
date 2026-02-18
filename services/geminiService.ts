
import { GoogleGenAI } from "@google/genai";
import { CityStats } from "../types";

export async function getAdvisorFeedback(stats: CityStats, tileCounts: Record<string, number>) {
  // Always initialize with the direct process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Eres un asesor de planificación urbana en un simulador de ciudades.
    Proporciona un consejo corto basado en estos datos:
    
    - Habitantes: ${stats.population} vs Empleos: ${stats.jobs}
    - Salud: ${stats.health}% | Polución: ${stats.pollution}
    - Felicidad: ${stats.happiness}%
    - Presupuesto: $${stats.money}
    - Demandas: R:${stats.demandR}, C:${stats.demandC}, I:${stats.demandI}
    
    Responde en ESPAÑOL (máximo 40 palabras). Sé profesional y directo.
  `;

  try {
    // Basic text task uses gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Access response.text as a property, not a method
    return response.text || "La ciudad crece, Alcalde. Siga así.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error de comunicación con el consejo.";
  }
}
