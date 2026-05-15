const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const { Pool } = require("pg");
const multer = require("multer");
const XLSX = require("xlsx");

require("dotenv").config();

const app = express();

const upload = multer({
  dest:"uploads/"
});

/* ========================================= */
/* MIDDLEWARE */
/* ========================================= */

app.use(cors());

app.use(express.json({
  limit:"50mb"
}));

app.use(express.urlencoded({
  extended:true,
  limit:"50mb"
}));

app.use(
  express.static(
    path.join(__dirname,"public")
  )
);

/* ========================================= */
/* CLOUDINARY */
/* ========================================= */

cloudinary.config({

  cloud_name:
  process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
  process.env.CLOUDINARY_API_KEY,

  api_secret:
  process.env.CLOUDINARY_API_SECRET

});

/* ========================================= */
/* POSTGRES */
/* ========================================= */

const pool = new Pool({

  connectionString:
  process.env.DATABASE_URL,

  ssl:{
    rejectUnauthorized:false
  }

});

/* ========================================= */
/* INIT DB */
/* ========================================= */

async function initDB(){

  try{

    /* EVENTS */

    await pool.query(`

      CREATE TABLE IF NOT EXISTS events(

        id SERIAL PRIMARY KEY,

        name TEXT,

        slug TEXT UNIQUE,

        active BOOLEAN DEFAULT true,

        has360 BOOLEAN DEFAULT false,

        hastrivia BOOLEAN DEFAULT false,

        logo_url TEXT,

        background_url TEXT,

        frame_url TEXT,

        created_at TIMESTAMP
        DEFAULT NOW()

      )

    `);
    /* PHOTOS */

await pool.query(`

  CREATE TABLE IF NOT EXISTS photos(

    id SERIAL PRIMARY KEY,

    event_slug TEXT,

    guest_name TEXT,

    guest_table TEXT,

    image_url TEXT,

    created_at TIMESTAMP
    DEFAULT NOW()

  )

`);

    /* GUESTS */

    await pool.query(`

      CREATE TABLE IF NOT EXISTS guests(

        id SERIAL PRIMARY KEY,

        event_slug TEXT,

        guest_name TEXT,

        guest_table TEXT,

        guest_phone TEXT,

        arrived BOOLEAN DEFAULT false,

        points INTEGER DEFAULT 0,

        created_at TIMESTAMP
        DEFAULT NOW()

      )

    `);

    /* 360 VIDEOS */

    await pool.query(`

      CREATE TABLE IF NOT EXISTS videos360(

        id SERIAL PRIMARY KEY,

        event_slug TEXT,

        video_url TEXT,

        created_at TIMESTAMP
        DEFAULT NOW()

      )

    `);

    /* TRIVIA QUESTIONS */

    await pool.query(`

      CREATE TABLE IF NOT EXISTS trivia_questions(

        id SERIAL PRIMARY KEY,

        event_slug TEXT,

        question TEXT,

        options JSONB,

        correct_answer INTEGER,

        created_at TIMESTAMP
        DEFAULT NOW()

      )

    `);

    /* TRIVIA ANSWERS */

    await pool.query(`

      CREATE TABLE IF NOT EXISTS trivia_answers(

        id SERIAL PRIMARY KEY,

        event_slug TEXT,

        guest_name TEXT,

        answered BOOLEAN DEFAULT true,

        score INTEGER DEFAULT 0,

        created_at TIMESTAMP
        DEFAULT NOW()

      )

    `);

    console.log(
      "🐘 PostgreSQL conectado"
    );

  }

  catch(err){

    console.error(
      "❌ Error PostgreSQL",
      err
    );

  }

}

initDB();

/* ========================================= */
/* HELPERS */
/* ========================================= */

function slugify(text){

  return text
  .toLowerCase()
  .trim()
  .replace(/\s+/g,"-")
  .replace(/[^\w\-]+/g,"");

}

/* ========================================= */
/* CREATE EVENT */
/* ========================================= */

