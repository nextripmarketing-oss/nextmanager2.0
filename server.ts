import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable generous limits for base64 photo payloads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API endpoint for Gemini-powered passport photo editing
  app.post("/api/gemini/edit-photo", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "GEMINI_API_KEY is not configured in the system secrets/environment. Please configure it in your Settings > Secrets panel." 
        });
      }

      const { image, prompt, modelName } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image payload supplied." });
      }

      // Extract raw base64 data and mimeType
      let base64Data = image;
      let mimeType = "image/png";
      if (image.startsWith("data:")) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      // Initialize the official GoogleGenAI client on the server
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Default model is gemini-2.5-flash-image
      const model = modelName || "gemini-2.5-flash-image";

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt || "Convert to a premium passport photo style. Adjust background to solid clean white. Change clothing to a modern sharp black suit and white shirt. Align face and shoulders forward elegantly with centered portrait framing, keeping the user's face 100% identical and authentic.",
            },
          ],
        },
      });

      let generatedImageBase64 = null;
      let responseText = "";

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageBase64 = part.inlineData.data;
          } else if (part.text) {
            responseText += part.text;
          }
        }
      }

      if (generatedImageBase64) {
        return res.json({
          success: true,
          image: `data:image/png;base64,${generatedImageBase64}`,
          explanation: responseText
        });
      } else {
        return res.json({
          success: false,
          text: responseText,
          error: "Gemini did not return an updated image part. Response prompt was: " + responseText
        });
      }
    } catch (error: any) {
      console.error("Gemini Edit Error:", error);
      return res.status(500).json({ 
        error: error.message || "An exception occurred inside the server-side Gemini execution context." 
      });
    }
  });

  // Vite development vs production serving logic
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
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

startServer();
