const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 470;
canvas.height = 760;

// ================= UI =================

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const pauseBtn = document.getElementById("pauseBtn");
const soundBtn = document.getElementById("soundBtn");

const finalScore = document.getElementById("finalScore");

// ================= GAME STATE =================

let gameStarted = false;
let gameOver = false;
let paused = false;

let score = 0;
let speed = 2.8;

let best = localStorage.getItem("skyhunter_best") || 0;

bestText.innerText = best;

let soundEnabled = true;
let shake = 0;

// ================= EAGLE =================

const eagle = {

    x: 120,
    y: 350,

    velocity: 0,

    // Natural smooth fall
    gravity: 0.22,

    // Jump strength
    flap: -5.5,

    rotation: 0
};

// ================= PIPES =================

const pipes = [];

const pipeWidth = 90;

// Clear professional gap
const gap = 220;

// ================= SOUND =================

function playSound(freq, duration){

    if(!soundEnabled) return;

    const audioCtx =
    new(window.AudioContext || window.webkitAudioContext)();

    const oscillator =
    audioCtx.createOscillator();

    const gainNode =
    audioCtx.createGain();

    oscillator.connect(gainNode);

    gainNode.connect(audioCtx.destination);

    oscillator.type = "triangle";

    oscillator.frequency.value = freq;

    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + duration
    );

    oscillator.stop(
        audioCtx.currentTime + duration
    );
}

// ================= CREATE PIPE =================

function createPipe(){

    const topHeight =
    Math.random() * 250 + 80;

    pipes.push({

        x: canvas.width,

        top: topHeight,

        passed: false
    });
}

// ================= BACKGROUND =================