app.post(
"/create-event",
async(req,res)=>{

  try{

    const {

      name,
      logoVenue,
      background,
      frame,
      has360,
      hastrivia

    } = req.body;

    const slug =
    slugify(name);

    await pool.query(

      `INSERT INTO events(

        name,
        slug,
        active,
        has360,
        hastrivia,
        logo_url,
        background_url,
        frame_url

      )

      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8
      )`,

      [

        name,
        slug,
        true,
        has360 || false,
        hastrivia || false,
        logoVenue || "",
        background || "",
        frame || ""

      ]

    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.json({

      success:false,
      message:"Error creando evento"

    });

  }

});

/* ========================================= */
/* EVENTS */
/* ========================================= */

app.get(
"/events",
async(req,res)=>{

  try{

    const events =
    await pool.query(`

      SELECT *
      FROM events
      ORDER BY id DESC

    `);

    const finalEvents = [];

    for(const ev of events.rows){

      const guests =
      await pool.query(

        `SELECT *
         FROM guests
         WHERE event_slug=$1`,

        [ev.slug]

      );

      finalEvents.push({

        ...ev,
        guests:guests.rows

      });

    }

    res.json(finalEvents);

  }

  catch(err){

    console.error(err);

    res.json([]);

  }

});

/* ========================================= */
/* EVENT CONFIG */
/* ========================================= */

app.get(
"/event-config/:slug",
async(req,res)=>{

  try{

    const slug =
    req.params.slug;

    const result =
    await pool.query(

      `SELECT *
       FROM events
       WHERE slug=$1
       LIMIT 1`,

      [slug]

    );

    if(
      result.rows.length===0
    ){

      return res.json({
        success:false
      });

    }

    res.json({

      success:true,

      event:
      result.rows[0]

    });

  }

  catch(err){

    console.error(err);

    res.json({
      success:false
    });

  }

});

/* ========================================= */
/* TOGGLE EVENT */
/* ========================================= */

app.post(
"/toggle-event/:id",
async(req,res)=>{

  try{

    const id =
    req.params.id;

    const current =
    await pool.query(

      `SELECT *
       FROM events
       WHERE id=$1`,

      [id]

    );

    if(
      current.rows.length===0
    ){

      return res.json({
        success:false
      });

    }

    const active =
    current.rows[0].active;

    await pool.query(

      `UPDATE events
       SET active=$1
       WHERE id=$2`,

      [!active,id]

    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.json({
      success:false
    });

  }

});

/* ========================================= */
/* DELETE EVENT */
/* ========================================= */

app.post(
"/delete-event/:id",
async(req,res)=>{

  try{

    const id =
    req.params.id;

    const eventResult =
    await pool.query(

      `SELECT *
       FROM events
       WHERE id=$1`,

      [id]

    );

    if(
      eventResult.rows.length===0
    ){

      return res.json({
        success:false
      });

    }

    const event =
    eventResult.rows[0];

    await pool.query(

      `DELETE FROM guests
       WHERE event_slug=$1`,

      [event.slug]

    );

    await pool.query(

      `DELETE FROM videos360
       WHERE event_slug=$1`,

      [event.slug]

    );

    await pool.query(

      `DELETE FROM trivia_questions
       WHERE event_slug=$1`,

      [event.slug]

    );

    await pool.query(

      `DELETE FROM trivia_answers
       WHERE event_slug=$1`,

      [event.slug]

    );
    await pool.query(

  `DELETE FROM photos
   WHERE event_slug=$1`,

  [event.slug]

);

    await pool.query(

      `DELETE FROM events
       WHERE id=$1`,

      [id]

    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

/* ========================================= */
/* UPLOAD GUESTS */
/* ========================================= */

app.post(
"/upload-guests/:id",
async(req,res)=>{

  try{

    const id =
    req.params.id;

    const guests =
    req.body.guests || [];

    const eventResult =
    await pool.query(

      `SELECT *
       FROM events
       WHERE id=$1`,

      [id]

    );

    if(
      eventResult.rows.length===0
    ){

      return res.json({
        success:false
      });

    }

    const event =
    eventResult.rows[0];

    for(const g of guests){

      await pool.query(

        `INSERT INTO guests(

          event_slug,
          guest_name,
          guest_table,
          guest_phone

        )

        VALUES(
          $1,$2,$3,$4
        )`,

        [

          event.slug,
          g.name || "",
          g.table || "",
          g.phone || ""

        ]

      );

    }

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.json({
      success:false
    });

  }

});

/* ========================================= */
/* LOGIN */
/* ========================================= */

app.post(
"/login-guest",
async(req,res)=>{

  try{

    const {
      event_slug,
      name
    } = req.body;

    const result =
    await pool.query(

      `SELECT *
       FROM guests

       WHERE
       event_slug=$1

       AND LOWER(guest_name)
       = LOWER($2)

       LIMIT 1`,

      [
        event_slug,
        name
      ]

    );

    if(
      result.rows.length===0
    ){

      return res.json({

        success:false,
        error:"Invitado no encontrado"

      });

    }

    const guest =
    result.rows[0];

    res.json({

      success:true,
      guest

    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

/* ========================================= */
/* UPLOAD PHOTO */
/* ========================================= */

app.post(
"/upload-photo",
async(req,res)=>{

  try{

    const {
      image,
      eventName,
      user
    } = req.body;

    const uploaded =
    await cloudinary.uploader.upload(
      image,
      {
        folder:
        `snoopbox/${eventName}/photos`
      }
    );

    const guestResult =
    await pool.query(

      `SELECT *
       FROM guests

       WHERE event_slug=$1
       AND LOWER(guest_name)=LOWER($2)

       LIMIT 1`,

      [
        eventName,
        user
      ]

    );

    const guestData =
    guestResult.rows[0];

    await pool.query(

      `UPDATE guests

       SET points =
       points + 1

       WHERE

       event_slug=$1

       AND LOWER(guest_name)=LOWER($2)`,

      [
        eventName,
        user
      ]

    );

    await pool.query(

      `INSERT INTO photos(

        event_slug,
        guest_name,
        guest_table,
        image_url

      )

      VALUES($1,$2,$3,$4)`,

      [

        eventName,
        user,

        guestData?.guest_table || "",

        uploaded.secure_url

      ]

    );

    res.json({

      success:true,
      image:uploaded.secure_url

    });

  }

  catch(err){

    console.error(err);

    res.json({
      success:false
    });

  }

});

/* ========================================= */
/* RANKING */
/* ========================================= */

app.get(
"/ranking/:slug",
async(req,res)=>{

  try{

    const slug =
    req.params.slug;

    const result =
    await pool.query(`

      SELECT

      guest_table AS table,

      SUM(points)::int AS points

      FROM guests

      WHERE event_slug=$1

      GROUP BY guest_table

      ORDER BY points DESC

    `,[slug]);

    res.json(result.rows);

  }

  catch(err){

    console.error(err);

    res.json([]);

  }

});

/* ========================================= */
/* SAVE 360 VIDEO */
/* ========================================= */

app.post(
"/save-360-video",
async(req,res)=>{

  try{

    const {
      event_slug,
      video_url
    } = req.body;

    await pool.query(

      `INSERT INTO videos360(

        event_slug,
        video_url

      )

      VALUES($1,$2)`,

      [

        event_slug,
        video_url

      ]

    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.json({
      success:false
    });

  }

});

/* ========================================= */
/* LIST 360 VIDEOS */
/* ========================================= */

app.get(
"/360-videos/:slug",
async(req,res)=>{

  try{

    const slug =
    req.params.slug;

    const result =
    await pool.query(

      `SELECT *
       FROM videos360

       WHERE event_slug=$1

       ORDER BY id DESC`,

      [slug]

    );

    res.json(result.rows);

  }

  catch(err){

    console.error(err);

    res.json([]);

  }

});
/* ========================================= */
/* ARRIVE GUEST */
/* ========================================= */

app.post(
"/arrive/:id",
async(req,res)=>{

  try{

    const id =
    req.params.id;

    await pool.query(

      `UPDATE guests

       SET arrived=true

       WHERE id=$1`,

      [id]

    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});
/* ========================================= */
/* EVENT PHOTOS */
/* ========================================= */

app.get(
"/event-photos/:slug",
async(req,res)=>{

  try{

    const slug =
    req.params.slug;

    const result =
    await pool.query(

      `SELECT *
       FROM photos

       WHERE event_slug=$1

       ORDER BY id DESC`,

      [slug]

    );

    res.json(
      result.rows
    );

  }

  catch(err){

    console.error(err);

    res.json([]);

  }

});
/* ========================================= */
/* DELETE PHOTO */
/* ========================================= */

app.delete(
"/photo",
async(req,res)=>{

  try{

    const { url } =
    req.body;

    await pool.query(

      `DELETE FROM photos
       WHERE image_url=$1`,

      [url]

    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

/* ========================================= */
/* DEBUG */
/* ========================================= */

app.get(
"/db-events",
async(req,res)=>{

  const result =
  await pool.query(
    `SELECT * FROM events`
  );

  res.json(result.rows);

});

app.get(
"/db-guests/:slug",
async(req,res)=>{

  const slug =
  req.params.slug;

  const result =
  await pool.query(

    `SELECT *
     FROM guests
     WHERE event_slug=$1`,

    [slug]

  );

  res.json(result.rows);

});

/* ========================================= */
/* TRIVIA */
/* ========================================= */

app.get('/trivia/:event', async (req,res)=>{

  try{

    const { rows } = await pool.query(
      `SELECT *
       FROM trivia_questions
       WHERE event_slug=$1
       ORDER BY id ASC`,
      [req.params.event]
    );

    res.json(rows);

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

/* ====================== */

app.get('/trivia-status/:event/:guest', async (req,res)=>{

  try{

    const { rows } = await pool.query(
      `SELECT *
       FROM trivia_answers
       WHERE event_slug=$1
       AND guest_name=$2
       LIMIT 1`,
      [
        req.params.event,
        req.params.guest
      ]
    );

    if(rows.length){

      return res.json({
        answered:true,
        data:rows[0]
      });

    }

    res.json({
      answered:false
    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

/* ====================== */

app.post('/submit-trivia', async (req,res)=>{

  try{

    const {
      event_slug,
      guest_name,
      score
    } = req.body;

    const existing = await pool.query(
      `SELECT *
       FROM trivia_answers
       WHERE event_slug=$1
       AND guest_name=$2`,
      [event_slug,guest_name]
    );

    if(existing.rows.length){

      return res.json({
        success:false,
        message:'already answered'
      });

    }

    await pool.query(
      `INSERT INTO trivia_answers
      (
        event_slug,
        guest_name,
        answered,
        score
      )
      VALUES($1,$2,true,$3)`,
      [
        event_slug,
        guest_name,
        score
      ]
    );

    await pool.query(
      `UPDATE guests
       SET points = points + $1
       WHERE event_slug=$2
       AND LOWER(guest_name)=LOWER($3)`,
      [
        score,
        event_slug,
        guest_name
      ]
    );

    res.json({
      success:true
    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

});

/* ========================================= */
/* UPLOAD TRIVIA XLSX */
/* ========================================= */

app.post(

  "/upload-trivia/:event",

  upload.single("file"),

  async(req,res)=>{

    try{

      const eventSlug =
      req.params.event;

      const workbook =
      XLSX.readFile(
        req.file.path
      );

      const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

      const data =
      XLSX.utils.sheet_to_json(
        sheet
      );

      await pool.query(

        `DELETE FROM trivia_questions
         WHERE event_slug=$1`,

        [eventSlug]

      );

for(const rawRow of data){

  const row = {};

  Object.keys(rawRow)
  .forEach(key=>{

    row[
      key
      .toString()
      .trim()
      .toLowerCase()

    ] = rawRow[key];

  });

  const options = [

    row.option1,
    row.option2,
    row.option3,
    row.option4

  ].filter(Boolean);

  await pool.query(

    `INSERT INTO trivia_questions(

      event_slug,
      question,
      options,
      correct_answer

    )

    VALUES($1,$2,$3,$4)`,

    [

  eventSlug,

  row.question,

  JSON.stringify(options),

  Number(row.correct) - 1

]

  );

}

      res.json({
        success:true
      });

    }

    catch(err){

      console.error(err);

      res.status(500).json({
        success:false
      });

    }

  }

);

/* ========================================= */
/* CATCH ALL */
/* ========================================= */

app.get(

  "/control",

  (req,res)=>{

    res.sendFile(

      path.join(
        __dirname,
        "public",
        "control.html"
      )

    );

  }

);

app.get("*",(req,res)=>{

  res.sendFile(

    path.join(
      __dirname,
      "public",
      "index.html"
    )

  );

});

/* ========================================= */
/* SERVER */
/* ========================================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

  console.log(
    "🚀 Puerto " + PORT
  );

});