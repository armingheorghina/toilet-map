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
const zoomInButton = document.querySelector("#zoom-in-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const latInput = document.querySelector("#toilet-lat");
const lngInput = document.querySelector("#toilet-lng");
const nameInput = document.querySelector("#toilet-name");
const notesInput = document.querySelector("#toilet-notes");

let osmToilets = [];
let customToilets = loadCustomToilets();
let currentLayer = null;
let selectedLatLng = null;

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
    selectedLatLng = map.getCenter();
  }

  latInput.value = selectedLatLng.lat.toFixed(6);
  lngInput.value = selectedLatLng.lng.toFixed(6);
  addToiletDialog.showModal();
  nameInput.focus();
}

function closeDialog() {
  addToiletDialog.close();
}

function storeSelectedLatLng(latlng) {
  selectedLatLng = latlng;
  latInput.value = latlng.lat.toFixed(6);
  lngInput.value = latlng.lng.toFixed(6);
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

  if (addToiletDialog.open) {
    updateStatus("Map position updated for the custom toilet form.");
  } else {
    updateStatus("Map position saved. Tap Add toilet to create a custom marker.");
  }
});

addToiletButton.addEventListener("click", openDialog);
closeDialogButton.addEventListener("click", closeDialog);
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
  closeDialog();
  addToiletForm.reset();
  updateStatus(`Saved custom toilet "${customToilet.name}" on this device.`);
});

zoomInButton.addEventListener("click", () => map.zoomIn());
zoomOutButton.addEventListener("click", () => map.zoomOut());

initialize();
