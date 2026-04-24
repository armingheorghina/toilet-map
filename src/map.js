const osmIcon = L.divIcon({
  className: "custom-div-icon",
  html: '<span class="marker marker-osm" aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10]
});

const customIcon = L.divIcon({
  className: "custom-div-icon",
  html: '<span class="marker marker-custom" aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10]
});

function buildDetailsList(toilet) {
  const details = [
    ["Source", toilet.source === "custom" ? "Custom location" : "OpenStreetMap"],
    ["Access", toilet.access],
    ["Fee", toilet.fee],
    ["Wheelchair", toilet.wheelchair],
    ["Opening hours", toilet.openingHours],
    ["Notes", toilet.notes]
  ].filter(([, value]) => value);

  if (details.length === 0) {
    return "<p class=\"popup-empty\">No extra details available.</p>";
  }

  const rows = details
    .map(
      ([label, value]) =>
        `<div class="popup-row"><span class="popup-label">${label}</span><span>${value}</span></div>`
    )
    .join("");

  return `<div class="popup-details">${rows}</div>`;
}

function createPopupContent(toilet) {
  return `
    <article class="popup-card">
      <h3>${toilet.name}</h3>
      ${buildDetailsList(toilet)}
    </article>
  `;
}

function buildMarker(toilet) {
  return L.marker([toilet.lat, toilet.lng], {
    icon: toilet.source === "custom" ? customIcon : osmIcon,
    title: toilet.name
  }).bindPopup(createPopupContent(toilet));
}

export function createMap({ containerId, center }) {
  const map = L.map(containerId, {
    center: [center.lat, center.lng],
    zoom: center.zoom,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}

export function renderToilets(map, toilets) {
  const markers = toilets.map(buildMarker);
  const layerGroup = L.layerGroup(markers).addTo(map);
  return layerGroup;
}
