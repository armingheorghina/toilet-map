import { MAPTILER_API_KEY } from "./maptiler-config.js";
import { addReview, getDefaultStarDisplay } from "./reviews.js";

const TOILET_ICON_URL = "./src/toilet.png";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createMarkerElement(kind) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `toilet-marker-hit toilet-marker-hit--${kind}`;
  el.innerHTML = `
    <span class="toilet-marker toilet-marker-${kind}" aria-hidden="true">
      <img src="${TOILET_ICON_URL}" class="toilet-marker-image" alt="">
    </span>
  `;
  return el;
}

/** OSM: `fee`, `charge` (amount), sometimes monetary value in `fee` itself. */
function feeLabelAndClass(toilet) {
  const feeTag = toilet.fee != null ? String(toilet.fee).trim() : "";
  const feeLower = feeTag.toLowerCase();
  const charge = toilet.charge != null ? String(toilet.charge).trim() : "";

  if (feeLower === "no" || feeLower === "free" || feeLower === "no_fee") {
    return { text: "Free", className: "popup-fee-tag--free" };
  }

  if (charge) {
    return { text: charge, className: "popup-fee-tag--paid" };
  }

  if (feeLower === "yes") {
    return { text: "Paid", className: "popup-fee-tag--paid" };
  }

  if (feeLower === "donation") {
    return { text: "Donation", className: "popup-fee-tag--donation" };
  }

  if (feeTag && feeLower !== "no") {
    return { text: feeTag, className: "popup-fee-tag--paid" };
  }

  return { text: "Free", className: "popup-fee-tag--free" };
}

const MAPS_NAV_ICON = `<svg class="popup-card__nav-icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>`;

function googleMapsUrl(toilet) {
  const lat = Number(toilet.lat);
  const lng = Number(toilet.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "https://www.google.com/maps";
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function reviewsStarsButtonsHtml() {
  return [1, 2, 3, 4, 5]
    .map(
      (v) =>
        `<button type="button" class="popup-star" data-value="${v}" aria-label="${v} out of 5 stars">★</button>`
    )
    .join("");
}

function reviewsSectionHtml() {
  return `
    <div class="popup-reviews">
      <p class="popup-reviews__hint"><strong>Rating</strong></p>
      <div class="popup-reviews__stars" data-role="stars" data-display="5" role="radiogroup" aria-label="Star rating">
        ${reviewsStarsButtonsHtml()}
      </div>
    </div>
  `;
}

function popupActionsHtml(mapsHref) {
  return `
    <div class="popup-actions">
      <a class="popup-actions__btn popup-actions__btn--maps" href="${escapeHtml(mapsHref)}" target="_blank" rel="noopener noreferrer">
        ${MAPS_NAV_ICON}
        <span class="popup-actions__maps-label">Open in maps</span>
      </a>
    </div>
  `;
}

function createPopupContent(toilet) {
  const fee = feeLabelAndClass(toilet);
  const mapsHref = googleMapsUrl(toilet);
  const idAttr = encodeURIComponent(toilet.id);

  return `
    <article class="popup-card popup-card--compact" data-toilet-id="${idAttr}">
      <h3 class="popup-card__title">${escapeHtml(toilet.name)}</h3>
      <dl class="popup-card__rows">
        <div class="popup-card__row">
          <dt>Fee</dt>
          <dd><span class="popup-fee-tag ${fee.className}">${escapeHtml(fee.text)}</span></dd>
        </div>
      </dl>
      ${reviewsSectionHtml()}
      ${popupActionsHtml(mapsHref)}
    </article>
  `;
}

function wirePopupStars(popup, toiletId, signal) {
  const root = popup.getElement();
  if (!root) {
    return;
  }

  const starsWrap = root.querySelector("[data-role=\"stars\"]");
  if (!starsWrap) {
    return;
  }

  const starButtons = [...starsWrap.querySelectorAll(".popup-star")];

  function syncDisplayFromStats() {
    const n = getDefaultStarDisplay(toiletId);
    starsWrap.dataset.display = String(n);
  }

  function paintStars() {
    const displayN = Number(starsWrap.dataset.display) || 5;
    const cap = hoverValue > 0 ? hoverValue : displayN;
    starButtons.forEach((btn) => {
      const v = Number(btn.dataset.value);
      btn.classList.toggle("popup-star--on", v <= cap);
    });
  }

  let hoverValue = 0;
  syncDisplayFromStats();
  paintStars();

  const onLeave = () => {
    hoverValue = 0;
    paintStars();
  };
  starsWrap.addEventListener("mouseleave", onLeave, { signal });

  starButtons.forEach((btn) => {
    const v = Number(btn.dataset.value);
    btn.addEventListener(
      "mouseenter",
      () => {
        hoverValue = v;
        paintStars();
      },
      { signal }
    );
    btn.addEventListener(
      "click",
      () => {
        addReview(toiletId, v);
        syncDisplayFromStats();
        hoverValue = 0;
        paintStars();
      },
      { signal }
    );
  });
}

function buildMarker(map, toilet) {
  const kind = toilet.source === "custom" ? "custom" : "osm";
  const el = createMarkerElement(kind);
  el.setAttribute("aria-label", toilet.name);
  el.title = toilet.name;

  const popup = new mapboxgl.Popup({
    offset: 20,
    maxWidth: "260px",
    className: "toilet-ml-popup",
    closeButton: true,
    closeOnClick: true
  }).setHTML(createPopupContent(toilet));

  popup.on("open", () => {
    popup._starsAbort?.abort();
    popup._starsAbort = new AbortController();
    wirePopupStars(popup, toilet.id, popup._starsAbort.signal);
  });
  popup.on("close", () => {
    popup._starsAbort?.abort();
  });

  return new mapboxgl.Marker({ element: el, anchor: "center" })
    .setLngLat([toilet.lng, toilet.lat])
    .setPopup(popup)
    .addTo(map);
}

export function createMap({ containerId, center }) {
  if (typeof mapboxgl === "undefined") {
    throw new Error("Mapbox GL JS failed to load. Check the mapbox-gl script in index.html.");
  }

  const mapTilerKey = MAPTILER_API_KEY?.trim() || "";
  if (!mapTilerKey) {
    console.warn(
      "MapTiler: missing MAPTILER_API_KEY. Copy src/maptiler-config.example.js to src/maptiler-config.js and add your key."
    );
  }

  const map = new mapboxgl.Map({
    container: containerId,
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(mapTilerKey)}`,
    center: [center.lng, center.lat],
    zoom: center.zoom,
    attributionControl: false
  });

  map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

  return map;
}

export function renderToilets(map, toilets) {
  if (!map) {
    return { remove() {} };
  }
  const markers = toilets.map((t) => buildMarker(map, t));
  return {
    remove() {
      markers.forEach((m) => m.remove());
    }
  };
}
