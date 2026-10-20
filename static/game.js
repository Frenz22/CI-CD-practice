const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const message = document.querySelector("#message");
const newGameButton = document.querySelector("#new-game-button");
const helpButton = document.querySelector("#help-button");
const helpDialog = document.querySelector("#help-dialog");
const closeHelp = document.querySelector("#close-help");

const ROWS = 6;
const COLS = 5;
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

let currentGuess = "";
let currentRow = 0;
let finished = false;
let sending = false;
const keyStates = {};

function buildBoard() {
  board.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    const rowElement = document.createElement("div");
    rowElement.className = "board-row";
    rowElement.dataset.row = row;

    for (let col = 0; col < COLS; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.col = col;
      rowElement.appendChild(tile);
    }
    board.appendChild(rowElement);
  }
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  keyboardRows.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "keyboard-row";

    if (rowIndex === 2) row.appendChild(makeKey("ENTER", "wide"));
    for (const letter of letters) row.appendChild(makeKey(letter));
    if (rowIndex === 2) row.appendChild(makeKey("⌫", "wide"));

    keyboard.appendChild(row);
  });
}

function makeKey(value, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key ${extraClass}`.trim();
  button.textContent = value;
  button.dataset.key = value;
  button.addEventListener("click", () => handleKey(value));
  return button;
}

function paintCurrentGuess() {
  const row = board.children[currentRow];
  if (!row) return;

  [...row.children].forEach((tile, index) => {
    tile.textContent = currentGuess[index] || "";
    tile.classList.toggle("filled", Boolean(currentGuess[index]));
  });
}

function setMessage(text) {
  message.textContent = text;
}

function handleKey(key) {
  if (finished || sending) return;

  if (key === "ENTER") {
    submitGuess();
  } else if (key === "⌫" || key === "BACKSPACE") {
    currentGuess = currentGuess.slice(0, -1);
    paintCurrentGuess();
  } else if (/^[a-z]$/i.test(key) && currentGuess.length < COLS) {
    currentGuess += key.toUpperCase();
    paintCurrentGuess();
  }
}

async function submitGuess() {
  if (currentGuess.length !== COLS) {
    setMessage("Enter five letters first.");
    return;
  }

  sending = true;
  setMessage("Checking word…");

  try {
    const response = await fetch("/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess: currentGuess })
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Something went wrong.");
      return;
    }

    const row = board.children[currentRow];
    [...row.children].forEach((tile, index) => {
      const letter = currentGuess[index];
      const color = data.feedback[index];
      tile.textContent = letter;
      tile.classList.add(color);
      tile.classList.remove("filled");

      const oldState = keyStates[letter];
      const priority = { gray: 1, yellow: 2, green: 3 };
      if (!oldState || priority[color] > priority[oldState]) {
        keyStates[letter] = color;
      }
    });

    updateKeyboard();
    currentRow++;
    currentGuess = "";

    if (data.won) {
      finished = true;
      setMessage("🎉 You got it!");
    } else if (data.game_over) {
      finished = true;
      setMessage(`Game over! The word was ${data.answer.toUpperCase()}.`);
    } else {
      setMessage(`${data.attempts_left} attempts left.`);
    }
  } catch (error) {
    setMessage("Couldn't reach the game server. Please try again.");
  } finally {
    sending = false;
  }
}

function updateKeyboard() {
  document.querySelectorAll(".key[data-key]").forEach(button => {
    const state = keyStates[button.dataset.key];
    if (state) {
      button.classList.remove("green", "yellow", "gray");
      button.classList.add(state);
    }
  });
}

async function startNewGame() {
  sending = true;
  try {
    const response = await fetch("/new-game", { method: "POST" });
    if (!response.ok) throw new Error("Could not start a new game.");

    currentGuess = "";
    currentRow = 0;
    finished = false;
    Object.keys(keyStates).forEach(key => delete keyStates[key]);
    buildBoard();
    buildKeyboard();
    setMessage("");
  } catch (error) {
    setMessage("Couldn't start a new game. Refresh the page and try again.");
  } finally {
    sending = false;
  }
}

document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key === "Enter") handleKey("ENTER");
  else if (event.key === "Backspace") handleKey("BACKSPACE");
  else if (/^[a-z]$/i.test(event.key)) handleKey(event.key);
});

newGameButton.addEventListener("click", startNewGame);
helpButton.addEventListener("click", () => helpDialog.showModal());
closeHelp.addEventListener("click", () => helpDialog.close());

buildBoard();
buildKeyboard();
