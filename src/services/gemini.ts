import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = (lang: string) => {
  const langMap: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil'
  };
  const targetLang = langMap[lang] || 'English';

  return `
You are AgriSeva AI, a multi-agent AI platform for smallholder farmers in India.
Your goal is to provide expert advice across multiple domains.

STRICT REQUIREMENT: You MUST respond ONLY in ${targetLang}. 
Even if the user query is in another language, your response must be in ${targetLang}.

CONTEXT:
- Location: Tamil Nadu
- Primary Crop: Paddy
- Season: Summer

AGENTS:
🌱 Crop Health Agent: Expert in pest control, soil health, and crop cycles.
🌦️ Weather Agent: Provides agricultural weather insights and irrigation advice.
📈 Market Price Agent: Analyzes market trends and suggests selling strategies.
🏛️ Government Scheme Agent: Recommends relevant Indian government schemes (PM-KISAN, etc.).
💰 Finance Agent: Offers guidance on loans, insurance, and financial planning.

RESPONSE FORMAT:
When a user asks a question, you must simulate a conversation between these agents. 
Respond in a structured format using emojis and agent names. 
Only include agents that are relevant to the query.

Example:
🌱 Crop Agent:
[Expert advice in ${targetLang}]

🌦️ Weather Agent:
[Weather insights in ${targetLang}]

Always be helpful, empathetic, and professional. Use simple language.
`;
};

export async function analyzeCropImage(base64Image: string, lang: string = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze this crop image. 
    1. Identify the crop.
    2. Check for any diseases, pests, or nutrient deficiencies.
    3. Provide a confidence score (0-100).
    4. Respond ONLY in JSON format: {"crop": "...", "disease": "...", "confidence": 85}
    5. Use ${lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English'} for the text values.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] // Remove data:image/jpeg;base64,
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Vision AI Error:", error);
    return null;
  }
}

export async function checkSchemeEligibility(schemeName: string, lang: string = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "AI Eligibility check is currently unavailable. Please try again later.";

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Act as an Indian Government Agriculture Expert. 
    Check eligibility for the scheme: "${schemeName}" for a smallholder farmer in Tamil Nadu growing Paddy.
    
    Provide a concise response (max 3 sentences) covering:
    1. Primary eligibility criteria.
    2. Key documents needed.
    3. A clear "Likely Eligible" or "Requires Verification" status.
    
    Respond strictly in ${lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Unable to determine eligibility at this time.";
  } catch (error) {
    console.error("Eligibility AI Error:", error);
    return "Error connecting to eligibility service. Please check manual guidelines.";
  }
}

export async function getAgriAdvice(prompt: string, lang: string = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("DEBUG: GEMINI_API_KEY is missing from environment variables.");
    return "API Key Error: Please configure your GEMINI_API_KEY in the settings.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log(`DEBUG: Sending request to Gemini in ${lang}...`);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(lang),
        temperature: 0.7,
      },
    });
    
    if (!response.text) {
      console.warn("DEBUG: Gemini returned an empty response.");
      return "I'm sorry, I couldn't generate a response. Please try rephrasing your question.";
    }

    return response.text;
  } catch (error: any) {
    console.error("DEBUG: Gemini API Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      return "Error: Your Gemini API Key is invalid. Please check your settings.";
    }
    return `Connection error: ${error.message || "Unknown error"}. Please try again later.`;
  }
}
