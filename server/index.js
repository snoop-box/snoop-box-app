const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 RUTA TEST (CLAVE)
app.get("/", (req, res) => {
  res.send("SNOOP BOX ONLINE 🚀");
});

// 🔥 PUERTO PARA RAILWAY
const PORT = process.env.PORT || 3000;

// 🔥 IMPORTANTE: 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});