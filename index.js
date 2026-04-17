const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("SNOOP BOX ONLINE 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto", PORT);
});