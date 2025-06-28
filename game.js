const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const flashDiv = document.getElementById('flash-message');
const flashText = document.getElementById('flash-text');

let WIDTH = 700, HEIGHT = 400;
function resizeCanvas() {
    const w = Math.min(canvas.parentElement.offsetWidth, 700);
    const h = w / 16 * 9;
    canvas.width = w;
    canvas.height = h;
    WIDTH = 700; HEIGHT = 400;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const PADDLE_W = 12, PADDLE_H = 80;
const BALL_S = 16;
const PLAYER_X = 12, AI_X = WIDTH - PADDLE_W - 12;
const PADDLE_SPEED = 7;
const BALL_SPEED = 6;

let player, ai, ball, score, gameOver, winner;

// --- Reset all state for a new game
function startGame() {
    player = { x: PLAYER_X, y: HEIGHT/2-PADDLE_H/2, w: PADDLE_W, h: PADDLE_H };
    ai = { x: AI_X, y: HEIGHT/2-PADDLE_H/2, w: PADDLE_W, h: PADDLE_H };
    ball = { x: WIDTH/2, y: HEIGHT/2, s: BALL_S, vx: BALL_SPEED, vy: BALL_SPEED * (Math.random()*2-1) };
    score = { player: 0, ai: 0 };
    playerScoreEl.textContent = "0";
    aiScoreEl.textContent = "0";
    gameOver = false;
    winner = null;
    flashDiv.style.display = "none";
}

startGame();

// Draw
function draw() {
    const scalex = canvas.width / 700, scaley = canvas.height / 400;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // net
    ctx.save();
    ctx.globalAlpha = 0.16;
    for(let i=0;i<HEIGHT;i+=18)
        ctx.fillRect(canvas.width/2-1, i*scaley, 2, 10*scaley);
    ctx.restore();
    // paddles
    ctx.fillStyle = "#00eaff";
    ctx.fillRect(player.x*scalex, player.y*scaley, player.w*scalex, player.h*scaley);
    ctx.fillStyle = "#ff9800";
    ctx.fillRect(ai.x*scalex, ai.y*scaley, ai.w*scalex, ai.h*scaley);
    // ball
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x*scalex, ball.y*scaley, ball.s/2*scalex, 0, Math.PI*2);
    ctx.fill();
}

// Collision
function collision(paddle, ball) {
    return (
        ball.x - ball.s/2 < paddle.x + paddle.w &&
        ball.x + ball.s/2 > paddle.x &&
        ball.y - ball.s/2 < paddle.y + paddle.h &&
        ball.y + ball.s/2 > paddle.y
    );
}

// AI move (a bit faster, still beatable)
function moveAI() {
    let paddleCenter = ai.y + ai.h/2;
    let diff = ball.y - paddleCenter;
    if (Math.abs(diff) > 16) {
        let aiMove = Math.sign(diff) * Math.min(Math.abs(diff), PADDLE_SPEED * 0.38);
        aiMove += (Math.random() - 0.5) * 1.1;
        ai.y += aiMove;
    }
    ai.y = Math.max(0, Math.min(HEIGHT - ai.h, ai.y));
}

// Update
function update() {
    if (gameOver) return;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall
    if (ball.y - ball.s/2 < 0 || ball.y + ball.s/2 > HEIGHT) {
        ball.vy *= -1;
    }

    // Player paddle
    if (collision(player, ball)) {
        ball.vx = Math.abs(ball.vx);
        let collidePoint = (ball.y - (player.y + player.h/2)) / (player.h/2);
        let angle = collidePoint * (Math.PI/4);
        ball.vy = BALL_SPEED * Math.sin(angle);
    }
    // AI paddle
    if (collision(ai, ball)) {
        ball.vx = -Math.abs(ball.vx);
        let collidePoint = (ball.y - (ai.y + ai.h/2)) / (ai.h/2);
        let angle = collidePoint * (Math.PI/4);
        ball.vy = BALL_SPEED * Math.sin(angle);
    }

    // Score
    if (ball.x - ball.s/2 < 0) {
        score.ai++;
        aiScoreEl.textContent = score.ai;
        if (score.ai >= 5) {
            gameOver = true;
            winner = "ai";
            showFlashMessage("😢 AI wins. Try again!");
        }
        resetBall(-1);
    } else if (ball.x + ball.s/2 > WIDTH) {
        score.player++;
        playerScoreEl.textContent = score.player;
        if (score.player >= 5) {
            gameOver = true;
            winner = "player";
            showFlashMessage("🎉 Hooray ... you wonnn! 🏆");
        }
        resetBall(1);
    }

    moveAI();
}

// Ball reset
function resetBall(dir=1) {
    ball.x = WIDTH/2;
    ball.y = HEIGHT/2;
    ball.vx = BALL_SPEED * dir;
    ball.vy = BALL_SPEED * (Math.random()*2-1);
}

// Flash message
function showFlashMessage(msg) {
    flashText.innerHTML = msg;
    flashDiv.style.display = "flex";
}

// Player controls
canvas.addEventListener('mousemove', (e) => {
    if (gameOver) return;
    let rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top;
    const scaley = canvas.height / HEIGHT;
    player.y = mouseY / scaley - player.h/2;
    player.y = Math.max(0, Math.min(HEIGHT - player.h, player.y));
});
// Mobile touch
let touchDragging = false;
canvas.addEventListener('touchstart', (e) => {
    if (gameOver) return;
    touchDragging = true; e.preventDefault();
});
canvas.addEventListener('touchmove', (e) => {
    if (!touchDragging || gameOver) return;
    let rect = canvas.getBoundingClientRect();
    let touchY = e.touches[0].clientY - rect.top;
    const scaley = canvas.height / HEIGHT;
    player.y = touchY / scaley - player.h/2;
    player.y = Math.max(0, Math.min(HEIGHT - player.h, player.y));
    e.preventDefault();
});
canvas.addEventListener('touchend', () => { touchDragging = false; });

// Restart on click/tap ANYWHERE on overlay
flashDiv.addEventListener('mousedown', restartGame);
flashDiv.addEventListener('touchstart', (e) => { restartGame(); e.preventDefault(); });

function restartGame() {
    startGame();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();