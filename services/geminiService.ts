
import { GoogleGenAI, Type } from "@google/genai";
import { CropInput, PriceResult, SupportedLanguage } from '../types';

/**
 * Service to interact with Google Gemini AI for fair price calculations.
 * Note: The API key is injected via vite.config.ts from environment variables.
 */
export const calculateFairPrice = async (input: CropInput, language: SupportedLanguage): Promise<PriceResult> => {
  
  // The API key is mapped in vite.config.ts to process.env.API_KEY
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error(
      "API Key is missing. Please add 'VITE_API_KEY' to your Vercel Environment Variables and REDEPLOY your project."
    );
  }

  // Initialize the AI client with the required naming convention
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Calculate total cost for the prompt context
  const totalCost = Number(input.seedCost) + 
                    Number(input.fertilizerCost) + 
                    Number(input.labourCost) + 
                    Number(input.maintenanceCost) + 
                    Number(input.otherCost);

  const prompt = `
    You are an expert agricultural economist devoted to fair trade for farmers.
    Calculate a fair price for the following crop, ensuring the farmer gets a significant benefit.
    Consider hidden costs, inflation, and a living wage margin.
    
    Input Data:
    - Crop: ${input.cropName}
    - Quantity: ${input.quantity} ${input.unit}
    - Quality: ${input.quality}
    - Region: ${input.region}
    
    Cost Breakdown:
    - Seed Cost: ${input.seedCost}
    - Fertilizer/Pesticide Cost: ${input.fertilizerCost}
    - Labour Cost: ${input.labourCost}
    - Maintenance Cost: ${input.maintenanceCost}
    - Other (Transport/Storage): ${input.otherCost}
    ---------------------------
    - Total Cultivation Cost: ${totalCost}
    
    - Current Market Offer: ${input.marketRate}
    
    Your goal is to justify a higher price if the market rate is unfair.
    
    Output strictly in JSON format matching this schema:
    {
      "fairPrice": number (The recommended total fair amount for the total quantity),
      "marketComparison": number (Percentage difference, e.g., 15 for 15% higher than market),
      "explanation": string (A short paragraph explaining why this price is fair, in language: ${language}),
      "breakdown": {
        "baseCost": number (Cost coverage),
        "profitMargin": number (Pure profit for farmer),
        "riskPremium": number (Buffer for weather/market risks)
      },
      "recommendation": string (Actionable advice for the farmer, in language: ${language})
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fairPrice: { type: Type.NUMBER },
            marketComparison: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                baseCost: { type: Type.NUMBER },
                profitMargin: { type: Type.NUMBER },
                riskPremium: { type: Type.NUMBER },
              },
              required: ["baseCost", "profitMargin", "riskPremium"]
            },
            recommendation: { type: Type.STRING },
          },
          required: ["fairPrice", "marketComparison", "explanation", "breakdown", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The AI model failed to generate a response.");
    
    return JSON.parse(text) as PriceResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for specific API key errors
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("not found")) {
      throw new Error("Invalid API Key. Please verify the key in your Vercel settings.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during calculation.");
  }
};
