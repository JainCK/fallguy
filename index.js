const player = document.getElementById("player");
const gameContainer = document.getElementById("game-container");
const scoreElement = document.getElementById("score");
const gameOverElement = document.getElementById("game-over");
const finalScoreElement = document.getElementById("final-score");
const restartButton = document.getElementById("restart-button");

let playerX = gameContainer.offsetWidth / 2 - 20;
let score = 0;
let obstacles = [];
let obstacleId = 0;
let gameActive = true;
let gameSpeed = 5;
let obstacleFrequency = 1500;

player.style.left = playerX + "px";

// Player movement
document.addEventListener("mousemove", (e) => {
  if (!gameActive) return;

  const gameRect = gameContainer.getBoundingClientRect();
  const relativeX = e.clientX - gameRect.left;

  // Keep player within game bounds
  if (relativeX >= 20 && relativeX <= gameRect.width - 20) {
    playerX = relativeX - 20;
    player.style.left = playerX + "px";
  }
});

// Touch controls for mobile
gameContainer.addEventListener(
  "touchmove",
  (e) => {
    if (!gameActive) return;

    e.preventDefault();
    const touch = e.touches[0];
    const gameRect = gameContainer.getBoundingClientRect();
    const relativeX = touch.clientX - gameRect.left;

    if (relativeX >= 20 && relativeX <= gameRect.width - 20) {
      playerX = relativeX - 20;
      player.style.left = playerX + "px";
    }
  },
  { passive: false }
);

// Create obstacles
function createObstacle() {
  if (!gameActive) return;

  obstacleId++;
  const obstacle = document.createElement("div");
  obstacle.className = "obstacle";
  obstacle.id = "obstacle-" + obstacleId;

  // Random position
  const obstacleX = Math.random() * (gameContainer.offsetWidth - 30);
  obstacle.style.left = obstacleX + "px";
  obstacle.style.top = "-30px";

  gameContainer.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    x: obstacleX,
    y: -30,
    id: obstacleId,
  });

  // Speed up game over time
  if (obstacleFrequency > 500) {
    obstacleFrequency -= 10;
  }
  if (gameSpeed < 12) {
    gameSpeed += 0.1;
  }

  setTimeout(createObstacle, obstacleFrequency);
}

// Game loop
function updateGame() {
  if (!gameActive) return;

  // Move obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    obstacle.y += gameSpeed;
    obstacle.element.style.top = obstacle.y + "px";

    // Check collision
    if (
      obstacle.y + 30 > gameContainer.offsetHeight - 40 && // Y collision (bottom of obstacle below player top)
      obstacle.y < gameContainer.offsetHeight && // Y still in game
      obstacle.x + 30 > playerX && // X collision right edge
      obstacle.x < playerX + 40 // X collision left edge
    ) {
      gameOver();
      return;
    }

    // Remove obstacles that went offscreen
    if (obstacle.y > gameContainer.offsetHeight) {
      gameContainer.removeChild(obstacle.element);
      obstacles.splice(i, 1);
      i--;

      // Increase score
      score++;
      scoreElement.textContent = "Score: " + score;
    }
  }

  requestAnimationFrame(updateGame);
}

// Start game
function startGame() {
  // Reset variables
  playerX = gameContainer.offsetWidth / 2 - 20;
  player.style.left = playerX + "px";
  score = 0;
  scoreElement.textContent = "Score: 0";
  gameSpeed = 5;
  obstacleFrequency = 1500;

  // Clear existing obstacles
  obstacles.forEach((obstacle) => {
    if (obstacle.element.parentNode) {
      gameContainer.removeChild(obstacle.element);
    }
  });
  obstacles = [];

  gameActive = true;
  gameOverElement.style.display = "none";

  // Start game loops
  createObstacle();
  updateGame();
}

function gameOver() {
  gameActive = false;
  finalScoreElement.textContent = "Your score: " + score;
  gameOverElement.style.display = "flex";
}

// Restart game when button is clicked
restartButton.addEventListener("click", startGame);

// Start game on load
startGame();
