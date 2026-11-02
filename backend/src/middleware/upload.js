const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /\.(jpeg|jpg|png|webp|pdf)$/.test(file.originalname.toLowerCase());
  ok ? cb(null, true) : cb(new Error("Only JPG, PNG, WEBP or PDF files are allowed"));
};

// 5 MB per file
module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Profile photos: images only, 2 MB
module.exports.image = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpeg|jpg|png|webp)$/.test(file.originalname.toLowerCase()) && /^image\//.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only JPG, PNG or WEBP images are allowed for profile photos"));
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});
