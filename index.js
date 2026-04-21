const express = require("express");
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// STORAGE
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const event = req.body?.event || "default";
    return {
      folder: "snoopbox/" + event,
      format: "jpg",
      public_id: Date.now()
    };
  }
});

const upload = multer({ storage });

// DB
const dbFile = path.join(__dirname, "db.json");
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ photos: [], scores: [] }));
}

// FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// SUBIR FOTO (+10 puntos)
app.post("/upload", upload.single("photo"), (req, res) => {
  const { name, table, event } = req.body;

  const db = JSON.parse(fs.readFileSync(dbFile));

  const newPhoto = {
    url: req.file.path,
    name,
    table,
    event,
    date: Date.now()
  };

  db.photos.push(newPhoto);

  // SUMAR PUNTOS
  addScore(db, table, event, 10);

  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

  res.json({ success: true });
});

// SUMAR PUNTOS TRIVIA
app.post("/trivia", (req, res) => {
  const { table, event, correct } = req.body;

  const db = JSON.parse(fs.readFileSync(dbFile));

  if (correct) {
    addScore(db, table, event, 5);
  }

  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

  res.json({ success: true });
});

// FUNCION SUMAR
function addScore(db, table, event, points) {
  let score = db.scores.find(s => s.table == table && s.event == event);

  if (!score) {
    score = { table, event, points: 0 };
    db.scores.push(score);
  }

  score.points += points;
}

// GALERIA
app.get("/photos/:event", (req, res) => {
  const db = JSON.parse(fs.readFileSync(dbFile));
  const event = req.params.event;

  res.json(db.photos.filter(p => p.event === event));
});

// RANKING
app.get("/ranking/:event", (req, res) => {
  const db = JSON.parse(fs.readFileSync(dbFile));
  const event = req.params.event;

  const ranking = db.scores
    .filter(s => s.event === event)
    .sort((a, b) => b.points - a.points);

  res.json(ranking);
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});