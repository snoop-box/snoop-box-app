const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ====================
// STORAGE FOTOS
// ====================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const id = uuidv4();
    cb(null, id + ".jpg");
  }
});

const upload = multer({ storage });

// ====================
// BASE DE DATOS SIMPLE
// ====================
let database = {};
let ranking = {};

// ====================
// SUBIR FOTO
// ====================
app.post("/upload", upload.single("photo"), (req, res) => {
  const id = req.file.filename.split(".")[0];
  const mesa = req.body.mesa;

  database[id] = {
    mesa,
    file: req.file.filename
  };

  res.json({ id });
});

// ====================
// OBTENER FOTO (DATA)
// ====================
app.get("/photo/:id", (req, res) => {
  const data = database[req.params.id];

  if (!data) {
    return res.status(404).send("No existe");
  }

  res.json(data);
});

// ====================
// SUMAR PUNTOS
// ====================
app.post("/score", (req, res) => {
  const { mesa, puntos } = req.body;

  if (!ranking[mesa]) {
    ranking[mesa] = 0;
  }

  ranking[mesa] += puntos;

  console.log("Ranking actualizado:", ranking);

  res.json({ ok: true });
});

// ====================
// VER RANKING
// ====================
app.get("/ranking", (req, res) => {
  res.json(ranking);
});

// ====================
// INICIAR SERVIDOR
// ====================
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en puerto 3000");
});