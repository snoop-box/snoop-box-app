// LISTAR EVENTOS
app.get("/admin/events",(req,res)=>{
  res.json(events);
});

// TOGGLE
app.post("/admin/event/toggle",(req,res)=>{
  const {name,active}=req.body;
  if(events[name]) events[name].active=active;
  res.json({ok:true});
});

// CREAR EVENTO CON IMÁGENES
app.post("/admin/event", upload.fields([
  { name: "bg", maxCount: 1 },
  { name: "frame", maxCount: 1 }
]), async (req,res)=>{

  const name=req.body.name;
  const active=req.body.active==="true";

  let bg="", frame="";

  if(req.files.bg){
    const r=await cloudinary.uploader.upload(req.files.bg[0].path,{
      folder:`snoopbox/${name}/bg`
    });
    bg=r.secure_url;
  }

  if(req.files.frame){
    const r=await cloudinary.uploader.upload(req.files.frame[0].path,{
      folder:`snoopbox/${name}/frame`
    });
    frame=r.secure_url;
  }

  events[name]={bg,frame,active};

  res.json({ok:true});
});