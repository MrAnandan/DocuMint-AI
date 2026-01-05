import { GoogleGenAI } from "@google/genai";
import { FormatResult } from "../types";

const API_KEY = process.env.API_KEY || "";

export const formatDocument = async (
  content: string, 
  promptTemplate: string
): Promise<FormatResult> => {
  if (!content.trim()) return { text: "" };

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Using gemini-3-flash-preview for high-speed, low-latency processing.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${promptTemplate}\n\nContent to process:\n${content}`,
      config: {
        temperature: 0.3,
        topP: 0.95,
        thinkingConfig: {
            thinkingBudget: 0 
        }
      }
    });

    const text = response.text || "Failed to generate content.";
    return { text };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Formatting failed. Please check your connection or API key.");
  }
};