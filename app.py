import os
import random

from flask import Flask, jsonify, render_template, session, request
from wordfreq import top_n_list

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-this-before-deployment")

# Build a pool of common five-letter English words once when the app starts.
WORDS = sorted({
    word.lower()
    for word in top_n_list("en", 50000)
    if len(word) == 5 and word.isalpha() and word.isascii()
})
WORD_SET = set(WORDS)


def new_game():
    session["secret_word"] = random.choice(WORDS)
    session["guesses"] = []
    session["game_over"] = False
    session["won"] = False


def score_guess(guess, answer):
    """Return Wordle-style feedback, correctly accounting for repeated letters."""
    result = ["gray"] * 5
    remaining = {}

    # First mark exact matches and count unmatched answer letters.
    for i, letter in enumerate(answer):
        if guess[i] == letter:
            result[i] = "green"
        else:
            remaining[letter] = remaining.get(letter, 0) + 1

    # Then mark letters that occur elsewhere, without over-counting duplicates.
    for i, letter in enumerate(guess):
        if result[i] == "green":
            continue
        if remaining.get(letter, 0) > 0:
            result[i] = "yellow"
            remaining[letter] -= 1

    return result


@app.route("/")
def index():
    if "secret_word" not in session:
        new_game()
    return render_template("index.html")


@app.post("/guess")
def submit_guess():
    if "secret_word" not in session:
        new_game()

    data = request.get_json(silent=True) or {}
    guess = str(data.get("guess", "")).strip().lower()

    if session.get("game_over"):
        return jsonify({"error": "This game is over. Start a new game to play again."}), 400

    if len(guess) != 5 or not guess.isalpha() or not guess.isascii():
        return jsonify({"error": "Enter a five-letter English word."}), 400

    if guess not in WORD_SET:
        return jsonify({"error": "That word isn't in the game's word list. Try a common English word."}), 400

    answer = session["secret_word"]
    feedback = score_guess(guess, answer)
    guesses = session.get("guesses", [])
    guesses.append({"word": guess, "feedback": feedback})

    won = guess == answer
    game_over = won or len(guesses) >= 6

    session["guesses"] = guesses
    session["won"] = won
    session["game_over"] = game_over

    return jsonify({
        "guess": guess,
        "feedback": feedback,
        "won": won,
        "game_over": game_over,
        "attempts_left": 6 - len(guesses),
        "answer": answer if game_over else None,
        "message": "You got it!" if won else (
            f"The word was {answer.upper()}." if game_over else ""
        ),
    })


@app.post("/new-game")
def start_new_game():
    new_game()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True)