function drawBackground(){

    // SKY
    const gradient =
    ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
    );

    gradient.addColorStop(0,"#081321");
    gradient.addColorStop(1,"#02050b");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // STARS
    for(let i = 0; i < 60; i++){

        ctx.fillStyle =
        "rgba(255,255,255,0.7)";

        ctx.beginPath();

        ctx.arc(
            (i * 67) % canvas.width,
            (i * 91) % canvas.height,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // MOON
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 30;

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        380,
        100,
        50,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    // CLOUDS
    ctx.fillStyle =
    "rgba(255,255,255,0.08)";

    for(let i = 0; i < 5; i++){

        let cloudX =
        ((i * 160) + Date.now()/40)
        % 800 - 150;

        ctx.beginPath();

        ctx.arc(cloudX,120,25,0,Math.PI*2);
        ctx.arc(cloudX+30,105,30,0,Math.PI*2);
        ctx.arc(cloudX+60,120,25,0,Math.PI*2);

        ctx.fill();
    }

    // MOUNTAINS
    ctx.fillStyle = "#0d1b2a";

    ctx.beginPath();

    ctx.moveTo(0,760);
    ctx.lineTo(120,430);
    ctx.lineTo(240,760);

    ctx.moveTo(180,760);
    ctx.lineTo(340,390);
    ctx.lineTo(470,760);

    ctx.fill();

    // GROUND
    ctx.fillStyle = "#111";

    ctx.fillRect(
        0,
        canvas.height - 70,
        canvas.width,
        70
    );
}

// ================= EAGLE =================

function drawEagle(){

    ctx.save();

    ctx.translate(
        eagle.x,
        eagle.y
    );

    ctx.rotate(eagle.rotation);

    // BODY
    ctx.fillStyle = "#5c5c5c";

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        30,
        18,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // WING
    ctx.fillStyle = "#3a3a3a";

    ctx.beginPath();

    ctx.moveTo(-5,0);
    ctx.lineTo(-40,-14);
    ctx.lineTo(-18,14);

    ctx.fill();

    // HEAD
    ctx.fillStyle = "#d9d9d9";

    ctx.beginPath();

    ctx.arc(
        22,
        -8,
        11,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // EYE
    ctx.fillStyle = "black";

    ctx.beginPath();

    ctx.arc(
        24,
        -10,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // BEAK
    ctx.fillStyle = "#e0a100";

    ctx.beginPath();

    ctx.moveTo(32,-4);
    ctx.lineTo(48,0);
    ctx.lineTo(32,4);

    ctx.fill();

    ctx.restore();
}

// ================= PIPES =================

function drawPipe(x, y, height, isTop){

    const gradient =
    ctx.createLinearGradient(
        x,
        0,
        x + pipeWidth,
        0
    );

    gradient.addColorStop(0,"#145a14");
    gradient.addColorStop(0.5,"#2ecc71");
    gradient.addColorStop(1,"#145a14");

    ctx.fillStyle = gradient;

    // PIPE BODY
    ctx.fillRect(
        x,
        y,
        pipeWidth,
        height
    );

    // PIPE CAP
    if(isTop){

        ctx.fillStyle = "#27ae60";

        ctx.fillRect(
            x - 8,
            height - 25,
            pipeWidth + 16,
            25
        );

    }else{

        ctx.fillStyle = "#27ae60";

        ctx.fillRect(
            x - 8,
            y,
            pipeWidth + 16,
            25
        );
    }

    // LIGHT EFFECT
    ctx.fillStyle =
    "rgba(255,255,255,0.15)";

    ctx.fillRect(
        x + 10,
        y,
        10,
        height
    );
}

// ================= UPDATE =================

function update(){

    if(
        !gameStarted ||
        gameOver ||
        paused
    ){
        return;
    }

    // EAGLE PHYSICS
    eagle.velocity += eagle.gravity;

    eagle.y += eagle.velocity;

    eagle.rotation =
    eagle.velocity * 0.05;

    // TOP LIMIT
    if(eagle.y < 0){

        eagle.y = 0;
    }

    // GROUND COLLISION
    if(eagle.y > canvas.height - 90){

        endGame();
    }

    // PIPES
    pipes.forEach((pipe,index)=>{

        pipe.x -= speed;

        // COLLISION
        if(

            eagle.x + 25 > pipe.x &&
            eagle.x - 25 < pipe.x + pipeWidth &&

            (
                eagle.y < pipe.top ||
                eagle.y > pipe.top + gap
            )

        ){

            endGame();
        }

        // SCORE
        if(
            !pipe.passed &&
            pipe.x < eagle.x
        ){

            pipe.passed = true;

            score++;

            scoreText.innerText = score;

            playSound(700,0.08);

            // SPEED INCREASE
            speed += 0.03;

            if(score > 15){
                speed += 0.005;
            }

            if(score > 30){
                speed += 0.008;
            }

            shake = 2;
        }

        // REMOVE
        if(pipe.x < -150){

            pipes.splice(index,1);
        }
    });
}

// ================= GAME OVER =================

function endGame(){

    gameOver = true;

    shake = 20;

    playSound(120,0.5);

    finalScore.innerText =
    "Score : " + score;

    if(score > best){

        best = score;

        localStorage.setItem(
            "skyhunter_best",
            best
        );

        bestText.innerText = best;
    }

    gameOverScreen.classList.remove("hidden");
}

// ================= DRAW =================

function draw(){

    if(shake > 0){

        ctx.save();

        ctx.translate(
            Math.random()*6 - 3,
            Math.random()*6 - 3
        );

        shake--;
    }

    drawBackground();

    // DRAW PIPES
    pipes.forEach(pipe=>{

        // TOP PIPE
        drawPipe(
            pipe.x,
            0,
            pipe.top,
            true
        );

        // BOTTOM PIPE
        drawPipe(
            pipe.x,
            pipe.top + gap,
            canvas.height - pipe.top - gap,
            false
        );
    });

    drawEagle();

    if(shake > 0){

        ctx.restore();
    }
}

// ================= GAME LOOP =================

function gameLoop(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    update();

    draw();

    requestAnimationFrame(gameLoop);
}

// ================= FLAP =================

function flap(){

    if(
        !gameStarted ||
        gameOver ||
        paused
    ){
        return;
    }

    eagle.velocity = eagle.flap;

    playSound(300,0.08);
}

// ================= START GAME =================

function startGame(){

    gameStarted = true;

    gameOver = false;

    score = 0;

    speed = 2.8;

    eagle.y = 350;

    eagle.velocity = 0;

    pipes.length = 0;

    scoreText.innerText = 0;

    startScreen.classList.add("hidden");

    gameOverScreen.classList.add("hidden");
}

// ================= CREATE PIPES =================

setInterval(()=>{

    if(
        gameStarted &&
        !gameOver &&
        !paused
    ){

        createPipe();
    }

},1900);

// ================= CONTROLS =================

document.addEventListener(
    "keydown",
    (e)=>{

        if(e.code === "Space"){

            flap();
        }

        if(e.code === "KeyP"){

            paused = !paused;
        }
    }
);

canvas.addEventListener(
    "click",
    flap
);

startBtn.addEventListener(
    "click",
    startGame
);

restartBtn.addEventListener(
    "click",
    startGame
);

pauseBtn.addEventListener(
    "click",
    ()=>{

        paused = !paused;
    }
);

soundBtn.addEventListener(
    "click",
    ()=>{

        soundEnabled = !soundEnabled;

        soundBtn.innerText =
        soundEnabled ? "🔊" : "🔇";
    }
);

// ================= START LOOP =================

gameLoop();

