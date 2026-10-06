# ServiceNow KB Autosave

## Start the app

1. Extract this ZIP to a normal folder such as Documents.
2. Open the extracted `ServiceNow-KB-Autosave` folder.
3. Double-click `Start ServiceNow KB.bat`.
4. A small command window stays open while the app is running.
5. Your browser opens to the editor automatically.

## Autosave behavior

As you type, the article is saved directly into the local `articles` folder.

The save waits about half a second after typing, which avoids excessive disk writes while still feeling immediate.

## Requirements

- Windows
- Python 3
- No third-party Python packages are required

The launcher checks for either `py` or `python`.

## Stop the app

Close the command window that opened when you launched the app.

## Article files

Every article is a real `.html` file inside the `articles` folder. You can back up, move, copy, or edit those files independently.
