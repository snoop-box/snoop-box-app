const express = require("express");

const app = express();

// Ruta test
app.get("/", (req, res) => {
  res.send("SNOOP BOX ONLINE 🚀");
});

// Railway usa este puerto
const PORT = process.env.PORT || 3000;

// MUY IMPORTANTE
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto", PORT);
});