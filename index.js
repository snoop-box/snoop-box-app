const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MEMORIA
let events = {};
let photos = [];
let ranking = {};

// =========================
// ADMIN SIMPLE (SIN UPLOAD)
// =========================
app.post("/admin/event", (req, res) => {

  const { name, bg, frame, active } = req.body;

  events[name] = {
    bg,
    frame,
    active
  };

  console.log("Evento guardado:", name);

  res.json({ success: true });
});

// LISTAR EVENTOS
app.get("/admin/events", (req, res) => {
  res.json(events);
});

// ACTIVAR / DESACTIVAR
app.post("/admin/event/toggle", (req, res) => {
  const { name, active } = req.body;

  if (events[name]) {
    events[name].active = active;
  }

  res.json({ success: true });
});

// CONFIG EVENTO
app.get("/event/:name", (req, res) => {
  const event = events[req.params.name] || {};
  res.json(event);
});

// =========================
// SUBIR FOTO
// =========================
app.post("/upload", upload.single("photo"), async (req, res) => {

  const { name, table, event } = req.body;

  if (!events[event] || !events[event].active) {
    return res.json({ success: false, message: "Evento cerrado" });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `snoopbox/${event}/photos`
    });

    const photo = {
      url: result.secure_url,
      name,
      table,
      event
    };

    photos.push(photo);

    if (!ranking[event]) ranking[event] = {};
    if (!ranking[event][table]) ranking[event][table] = 0;

    ranking[event][table] += 5;

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// =========================
// FOTOS
// =========================
app.get("/photos/:event", (req, res) => {
  const data = photos.filter(p => p.event === req.params.event);
  res.json(data);
});

// BORRAR FOTO
app.delete("/photo", (req, res) => {
  const { url } = req.body;

  photos = photos.filter(p => p.url !== url);

  res.json({ success: true });
});

// =========================
// TRIVIA
// =========================
app.post("/trivia", (req, res) => {

  const { table, event, correct } = req.body;

  if (!ranking[event]) ranking[event] = {};
  if (!ranking[event][table]) ranking[event][table] = 0;

  if (correct) ranking[event][table] += 10;

  res.json({ success: true });
});

// =========================
// RANKING
// =========================
app.get("/ranking/:event", (req, res) => {

  const r = ranking[req.params.event] || {};

  const result = Object.keys(r).map(table => ({
    table,
    points: r[table]
  }));

  result.sort((a, b) => b.points - a.points);

  res.json(result);
});

// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});