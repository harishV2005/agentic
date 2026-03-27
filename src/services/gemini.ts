import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = (lang: string, location: string = 'Tamil Nadu', crop: string = 'Paddy', farmSize: string = '', soilType: string = '') => {
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
- Location: ${location}
- Primary Crop: ${crop}
- Farm Size: ${farmSize || 'Not specified'}
- Soil Type: ${soilType || 'Not specified'}
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

export async function checkSchemeEligibility(schemeName: string, lang: string = 'en', location: string = 'Tamil Nadu', crop: string = 'Paddy') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "AI Eligibility check is currently unavailable. Please try again later.";

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Act as an Indian Government Agriculture Expert. 
    Check eligibility for the scheme: "${schemeName}" for a smallholder farmer in ${location} growing ${crop}.
    
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
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Unable to determine eligibility at this time.";
  } catch (error) {
    console.error("Eligibility AI Error:", error);
    return "Error connecting to eligibility service. Please check manual guidelines.";
  }
}

export async function getWeatherAdvice(location: string, lang: string = 'en', crop: string = 'Paddy', weatherData?: { temp: number, humidity: number, condition: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Weather advice is currently unavailable.";

  const ai = new GoogleGenAI({ apiKey });
  
  let weatherContext = `typical seasonal weather in ${location}`;
  if (weatherData) {
    weatherContext = `current weather: ${weatherData.temp}°C, ${weatherData.humidity}% humidity, ${weatherData.condition}`;
  }

  const prompt = `
    Act as an Agricultural Weather Expert. 
    Provide weather-based farming advice for a farmer in ${location} growing ${crop}.
    
    Context: ${weatherContext}.
    
    Provide a concise response (max 4 sentences) covering:
    1. Current seasonal weather risks in ${location}.
    2. Irrigation or pesticide application advice based on ${weatherData ? 'current' : 'typical'} weather.
    3. One specific action for the next 48 hours.
    
    Respond strictly in ${lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Unable to fetch weather advice.";
  } catch (error) {
    console.error("Weather Advice Error:", error);
    return "Error fetching weather advice.";
  }
}

export async function findNearbyAgriOffices(location: string, lang: string = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Location services are currently unavailable.";

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Find 3 nearby government agricultural offices or Krishi Vigyan Kendras (KVK) near ${location}.
    Provide their names and a very brief description of what they do.
    
    Respond strictly in ${lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    return response.text || "Unable to find nearby offices.";
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return "Error finding nearby agricultural offices.";
  }
}

export async function getAgriAdvice(prompt: string, lang: string = 'en', location: string = 'Tamil Nadu', crop: string = 'Paddy', farmSize: string = '', soilType: string = '') {
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
        systemInstruction: getSystemInstruction(lang, location, crop, farmSize, soilType),
        tools: [{ googleSearch: {} }],
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
