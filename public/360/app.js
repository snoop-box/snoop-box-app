const homeScreen = document.getElementById("homeScreen");
const cameraScreen = document.getElementById("cameraScreen");
const thanksScreen = document.getElementById("thanksScreen");

const startBtn = document.getElementById("startBtn");

const preview = document.getElementById("preview");
const countdown = document.getElementById("countdown");
const statusText = document.getElementById("status");

let mediaRecorder;
let recordedChunks = [];
let stream;

startBtn.addEventListener("click", async () => {

  showScreen(cameraScreen);

  await initCamera();

  await startCountdown();

  startRecording();

});

async function initCamera() {

  try {

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: 1920,
        height: 1080,
        frameRate: 30
      },
      audio: false
    });

    preview.srcObject = stream;

  } catch (error) {

    console.error(error);

    alert("No se pudo acceder a la cámara");
  }
}

async function startCountdown() {

  for (let i = 3; i > 0; i--) {

    countdown.innerText = i;

    await wait(1000);
  }

  countdown.innerText = "";
}

function startRecording() {

  recordedChunks = [];

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {

    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {

    const blob = new Blob(recordedChunks, {
      type: "video/mp4"
    });

    console.log("VIDEO GRABADO", blob);

    stopCamera();

    showScreen(thanksScreen);

    setTimeout(() => {

      showScreen(homeScreen);

    }, 5000);
  };

  mediaRecorder.start();

  statusText.innerText = "GRABANDO...";

  setTimeout(() => {

    mediaRecorder.stop();

    statusText.innerText = "";

  }, 8000);
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