const AuthModule = (function () {
  let currentUser = null;
  const users = JSON.parse(localStorage.getItem("users") || "{}");

  function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
  }

  function register(username, password) {
    if (users[username]) {
      return { success: false, message: "Username already exists" };
    }

    users[username] = {
      password,
      highScore: 0,
      created: Date.now(),
    };

    saveUsers();
    return { success: true, message: "Registration successful" };
  }

  function login(username, password) {
    const user = users[username];

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.password !== password) {
      return { success: false, message: "Incorrect password" };
    }

    currentUser = username;
    return { success: true, message: "Login successful", username };
  }

  function logout() {
    currentUser = null;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function updateHighScore(score) {
    if (currentUser && users[currentUser]) {
      if (score > users[currentUser].highScore) {
        users[currentUser].highScore = score;
        saveUsers();
        return true;
      }
    }
    return false;
  }

  function getLeaderboard() {
    return Object.entries(users)
      .map(([username, userData]) => ({
        username,
        highScore: userData.highScore,
      }))
      .sort((a, b) => b.highScore - a.highScore);
  }

  return {
    register,
    login,
    logout,
    getCurrentUser,
    updateHighScore,
    getLeaderboard,
  };
})();

// Game UI Module
const UIModule = (function () {
  const menuElement = document.getElementById("menu");
  const loginView = document.getElementById("login-view");
  const gameOverView = document.getElementById("game-over-view");
  const mainMenuView = document.getElementById("main-menu-view");
  const scoreDisplay = document.getElementById("score-display");
  const finalScore = document.getElementById("final-score");
  const userDisplay = document.getElementById("user-display");
  const leaderboardBody = document.getElementById("leaderboard-body");

  function showMenu(view) {
    menuElement.classList.remove("hidden");
    loginView.classList.add("hidden");
    gameOverView.classList.add("hidden");
    mainMenuView.classList.add("hidden");

    if (view === "login") {
      loginView.classList.remove("hidden");
    } else if (view === "gameOver") {
      gameOverView.classList.remove("hidden");
    } else if (view === "mainMenu") {
      mainMenuView.classList.remove("hidden");
    }
  }

  function hideMenu() {
    menuElement.classList.add("hidden");
  }

  function updateScore(score) {
    scoreDisplay.textContent = `Score: ${score}`;
  }

  function updateFinalScore(score) {
    finalScore.textContent = `Your score: ${score}`;
  }

  function updateUserDisplay(username) {
    userDisplay.textContent = username;
  }

  function updateLeaderboard(leaderboardData) {
    leaderboardBody.innerHTML = "";

    leaderboardData.forEach((entry, index) => {
      const row = document.createElement("tr");

      const rankCell = document.createElement("td");
      rankCell.textContent = index + 1;

      const nameCell = document.createElement("td");
      nameCell.textContent = entry.username;

      const scoreCell = document.createElement("td");
      scoreCell.textContent = entry.highScore;

      row.appendChild(rankCell);
      row.appendChild(nameCell);
      row.appendChild(scoreCell);

      leaderboardBody.appendChild(row);
    });
  }

  function setLoginMessage(message, isError = false) {
    const messageElement = document.getElementById("login-message");
    messageElement.textContent = message;
    messageElement.style.color = isError ? "#e74c3c" : "#2ecc71";
  }

  return {
    showMenu,
    hideMenu,
    updateScore,
    updateFinalScore,
    updateUserDisplay,
    updateLeaderboard,
    setLoginMessage,
  };
})();

