#!/usr/bin/env node
/**
 * Local Image Saver Server
 *
 * Runs a local server that receives generated images from the WebSyncer
 * branding generator and saves them directly to your orthoscan-web project.
 *
 * Usage:
 *   node save-server.js
 *
 * Then in the web app, images will auto-save to:
 *   /Users/peterblazsik/DevApps/O_S_v2/orthoscan-web/public/images/
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Target directory for images
const TARGET_DIR =
  "/Users/peterblazsik/DevApps/O_S_v2/orthoscan-web/public/images";

// orthoscan-web project directory (for manifest generation)
const ORTHOSCAN_WEB_DIR = "/Users/peterblazsik/DevApps/O_S_v2/orthoscan-web";

const PORT = 3456;

// Allowed origins for CORS (localhost dev server + deployed sites)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://websyncer.pages.dev",
];

// System paths that should never be written to (including their children)
const BLOCKED_PATH_PREFIXES = [
  "/System", "/Library", "/usr", "/bin", "/sbin",
  "/var", "/private", "/etc",
];

// Custom target dirs must live under this user prefix
const ALLOWED_USER_PREFIX = "/Users/peterblazsik/";

/**
 * Validate that a path stays within a base directory (prevent path traversal)
 */
function isPathSafe(outputPath, baseDir = TARGET_DIR) {
  const resolvedTarget = path.resolve(baseDir);
  const resolvedFull = path.resolve(baseDir, outputPath);
  return (
    resolvedFull.startsWith(resolvedTarget + path.sep) ||
    resolvedFull === resolvedTarget
  );
}

/**
 * Validate that a custom target directory is safe to use.
 * Must be an absolute path under the user's home directory,
 * and not a system directory.
 */
function isTargetDirSafe(targetDir) {
  if (!path.isAbsolute(targetDir)) return false;
  const normalized = path.normalize(targetDir);

  // Must not be root-level
  if (normalized === "/" || normalized === "/Users") return false;

  // Must live under the allowed user prefix
  if (!normalized.startsWith(ALLOWED_USER_PREFIX)) return false;

  // Block system directories and their children
  for (const blocked of BLOCKED_PATH_PREFIXES) {
    if (normalized === blocked || normalized.startsWith(blocked + path.sep)) {
      return false;
    }
  }

  return true;
}

// Ensure directories exist
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

// Save base64 image to file
function saveImage(outputPath, base64Data, baseDir = TARGET_DIR) {
  // Validate path to prevent directory traversal
  if (!isPathSafe(outputPath, baseDir)) {
    throw new Error("Invalid path: path traversal not allowed");
  }

  const fullPath = path.join(baseDir, outputPath);
  ensureDir(fullPath);

  // Remove data URL prefix if present
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Clean, "base64");

  fs.writeFileSync(fullPath, buffer);
  console.log(`✅ Saved: ${fullPath}`);
  return fullPath;
}

const server = http.createServer((req, res) => {
  // CORS headers - restrict to allowed origins
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/save") {
    let body = "";
    const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB

    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > MAX_BODY_SIZE) {
        res.writeHead(413);
        res.end(JSON.stringify({ error: "Request body too large (max 50MB)" }));
        req.destroy();
        return;
      }
    });

    req.on("end", () => {
      try {
        const { outputPath, imageData, targetDir } = JSON.parse(body);

        if (!outputPath || !imageData) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing outputPath or imageData" }));
          return;
        }

        // Determine the base directory
        let baseDir = TARGET_DIR;
        if (targetDir) {
          if (!isTargetDirSafe(targetDir)) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error:
                  "Invalid target directory. Must be an absolute path and not a system directory.",
              }),
            );
            return;
          }
          baseDir = targetDir;
        }

        const savedPath = saveImage(outputPath, imageData, baseDir);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, path: savedPath }));
      } catch (error) {
        console.error("❌ Error:", error.message);
        res.writeHead(500);
        // Return generic error to client, log details server-side
        res.end(JSON.stringify({ error: "Failed to save image" }));
      }
    });
  } else if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: "running",
        targetDir: TARGET_DIR,
        exists: fs.existsSync(TARGET_DIR),
        supportsCustomTargetDir: true,
      }),
    );
  } else if (req.method === "POST" && req.url === "/update-manifest") {
    // Run the generate-image-manifest script in orthoscan-web
    const scriptPath = path.join(
      ORTHOSCAN_WEB_DIR,
      "scripts",
      "generate-image-manifest.js",
    );

    if (!fs.existsSync(scriptPath)) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Manifest script not found" }));
      return;
    }

    console.log("📋 Updating image manifest...");
    exec(
      `node "${scriptPath}"`,
      { cwd: ORTHOSCAN_WEB_DIR },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Manifest update failed:", error.message);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Failed to update manifest" }));
          return;
        }

        console.log("✅ Manifest updated successfully");
        console.log(stdout);
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: "Image manifest updated",
            output: stdout,
          }),
        );
      },
    );
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("🖼️  WebSyncer Local Image Saver");
  console.log("================================");
  console.log(`📂 Target: ${TARGET_DIR}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log("");
  console.log("Waiting for images from WebSyncer...");
  console.log("Press Ctrl+C to stop.");
  console.log("");
});
