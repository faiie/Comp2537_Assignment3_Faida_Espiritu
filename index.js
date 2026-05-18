// Game state
let firstCard = undefined;
let secondCard = undefined;
let lockBoard = false;
let clicks = 0;
let matchedPairs = 0;
let totalPairs = 0;
let timeLeft = 0;
let timerInterval = undefined;
let gameStarted = false;
let difficulty = "easy";
let allPokemon = [];

// Difficulty settings
const difficultySettings = {
  easy:   { pairs: 3,  time: 60  },
  medium: { pairs: 6,  time: 90  },
  hard:   { pairs: 10, time: 120 }
};

// Fetch all pokemon on load
async function fetchAllPokemon() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
  const data = await response.json();
  allPokemon = data.results;
}

// Get random pokemon images
async function getRandomPokemon(count) {
  const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  const pokemonData = await Promise.all(
    selected.map(async (p) => {
      const res = await fetch(p.url);
      const data = await res.json();
      return {
        name: data.name,
        img: data.sprites.other["official-artwork"].front_default
      };
    })
  );
  return pokemonData;
}

// Reset all game state completely
function resetGameState() {
  clearInterval(timerInterval);
  timerInterval = undefined;
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
  clicks = 0;
  matchedPairs = 0;
  gameStarted = false;
  $("#message").text("");
  $("#game_grid").replaceWith('<div id="game_grid"></div>');
}

// Build the game grid
async function buildGrid() {
  resetGameState();

  const settings = difficultySettings[difficulty];
  totalPairs = settings.pairs;
  timeLeft = settings.time;

  updateStatus();
  $("#message").text("Loading Pokemon...");
  
  $("#start-btn").prop("disabled", true);
  $("#reset-btn").prop("disabled", true);

  const pokemon = await getRandomPokemon(totalPairs);
  const cards = [...pokemon, ...pokemon].sort(() => Math.random() - 0.5);

  $("#message").text("");
  
  $("#start-btn").prop("disabled", false);
  $("#reset-btn").prop("disabled", false);

  cards.forEach((p) => {
    const card = $(`
      <div class="card" data-name="${p.name}">
        <img class="front_face" src="${p.img}" alt="${p.name}">
        <img class="back_face" src="back.webp" alt="back">
      </div>
    `);
    $("#game_grid").append(card);
  });

  attachCardListeners();
}

function attachCardListeners() {
  $("#game_grid").off("click", ".card");
  $("#game_grid").on("click", ".card", function () {
    if (lockBoard) return;
    if ($(this).hasClass("flip")) return;
    if ($(this).hasClass("matched")) return;

    $(this).addClass("flip");
    clicks++;
    updateStatus();

    if (!firstCard) {
      firstCard = $(this);
    } else {
      secondCard = $(this);
      lockBoard = true;
      checkMatch();
    }
  });
}

// Check if two flipped cards match
function checkMatch() {
  const isMatch = firstCard.data("name") === secondCard.data("name");

  if (isMatch) {
    firstCard.addClass("matched");
    secondCard.addClass("matched");
    matchedPairs++;
    updateStatus();
    resetTurn();

    if (matchedPairs === totalPairs) {
      winGame();
    }
  } else {
    setTimeout(() => {
      firstCard.removeClass("flip");
      secondCard.removeClass("flip");
      resetTurn();
    }, 1000);
  }
}

function resetTurn() {
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
}

// Update status bar
function updateStatus() {
  $("#clicks").text(clicks);
  $("#matched").text(matchedPairs);
  $("#pairs-left").text(totalPairs - matchedPairs);
  $("#total-pairs").text(totalPairs);
  $("#timer").text(timeLeft);
}

// Start countdown timer
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      loseGame();
    }
  }, 1000);
}

// Win the game
function winGame() {
  clearInterval(timerInterval);
  gameStarted = false;
  $("#message").text("You Win! All Pokemon matched!");
  $("#game_grid").off("click", ".card");
}

// Lose the game
function loseGame() {
  gameStarted = false;
  $("#message").text("Game Over! Time ran out!");
  $("#game_grid").off("click", ".card");
  $(".card:not(.matched)").addClass("flip");
}

$("#start-btn").on("click", async function () {
  await buildGrid();
  gameStarted = true;
  startTimer();
});

$("#reset-btn").on("click", async function () {
  await buildGrid();
  gameStarted = true;
  startTimer();
});

$(".diff-btn").on("click", function () {
  $(".diff-btn").removeClass("active");
  $(this).addClass("active");
  difficulty = $(this).attr("id");
});

$("#theme-btn").on("click", function () {
  $("body").toggleClass("light dark");
  if ($("body").hasClass("dark")) {
    $(this).text("Light Mode");
  } else {
    $(this).text("Dark Mode");
  }
});

// Power up 
$("#powerup-btn").on("click", function () {
  if (!gameStarted) return;
  clearInterval(timerInterval);
  $("#message").text("Power Up! Memorize the cards!");
  $(".card:not(.matched)").addClass("flip");

  setTimeout(() => {
    $(".card:not(.matched)").removeClass("flip");
    if (firstCard) firstCard.addClass("flip");
    if (secondCard) secondCard.addClass("flip");
    $("#message").text("");
    startTimer();
  }, 3000);
});

$(document).ready(async function () {
  await fetchAllPokemon();
  updateStatus();
});