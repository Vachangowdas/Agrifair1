
import { GoogleGenAI, Type } from "@google/genai";
import { CropInput, PriceResult, SupportedLanguage } from '../types';

// We use process.env.API_KEY. 
// Note: Ensure your bundler (Vite/Webpack) is configured to define this variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const calculateFairPrice = async (input: CropInput, language: SupportedLanguage): Promise<PriceResult> => {
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
      "fairPrice": number (The total fair amount for the total quantity),
      "marketComparison": number (Percentage difference, e.g., 15 for 15% higher than market),
      "explanation": string (A short paragraph explaining why this price is fair, in language: ${language}),
      "breakdown": {
        "baseCost": number (Cost coverage),
        "profitMargin": number (Pure profit for farmer),
        "riskPremium": number (Buffer for weather/market risks)
      },
      "recommendation": string (Advice for the farmer, in language: ${language})
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
              }
            },
            recommendation: { type: Type.STRING },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as PriceResult;
  } catch (error) {
    console.error("Gemini Calculation Error:", error);
    throw new Error("Failed to calculate fair price. Please try again.");
  }
};
