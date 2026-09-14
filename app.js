const state = {
  cat: "all",
  query: "",
  sort: "price",
  lat: null,
  lng: null,
  deals: [],
  loaded: false
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

function setStatus(text) {
  const el = $("#sourceStatus");
  if (el) el.textContent = text;
}

function render() {
  let list = state.deals.filter(d => {
    const categoryOK =
      state.cat === "all" || d.cat === state.cat;

    const searchText =
      `${d.item} ${d.store}`.toLowerCase();

    const searchOK =
      !state.query ||
      searchText.includes(state.query.toLowerCase());

    return categoryOK && searchOK;
  });

  list.sort((a,b) => {
    if (state.sort === "distance")
      return (a.distance ?? 9999) - (b.distance ?? 9999);

    if (state.sort === "savings")
      return (b.saving || 0) - (a.saving || 0);

    return a.price - b.price;
  });

  const count = $("#resultCount");
  const deals = $("#deals");

  if (count) {
    count.textContent =
      `${list.length} deal${list.length === 1 ? "" : "s"}`;
  }

  if (!deals) return;

  if (!list.length) {
    deals.innerHTML = `
      <div class="empty">
        <h3>No verified prices found yet</h3>
        <p>
          Search for an item such as milk, eggs, bread,
          chicken, soda or cereal.
        </p>
      </div>
    `;
    return;
  }

  deals.innerHTML = list.map(d => `
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
            ? `<span class="old">${money(d.old)}</span>`
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
        ${esc(d.fresh || "Price observed")}
      </div>
    </article>
  `).join("");
}


/* ---------- NOURISH LIVE GROCERY DATA ---------- */

async function getNourish() {
  if (state.lat == null || state.lng == null)
    return [];

  const url =
    `https://mynourish.app/api/v1/public/prices` +
    `?lat=${encodeURIComponent(state.lat)}` +
    `&lng=${encodeURIComponent(state.lng)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok)
    throw new Error("Nourish HTTP " + response.status);

  const data = await response.json();

  const stores =
    Array.isArray(data)
      ? data
      : Array.isArray(data.stores)
      ? data.stores
      : Array.isArray(data.data)
      ? data.data
      : [];

  const results = [];

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

      if (!Number.isFinite(price) || price <= 0)
        continue;

      const regular = Number(
        product.regular_price ??
        product.list_price ??
        product.original_price
      );

      const storeLat = Number(
        store.lat ??
        store.latitude ??
        store.location?.lat
      );

      const storeLng = Number(
        store.lng ??
        store.longitude ??
        store.location?.lng
      );

      const old =
        Number.isFinite(regular) &&
        regular > price
          ? regular
          : null;

      results.push({
        cat: "grocery",

        item:
          product.item ||
          product.name ||
          product.title ||
          "Grocery item",

        store:
          store.name ||
          store.store ||
          store.title ||
          "Nearby grocery store",

        price,

        old,

        saving:
          old
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
          product.scrapedAt ||
          product.updatedAt
            ? "Recently updated price"
            : "Live grocery price"
      });
    }
  }

  return results;
}


/* ---------- OPEN PRICES DATA ---------- */

async function getOpenPrices() {
  if (state.lat == null || state.lng == null)
    return [];

  const base =
    "https://prices.openfoodfacts.org/api/v1/prices";

  const params = new URLSearchParams();

  params.set("lat", state.lat);
  params.set("lon", state.lng);
  params.set("page_size", "100");

  if (state.query)
    params.set("product_name", state.query);

  try {

    const response = await fetch(
      `${base}?${params.toString()}`,
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok)
      return [];

    const data = await response.json();

    const rows =
      Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.prices)
        ? data.prices
        : [];

    return rows
      .map(p => {

        const price = Number(
          p.price ??
          p.price_without_discount
        );

        if (!Number.isFinite(price) || price <= 0)
          return null;

        const lat = Number(
          p.location?.latitude ??
          p.latitude
        );

        const lng = Number(
          p.location?.longitude ??
          p.longitude
        );

        return {
          cat: "grocery",

          item:
            p.product_name ||
            p.product?.product_name ||
            p.product_code ||
            "Grocery item",

          store:
            p.store_name ||
            p.store?.name ||
            p.location?.name ||
            "Nearby store",

          price,

          old: null,

          saving: 0,

          distance:
            Number.isFinite(lat) &&
            Number.isFinite(lng)
              ? distance(
                  state.lat,
                  state.lng,
                  lat,
                  lng
                )
              : null,

          fresh:
            p.date
              ? `Observed ${p.date}`
              : "Observed price"
        };
      })
      .filter(Boolean);

  } catch {
    return [];
  }
}


/* ---------- LOAD LIVE DATA ---------- */

async function loadPrices() {

  state.loaded = false;
  state.deals = [];

  setStatus("🟡 Finding live prices near you…");
  render();

  const results = [];

  try {
    const nourish = await getNourish();
    results.push(...nourish);
  } catch {}

  if (!results.length || state.query) {
    try {
      const openPrices = await getOpenPrices();
      results.push(...openPrices);
    } catch {}
  }

  /*
    Remove exact duplicates.
  */
  const seen = new Set();

  state.deals = results.filter(d => {

    const key =
      `${d.item}|${d.store}|${d.price}`.toLowerCase();

    if (seen.has(key))
      return false;

    seen.add(key);
    return true;
  });

  /*
    Cheapest first.
  */
  state.deals.sort(
    (a,b) => a.price - b.price
  );

  state.loaded = true;

  if (state.deals.length) {

    setStatus(
      `🟢 ${state.deals.length} verified price${
        state.deals.length === 1 ? "" : "s"
      } found.`
    );

  } else {

    setStatus(
      "🟡 No verified prices were returned for this area yet."
    );
  }

  render();
}


/* ---------- LOCATION ---------- */

function requestLocation() {

  if (!navigator.geolocation) {

    const el = $("#locationStatus");

    if (el)
      el.textContent =
        "Location is not supported on this device.";

    return;
  }

  const el = $("#locationStatus");

  if (el)
    el.textContent =
      "📍 Getting your location…";

  navigator.geolocation.getCurrentPosition(

    async position => {

      state.lat =
        position.coords.latitude;

      state.lng =
        position.coords.longitude;

      if (el)
        el.textContent =
          "📍 Location enabled.";

      await loadPrices();
    },

    error => {

      if (el) {

        if (error.code === 1) {
          el.textContent =
            "Location permission was denied.";
        } else {
          el.textContent =
            "Unable to get your location.";
        }
      }

      setStatus(
        "Turn on location access to find nearby prices."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    }
  );
}


/* ---------- SEARCH ---------- */

const searchBox = $("#search");

if (searchBox) {

  searchBox.addEventListener("input", async e => {

    state.query =
      e.target.value.trim();

    render();

    /*
      Search live data again when the user
      enters an item.
    */
    if (
      state.lat != null &&
      state.query.length >= 2
    ) {
      await loadPrices();
    }
  });
}


/* ---------- SORT ---------- */

const sortBox = $("#sort");

if (sortBox) {

  sortBox.addEventListener("change", e => {

    state.sort =
      e.target.value;

    render();
  });
}


/* ---------- CATEGORIES ---------- */

document
  .querySelectorAll("#cats button")
  .forEach(button => {

    button.addEventListener("click", async () => {

      document
        .querySelector("#cats .active")
        ?.classList.remove("active");

      button.classList.add("active");

      state.cat =
        button.dataset.cat || "all";

      render();

      if (
        state.lat != null &&
        state.cat === "grocery"
      ) {
        await loadPrices();
      }
    });
  });


/* ---------- LOCATION BUTTON ---------- */

const locationButton =
  $("#locBtn");

if (locationButton) {

  locationButton.addEventListener(
    "click",
    requestLocation
  );
}


/* ---------- START ---------- */

render();

setStatus(
  "📍 Tap your location button to find nearby prices."
);


/* ---------- SERVICE WORKER ---------- */

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
