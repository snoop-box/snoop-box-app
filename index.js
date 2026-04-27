const express = require("express");
const cors = require("cors");

const app = express();

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

function generateToken(){
  return Math.random().toString(36).substring(2,10);
}

let guests = [
  { id:1, name:"Juan", table:1, checked:false, token:generateToken() },
  { id:2, name:"Ana", table:2, checked:false, token:generateToken() },
  { id:3, name:"Pedro", table:3, checked:false, token:generateToken() }
];

/* =========================
   EVENTO
========================= */

// Crear evento
app.post("/create-event", (req,res)=>{

  try{

    const { name, active, background, frame } = req.body;

    currentEvent = {
      name: name || "",
      active: active === true,
      background: background || "",
      frame: frame || ""
    };

    eventActive = currentEvent.active;

    console.log("Evento creado:", currentEvent);

    res.json({
      success:true,
      event: currentEvent
    });

  }catch(err){

    console.log(err);

    res.json({
      success:false
    });

  }

});

// Ver evento actual
app.get("/event", (req,res)=>{
  res.json(currentEvent);
});

// Estado evento
app.get("/event-status", (req,res)=>{
  res.json({
    active:eventActive
  });
});

/* =========================
   INVITADOS
========================= */

app.get("/guests",(req,res)=>{
  if(!eventActive) return res.json([]);
  res.json(guests);
});

app.get("/guest/:token",(req,res)=>{

  if(!eventActive){
    return res.json({ success:false });
  }

  const guest = guests.find(g => g.token === req.params.token);

  if(!guest){
    return res.json({ success:false });
  }

  res.json({
    success:true,
    guest
  });

});

app.post("/checkin/:token",(req,res)=>{

  const guest = guests.find(g => g.token === req.params.token);

  if(!guest){
    return res.json({ success:false });
  }

  guest.checked = true;

  res.json({
    success:true
  });

});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
  console.log("Servidor corriendo puerto " + PORT);
});