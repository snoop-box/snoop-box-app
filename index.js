const express = require("express");
const cors = require("cors");

const app = express();

console.log("🔥 VERSION NUEVA BACKEND 27");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   VARIABLES GLOBALES
========================= */

let eventActive = true;

let currentEvent = {
  name: "",
  active: true,
  background: "",
  frame: ""
};

function generateToken() {
  return Math.random().toString(36).substring(2, 10);
}

let guests = [
  { id: 1, name: "Juan", table: 1, checked: false, token: generateToken() },
  { id: 2, name: "Ana", table: 2, checked: false, token: generateToken() },
  { id: 3, name: "Pedro", table: 3, checked: false, token: generateToken() }
];

/* =========================
   EVENTO
========================= */

// TEST CREAR EVENTO DESDE URL
app.get("/test-event", (req,res)=>{

  currentEvent = {
    name: "TEST DIRECTO",
    active: true,
    background: "",
    frame: ""
  };

  eventActive = true;

  res.json({
    success:true,
    event: currentEvent
  });

});

// Ver evento actual
app.get("/event", (req, res) => {
  res.json(currentEvent);
});

// Estado evento
app.get("/event-status", (req, res) => {
  res.json({
    active: eventActive
  });
});

/* =========================
   INVITADOS
========================= */

// Lista invitados
app.get("/guests", (req, res) => {
  if (!eventActive) return res.json([]);
  res.json(guests);
});

// Login QR
app.get("/guest/:token", (req, res) => {
  if (!eventActive) {
    return res.json({ success: false });
  }

  const guest = guests.find(g => g.token === req.params.token);

  if (!guest) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
    guest
  });
});

// Check-in
app.post("/checkin/:token", (req, res) => {
  const guest = guests.find(g => g.token === req.params.token);

  if (!guest) {
    return res.json({ success: false });
  }

  guest.checked = true;

  res.json({
    success: true
  });
});

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});