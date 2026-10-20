# Python Wordle Web App

A small Wordle-style web app built with Python, Flask, HTML, CSS, and JavaScript.

## 1. Install dependencies

Open a terminal in this folder and run:

```powershell
python -m pip install -r requirements.txt
```

## 2. Start the app

```powershell
python app.py
```

Open the local URL printed in the terminal, usually http://127.0.0.1:5000.

## 3. How it works

- `app.py`: Flask server, random word selection, and guess scoring.
- `templates/index.html`: page structure.
- `static/style.css`: visual design and responsive layout.
- `static/game.js`: interactive board, keyboard, and requests to Python.
- `requirements.txt`: Python packages needed by the app.

The word list is built from common English words provided by `wordfreq`. Guesses must be present in that word list.

## Notes

This is a learning project. Before deploying publicly, set a strong `SECRET_KEY` environment variable and turn off Flask debug mode.
