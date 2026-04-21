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
  cloudinary,
  params: async (req) => {
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
  fs.writeFileSync(dbFile, JSON.stringify({
    photos: [],
    scores: [],
    triviaUsers: []
  }));
}

// FRONT
app.use(express.static(path.join(__dirname, "public")));

// SUMAR PUNTOS
function addScore(db, table, event, points) {
  let s = db.scores.find(x => x.table == table && x.event == event);
  if (!s) {
    s = { table, event, points: 0 };
    db.scores.push(s);
  }
  s.points += points;
}

// FOTO (+10)
app.post("/upload", upload.single("photo"), (req, res) => {
  const { name, table, event } = req.body;
  const db = JSON.parse(fs.readFileSync(dbFile));

  db.photos.push({
    url: req.file.path,
    name,
    table,
    event
  });

  addScore(db, table, event, 10);

  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  res.json({ ok: true });
});

// TRIVIA (+5 SOLO UNA VEZ)
app.post("/trivia", (req, res) => {
  const { name, table, event, correct } = req.body;
  const db = JSON.parse(fs.readFileSync(dbFile));

  const userKey = name + "-" + table + "-" + event;

  const already = db.triviaUsers.includes(userKey);

  if (correct && !already) {
    addScore(db, table, event, 5);
    db.triviaUsers.push(userKey);
  }

  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  res.json({ ok: true });
});

// GALERIA
app.get("/photos/:event", (req, res) => {
  const db = JSON.parse(fs.readFileSync(dbFile));
  res.json(db.photos.filter(p => p.event === req.params.event));
});

// RANKING
app.get("/ranking/:event", (req, res) => {
  const db = JSON.parse(fs.readFileSync(dbFile));
  const r = db.scores
    .filter(x => x.event === req.params.event)
    .sort((a, b) => b.points - a.points);

  res.json(r);
});

app.listen(PORT, () => console.log("OK"));