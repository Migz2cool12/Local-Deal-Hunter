const state = {
  cat: "all",
  query: "",
  sort: "price",
  lat: null,
  lng: null,
  deals: []
};

const $ = s => document.querySelector(s);
const money = n => "$" + Number(n).toFixed(2);

function distance(a, b, c, d) {
  const R = 3958.7613;
  const p = Math.PI / 180;

  const x =
    0.5 -
    Math.cos((c - a) * p) / 2 +
    Math.cos(a * p) *
      Math.cos(c * p) *
      (1 - Math.cos((d - b) * p)) / 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function render() {
  let list = state.deals.filter(d =>
    (state.cat === "all" || d.cat === state.cat) &&
    (`${d.item} ${d.store}`)
      .toLowerCase()
      .includes(state.query.toLowerCase())
  );

  list.sort((a, b) =>
    state.sort === "distance"
      ? (a.distance ?? 999) - (b.distance ?? 999)
      : state.sort === "savings"
      ? b.saving - a.saving
      : a.price - b.price
  );

  $("#resultCount").textContent =
    `${list.length} deal${list.length === 1 ? "" : "s"}`;

  $("#deals").innerHTML = list.length
    ? list.map(d => `
      <article class="card">
        <div class="row">
          <span class="tag">${esc(d.cat)}</span>
          <span>📍 ${
            d.distance == null ? "—" : d.distance.toFixed(1) + " mi"
          }</span>
        </div>

        <div class="price">
          ${money(d.price)}
          ${d.old ? `<span class="old">${money(d.old)}</span>` : ""}
        </div>

        ${
          d.saving > 0
            ? `<span class="save">Save ${money(d.saving)}</span>`
            : ""
        }

        <div class="store">${esc(d.store)}</div>
        <div class="meta">${esc(d.item)}</div>
        <div class="fresh">${esc(d.fresh || "Live price")}</div>
      </article>
    `).join("")
    : `<div class="empty">
        No live prices found for this search and area.
        Try another item.
      </div>`;
}

async function nourish() {
  if (state.lat == null) return [];

  const u =
    `https://mynourish.app/api/v1/public/prices?lat=${state.lat}&lng=${state.lng}`;

  const r = await fetch(u);

  if (!r.ok) throw Error("Live price request failed");

  const data = await r.json();
  const out = [];

  for (const s of (data.stores || [])) {
    for (const p of (s.prices || s.items || [])) {

      const price = Number(
        p.price ?? p.current_price
      );

      if (!Number.isFinite(price)) continue;

      const old = Number(
        p.regular_price ?? p.list_price
      );

      const la = Number(
        s.lat ?? s.latitude
      );

      const lo = Number(
        s.lng ?? s.longitude
      );

      out.push({
        cat: "grocery",

        item:
          p.item ||
          p.name ||
          "Grocery item",

        store:
          s.name ||
          s.store ||
          "Nearby store",

        price: price,

        old:
          Number.isFinite(old) && old > price
            ? old
            : null,

        saving:
          Number.isFinite(old)
            ? Math.max(0, old - price)
            : 0,

        distance:
          Number.isFinite(la) && Number.isFinite(lo)
            ? distance(
                state.lat,
                state.lng,
                la,
                lo
              )
            : null,

        fresh: "Live grocery price"
      });
    }
  }

  return out;
}

async function load() {

  state.deals = [];

  $("#sourceStatus").textContent =
    "🟡 Loading live prices…";

  render();

  try {
    state.deals = await nourish();
  } catch (e) {
    state.deals = [];
  }

  $("#sourceStatus").textContent =
    state.deals.length
      ? "🟢 Live grocery prices loaded for your area."
      : "No live prices were returned for this area.";

  render();
}

$("#locBtn").onclick = () => {

  navigator.geolocation.getCurrentPosition(
    async p => {

      state.lat = p.coords.latitude;
      state.lng = p.coords.longitude;

      $("#locationStatus").textContent =
        "📍 Location enabled. Prices are filtered to your area.";

      await load();
    },

    () => {

      $("#locationStatus").textContent =
        "Location permission denied. Turn on location access.";
    }
  );
};

$("#search").oninput = e => {

  state.query = e.target.value;

  render();
};

$("#sort").onchange = e => {

  state.sort = e.target.value;

  render();
};

document.querySelectorAll("#cats button").forEach(b => {

  b.onclick = () => {

    document
      .querySelector(".cats .active")
      ?.classList.remove("active");

    b.classList.add("active");

    state.cat = b.dataset.cat;

    render();
  };
});

render();

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});
}
