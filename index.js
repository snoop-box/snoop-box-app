const express = require("express");
const path = require("path");

const app = express();

// Puerto Railway
const PORT = process.env.PORT || 8080;

// Carpeta pública (frontend)
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Levantar servidor
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});