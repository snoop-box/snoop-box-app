const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit:"10mb" }));
app.use(express.urlencoded({ extended:true }));
app.use(express.static("public"));

console.log("🔥 SNOOP BOX BACKEND ONLINE");

/* ===============================
   VARIABLES GLOBALES
================================= */

let currentEvent = {
  name: "",
  active: true,
  background: "",
  frame: ""
};

let guests = [];

let photos = [];

function generateToken(){
  return Math.random().toString(36).substring(2,10);
}

/* ===============================
   EVENTO
================================= */

// Crear evento
app.post("/create-event",(req,res)=>{

  const { name, active, background, frame } = req.body;

  currentEvent = {
    name: name || "",
    active: active === true,
    background: background || "",
    frame: frame || ""
  };

  // invitados demo
  guests = [
    { id:1, name:"Juan", table:1, checked:false, token:generateToken() },
    { id:2, name:"Ana", table:2, checked:false, token:generateToken() },
    { id:3, name:"Pedro", table:3, checked:false, token:generateToken() }
  ];

  res.json({
    success:true,
    event:currentEvent
  });

});

// Ver evento
app.get("/event",(req,res)=>{
  res.json(currentEvent);
});

// Estado
app.get("/event-status",(req,res)=>{
  res.json({
    active: currentEvent.active
  });
});

/* ===============================
   INVITADOS
================================= */

app.get("/guests",(req,res)=>{
  if(!currentEvent.active) return res.json([]);
  res.json(guests);
});

app.post("/checkin/:token",(req,res)=>{

  const guest = guests.find(g => g.token === req.params.token);

  if(!guest){
    return res.json({ success:false });
  }

  guest.checked = true;

  res.json({ success:true });

});

app.get("/guest/:token",(req,res)=>{

  const guest = guests.find(g => g.token === req.params.token);

  if(!guest){
    return res.json({ success:false });
  }

  res.json({
    success:true,
    guest
  });

});

/* ===============================
   FOTOS
================================= */

app.get("/photos",(req,res)=>{
  res.json(photos);
});

app.post("/upload-photo",(req,res)=>{

  const { user, image } = req.body;

  photos.unshift({
    id: Date.now(),
    user: user || "Invitado",
    image: image || "",
    likes:0
  });

  res.json({ success:true });

});

app.post("/delete-photo/:id",(req,res)=>{

  photos = photos.filter(p => p.id != req.params.id);

  res.json({ success:true });

});

/* ===============================
   HOME
================================= */

app.get("/",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

/* ===============================
   SERVER
================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
  console.log("🚀 Servidor puerto " + PORT);
});