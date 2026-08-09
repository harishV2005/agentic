import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import our backend functions from src/services/gemini-backend
import {
  analyzeCropImage,
  checkSchemeEligibility,
  getWeatherAdvice,
  findNearbyAgriOffices,
  getAgriAdvice,
  getCropCalendar,
  getCropRotationSuggestions,
  getMarketPrices,
  reverseGeocode,
  getPredictiveYieldEstimate
} from "./src/services/gemini-backend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 crop images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoints
  app.post("/api/gemini/analyzeCropImage", async (req, res) => {
    try {
      const { base64Image, lang, location } = req.body;
      const result = await analyzeCropImage(base64Image, lang, location);
      res.json(result);
    } catch (err: any) {
      console.error("API Error analyzeCropImage:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/checkSchemeEligibility", async (req, res) => {
    try {
      const { schemeName, lang, location, crop } = req.body;
      const result = await checkSchemeEligibility(schemeName, lang, location, crop);
      res.json(result);
    } catch (err: any) {
      console.error("API Error checkSchemeEligibility:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/getWeatherAdvice", async (req, res) => {
    try {
      const { location, lang, crop, weatherData } = req.body;
      const result = await getWeatherAdvice(location, lang, crop, weatherData);
      res.json(result);
    } catch (err: any) {
      console.error("API Error getWeatherAdvice:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/findNearbyAgriOffices", async (req, res) => {
    try {
      const { location, lang } = req.body;
      const result = await findNearbyAgriOffices(location, lang);
      res.json(result);
    } catch (err: any) {
      console.error("API Error findNearbyAgriOffices:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/getAgriAdvice", async (req, res) => {
    try {
      const { prompt, lang, location, crop, farmSize, soilType } = req.body;
      const result = await getAgriAdvice(prompt, lang, location, crop, farmSize, soilType);
      res.json(result);
    } catch (err: any) {
      console.error("API Error getAgriAdvice:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/getCropCalendar", async (req, res) => {
    try {
      const { crop, location, lang } = req.body;
      const result = await getCropCalendar(crop, location, lang);
      res.json(result);
    } catch (err: any) {
      console.error("API Error getCropCalendar:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/getCropRotationSuggestions", async (req, res) => {
    try {
      const { currentCrop, location, soilType, lang } = req.body;
      const result = await getCropRotationSuggestions(currentCrop, location, soilType, lang);
      res.json(result);
    } catch (err: any) {
      console.error("API Error getCropRotationSuggestions:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/getMarketPrices", async (req, res) => {
    try {
      const { location, crops, lang } = req.body;
      const result = await getMarketPrices(location, crops, lang);
      res.json(result);
    } catch (err: any) {
      console.error("API Error getMarketPrices:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/reverseGeocode", async (req, res) => {
    try {
      const { lat, lon } = req.body;
      const result = await reverseGeocode(lat, lon);
      res.json(result);
    } catch (err: any) {
      console.error("API Error reverseGeocode:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/getPredictiveYieldEstimate", async (req, res) => {
    try {
      const { cropHistory, currentCrop, farmSize, farmUnit, soilType, location, weatherData, lang } = req.body;
      const result = await getPredictiveYieldEstimate(cropHistory, currentCrop, farmSize, farmUnit, soilType, location, weatherData, lang);
      res.json(result);
    } catch (err: any) {
      console.error("API Error getPredictiveYieldEstimate:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GEMINI_API_KEY is ${process.env.GEMINI_API_KEY ? "defined (active)" : "NOT defined (inactive!)"}`);
  });
}

startServer();
