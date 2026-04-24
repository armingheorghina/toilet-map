# Cluj Public Toilets Map

Mobile-friendly OpenStreetMap-based website for viewing public toilets in Cluj-Napoca and saving custom toilet locations locally in the browser.

## Features

- Map centered on Cluj-Napoca
- OpenStreetMap tile layer
- Public toilet markers loaded from Overpass when available
- Local fallback toilet dataset for reliability
- Custom toilet creation with local storage persistence
- Touch-friendly zoom controls
- Marker popups with source and metadata

## Project Structure

```text
.
|-- docs/
|   |-- implementation-brief.md
|   `-- requirements.md
|-- src/
|   |-- app.js
|   |-- data.js
|   |-- fallback-toilets.json
|   |-- map.js
|   |-- storage.js
|   `-- styles.css
`-- index.html
```

## How To Run

Because this project uses ES modules in the browser, run it from a local web server instead of opening `index.html` directly from the filesystem.

Example using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Data Notes

- Live toilet data is requested from the Overpass API using OpenStreetMap tags.
- The query targets `amenity=toilets` for Cluj-Napoca.
- If the live request fails, the app falls back to a small local dataset so the UI still works.

## Limitations

- Custom toilets are stored only in the current browser via local storage.
- The fallback dataset is intentionally small and only exists to keep the app usable when live data is unavailable.
- Overpass availability and response size can vary.
