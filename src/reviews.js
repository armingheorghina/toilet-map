const STORAGE_KEY = "cluj-toilets-ratings-v1";

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Ratings could not be saved.", e);
  }
}

export function getReviewStats(toiletId) {
  if (!toiletId) {
    return { average: null, count: 0 };
  }
  const row = readAll()[toiletId];
  if (!row || typeof row.sum !== "number" || typeof row.count !== "number" || row.count < 1) {
    return { average: null, count: 0 };
  }
  return { average: row.sum / row.count, count: row.count };
}

/** @param {string} toiletId stable id (OSM or custom) */
export function addReview(toiletId, rating) {
  const v = Math.round(Number(rating));
  if (!toiletId || !Number.isFinite(v) || v < 1 || v > 5) {
    return;
  }
  const all = readAll();
  const prev = all[toiletId] || { sum: 0, count: 0 };
  all[toiletId] = { sum: prev.sum + v, count: prev.count + 1 };
  writeAll(all);
}

export function formatReviewSummary(toiletId) {
  const { average, count } = getReviewStats(toiletId);
  if (!count) {
    return "No votes yet";
  }
  const plural = count === 1 ? "vote" : "votes";
  return `Average ${average.toFixed(1)} / 5 · ${count} ${plural}`;
}

/** Stars to show at rest: rounded average, or 5 when there are no votes yet. */
export function getDefaultStarDisplay(toiletId) {
  const { average, count } = getReviewStats(toiletId);
  if (!count) {
    return 5;
  }
  return Math.min(5, Math.max(1, Math.round(average)));
}
