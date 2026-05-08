const preview = document.getElementById("preview");
const recordBtn = document.getElementById("recordBtn");
const countdown = document.getElementById("countdown");
const statusText = document.getElementById("status");

let mediaRecorder;
let recordedChunks = [];
let stream;

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

initCamera();

recordBtn.addEventListener("click", async () => {

  recordBtn.style.display = "none";

  await startCountdown();

  startRecording();

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

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {

    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {

    const blob = new Blob(recordedChunks, {
      type: "video/mp4"
    });

    console.log("VIDEO GRABADO", blob);

    statusText.innerText = "✔ VIDEO GRABADO";

    setTimeout(() => {

      statusText.innerText = "";
      recordBtn.style.display = "block";

    }, 3000);
  };

  mediaRecorder.start();

  statusText.innerText = "GRABANDO...";

  setTimeout(() => {

    mediaRecorder.stop();

    statusText.innerText = "";

  }, 8000);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}