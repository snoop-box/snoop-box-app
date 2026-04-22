const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// CONFIG CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// =========================
// CONTROL DE EVENTOS
// =========================
const activeEvents = {
  "olivia2": true
};

// =========================
// BASE EN MEMORIA
// =========================
let photos = [];
let ranking = {};

// =========================
// SUBIR FOTO
// =========================
app.post("/upload", upload.single("photo"), async (req, res) => {

  const event = req.body.event;

  // 🔒 VALIDACIÓN EVENTO ACTIVO
  if (!activeEvents[event]) {
    return res.status(403).json({ error: "Evento cerrado" });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `snoopbox/${event}`
    });

    const photo = {
      url: result.secure_url,
      name: req.body.name,
      table: req.body.table,
      event: event
    };

    photos.push(photo);

    // SUMA PUNTOS POR FOTO
    if (!ranking[event]) ranking[event] = {};
    if (!ranking[event][req.body.table]) ranking[event][req.body.table] = 0;

    ranking[event][req.body.table] += 5;

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Error al subir" });
  }
});

// =========================
// OBTENER FOTOS
// =========================
app.get("/photos/:event", (req, res) => {
  const event = req.params.event;
  const eventPhotos = photos.filter(p => p.event === event);
  res.json(eventPhotos);
});

// =========================
// TRIVIA
// =========================
app.post("/trivia", (req, res) => {
  const { table, event, correct } = req.body;

  if (!ranking[event]) ranking[event] = {};
  if (!ranking[event][table]) ranking[event][table] = 0;

  if (correct) {
    ranking[event][table] += 10;
  }

  res.json({ success: true });
});

// =========================
// RANKING
// =========================
app.get("/ranking/:event", (req, res) => {
  const event = req.params.event;

  if (!ranking[event]) return res.json([]);

  const result = Object.keys(ranking[event]).map(table => ({
    table,
    points: ranking[event][table]
  }));

  result.sort((a,b) => b.points - a.points);

  res.json(result);
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor funcionando en puerto " + PORT);
});