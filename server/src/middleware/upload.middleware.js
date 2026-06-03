const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ── Folder map: route key → subdirectory ─────────────────────────────────────
//   Usage: pass  dest: "profiles" | "products" | "general"  to getUploader()
const DEST_MAP = {
  profiles: "uploads/profiles",
  products: "uploads/products",
  general:  "uploads/general",
};

/**
 * buildStorage(subDir) — returns a diskStorage engine that:
 *   - Ensures the target sub-directory exists (mkdirSync)
 *   - Renames files: <fieldname>-<timestamp>-<random>.<ext>
 */
function buildStorage(subDir) {
  const dest = path.join(__dirname, "../../", subDir);

  // Create directory tree if it doesn't exist
  fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, dest);
    },

    filename(_req, file, cb) {
      const ext      = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-z0-9]/gi, "_")   // sanitise original name
        .toLowerCase()
        .slice(0, 40);
      const unique   = `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, unique);
    },
  });
}

// ── File filter — reject non-image types ─────────────────────────────────────
function fileFilter(_req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error("Only JPEG, PNG, and WebP images are allowed"), { status: 400 }),
      false
    );
  }
}

// ── Factory: getUploader(type, options) ──────────────────────────────────────
/**
 * @param {"profiles"|"products"|"general"} type  — which sub-folder to target
 * @param {object}  opts
 * @param {number}  [opts.maxSizeMB=5]             — max file size in MB
 * @param {string}  [opts.fieldName="image"]       — the form-data field name
 * @returns multer middleware (single upload)
 *
 * Usage in a route:
 *   const { getUploader } = require("../middleware/upload.middleware");
 *   router.post("/avatar", getUploader("profiles").single("avatar"), controller);
 */
function getUploader(type = "general", { maxSizeMB = 5, fieldName = "image" } = {}) {
  const subDir = DEST_MAP[type] ?? DEST_MAP.general;

  return multer({
    storage:  buildStorage(subDir),
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
}

/**
 * uploadErrorHandler — attach after multer in a route chain to return
 * a clean JSON error instead of the default Express crash page.
 *
 * Usage:
 *   router.post("/avatar",
 *     getUploader("profiles").single("avatar"),
 *     uploadErrorHandler,
 *     controller
 *   );
 */
function uploadErrorHandler(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err && err.status === 400) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
}

/**
 * getFileUrl(req, file) — build the public URL for multer's req.file object.
 * Works locally and can be swapped for a CDN URL in production.
 *
 * Usage in a controller:
 *   const { getFileUrl } = require("../middleware/upload.middleware");
 *   const imageUrl = getFileUrl(req, req.file);
 */
function getFileUrl(req, file) {
  if (!file) return null;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  // Convert Windows backslashes to forward slashes, strip leading src/../../
  const relativePath = file.path
    .replace(/\\/g, "/")
    .replace(/^.*?(uploads\/)/, "/$1");

  return `${baseUrl}${relativePath}`;
}

module.exports = { getUploader, uploadErrorHandler, getFileUrl };
