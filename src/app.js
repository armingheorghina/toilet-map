import { getToilets, CLUJ_CENTER } from "./data.js";
import { createMap, renderToilets } from "./map.js";
import { createCustomToilet, loadCustomToilets, saveCustomToilets } from "./storage.js";

const map = createMap({
  containerId: "map",
  center: CLUJ_CENTER
});

const statusMessage = document.querySelector("#status-message");
const addToiletButton = document.querySelector("#add-toilet-button");
const addToiletDialog = document.querySelector("#add-toilet-dialog");
const addToiletForm = document.querySelector("#add-toilet-form");
const closeDialogButton = document.querySelector("#close-dialog-button");
const useMapHintButton = document.querySelector("#use-map-hint-button");
const pickOnMapButton = document.querySelector("#pick-on-map-button");
const zoomInButton = document.querySelector("#zoom-in-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const latInput = document.querySelector("#toilet-lat");
const lngInput = document.querySelector("#toilet-lng");
const nameInput = document.querySelector("#toilet-name");
const notesInput = document.querySelector("#toilet-notes");
const selectionCoordinates = document.querySelector("#selection-coordinates");
const dialogSelectionHint = document.querySelector("#dialog-selection-hint");

let osmToilets = [];
let customToilets = loadCustomToilets();
let currentLayer = null;
let selectedLatLng = null;
let pickModeEnabled = false;
let selectionMarker = null;

function updateStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = isError ? "error" : "normal";
}

function refreshMarkers() {
  if (currentLayer) {
    currentLayer.remove();
  }

  currentLayer = renderToilets(map, [...osmToilets, ...customToilets]);
}

function openDialog() {
  if (!selectedLatLng) {
    storeSelectedLatLng(map.getCenter());
  }

  addToiletDialog.showModal();
  nameInput.focus();
}

function closeDialog() {
  addToiletDialog.close();
}

function formatLatLng(latlng) {
  return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}

function updateSelectionSummary() {
  if (!selectedLatLng) {
    selectionCoordinates.textContent = "No map location selected yet.";
    dialogSelectionHint.textContent = "No map point selected yet. The current map center will be used.";
    return;
  }

  const formatted = formatLatLng(selectedLatLng);
  selectionCoordinates.textContent = formatted;
  dialogSelectionHint.textContent = `Selected map point: ${formatted}`;
}

function refreshSelectionMarker() {
  if (selectionMarker) {
    selectionMarker.remove();
    selectionMarker = null;
  }

  if (!selectedLatLng) {
    return;
  }

  selectionMarker = L.circleMarker([selectedLatLng.lat, selectedLatLng.lng], {
    radius: 10,
    weight: 3,
    color: "#dc5f00",
    fillColor: "#fff4e8",
    fillOpacity: 0.9
  }).addTo(map);
}

function setPickMode(enabled) {
  pickModeEnabled = enabled;
  pickOnMapButton.textContent = enabled ? "Picking..." : "Pick on map";
  pickOnMapButton.dataset.active = enabled ? "true" : "false";
}

function storeSelectedLatLng(latlng) {
  selectedLatLng = latlng;
  latInput.value = latlng.lat.toFixed(6);
  lngInput.value = latlng.lng.toFixed(6);
  updateSelectionSummary();
  refreshSelectionMarker();
}

async function initialize() {
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

map.on("click", (event) => {
  storeSelectedLatLng(event.latlng);

  if (pickModeEnabled) {
    setPickMode(false);
    window.setTimeout(openDialog, 0);
    updateStatus("Map point selected. Add the toilet details and save.");
  } else if (addToiletDialog.open) {
    updateStatus("Map position updated for the custom toilet form.");
  } else {
    updateStatus("Map position saved. Tap Add toilet to create a custom marker.");
  }
});

addToiletButton.addEventListener("click", openDialog);
closeDialogButton.addEventListener("click", closeDialog);
pickOnMapButton.addEventListener("click", () => {
  const nextState = !pickModeEnabled;
  setPickMode(nextState);
  updateStatus(
    nextState
      ? "Pick mode is on. Tap the map to choose a location for a custom toilet."
      : "Pick mode is off."
  );
});
useMapHintButton.addEventListener("click", () => {
  storeSelectedLatLng(map.getCenter());
  updateStatus("Coordinates were updated using the current map center.");
});

addToiletForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const customToilet = createCustomToilet({
    name: nameInput.value,
    notes: notesInput.value,
    lat: latInput.value,
    lng: lngInput.value
  });

  customToilets = [...customToilets, customToilet];
  saveCustomToilets(customToilets);
  refreshMarkers();
  storeSelectedLatLng({ lat: customToilet.lat, lng: customToilet.lng });
  map.setView([customToilet.lat, customToilet.lng], Math.max(map.getZoom(), 16));
  setPickMode(false);
  closeDialog();
  addToiletForm.reset();
  updateStatus(`Saved custom toilet "${customToilet.name}" on this device.`);
});

zoomInButton.addEventListener("click", () => map.zoomIn());
zoomOutButton.addEventListener("click", () => map.zoomOut());

updateSelectionSummary();
initialize();
