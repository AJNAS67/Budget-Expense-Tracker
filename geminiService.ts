
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "./types";

// Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSpending = async (transactions: Transaction[]): Promise<{ insights: AIInsight[], predictions: string }> => {
  if (transactions.length === 0) {
    return {
      insights: [{ title: "No Data Yet", description: "Add some transactions to get AI-powered financial insights.", type: "analysis", impact: "neutral" }],
      predictions: "Once you record some entries, I can forecast your future balances."
    };
  }

  const transactionSummary = transactions.map(t => ({
    date: t.date,
    amount: t.amount,
    category: t.category,
    subCategory: t.subCategory,
    description: t.description,
    type: t.type
  }));

  const prompt = `Act as an elite wealth manager and financial AI. Analyze the following data:
  1. Highlight hidden spending patterns using categories and subcategories.
  2. Give 3 actionable, high-impact saving strategies.
  3. Predict the financial outlook for the next month based on this specific history.
  
  Format the output as JSON:
  {
    "insights": [
      { "title": "...", "description": "...", "type": "analysis|saving_tip|prediction", "impact": "positive|negative|neutral" }
    ],
    "predictions": "A concise, professional 1-2 sentence forecast."
  }

  Transaction History: ${JSON.stringify(transactionSummary)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ["title", "description", "type", "impact"]
              }
            },
            predictions: { type: Type.STRING }
          },
          required: ["insights", "predictions"]
        }
      }
    });

    // Use .text property directly to extract the string output
    const result = JSON.parse(response.text || '{}');
    return {
      insights: result.insights || [],
      predictions: result.predictions || "Outlook stable."
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      insights: [
        { title: "Audit Interrupted", description: "Our AI analysis service is temporarily offline.", type: "analysis", impact: "neutral" }
      ],
      predictions: "Prediction unavailable."
    };
  }
};
