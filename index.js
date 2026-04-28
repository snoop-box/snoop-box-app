const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

console.log("🔥 SNOOP BOX MULTIEVENTO ONLINE");

/* ==================================
   BASE EN MEMORIA (multievento)
================================== */

let events = [];
let photos = [];

/* ==================================
   HELPERS
================================== */

function newId() {
  return Date.now() + Math.floor(Math.random() * 9999);
}

function normalize(text = "") {
  return text.toString().trim().toLowerCase();
}

/* ==================================
   EVENTOS
================================== */

// crear evento
app.post("/create-event", (req, res) => {
  try {
    const { name, background, frame } = req.body;

    if (!name || !name.trim()) {
      return res.json({
        success: false,
        message: "Nombre requerido"
      });
    }

    const exists = events.find(
      e => normalize(e.name) === normalize(name)
    );

    if (exists) {
      return res.json({
        success: false,
        message: "Ya existe un evento con ese nombre"
      });
    }

    const event = {
      id: newId(),
      name: name.trim(),
      background: background || "",
      frame: frame || "",
      active: true,
      createdAt: new Date().toISOString()
    };

    events.push(event);

    res.json({
      success: true,
      event
    });

  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: "Error servidor"
    });
  }
});

// listar eventos
app.get("/events", (req, res) => {
  res.json(events);
});

// buscar evento por nombre
app.get("/event/:name", (req, res) => {

  const found = events.find(
    e => normalize(e.name) === normalize(req.params.name)
  );

  if (!found) {
    return res.json({
      success: false
    });
  }

  res.json({
    success: true,
    event: found
  });
});

// activar / desactivar
app.post("/toggle-event/:id", (req, res) => {

  const id = Number(req.params.id);

  const ev = events.find(e => e.id === id);

  if (!ev) {
    return res.json({ success:false });
  }

  ev.active = !ev.active;

  res.json({
    success:true,
    active:ev.active
  });

});

/* ==================================
   FOTOS POR EVENTO
================================== */

// subir foto
app.post("/upload-photo", (req, res) => {

  const { eventName, user, image } = req.body;

  if (!eventName || !image) {
    return res.json({ success:false });
  }

  photos.unshift({
    id:newId(),
    eventName:eventName.trim(),
    user:user || "Invitado",
    image:image,
    createdAt:Date.now()
  });

  res.json({ success:true });

});

// listar fotos de un evento
app.get("/photos/:eventName", (req,res)=>{

  const name = normalize(req.params.eventName);

  const result = photos.filter(
    p => normalize(p.eventName) === name
  );

  res.json(result);

});

/* ==================================
   HOME
================================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ==================================
   SERVER
================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Puerto " + PORT);
});