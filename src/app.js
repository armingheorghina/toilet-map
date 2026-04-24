import { getToilets, CLUJ_CENTER } from "./data.js";
import { createMap, renderToilets } from "./map.js";
import { loadCustomToilets, saveCustomToilets, createCustomToilet } from "./storage.js";
import { BUY_ME_A_COFFEE_USERNAME } from "./site-config.js";

const map = createMap({
  containerId: "map",
  center: CLUJ_CENTER
});

const statusMessage = document.querySelector("#status-message");
const zoomInButton = document.querySelector("#zoom-in-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const selectionCoordinates = document.querySelector("#selection-coordinates");
const addToiletForm = document.querySelector("#add-toilet-form");
const pickLocationButton = document.querySelector("#pick-location-button");
const useMapCenterButton = document.querySelector("#use-map-center-button");
const supportFooter = document.querySelector("#support-footer");
const supportLink = document.querySelector("#support-footer-link");

let osmToilets = [];
let customToilets = loadCustomToilets();
let markerLayer = null;
let placementMode = false;

function toiletsForMap() {
  return [...osmToilets, ...customToilets];
}

function updateStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = isError ? "error" : "normal";
}

function refreshMarkers() {
  if (markerLayer) {
    markerLayer.remove();
  }
  markerLayer = renderToilets(map, toiletsForMap());
}

function formatLatLng(latlng) {
  return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}

function updateCenterSummary() {
  selectionCoordinates.textContent = `Map center: ${formatLatLng(map.getCenter())}`;
}

function setPlacementMode(active) {
  placementMode = active;
  pickLocationButton.dataset.active = active ? "true" : "false";
  pickLocationButton.textContent = active ? "Tap the map to set location…" : "Pick on map";
  map.getContainer().classList.toggle("map--placing", active);
}

function initSupportFooter() {
  const slug = BUY_ME_A_COFFEE_USERNAME?.trim();
  if (!supportFooter || !supportLink || !slug) {
    return;
  }
  supportLink.href = `https://buymeacoffee.com/${encodeURIComponent(slug)}`;
  supportFooter.hidden = false;
}

function readFormLatLng() {
  const lat = Number(addToiletForm.querySelector('[name="lat"]').value);
  const lng = Number(addToiletForm.querySelector('[name="lng"]').value);
  return { lat, lng };
}

function handleAddToiletSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.querySelector('[name="name"]').value;
  const notes = form.querySelector('[name="notes"]').value;
  const { lat, lng } = readFormLatLng();

  if (!name.trim()) {
    updateStatus("Please enter a name for the toilet.", true);
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    updateStatus("Please set valid latitude and longitude.", true);
    return;
  }

  customToilets = [...customToilets, createCustomToilet({ name, notes, lat, lng })];
  saveCustomToilets(customToilets);
  refreshMarkers();
  form.reset();
  setPlacementMode(false);
  updateStatus(`Saved your toilet. ${toiletsForMap().length} markers on the map.`, false);
}

function handleMapClickForPlacement(event) {
  if (!placementMode) {
    return;
  }
  const { lat, lng } = event.latlng;
  addToiletForm.querySelector('[name="lat"]').value = lat.toFixed(6);
  addToiletForm.querySelector('[name="lng"]').value = lng.toFixed(6);
  setPlacementMode(false);
}

async function loadOsmToilets() {
  try {
    const result = await getToilets();
    osmToilets = result.toilets;
    refreshMarkers();
    updateStatus(result.message, result.usedFallback);
  } catch (error) {
    console.error(error);
    osmToilets = [];
    refreshMarkers();
    updateStatus("The map loaded, but toilet data could not be loaded right now.", true);
  }
}

map.on("moveend", updateCenterSummary);
map.on("click", handleMapClickForPlacement);

zoomInButton.addEventListener("click", () => map.zoomIn());
zoomOutButton.addEventListener("click", () => map.zoomOut());

pickLocationButton.addEventListener("click", () => {
  setPlacementMode(!placementMode);
});

useMapCenterButton.addEventListener("click", () => {
  const c = map.getCenter();
  addToiletForm.querySelector('[name="lat"]').value = c.lat.toFixed(6);
  addToiletForm.querySelector('[name="lng"]').value = c.lng.toFixed(6);
  setPlacementMode(false);
});

addToiletForm.addEventListener("submit", handleAddToiletSubmit);

updateCenterSummary();
initSupportFooter();
loadOsmToilets();
