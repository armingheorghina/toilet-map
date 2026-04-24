import { MAPBOX_ACCESS_TOKEN } from "./mapbox-config.js";
import { addReview, getDefaultStarDisplay } from "./reviews.js";

const TOILET_ICON_URL = "./src/toilet.png";

/**
 * Mapbox style JSON URL for MapLibre.
 * Use `/styles/v1/.../outdoors-v12?access_token=` — `/style.json` on this path returns 404.
 */
function mapStyleUrl() {
  const token = encodeURIComponent(MAPBOX_ACCESS_TOKEN?.trim() || "");
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12?access_token=${token}`;
}

/** MapLibre does not resolve `mapbox://` URLs; rewrite them like mapbox-gl does (MIT: rowanwins/maplibregl-mapbox-request-transformer). */
function isMapboxURL(url) {
  return url.startsWith("mapbox:");
}

function parseUrl(url) {
  const urlRe = /^(\w+):\/\/([^/?]*)(\/[^?]+)?\??(.+)?/;
  const parts = url.match(urlRe);
  if (!parts) {
    throw new Error("Unable to parse URL object");
  }
  return {
    protocol: parts[1],
    authority: parts[2],
    path: parts[3] || "/",
    params: parts[4] ? parts[4].split("&") : []
  };
}

function formatUrl(urlObject, accessToken) {
  const apiUrlObject = parseUrl("https://api.mapbox.com");
  urlObject.protocol = apiUrlObject.protocol;
  urlObject.authority = apiUrlObject.authority;
  urlObject.params.push(`access_token=${accessToken}`);
  const params = urlObject.params.length ? `?${urlObject.params.join("&")}` : "";
  return `${urlObject.protocol}://${urlObject.authority}${urlObject.path}${params}`;
}

function normalizeStyleURL(url, accessToken) {
  const urlObject = parseUrl(url);
  urlObject.path = `/styles/v1${urlObject.path}`;
  return formatUrl(urlObject, accessToken);
}

function normalizeGlyphsURL(url, accessToken) {
  const urlObject = parseUrl(url);
  urlObject.path = `/fonts/v1${urlObject.path}`;
  return formatUrl(urlObject, accessToken);
}

function normalizeSourceURL(url, accessToken) {
  const urlObject = parseUrl(url);
  urlObject.path = `/v4/${urlObject.authority}.json`;
  urlObject.params.push("secure");
  return formatUrl(urlObject, accessToken);
}

function normalizeSpriteURL(url, accessToken) {
  const urlObject = parseUrl(url);
  const pathParts = urlObject.path.split(".");
  let properPath = pathParts[0];
  const extension = pathParts[1] || "json";
  let format = "";
  if (properPath.includes("@2x")) {
    const [base] = properPath.split("@2x");
    properPath = base;
    format = "@2x";
  }
  urlObject.path = `/styles/v1${properPath}/sprite${format}.${extension}`;
  return formatUrl(urlObject, accessToken);
}

function transformMapboxUrl(url, resourceType, accessToken) {
  if (url.includes("/styles/") && !url.includes("/sprite")) {
    return { url: normalizeStyleURL(url, accessToken) };
  }
  if (url.includes("/sprites/")) {
    return { url: normalizeSpriteURL(url, accessToken) };
  }
  if (url.includes("/fonts/")) {
    return { url: normalizeGlyphsURL(url, accessToken) };
  }
  if (url.includes("/v4/")) {
    return { url: normalizeSourceURL(url, accessToken) };
  }
  if (resourceType === "Source") {
    return { url: normalizeSourceURL(url, accessToken) };
  }
  return undefined;
}

function createMapboxTransformRequest(accessToken) {
  const token = accessToken?.trim();
  return (url, resourceType) => {
    if (token && isMapboxURL(url)) {
      const mapped = transformMapboxUrl(url, resourceType, token);
      if (mapped?.url) {
        return mapped;
      }
    }
    if (token && url.startsWith("https://api.mapbox.com") && !url.includes("access_token=")) {
      const sep = url.includes("?") ? "&" : "?";
      return { url: `${url}${sep}access_token=${encodeURIComponent(token)}` };
    }
    return { url };
  };
}

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

  const popup = new maplibregl.Popup({
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

  return new maplibregl.Marker({ element: el, anchor: "center" })
    .setLngLat([toilet.lng, toilet.lat])
    .setPopup(popup)
    .addTo(map);
}

export function createMap({ containerId, center }) {
  if (typeof maplibregl === "undefined") {
    throw new Error("MapLibre GL failed to load. Check the maplibre-gl script in index.html.");
  }

  if (!MAPBOX_ACCESS_TOKEN?.trim()) {
    console.warn(
      "Mapbox: missing MAPBOX_ACCESS_TOKEN. Copy src/mapbox-config.example.js to src/mapbox-config.js and add your token."
    );
  }

  const token = MAPBOX_ACCESS_TOKEN?.trim() || "";

  const map = new maplibregl.Map({
    container: containerId,
    style: mapStyleUrl(),
    center: [center.lng, center.lat],
    zoom: center.zoom,
    attributionControl: false,
    transformRequest: createMapboxTransformRequest(token),
    validateStyle: false
  });

  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

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
