const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔥 ESTADO EVENTO
let eventActive = true;

// 🔥 EVENTO ACTUAL
let currentEvent = {
  name: "",
  active: true,
  background: "",
  frame: ""
};

// 🔥 TOKEN
function generateToken(){
  return Math.random().toString(36).substring(2,10);
}

// 🔥 INVITADOS
let guests = [
  { id:1, name:"Juan", table:1, checked:false, token:generateToken() },
  { id:2, name:"Ana", table:2, checked:false, token:generateToken() },
  { id:3, name:"Pedro", table:3, checked:false, token:generateToken() }
];

// 📋 INVITADOS
app.get("/guests", (req,res)=>{
  if(!eventActive) return res.json([]);
  res.json(guests);
});

// 🔍 LOGIN QR
app.get("/guest/:token", (req,res)=>{
  if(!eventActive) return res.json({ success:false });

  const guest = guests.find(g=>g.token === req.params.token);
  if(!guest) return res.json({ success:false });

  res.json({ success:true, guest });
});

// ✔ CHECKIN
app.post("/checkin/:token", (req,res)=>{
  if(!eventActive) return res.json({ success:false });

  const guest = guests.find(g=>g.token === req.params.token);
  if(!guest) return res.json({ success:false });

  guest.checked = true;
  res.json({ success:true });
});

// 🔥 CREAR EVENTO
app.post("/create-event", (req,res)=>{
  const { name, active, background, frame } = req.body;

  currentEvent = { name, active, background, frame };
  eventActive = active;

  console.log("Evento creado:", currentEvent);

  res.json({ success:true });
});

// 🔥 OBTENER EVENTO (ESTE ES EL FIX CLAVE)
app.get("/event", (req,res)=>{
  res.json(currentEvent);
});

// 🔒 ESTADO EVENTO
app.get("/event-status", (req,res)=>{
  res.json({ active:eventActive });
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
  console.log("Servidor corriendo en puerto " + PORT);
});