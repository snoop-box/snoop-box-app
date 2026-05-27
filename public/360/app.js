const CLOUD_NAME = "daxf4enjn";
const UPLOAD_PRESET = "snoop360_unsigned";
const params =
new URLSearchParams(
window.location.search
);

let EVENT_ID =
params.get("event");


const homeScreen =document.getElementById("homeScreen");
const cameraScreen = document.getElementById("cameraScreen");
const thanksScreen = document.getElementById("thanksScreen");

const startBtn = document.getElementById("startBtn");

const preview = document.getElementById("preview");

const countdown = document.getElementById("countdown");
const timer = document.getElementById("timer");
const eventScreen =
document.getElementById(
"eventScreen"
);

const eventInput =
document.getElementById(
"eventInput"
);

const enterEventBtn =
document.getElementById(
"enterEventBtn"
);
window.onload = ()=>{

 if(EVENT_ID){

  document.getElementById(
  "eventTitle"
  ).innerText =
  EVENT_ID
  .replace(/-/g," ")
  .toUpperCase();

  showScreen(
    homeScreen
  );

  return;

}

  showScreen(
    eventScreen
  );

};

enterEventBtn.onclick =
async()=>{

  const value =
  eventInput.value
  .trim()
  .toLowerCase();

  if(!value)return;

  try{

    const res =
    await fetch("/events");

    const events =
    await res.json();

    const ev =
    events.find(

      e=>
      e.slug
      .toLowerCase()
      === value

    );

    if(!ev){

      alert(
      "Evento no encontrado"
      );

      return;

    }

    window.location.href =
    "/360/?event=" +
    ev.slug;

  }

  catch(err){

    console.error(err);

    alert(
    "Error cargando eventos"
    );

  }

};
let mediaRecorder;
let recordedChunks = [];
let stream;
let overlayImage =
new Image();

/* EVENTO */

const overlayEvent =

`https://res.cloudinary.com/daxf4enjn/image/upload/v1779893898/360-${EVENT_ID}.png`;

/* DEFAULT */

const overlayDefault =

"https://res.cloudinary.com/daxf4enjn/image/upload/v1779893898/360-1.png";

/* PROBAR EVENTO */

overlayImage.onload=()=>{

console.log(
"OVERLAY EVENTO"
);

};

overlayImage.onerror=()=>{

console.log(
"OVERLAY DEFAULT"
);

overlayImage.src=
overlayDefault;

};

overlayImage.src=
overlayEvent;

startBtn.addEventListener("click", async () => {

  try {

    startBtn.disabled = true;
    startBtn.style.pointerEvents =
"none";

    showScreen(cameraScreen);
    if(document.documentElement.requestFullscreen){

  document.documentElement
  .requestFullscreen();

}

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    preview.srcObject = stream;

    await preview.play();

    await startCountdown();

    startRecording();

  } catch (error) {

    console.error(error);

    alert("Error iniciando cámara");

    startBtn.disabled = false;
    startBtn.style.pointerEvents =
"auto";

    showScreen(homeScreen);
  }

});

async function startCountdown() {

  for (let i = 3; i > 0; i--) {

    countdown.innerText = i;

    await wait(1000);
  }

  countdown.innerText = "";
}

function startRecording() {

recordedChunks = [];

/* VOLVER A VERSION ESTABLE */

mediaRecorder =
new MediaRecorder(
stream
);

mediaRecorder.ondataavailable = (event) => {

if(
event.data.size > 0
){

recordedChunks.push(
event.data
);

}

};

mediaRecorder.onstop = async () => {

stopCamera();

const blob =
new Blob(
recordedChunks,
{
type:"video/mp4"
}
);

    try {

  timer.innerText = "SUBIENDO...";

  const uploadedUrl =
  await uploadVideo(blob);

  const saveRes =
  await fetch(

    "/save-360-video",

    {

      method:"POST",

      headers:{
        "Content-Type":
        "application/json"
      },

      body:JSON.stringify({

        event_slug:
        EVENT_ID,

        video_url:
        uploadedUrl

      })

    }

  );

  if(!saveRes.ok){

    throw new Error(
      "Error guardando video"
    );

  }

  console.log(
    "VIDEO SUBIDO:",
    uploadedUrl
  );

  timer.innerText =
  "VIDEO LISTO";

  showScreen(
    thanksScreen
  );

  setTimeout(() => {

    startBtn.disabled = false;

    startBtn.style.pointerEvents =
    "auto";

    showScreen(homeScreen);

    timer.innerText = "00:15";

  }, 5000);

}
 catch (error) {

      console.error(error);

      timer.innerText = "ERROR";

      alert(error.message);
    }


  };

  mediaRecorder.start();

  let seconds = 15;

 timer.innerText =
`00:${String(seconds)
.padStart(2,"0")}`;

  const interval = setInterval(() => {
    seconds--;

    if (seconds >= 0) {

      timer.innerText =
`00:${String(seconds)
.padStart(2,"0")}`;
    }

    if (seconds <= 0) {

      clearInterval(interval);

      mediaRecorder.stop();
    }

  }, 1000);
}

async function uploadVideo(blob) {

  const formData = new FormData();

  formData.append("file", blob);

  formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  formData.append(
    "folder",
    `snoopbox/${EVENT_ID}/360`
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  console.log("RESPUESTA CLOUDINARY:", data);

  if (!response.ok) {

    throw new Error(
      data.error?.message || "Error subiendo video"
    );
  }

  return data.secure_url;
}

function stopCamera() {

  if (stream) {

    stream.getTracks().forEach(track => track.stop());
  }
}

function showScreen(screen) {

  eventScreen.classList.remove("active");

  homeScreen.classList.remove("active");

  cameraScreen.classList.remove("active");

  thanksScreen.classList.remove("active");

  screen.classList.add("active");
}

function wait(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));
}