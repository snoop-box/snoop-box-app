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

// 📊 Ranking en memoria
let ranking = {};

// 📤 Subir foto
app.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// 📈 Sumar puntos
app.post("/score", (req, res) => {
  const { mesa } = req.body;
  if (!mesa) return res.status(400).json({ error: "Mesa requerida" });

  if (!ranking[mesa]) ranking[mesa] = 0;
  ranking[mesa]++;
  res.json({ mesa, puntos: ranking[mesa] });
});

// 📋 Ranking
app.get("/ranking", (req, res) => {
  res.json(ranking);
});

// 📂 Servir uploads
app.use("/uploads", express.static(uploadDir));

// 🌐 SERVIR FRONTEND (RUTA SEGURA)
const clientPath = path.resolve(__dirname, "../client");

app.use(express.static(clientPath));

// 🏠 Ruta raíz SIEMPRE responde
app.get("/", (req, res) => {
  res.send("SNOOP BOX SERVER FUNCIONANDO 🚀");
});

// 🔄 fallback (muy importante en producción)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});