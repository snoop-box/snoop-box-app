const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔥 ESTADO DEL EVENTO
let eventActive = true;

// 🔥 GENERADOR DE TOKEN
function generateToken(){
  return Math.random().toString(36).substring(2,10);
}

// 🔥 INVITADOS
let guests = [
  { id:1, name:"Juan", table:1, checked:false, token:generateToken() },
  { id:2, name:"Ana", table:2, checked:false, token:generateToken() },
  { id:3, name:"Pedro", table:3, checked:false, token:generateToken() }
];

// 📋 LISTA
app.get("/guests", (req,res)=>{
  if(!eventActive) return res.json([]);
  res.json(guests);
});

// 🔍 LOGIN QR
app.get("/guest/:token", (req,res)=>{
  if(!eventActive) return res.json({ success:false, blocked:true });

  const guest = guests.find(g=>g.token === req.params.token);

  if(!guest){
    return res.json({ success:false });
  }

  res.json({ success:true, guest });
});

// ✔ CHECK-IN
app.post("/checkin/:token", (req,res)=>{
  if(!eventActive) return res.json({ success:false, blocked:true });

  const guest = guests.find(g=>g.token === req.params.token);

  if(!guest){
    return res.json({ success:false });
  }

  guest.checked = true;
  guest.checkTime = Date.now();

  res.json({ success:true, guest });
});

// 🔒 ESTADO DEL EVENTO
app.get("/event-status", (req,res)=>{
  res.json({ active:eventActive });
});

// 🔧 ACTIVAR / DESACTIVAR
app.post("/event-toggle", (req,res)=>{
  eventActive = req.body.active;
  res.json({ active:eventActive });
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
  console.log("Servidor corriendo en puerto " + PORT);
});