const homeScreen = document.getElementById("homeScreen");
const cameraScreen = document.getElementById("cameraScreen");
const thanksScreen = document.getElementById("thanksScreen");

const startBtn = document.getElementById("startBtn");

const preview = document.getElementById("preview");
const countdown = document.getElementById("countdown");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");

let mediaRecorder;
let recordedChunks = [];
let stream;

const CLOUDINARY_CLOUD_NAME = "daxf4enjn";
const CLOUDINARY_UPLOAD_PRESET = "snoop360";

startBtn.addEventListener("click", async () => {

  try {

    startBtn.disabled = true;

    showScreen(cameraScreen);

    statusText.innerText = "ABRIENDO CAMARA...";

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    preview.srcObject = stream;

    await preview.play();

    statusText.innerText = "";

    await startCountdown();

    startRecording();

  } catch (error) {

    console.error(error);

    alert("Error iniciando cámara");

    startBtn.disabled = false;

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

  // Safari/iPhone estable
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {

    if (event.data.size > 0) {

      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {

    stopCamera();

    statusText.innerText = "SUBIENDO VIDEO...";

    const blob = new Blob(recordedChunks, {
      type: "video/webm"
    });

    const formData = new FormData();

    formData.append("file", blob);

    formData.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );

    formData.append(
      "folder",
      "snoopbox/evento-demo/360"
    );

    try {

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      console.log("VIDEO SUBIDO:", data);

    } catch (error) {

      console.error(error);

      alert("Error subiendo video");
    }

    showScreen(thanksScreen);

    setTimeout(() => {

      startBtn.disabled = false;

      showScreen(homeScreen);

    }, 5000);
  };

  mediaRecorder.start();

  let seconds = 15;

  timerText.innerText = `${seconds}s`;

  statusText.innerText = "REC";

  const interval = setInterval(() => {

    seconds--;

    timerText.innerText = `${seconds}s`;

    if (seconds <= 0) {

      clearInterval(interval);
    }

  }, 1000);

  setTimeout(() => {

    mediaRecorder.stop();

    statusText.innerText = "";

  }, 15000);
}

function stopCamera() {

  if (stream) {

    stream.getTracks().forEach(track => track.stop());
  }
}

function showScreen(screen) {

  homeScreen.classList.remove("active");
  cameraScreen.classList.remove("active");
  thanksScreen.classList.remove("active");

  screen.classList.add("active");
}

function wait(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));
}