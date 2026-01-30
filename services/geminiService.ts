import { GoogleGenAI, Type } from "@google/genai";
import { CropInput, PriceResult, SupportedLanguage } from '../types';

/**
 * Service to interact with Google Gemini AI for fair price calculations.
 */
export const calculateFairPrice = async (input: CropInput, language: SupportedLanguage): Promise<PriceResult> => {
  const apiKey = process.env.API_KEY;

  // Safeguard: Check if the key is still the default placeholder
  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
    throw new Error("API Key is missing or invalid. Please update your .env file or Vercel environment variables with a valid Gemini API Key from ai.google.dev.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const totalCost = Number(input.seedCost) + 
                    Number(input.fertilizerCost) + 
                    Number(input.labourCost) + 
                    Number(input.maintenanceCost) + 
                    Number(input.otherCost);

  const prompt = `
    You are an expert agricultural economist. Calculate a fair price for:
    - Crop: ${input.cropName} (${input.quantity} ${input.unit}, Quality: ${input.quality})
    - Region: ${input.region}
    - Total Cultivation Cost: ${totalCost}
    - Current Market Offer: ${input.marketRate}
    
    Ensure the farmer gets at least a 20-30% profit margin over costs.
    
    Output JSON:
    {
      "fairPrice": number,
      "marketComparison": number,
      "explanation": string,
      "breakdown": { "baseCost": number, "profitMargin": number, "riskPremium": number },
      "recommendation": string
    }
  `;

  try {
    // Using gemini-flash-lite-latest which has the highest available quota for free-tier users.
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking to save quota
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
    if (!text) throw new Error("The AI returned an empty response.");
    
    return JSON.parse(text.trim()) as PriceResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check specifically for rate limiting
    if (error.message?.includes('429') || error.message?.includes('Quota')) {
      throw new Error("RATE_LIMIT: The AI is currently busy (Free Tier limit). Please wait 60 seconds and try again, or check if your API Key has Gemini Flash enabled.");
    }
    
    throw new Error(error.message || "An error occurred while calculating the fair price.");
  }
};