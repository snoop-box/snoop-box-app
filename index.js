const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit:"50mb" }));
app.use(express.urlencoded({ extended:true, limit:"50mb" }));
app.use(express.static("public"));

console.log("🔥 SNOOP BOX PRO V2");

/* ===============================
   BASE EN MEMORIA
=============================== */

let events = [];
let photos = [];

/* ===============================
   HELPERS
=============================== */

function newId(){
  return Date.now() + Math.floor(Math.random()*9999);
}

function normalize(txt=""){
  return txt.toString().trim().toLowerCase();
}

function cleanFolder(txt=""){
  return txt
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g,"_")
    .replace(/[^a-z0-9_]/g,"");
}

/* ===============================
   EVENTOS
=============================== */

app.post("/create-event",(req,res)=>{
  try{

    const { name, logoVenue, background, frame } = req.body;

    if(!name || !name.trim()){
      return res.json({ success:false, message:"Nombre requerido" });
    }

    const exists = events.find(ev =>
      normalize(ev.name) === normalize(name)
    );

    if(exists){
      return res.json({ success:false, message:"Ese evento ya existe" });
    }

    const folder = "snoopbox/" + cleanFolder(name);

    const event = {
      id:newId(),
      name:name.trim(),
      folder,
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

app.get("/events",(req,res)=>{
  res.json(events);
});

app.get("/event/:name",(req,res)=>{

  const found = events.find(ev =>
    normalize(ev.name) === normalize(req.params.name)
  );

  if(!found){
    return res.json({ success:false });
  }

  res.json({
    success:true,
    event:found
  });

});

app.post("/toggle-event/:id",(req,res)=>{

  const id = Number(req.params.id);
  const ev = events.find(e=>e.id===id);

  if(!ev){
    return res.json({ success:false });
  }

  ev.active = !ev.active;

  res.json({
    success:true,
    active:ev.active
  });

});

/* ===============================
   INVITADOS
=============================== */

app.post("/upload-guests/:id",(req,res)=>{

  const id = Number(req.params.id);
  const ev = events.find(e=>e.id===id);

  if(!ev){
    return res.json({ success:false });
  }

  const guests = req.body.guests || [];

  ev.guests = guests.map((g,i)=>({
    id:i+1,
    name:g.name || "",
    table:g.table || "",
    phone:g.phone || "",
    arrived:false,
    points:0
  }));

  ev.arrived = 0;

  res.json({
    success:true,
    total:ev.guests.length
  });

});

app.get("/guests/:id",(req,res)=>{

  const id = Number(req.params.id);
  const ev = events.find(e=>e.id===id);

  if(!ev) return res.json([]);

  res.json(ev.guests);

});

app.post("/arrive/:eventId/:guestId",(req,res)=>{

  const eventId = Number(req.params.eventId);
  const guestId = Number(req.params.guestId);

  const ev = events.find(e=>e.id===eventId);

  if(!ev){
    return res.json({ success:false });
  }

  const guest = ev.guests.find(g=>g.id===guestId);

  if(!guest){
    return res.json({ success:false });
  }

  if(!guest.arrived){
    guest.arrived = true;
    ev.arrived++;
  }

  res.json({ success:true });

});

/* ===============================
   CONTROL
=============================== */

app.get("/control/:id",(req,res)=>{

  const id = Number(req.params.id);
  const ev = events.find(e=>e.id===id);

  if(!ev){
    return res.json({ success:false });
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
    missing: total - ev.arrived,
    percent
  });

});

/* ===============================
   FOTOS TÓTEM LEGACY
=============================== */

app.post("/upload",(req,res)=>{

  try{

    const event = req.body.event || "default";
    const name  = req.body.name || "Invitado";
    const table = req.body.table || "-";

    const folder =
      "snoopbox/" +
      cleanFolder(event);

    const fakeUrl =
      "https://picsum.photos/seed/" +
      Date.now() +
      "/800/1200";

    photos.unshift({
      id:newId(),
      eventName:event,
      folder,
      url:fakeUrl,
      user:name,
      table,
      createdAt:Date.now()
    });

    const ev = events.find(e =>
      normalize(e.name) === normalize(event)
    );

    if(ev){

      const guest =
        ev.guests.find(g =>
          g.table == table
        );

      if(guest){
        guest.points =
          (guest.points || 0) + 1;
      }

    }

    res.json({
      success:true,
      url:fakeUrl,
      folder
    });

  }catch(err){

    res.json({ success:false });

  }

});

/* ===============================
   FOTOS NUEVO SISTEMA + PUNTOS FIX
=============================== */

app.post("/upload-photo",(req,res)=>{

  const {
    eventName,
    user,
    image,
    table
  } = req.body;

  if(!eventName || !image){
    return res.json({
      success:false
    });
  }

  const folder =
    "snoopbox/" +
    cleanFolder(eventName);

  photos.unshift({
    id:newId(),
    eventName:eventName,
    folder,
    url:image,
    user:user || "Invitado",
    table:table || "-",
    createdAt:Date.now()
  });

  const ev =
    events.find(e =>
      normalize(e.name) ===
      normalize(eventName)
    );

  if(ev){

    let guest =
      ev.guests.find(g =>
        normalize(g.name) ===
        normalize(user)
      );

    if(!guest && table){

      guest =
        ev.guests.find(g =>
          g.table == table
        );

    }

    if(guest){

      guest.points =
        (guest.points || 0) + 1;

    }

  }

  res.json({
    success:true,
    folder
  });

});

/* ===============================
   GALERÍA
=============================== */

app.get("/photos/:eventName",(req,res)=>{

  const name =
    normalize(req.params.eventName);

  const result =
    photos.filter(p =>
      normalize(p.eventName || "") === name
    );

  res.json(result);

});

app.delete("/photo",(req,res)=>{

  const { url } = req.body;

  photos =
    photos.filter(p =>
      p.url !== url
    );

  res.json({
    success:true
  });

});

/* ===============================
   RANKING
=============================== */

app.get("/ranking/:event",(req,res)=>{

  const ev =
    events.find(e =>
      normalize(e.name) ===
      normalize(req.params.event)
    );

  if(!ev){
    return res.json([]);
  }

  const ranking =
    [...ev.guests]
    .sort((a,b)=>
      (b.points||0) -
      (a.points||0)
    );

  res.json(ranking);

});

/* ===============================
   HOME
=============================== */

app.get("/",(req,res)=>{

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});

/* ===============================
   SERVER
=============================== */

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

  console.log(
    "🚀 Puerto " + PORT
  );

});