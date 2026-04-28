const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit:"20mb" }));
app.use(express.urlencoded({ extended:true }));
app.use(express.static("public"));

console.log("🔥 SNOOP BOX");

/* ==================================
   BASE EN MEMORIA
================================== */

let events = [];
let photos = [];

/* ==================================
   HELPERS
================================== */

function newId(){
  return Date.now() + Math.floor(Math.random()*9999);
}

function normalize(txt=""){
  return txt.toString().trim().toLowerCase();
}

/* ==================================
   EVENTOS
================================== */

// crear evento
app.post("/create-event",(req,res)=>{

  try{

    const {
      name,
      logoVenue,
      background,
      frame
    } = req.body;

    if(!name || !name.trim()){
      return res.json({
        success:false,
        message:"Nombre requerido"
      });
    }

    const exists = events.find(ev =>
      normalize(ev.name) === normalize(name)
    );

    if(exists){
      return res.json({
        success:false,
        message:"Ese evento ya existe"
      });
    }

    const event = {
      id:newId(),
      name:name.trim(),
      logoVenue:logoVenue || "",
      background:background || "",
      frame:frame || "",
      active:true,
      createdAt:new Date().toISOString(),

      guests:[],
      arrived:0
    };

    events.push(event);

    res.json({
      success:true,
      event
    });

  }catch(err){

    res.json({
      success:false,
      message:"Error servidor"
    });

  }

});

// listar eventos
app.get("/events",(req,res)=>{
  res.json(events);
});

// buscar evento por nombre
app.get("/event/:name",(req,res)=>{

  const found = events.find(ev =>
    normalize(ev.name) ===
    normalize(req.params.name)
  );

  if(!found){
    return res.json({
      success:false
    });
  }

  res.json({
    success:true,
    event:found
  });

});

// activar / desactivar
app.post("/toggle-event/:id",(req,res)=>{

  const id = Number(req.params.id);

  const ev = events.find(e => e.id === id);

  if(!ev){
    return res.json({
      success:false
    });
  }

  ev.active = !ev.active;

  res.json({
    success:true,
    active:ev.active
  });

});

/* ==================================
   INVITADOS
================================== */

// cargar invitados
app.post("/upload-guests/:id",(req,res)=>{

  const id = Number(req.params.id);

  const ev = events.find(e => e.id === id);

  if(!ev){
    return res.json({
      success:false
    });
  }

  const guests = req.body.guests || [];

  ev.guests = guests.map((g,i)=>({
    id:i+1,
    name:g.name || "",
    table:g.table || "",
    phone:g.phone || "",
    arrived:false
  }));

  ev.arrived = 0;

  res.json({
    success:true,
    total:ev.guests.length
  });

});

// ver invitados
app.get("/guests/:id",(req,res)=>{

  const id = Number(req.params.id);

  const ev = events.find(e => e.id === id);

  if(!ev){
    return res.json([]);
  }

  res.json(ev.guests);

});

// marcar llegada
app.post("/arrive/:eventId/:guestId",(req,res)=>{

  const eventId = Number(req.params.eventId);
  const guestId = Number(req.params.guestId);

  const ev = events.find(e => e.id === eventId);

  if(!ev){
    return res.json({
      success:false
    });
  }

  const guest =
    ev.guests.find(g => g.id === guestId);

  if(!guest){
    return res.json({
      success:false
    });
  }

  if(!guest.arrived){
    guest.arrived = true;
    ev.arrived++;
  }

  res.json({
    success:true
  });

});

// panel control
app.get("/control/:id",(req,res)=>{

  const id = Number(req.params.id);

  const ev = events.find(e => e.id === id);

  if(!ev){
    return res.json({
      success:false
    });
  }

  const total = ev.guests.length;

  const percent =
    total
    ? Math.round((ev.arrived/total)*100)
    : 0;

  res.json({
    success:true,
    event:ev.name,
    total,
    arrived:ev.arrived,
    percent
  });

});

/* ==================================
   FOTOS
================================== */

app.post("/upload-photo",(req,res)=>{

  const {
    eventName,
    user,
    image
  } = req.body;

  if(!eventName || !image){
    return res.json({
      success:false
    });
  }

  photos.unshift({
    id:newId(),
    eventName:eventName,
    user:user || "Invitado",
    image:image,
    createdAt:Date.now()
  });

  res.json({
    success:true
  });

});

app.get("/photos/:eventName",(req,res)=>{

  const name =
    normalize(req.params.eventName);

  const result =
    photos.filter(p =>
      normalize(p.eventName) === name
    );

  res.json(result);

});

/* ==================================
   HOME
================================== */

app.get("/",(req,res)=>{

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});

/* ==================================
   SERVER
================================== */

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

  console.log("🚀 Puerto " + PORT);

});