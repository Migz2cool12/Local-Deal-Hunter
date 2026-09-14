const API =
  "https://local-deal-hunter-api.migz2cool12.workers.dev";

const state = {
  cat: "all",
  query: "",
  sort: "price",
  lat: null,
  lng: null,
  deals: []
};

const $ = s => document.querySelector(s);

function money(n) {
  return "$" + Number(n).toFixed(2);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function distance(a,b,c,d) {
  const R = 3958.7613;
  const p = Math.PI / 180;

  const x =
    0.5 -
    Math.cos((c-a)*p)/2 +
    Math.cos(a*p) *
    Math.cos(c*p) *
    (1-Math.cos((d-b)*p))/2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function render() {
  let list = state.deals.filter(d => {
    const category =
      state.cat === "all" || d.cat === state.cat;

    const text =
      `${d.item} ${d.store}`.toLowerCase();

    const search =
      !state.query ||
      text.includes(state.query.toLowerCase());

    return category && search;
  });

  list.sort((a,b) => {
    if (state.sort === "distance")
      return (a.distance ?? 9999) -
             (b.distance ?? 9999);

    if (state.sort === "savings")
      return (b.saving || 0) -
             (a.saving || 0);

    return a.price - b.price;
  });

  if ($("#resultCount")) {
    $("#resultCount").textContent =
      `${list.length} deal${list.length === 1 ? "" : "s"}`;
  }

  if (!$("#deals")) return;

  if (!list.length) {
    $("#deals").innerHTML = `
      <div class="empty">
        <h3>No verified deals found yet</h3>
        <p>
          Try searching for milk, eggs, bread,
          chicken, cereal or another grocery item.
        </p>
      </div>
    `;
    return;
  }

  $("#deals").innerHTML = list.map(d => `
    <article class="card">

      <div class="row">
        <span class="tag">${esc(d.cat)}</span>

        <span>
          📍 ${
            d.distance == null
              ? "Nearby"
              : d.distance.toFixed(1) + " mi"
          }
        </span>
      </div>

      <h3>${esc(d.item)}</h3>

      <div class="price">
        ${money(d.price)}

        ${
          d.old
            ? `<span class="old">
                 ${money(d.old)}
               </span>`
            : ""
        }
      </div>

      ${
        d.saving > 0
          ? `<span class="save">
               Save ${money(d.saving)}
             </span>`
          : ""
      }

      <div class="store">
        🏪 ${esc(d.store)}
      </div>

      <div class="fresh">
        ${esc(d.fresh || "Price data")}
      </div>

    </article>
  `).join("");
}

async function getPrices() {

  if (state.lat == null ||
      state.lng == null) {
    return [];
  }

  const params = new URLSearchParams();

  params.set("lat", state.lat);
  params.set("lng", state.lng);

  if (state.query) {
    params.set("q", state.query);
  }

  const response = await fetch(
    `${API}/prices?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      "API error " + response.status
    );
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(
      data.error || "Price service failed"
    );
  }

  const deals = [];

  const stores =
    Array.isArray(data.stores)
      ? data.stores
      : [];

  for (const store of stores) {

    const products =
      store.prices ||
      store.items ||
      store.products ||
      [];

    if (!Array.isArray(products))
      continue;

    for (const product of products) {

      const price = Number(
        product.price ??
        product.current_price ??
        product.sale_price ??
        product.amount
      );

      if (!Number.isFinite(price) ||
          price <= 0) {
        continue;
      }

      const old = Number(
        product.regular_price ??
        product.list_price ??
        product.original_price
      );

      const storeLat = Number(
        store.lat ??
        store.latitude
      );

      const storeLng = Number(
        store.lng ??
        store.longitude
      );

      deals.push({

        cat: "grocery",

        item:
          product.item ||
          product.name ||
          product.title ||
          "Grocery item",

        store:
          store.name ||
          store.store ||
          "Nearby store",

        price,

        old:
          Number.isFinite(old) &&
          old > price
            ? old
            : null,

        saving:
          Number.isFinite(old) &&
          old > price
            ? old - price
            : 0,

        distance:
          Number.isFinite(storeLat) &&
          Number.isFinite(storeLng)
            ? distance(
                state.lat,
                state.lng,
                storeLat,
                storeLng
              )
            : null,

        fresh:
          product.updatedAt
            ? "Recently updated"
            : "Live grocery price"
      });
    }
  }

  return deals;
}

async function loadPrices() {

  state.deals = [];

  if ($("#sourceStatus")) {
    $("#sourceStatus").textContent =
      "🟡 Finding live prices near you…";
  }

  render();

  try {

    state.deals =
      await getPrices();

    state.deals.sort(
      (a,b) => a.price - b.price
    );

    if ($("#sourceStatus")) {

      $("#sourceStatus").textContent =
        state.deals.length
          ? `🟢 ${state.deals.length} live price${
              state.deals.length === 1
                ? ""
                : "s"
            } found.`
          : "No live prices returned for this area.";
    }

  } catch (error) {

    console.error(error);

    if ($("#sourceStatus")) {
      $("#sourceStatus").textContent =
        "🔴 Price service could not return data.";
    }
  }

  render();
}

function getLocation() {

  if (!navigator.geolocation) {

    if ($("#locationStatus")) {
      $("#locationStatus").textContent =
        "Location is not supported.";
    }

    return;
  }

  if ($("#locationStatus")) {
    $("#locationStatus").textContent =
      "📍 Getting your location…";
  }

  navigator.geolocation.getCurrentPosition(

    async position => {

      state.lat =
        position.coords.latitude;

      state.lng =
        position.coords.longitude;

      if ($("#locationStatus")) {
        $("#locationStatus").textContent =
          "📍 Location enabled.";
      }

      await loadPrices();
    },

    error => {

      console.error(error);

      if ($("#locationStatus")) {
        $("#locationStatus").textContent =
          "Location permission was denied.";
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    }
  );
}

if ($("#locBtn")) {
  $("#locBtn").addEventListener(
    "click",
    getLocation
  );
}

if ($("#search")) {

  $("#search").addEventListener(
    "change",
    async e => {

      state.query =
        e.target.value.trim();

      if (state.lat != null) {
        await loadPrices();
      } else {
        render();
      }
    }
  );
}

if ($("#sort")) {

  $("#sort").addEventListener(
    "change",
    e => {

      state.sort =
        e.target.value;

      render();
    }
  );
}

document
  .querySelectorAll("#cats button")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        document
          .querySelector("#cats .active")
          ?.classList.remove("active");

        button.classList.add("active");

        state.cat =
          button.dataset.cat || "all";

        render();
      }
    );
  });

render();

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .catch(() => {});

    }
  );
    }
