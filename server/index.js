const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 📁 Carpeta uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 📦 Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + ".jpg")
});
const upload = multer({ storage });

// 📊 Ranking simple en memoria
let ranking = {};

// 📤 Subir foto
app.post("/upload", upload.single("photo"), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// 📈 Sumar puntos
app.post("/score", (req, res) => {
  const { mesa } = req.body;
  if (!ranking[mesa]) ranking[mesa] = 0;
  ranking[mesa]++;
  res.json({ mesa, puntos: ranking[mesa] });
});

// 📋 Obtener ranking
app.get("/ranking", (req, res) => {
  res.json(ranking);
});

// 📂 Servir imágenes
app.use("/uploads", express.static(uploadDir));

// 🌐 SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "../client")));

// 🏠 Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});