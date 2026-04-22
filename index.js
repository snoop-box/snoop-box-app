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

// 🔒 CONTROL EVENTO (SEGURO)
function isEventActive(event) {
  if (event === "olivia2") return true;
  return true; // fallback para no romper nada
}

// BASE
let photos = [];
let ranking = {};

// UPLOAD
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const event = req.body.event || "default";

    // VALIDACIÓN SUAVE (NO ROMPE)
    if (!isEventActive(event)) {
      return res.json({ success: false, message: "Evento cerrado" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `snoopbox/${event}`
    });

    const photo = {
      url: result.secure_url,
      name: req.body.name,
      table: req.body.table,
      event
    };

    photos.push(photo);

    // ranking
    if (!ranking[event]) ranking[event] = {};
    if (!ranking[event][req.body.table]) ranking[event][req.body.table] = 0;

    ranking[event][req.body.table] += 5;

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// GET PHOTOS
app.get("/photos/:event", (req, res) => {
  const event = req.params.event;
  const data = photos.filter(p => p.event === event);
  res.json(data);
});

// TRIVIA
app.post("/trivia", (req, res) => {
  const { table, event, correct } = req.body;

  if (!ranking[event]) ranking[event] = {};
  if (!ranking[event][table]) ranking[event][table] = 0;

  if (correct) ranking[event][table] += 10;

  res.json({ success: true });
});

// RANKING
app.get("/ranking/:event", (req, res) => {
  const event = req.params.event;

  if (!ranking[event]) return res.json([]);

  const result = Object.keys(ranking[event]).map(t => ({
    table: t,
    points: ranking[event][t]
  }));

  result.sort((a,b)=>b.points-a.points);

  res.json(result);
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server ON " + PORT));