const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Carpeta uploads
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Archivo base de datos simple
const dbFile = path.join(__dirname, "db.json");

// Crear db si no existe
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify([]));
}

// Configuración multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadPath));

// SUBIR FOTO
app.post("/upload", upload.single("photo"), (req, res) => {
  const { name, table, event } = req.body;

  const newPhoto = {
    file: req.file.filename,
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

// OBTENER GALERIA POR EVENTO
app.get("/photos/:event", (req, res) => {
  const event = req.params.event;

  const db = JSON.parse(fs.readFileSync(dbFile));

  const filtered = db.filter(p => p.event === event);

  res.json(filtered);
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});