// 3D Game Module
const GameModule = (function () {
  // Three.js variables
  let scene, camera, renderer;
  let player,
    obstacles = [];

  // Game state variables
  let score = 0;
  let gameActive = false;
  let obstacleSpeed = 0.2;
  let lastObstacleTime = 0;
  let obstacleInterval = 1500;

  // Setup Three.js scene
  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Create camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Create game floor
    const floorGeometry = new THREE.PlaneGeometry(20, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);

    // Create player
    const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.3,
      roughness: 0.4,
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0;
    player.position.z = -15;
    scene.add(player);

    // Handle window resize
    window.addEventListener("resize", onWindowResize);

    // Initialize mouse controls
    initControls();
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function initControls() {
    document.addEventListener("mousemove", (e) => {
      if (!gameActive) return;

      // Map mouse position to game space
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      player.position.x = mouseX * 7; // Scale to game width
    });

    // Touch controls for mobile
    document.addEventListener(
      "touchmove",
      (e) => {
        if (!gameActive) return;

        e.preventDefault();
        const touch = e.touches[0];
        const touchX = (touch.clientX / window.innerWidth) * 2 - 1;
        player.position.x = touchX * 7;
      },
      { passive: false }
    );
  }

  function createObstacle() {
    const size = 0.5 + Math.random() * 0.5; // Random size
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      metalness: 0.7,
      roughness: 0.2,
    });

    const obstacle = new THREE.Mesh(geometry, material);

    // Random position
    obstacle.position.x = Math.random() * 14 - 7;
    obstacle.position.z = -30;
    obstacle.position.y = 0;

    // Add to scene and obstacles array
    scene.add(obstacle);
    obstacles.push(obstacle);
  }

  function checkCollisions() {
    const playerPosition = player.position.clone();
    const playerRadius = 0.5;

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const distance = playerPosition.distanceTo(obstacle.position);

      // Simple distance-based collision detection
      const collisionThreshold =
        playerRadius + obstacle.geometry.parameters.width / 2;

      if (
        distance < collisionThreshold &&
        Math.abs(playerPosition.z - obstacle.position.z) < 1
      ) {
        return true;
      }
    }

    return false;
  }

  function updateGame(currentTime) {
    if (!gameActive) return;

    // Create new obstacles at intervals
    if (currentTime - lastObstacleTime > obstacleInterval) {
      createObstacle();
      lastObstacleTime = currentTime;

      // Speed up game over time
      if (obstacleInterval > 500) {
        obstacleInterval -= 10;
      }
      if (obstacleSpeed < 0.5) {
        obstacleSpeed += 0.005;
      }
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      obstacle.position.z += obstacleSpeed;

      // Add rotation for visual effect
      obstacle.rotation.x += 0.01;
      obstacle.rotation.y += 0.01;

      // Remove obstacles that pass the player
      if (obstacle.position.z > -10) {
        if (obstacle.position.z > player.position.z + 2) {
          scene.remove(obstacle);
          obstacles.splice(i, 1);

          // Increase score
          score++;
          UIModule.updateScore(score);
        }
      }
    }

    // Check for collisions
    if (checkCollisions()) {
      endGame();
    }
  }

  function animate(currentTime) {
    requestAnimationFrame(animate);

    if (gameActive) {
      updateGame(currentTime);
    }

    renderer.render(scene, camera);
  }

  function startGame() {
    // Initialize the scene if not already initialized
    if (!scene) {
      initScene();
    }

    // Reset game variables
    score = 0;
    gameActive = true;
    obstacleSpeed = 0.2;
    obstacleInterval = 1500;

    // Clear existing obstacles
    obstacles.forEach((obstacle) => {
      scene.remove(obstacle);
    });
    obstacles = [];

    // Reinitialize player if undefined
    if (!player) {
      const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const playerMaterial = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        metalness: 0.3,
        roughness: 0.4,
      });
      player = new THREE.Mesh(playerGeometry, playerMaterial);
      player.position.y = 0;
      player.position.z = -15;
      scene.add(player);
    } else {
      // Reset player position
      player.position.set(0, 0, -15);
    }

    // Update UI
    UIModule.updateScore(score);
    UIModule.hideMenu();

    // Start animation loop if not already started
    if (!renderer) {
      animate();
    }
  }

  function endGame() {
    gameActive = false;

    // Update high score if needed
    AuthModule.updateHighScore(score);

    // Update UI
    UIModule.updateFinalScore(score);
    UIModule.showMenu("gameOver");
  }

  function cleanup() {
    if (renderer) {
      renderer.domElement.remove();
      renderer = null;
    }

    obstacles = [];
    scene = null;
    camera = null;
  }

  return {
    startGame,
    endGame,
    cleanup,
    getScore: () => score,
  };
})();

// Application Controller
const AppController = (function () {
  function init() {
    // Register event listeners
    document
      .getElementById("login-button")
      .addEventListener("click", handleLogin);
    document
      .getElementById("register-button")
      .addEventListener("click", handleRegister);
    document
      .getElementById("start-game-button")
      .addEventListener("click", handleStartGame);
    document
      .getElementById("restart-button")
      .addEventListener("click", handleStartGame);
    document
      .getElementById("menu-button")
      .addEventListener("click", handleMainMenu);
    document
      .getElementById("logout-button")
      .addEventListener("click", handleLogout);

    // Show login screen initially
    UIModule.showMenu("login");
  }

  function handleLogin() {
    const username = document.getElementById("username-input").value;
    const password = document.getElementById("password-input").value;

    if (!username || !password) {
      UIModule.setLoginMessage("Please enter both username and password", true);
      return;
    }

    const result = AuthModule.login(username, password);

    if (result.success) {
      UIModule.setLoginMessage(result.message);
      UIModule.updateUserDisplay(username);
      updateLeaderboard();
      UIModule.showMenu("mainMenu");
    } else {
      UIModule.setLoginMessage(result.message, true);
    }
  }

  function handleRegister() {
    const username = document.getElementById("username-input").value;
    const password = document.getElementById("password-input").value;

    if (!username || !password) {
      UIModule.setLoginMessage("Please enter both username and password", true);
      return;
    }

    const result = AuthModule.register(username, password);

    if (result.success) {
      UIModule.setLoginMessage(result.message);
      // Auto-login after registration
      handleLogin();
    } else {
      UIModule.setLoginMessage(result.message, true);
    }
  }

  function handleStartGame() {
    GameModule.startGame();
  }

  function handleMainMenu() {
    updateLeaderboard();
    UIModule.showMenu("mainMenu");
  }

  function handleLogout() {
    AuthModule.logout();
    UIModule.showMenu("login");
    document.getElementById("username-input").value = "";
    document.getElementById("password-input").value = "";
    UIModule.setLoginMessage("");
  }

  function updateLeaderboard() {
    const leaderboardData = AuthModule.getLeaderboard();
    UIModule.updateLeaderboard(leaderboardData);
  }

  return {
    init,
  };
})();

// Initialize application
document.addEventListener("DOMContentLoaded", AppController.init);
