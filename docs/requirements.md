# Cluj-Napoca Public Toilets Map

## Purpose

Build a mobile-friendly website that shows public toilets in Cluj-Napoca on top of OpenStreetMap data. The site must make it easy for users to browse known toilet locations, zoom the map, and add custom toilet locations manually.

This document is intended as a handoff specification for another agent to implement the project in this git repository.

## Product Goals

- Show a map centered on Cluj-Napoca, Romania.
- Highlight public toilet locations from OpenStreetMap-related data.
- Provide a simple and touch-friendly mobile interface.
- Allow end users to add custom toilet locations.
- Keep the project simple to run and maintain.

## Core User Stories

1. As a mobile user, I can open the site and immediately see a map centered on Cluj-Napoca.
2. As a user, I can see all known public toilets currently available for the city.
3. As a user, I can zoom in and zoom out using simple on-screen controls.
4. As a user, I can tap the map or use a form to add a custom toilet location.
5. As a user, I can distinguish between OpenStreetMap-sourced toilets and my custom-added toilets.
6. As a user, I can use the site comfortably on a phone without horizontal scrolling or tiny controls.

## Scope

### In Scope

- Single-page website.
- OpenStreetMap-based map display.
- Toilet markers for Cluj-Napoca.
- Simple zoom in / zoom out controls.
- Add custom toilet locations from the UI.
- Basic details for each toilet marker.
- Mobile-first responsive design.
- Source code and documentation saved in this git repo.

### Out of Scope

- User authentication.
- Backend database.
- Multi-city support.
- Advanced route planning.
- Moderation workflow.
- Admin panel.

## Recommended Technical Direction

The implementation agent may choose equivalent tools, but the default recommendation is:

- Map library: Leaflet
- Basemap tiles: OpenStreetMap tiles or another OSM-compatible tile provider with a compatible usage policy
- Toilet source data: OpenStreetMap / Overpass API query for Cluj-Napoca area
- Frontend: simple static app using HTML, CSS, and JavaScript or a lightweight framework if justified
- Persistence for custom locations: browser local storage for MVP

Reasoning:

- Leaflet is lightweight, mobile-friendly, and works well with OSM.
- Overpass is a practical way to pull `amenity=toilets` data for a specific city.
- Local storage keeps MVP complexity low while still supporting user-added entries.

## Functional Requirements

### 1. Map Display

- The homepage must load a map centered on Cluj-Napoca.
- The initial zoom level must show the city area clearly on mobile.
- The map must use OpenStreetMap-based tiles.
- The map must fill most of the mobile viewport without breaking layout.

### 2. Public Toilet Data

- The app must display public toilet locations for Cluj-Napoca.
- The initial implementation should query or load OpenStreetMap-derived data for toilets in the city.
- Each toilet location must be represented by a visible marker.
- Marker popups or detail cards should show available metadata when present, such as:
  - name
  - access
  - fee
  - wheelchair accessibility
  - opening hours
  - source type

### 3. Custom Toilet Locations

- Users must be able to add a custom toilet location from the UI.
- The add flow should support at least one of these interactions:
  - tap or long-press on the map to place a marker
  - use a visible "Add toilet" action that opens a small form
- The add form should support:
  - title or label
  - optional notes
  - latitude
  - longitude
- If the user adds by tapping the map, latitude and longitude should be filled automatically.
- Custom toilets must be visually different from OSM-sourced toilets.
- Custom toilets must persist across page reloads for the same browser, using local storage for MVP.

### 4. Zoom Controls

- The UI must include simple visible controls for zoom in and zoom out.
- Controls must be large enough for touch interaction on mobile.
- Controls must remain accessible without obscuring the map too much.

### 5. Marker Details

- Tapping a marker must open a popup, sheet, or compact detail view.
- The detail view must identify whether the toilet is from OSM data or custom user data.
- Custom markers should show user-entered fields.

### 6. Error Handling

- If toilet data cannot be loaded, the app must show a friendly inline error state.
- The map should still load even if external toilet data fails.
- The UI should avoid blank-screen failure states.

## Data Requirements

### OSM Data

- Use OpenStreetMap-compatible data for public toilets, ideally via Overpass query.
- Target locations inside Cluj-Napoca administrative or bounding area.
- Prefer `amenity=toilets`.
- The implementation should normalize incoming data into a consistent frontend structure.

Suggested normalized shape:

```js
{
  id: "string",
  source: "osm" | "custom",
  name: "string",
  lat: 46.77,
  lng: 23.59,
  access: "yes" | "customers" | "private" | null,
  fee: "yes" | "no" | null,
  wheelchair: "yes" | "limited" | "no" | null,
  openingHours: "string|null",
  notes: "string|null"
}
```

### Custom Data

- Store custom toilets in local storage under a predictable key.
- On app load, merge custom toilets with OSM toilets for display.
- Prevent duplicate custom IDs by generating unique local IDs.

## UX Requirements

- Mobile-first design is required.
- The page must be usable at common phone widths such as 360px and 390px.
- Controls must be finger-friendly.
- Text must remain readable without zooming the browser.
- Keep the interface intentionally simple:
  - map is the main focus
  - one clear add action
  - simple zoom controls
  - lightweight popup/details

## Visual / UI Requirements

- Clean, minimal interface.
- No cluttered sidebars on mobile.
- Use contrasting marker styles:
  - one style for OSM toilets
  - one style for custom toilets
- Include a small legend or label system if needed to clarify marker types.

## Non-Functional Requirements

- Fast initial load on mobile.
- Basic accessibility:
  - buttons must have accessible labels
  - color contrast should be reasonable
  - forms should have labels
- Code should be organized and understandable for future extension.
- Project should run locally with straightforward setup steps.

## Suggested Project Structure

This is only a recommendation:

```text
/docs
  requirements.md
/src
  app.js
  map.js
  data.js
  storage.js
  styles.css
/public
  ...
README.md
```

## Delivery Requirements

The implementation agent should:

1. Build the website inside this repo.
2. Include a README with:
   - project purpose
   - setup steps
   - run steps
   - data source notes
   - limitations
3. Keep the implementation simple and MVP-focused.
4. Make sure the project is committed to git.

## Acceptance Criteria

- Opening the app shows a map centered on Cluj-Napoca.
- Public toilet markers appear on the map from OSM-derived data.
- Users can zoom in and zoom out via visible UI controls.
- Users can add a custom toilet location from the UI.
- Custom toilet markers persist after page refresh in the same browser.
- The layout works on mobile without broken spacing or horizontal scrolling.
- OSM toilets and custom toilets are visually distinguishable.
- A friendly error message appears if external toilet data cannot be loaded.

## Notes For The Implementation Agent

- Favor a reliable MVP over a feature-heavy architecture.
- If Overpass rate limits or availability become a problem during development, use a cached sample dataset as a fallback, but preserve the intended OSM-based behavior.
- Keep external dependencies light unless there is a clear reason to add more.
- Do not build a backend unless requirements change.
