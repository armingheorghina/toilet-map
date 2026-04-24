# Implementation Brief

## Goal

Ship an MVP static website for mobile users that shows public toilets in Cluj-Napoca on an OpenStreetMap-based map and supports local custom markers.

## Recommended Delivery Order

1. Build the static page shell and mobile layout.
2. Add Leaflet map rendering with OpenStreetMap tiles.
3. Load toilet data from Overpass.
4. Add fallback sample data for reliability.
5. Add custom toilet creation and local storage persistence.
6. Verify mobile behavior and marker interactions.
7. Finalize README and git commit.

## Suggested Tasks

### Product / UX

- Keep the map as the main focus.
- Use a compact header and one visible call to action.
- Make zoom controls obvious and touch-friendly.
- Differentiate OSM markers from custom markers clearly.

### Data

- Query `amenity=toilets` in Cluj-Napoca from Overpass.
- Normalize results before rendering.
- Merge remote and local custom data into one marker layer.
- Show a clear message when falling back to local sample data.

### Frontend

- Prefer plain HTML, CSS, and JavaScript for the MVP.
- Avoid backend dependencies.
- Use local storage for custom toilet persistence.
- Keep the code split into small modules:
  - `data.js`
  - `map.js`
  - `storage.js`
  - `app.js`

### Quality Bar

- No horizontal scrolling on mobile.
- Buttons must be usable by touch.
- Map must still render if the live data source fails.
- Custom markers must survive page refresh.

## Handoff Definition Of Done

- Requirements doc exists.
- MVP site exists in the repo.
- README explains how to run it.
- Repo has an initial commit with the created files.
