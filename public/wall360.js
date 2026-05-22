const params =
new URLSearchParams(
window.location.search
);

const eventSlug =
params.get(
"event"
);

let videos = [];

let current = 0;

let totalLoaded = 0;

const player =
document.getElementById(
"mainVideo"
);

/* ====================== */

async function init(){

await loadEvent();

await loadVideos();

buildQR();

startPolling();

playLoop();

}

/* ====================== */

async function loadEvent(){

try{

const res =
await fetch(
"/event-config/" +
eventSlug
);

const data =
await res.json();

if(!data.success)
return;

document
.getElementById(
"eventName"
)
.innerText =

data.event.name
.toUpperCase();


}

catch(err){

console.error(
err
);

}

}

/* ====================== */

async function loadVideos(){

const res =
await fetch(
"/360-videos/" +
eventSlug
);

videos =
await res.json();

document
.getElementById(
"counter"
)
.innerText =

videos.length;

}

/* ====================== */

function playLoop(){

if(
!videos.length
){

setTimeout(
playLoop,
3000
);

return;

}

playVideo();

}

/* ====================== */

function playVideo(){

if(
current>=videos.length
){

current=0;

}

const v =
videos[current];

player.src =
v.video_url;

player.play();

player.onended =
()=>{

current++;

setTimeout(
playVideo,
700
);

};

}

/* ====================== */

function buildQR(){

const url =

window.location.origin +

"/360-gallery.html?event=" +

eventSlug;

QRCode.toCanvas(

url,

{

width:180

},

(err,canvas)=>{

if(err)return;

document
.getElementById(
"qr"
)
.appendChild(
canvas
);

}

);

}

/* ====================== */

function showToast(){

const toast =
document.getElementById(
"toast"
);

toast.classList.add(
"show"
);

setTimeout(()=>{

toast.classList.remove(
"show"
);

},3000);

}

/* ====================== */

function startPolling(){

setInterval(
async()=>{

const oldCount =
videos.length;

await loadVideos();

if(
videos.length>
oldCount
){

showToast();

}

},10000);

}

/* ====================== */

init();