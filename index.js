const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

// Carpeta uploads
const uploadPath = path.join(__dirname, "uploads");

// Crear carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
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

const upload = multer({ storage: storage });

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));

// Servir imágenes
app.use("/uploads", express.static(uploadPath));

// Subir imagen
app.post("/upload", upload.single("photo"), (req, res) => {
  res.json({ success: true, file: req.file.filename });
});

// Obtener galería
app.get("/photos", (req, res) => {
  fs.readdir(uploadPath, (err, files) => {
    if (err) return res.json([]);

    const urls = files.map(file => "/uploads/" + file);
    res.json(urls);
  });
});

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});