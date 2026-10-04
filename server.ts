import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

// In-memory user database (replace with real DB in production)
interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: "Admin" | "Staff" | "Marketing Manager" | "Accountant";
  createdAt: string;
}

const users: Map<string, User> = new Map();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Seed accounts
const seedAccounts = [
  { email: "admin@123.com", password: "Nextrip@123", displayName: "Admin", role: "Admin" },
  { email: "m@123.com", password: "Mar@123", displayName: "Marketing", role: "Marketing Manager" },
  { email: "account@123.com", password: "Account@123", displayName: "Accountant", role: "Accountant" },
];

// Initialize seed accounts
async function initSeedAccounts() {
  for (const account of seedAccounts) {
    if (!users.has(account.email)) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      users.set(account.email, {
        id: account.email.split("@")[0],
        email: account.email,
        password: hashedPassword,
        displayName: account.displayName,
        role: account.role as any,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  await initSeedAccounts();

  // Enable generous limits for base64 photo payloads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Auth middleware
  const verifyToken = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      if (users.has(email)) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user: User = {
        id: email.split("@")[0],
        email,
        password: hashedPassword,
        displayName: displayName || email.split("@")[0],
        role: "Staff",
        createdAt: new Date().toISOString(),
      };

      users.set(email, user);

      const token = jwt.sign(
        { uid: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: { uid: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = users.get(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { uid: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: { uid: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/auth/me", verifyToken, (req: any, res) => {
    try {
      const user = users.get(req.user.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        uid: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API endpoint for Gemini-powered passport photo editing
  app.post("/api/gemini/edit-photo", verifyToken, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error:
            "GEMINI_API_KEY is not configured in the system secrets/environment. Please configure it in your Settings > Secrets panel.",
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
          },
        },
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
              text:
                prompt ||
                "Convert to a premium passport photo style. Adjust background to solid clean white. Change clothing to a modern sharp black suit and white shirt. Align face and shoulders forward elegantly with centered portrait framing, keeping the user's face 100% identical and authentic.",
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
          explanation: responseText,
        });
      } else {
        return res.json({
          success: false,
          text: responseText,
          error:
            "Gemini did not return an updated image part. Response prompt was: " +
            responseText,
        });
      }
    } catch (error: any) {
      console.error("Gemini Edit Error:", error);
      return res.status(500).json({
        error:
          error.message ||
          "An exception occurred inside the server-side Gemini execution context.",
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

