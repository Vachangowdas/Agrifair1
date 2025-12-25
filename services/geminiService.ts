
import { GoogleGenAI, Type } from "@google/genai";
import { CropInput, PriceResult, SupportedLanguage } from '../types';

/**
 * Service to interact with Google Gemini AI for fair price calculations.
 * The API key is injected via vite.config.ts from environment variables.
 */
export const calculateFairPrice = async (input: CropInput, language: SupportedLanguage): Promise<PriceResult> => {
  
  // Always use the named parameter and obtain the API key exclusively from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      "fairPrice": number,
      "marketComparison": number,
      "explanation": string,
      "breakdown": {
        "baseCost": number,
        "profitMargin": number,
        "riskPremium": number
      },
      "recommendation": string
    }
  `;

  try {
    // Select gemini-3-pro-preview for tasks involving advanced reasoning, coding, and math.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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

    // Directly access the .text property (not a method call) as per the guidelines.
    const text = response.text;
    if (!text) throw new Error("The AI returned an empty response.");
    
    return JSON.parse(text.trim()) as PriceResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An error occurred while calculating the fair price.");
  }
};
