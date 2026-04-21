const express = require("express");
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// 🔥 CONFIG CLOUDINARY DESDE VARIABLES
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔥 STORAGE CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "snoopbox/" + (req.body.event || "default"),
    format: "jpg",
    public_id: Date.now()
  })
});

const upload = multer({ storage });

// DB SIMPLE (temporal por ahora)
const dbFile = path.join(__dirname, "db.json");
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify([]));
}

// FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// SUBIR FOTO
app.post("/upload", upload.single("photo"), (req, res) => {
  const { name, table, event } = req.body;

  const newPhoto = {
    url: req.file.path, // URL cloudinary
    name,
    table,
    event,
    date: Date.now()
  };

  const db = JSON.parse(fs.readFileSync(dbFile));
  db.push(newPhoto);
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

  res.json({ success: true });
});

// GALERIA
app.get("/photos/:event", (req, res) => {
  const event = req.params.event;

  const db = JSON.parse(fs.readFileSync(dbFile));
  const filtered = db.filter(p => p.event === event);

  res.json(filtered);
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});