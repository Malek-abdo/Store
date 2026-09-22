import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "private_DEGStSRYX8Z26HTwj1yW9eLkbfA=";

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ImageKit Upload endpoint (proxy to keep private key server-side)
  app.post("/api/upload", async (req, res) => {
    try {
      const { file, fileName, folder } = req.body;
      if (!file) {
        return res.status(400).json({ error: "Missing file payload" });
      }

      const authHeader = "Basic " + Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString("base64");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName || `product_${Date.now()}.png`);
      formData.append("folder", folder || "/products");
      formData.append("useUniqueFileName", "true");

      const ikResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      const data = await ikResponse.json();

      if (!ikResponse.ok) {
        console.error("ImageKit error response:", data);
        return res.status(ikResponse.status).json({
          error: data.message || "Failed to upload to ImageKit",
          details: data,
        });
      }

      return res.json({
        success: true,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        fileId: data.fileId,
        name: data.name,
      });
    } catch (err: any) {
      console.error("Upload route error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
