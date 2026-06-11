const UEX_VEHICLES_URL = "https://api.uexcorp.uk/2.0/vehicles";
const HANGAR_SERVICES_URL = "/api/hangar-services";

const hangarServiceOptions = [
  { key: "size-1-ammo", label: "Size 1 Ammo", uexNames: ["Ship Ammunition - Size 1"] },
  { key: "size-2-ammo", label: "Size 2 Ammo", uexNames: ["Ship Ammunition - Size 2"] },
  { key: "size-3-ammo", label: "Size 3 Ammo", uexNames: ["Ship Ammunition - Size 3"] },
  { key: "size-4-ammo", label: "Size 4 Ammo", uexNames: ["Ship Ammunition - Size 4"] },
  { key: "size-5-ammo", label: "Size 5 Ammo", uexNames: ["Ship Ammunition - Size 5"] },
  { key: "hydrogen-fuel", label: "Hydrogen Fuel", uexNames: ["Hydrogen Fuel"] },
  { key: "quantum-fuel", label: "Quantum Fuel", uexNames: ["Quantum Fuel"] },
  {
    key: "recycled-material-composite",
    label: "Recycled Material Composite",
    uexNames: ["Recycled Material Composite"],
  },
  { key: "noise", label: "Noise", uexNames: ["Ship Noise Countermeasures"] },
  { key: "decoys", label: "Decoys", uexNames: ["Ship Decoy Countermeasures"] },
];

const hangarServiceEligibleShips = new Set(
  [
    "Origin 600i Explorer",
    "Origin 600i Touring",
    "Origin 600i Executive Edition",
    "Origin 890 Jump",
    "Anvil Carrack",
    "Anvil Carrack Expedition",
    "RSI Polaris",
    "Aegis Idris-M",
    "Aegis Idris-P",
    "MISC Starlancer TAC",
    "Drake Ironclad Assault",
  ].map(normalizeShipName),
);

let vehicleCatalog = [];
let hangarMarketRows = [];

const fallbackVehicles = [
  {
    name: "C2 Hercules Starlifter",
    nameFull: "Crusader C2 Hercules Starlifter",
    company: "Crusader Industries",
    role: "Cargo",
    scu: 696,
    crew: "1-2",
    padType: "XL",
    photo: "",
  },
  {
    name: "MOLE Carbon Edition",
    nameFull: "Argo MOLE Carbon Edition",
    company: "Argo Astronautics",
    role: "Mining",
    scu: 0,
    crew: "1-4",
    padType: "L",
    photo: "",
  },
  {
    name: "Aegis Redeemer",
    nameFull: "Aegis Redeemer",
    company: "Aegis Dynamics",
    role: "Combat",
    scu: 2,
    crew: "3-4",
    padType: "M",
    photo: "",
  },
  {
    name: "Carrack Expedition",
    nameFull: "Anvil Carrack Expedition",
    company: "Anvil Aerospace",
    role: "Exploration",
    scu: 456,
    crew: "4-6",
    padType: "L",
    photo: "",
  },
  {
    name: "Origin 600i Touring",
    nameFull: "Origin 600i Touring",
    company: "Origin Jumpworks",
    role: "Touring",
    scu: 16,
    crew: "1-5",
    padType: "L",
    photo: "",
  },
];

const ships = [
  {
    owner: "Voss-Actual",
    ship: "C2 Hercules Starlifter",
    role: "Cargo",
    rate: 18000,
    configName: "Cargo-ready hauler",
    configPrice: 5000,
    pilotIncluded: true,
    pilotRate: 12000,
    notes: "Includes basic cargo pods and insured hauling support. Owner pilot available for high-value runs.",
    dates: ["2026-06-14", "2026-06-15", "2026-06-18", "2026-06-22"],
    options: ["Cargo pods", "Crew included", "Insurance verified"],
    vehicle: fallbackVehicles[0],
  },
  {
    owner: "ArcMiner",
    ship: "MOLE Carbon Edition",
    role: "Industrial",
    rate: 22000,
    configName: "Mining laser package",
    configPrice: 8000,
    pilotIncluded: false,
    pilotRate: 0,
    notes: "Configured for asteroid work. Renter provides crew.",
    dates: ["2026-06-13", "2026-06-14", "2026-06-21"],
    options: ["Mining lasers", "Upgraded quantum drive", "Insurance verified"],
    vehicle: fallbackVehicles[1],
  },
  {
    owner: "NineTailsNope",
    ship: "Aegis Redeemer",
    role: "Combat",
    rate: 26000,
    configName: "Crewed turret gunship",
    configPrice: 10000,
    pilotIncluded: true,
    pilotRate: 18000,
    notes: "Pilot available. Turret crew can be negotiated before departure.",
    dates: ["2026-06-16", "2026-06-17", "2026-06-20"],
    options: ["Crew included", "Insurance verified"],
    vehicle: fallbackVehicles[2],
  },
  {
    owner: "Wayfinder_June",
    ship: "Carrack Expedition",
    role: "Exploration",
    rate: 30000,
    configName: "R/R/R expedition service",
    configPrice: 15000,
    pilotIncluded: true,
    pilotRate: 20000,
    hangarLoadCost: 7500,
    notes: "Carrack offered as a mobile service platform. Load time cost applies when hangar services are requested.",
    dates: ["2026-06-19", "2026-06-20", "2026-06-23"],
    options: ["Medical bay", "Crew included", "Upgraded quantum drive"],
    hangarServices: [
      {
        label: "Hydrogen Fuel",
        quantity: 6000,
        price: 196,
        system: "Stanton",
        planet: "Hurston",
        terminal: "Lorville L19",
      },
    ],
    vehicle: fallbackVehicles[3],
  },
  {
    owner: "PortTressler_Taxi",
    ship: "Origin 600i Touring",
    role: "Touring",
    rate: 12000,
    configName: "VIP touring setup",
    configPrice: 3000,
    pilotIncluded: true,
    pilotRate: 9000,
    notes: "Touring configuration with pilot available for point-to-point service.",
    dates: ["2026-06-14", "2026-06-24", "2026-06-25"],
    options: ["Crew included", "Insurance verified"],
    vehicle: fallbackVehicles[4],
  },
];

const bookings = [
  { date: "2026-06-12", ship: "Cutlass Black", owner: "KlescherSkip", status: "booked" },
  { date: "2026-06-14", ship: "C2 Hercules", owner: "Voss-Actual", status: "partial" },
  { date: "2026-06-16", ship: "Redeemer", owner: "NineTailsNope", status: "partial" },
  { date: "2026-06-19", ship: "Carrack", owner: "Wayfinder_June", status: "owner" },
  { date: "2026-06-27", ship: "Vulture", owner: "SalvageSam", status: "booked" },
];

const state = {
  activeDate: new Date(2026, 5, 1),
};

const monthLabel = document.querySelector("#month-label");
const calendarGrid = document.querySelector("#calendar-grid");
const fleetList = document.querySelector("#fleet-list");
const rentalResults = document.querySelector("#rental-results");
const ownerForm = document.querySelector("#owner-form");
const rentForm = document.querySelector("#rent-form");
const shipOptions = document.querySelector("#ship-options");
const shipApiStatus = document.querySelector("#ship-api-status");
const ownerShipInput = ownerForm.querySelector("[name='ship']");
const ownerRoleSelect = ownerForm.querySelector("[name='role']");
const offerHangarServices = document.querySelector("#offer-hangar-services");
const hangarServiceStatus = document.querySelector("#hangar-service-status");
const hangarServicesPanel = document.querySelector("#hangar-services-panel");
const hangarServiceRows = document.querySelector("#hangar-service-rows");
const hangarLoadCostInput = document.querySelector("#hangar-load-cost");

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

document.querySelector("#prev-month").addEventListener("click", () => {
  state.activeDate.setMonth(state.activeDate.getMonth() - 1);
  renderCalendar();
});

document.querySelector("#next-month").addEventListener("click", () => {
  state.activeDate.setMonth(state.activeDate.getMonth() + 1);
  renderCalendar();
});

ownerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(ownerForm);
  const options = data.getAll("options");
  const selectedVehicle = findVehicle(data.get("ship"));
  const hangarServices = collectHangarServices();
  const dates = String(data.get("dates"))
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);

  ships.unshift({
    owner: data.get("owner"),
    ship: selectedVehicle?.nameFull || data.get("ship"),
    role: selectedVehicle?.role || data.get("role"),
    rate: Number(data.get("rate")),
    configName: data.get("configName"),
    configPrice: Number(data.get("configPrice") || 0),
    pilotIncluded: data.has("pilotIncluded"),
    pilotRate: Number(data.get("pilotRate") || 0),
    hangarLoadCost: Number(data.get("hangarLoadCost") || 0),
    notes: data.get("notes"),
    dates,
    options,
    hangarServices,
    vehicle: selectedVehicle,
  });

  ownerForm.reset();
  ownerForm.querySelector("[name='rate']").value = 15000;
  ownerForm.querySelector("[name='configPrice']").value = 0;
  ownerForm.querySelector("[name='pilotRate']").value = 0;
  hangarLoadCostInput.value = 0;
  resetHangarRows();
  updateHangarEligibility();
  renderFleet();
  renderCalendar();
  renderRentalResults();
});

ownerShipInput.addEventListener("change", () => syncOwnerShipFields(ownerShipInput.value));
ownerShipInput.addEventListener("input", () => syncOwnerShipFields(ownerShipInput.value));

offerHangarServices.addEventListener("change", () => {
  updateHangarEligibility();
});

hangarServiceRows.addEventListener("change", (event) => {
  const row = event.target.closest(".service-row");
  if (!row) {
    return;
  }

  if (event.target.matches(".service-system")) {
    updateServicePlanetOptions(row);
    updateServiceTerminalOptions(row);
    updateServicePrice(row);
  }

  if (event.target.matches(".service-planet")) {
    updateServiceTerminalOptions(row);
    updateServicePrice(row);
  }

  if (event.target.matches(".service-terminal")) {
    updateServicePrice(row);
  }
});

rentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderRentalResults();
});

async function loadVehicles() {
  shipApiStatus.textContent = "Loading UEX ship list...";

  try {
    const response = await fetch(UEX_VEHICLES_URL);
    if (!response.ok) {
      throw new Error(`UEX returned ${response.status}`);
    }

    const payload = await response.json();
    vehicleCatalog = payload.data
      .map(normalizeVehicle)
      .filter((vehicle) => vehicle.nameFull && !vehicle.isAddon)
      .sort((a, b) => a.nameFull.localeCompare(b.nameFull));

    enrichSeedShips();
    renderShipOptions();
    shipApiStatus.textContent = `${vehicleCatalog.length.toLocaleString()} ships loaded from UEX`;
  } catch (error) {
    vehicleCatalog = fallbackVehicles.map((vehicle) => ({
      ...vehicle,
      searchText: [vehicle.name, vehicle.nameFull, vehicle.company, vehicle.role, vehicle.padType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
    renderShipOptions();
    shipApiStatus.textContent = "Using fallback ship list; UEX is not reachable from this browser";
  }

  renderFleet();
  renderCalendar();
  renderRentalResults();
}

async function loadHangarServices() {
  renderHangarServiceRows();
  hangarServiceStatus.textContent = "Loading UEX purchase locations...";

  try {
    const response = await fetch(HANGAR_SERVICES_URL);
    if (!response.ok) {
      throw new Error(`Hangar services returned ${response.status}`);
    }

    const payload = await response.json();
    hangarMarketRows = Array.isArray(payload.rows) ? payload.rows : [];
  } catch (error) {
    hangarMarketRows = [];
  }

  renderHangarServiceRows();
  updateHangarEligibility();
}

function setActiveTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function renderCalendar() {
  const year = state.activeDate.getFullYear();
  const month = state.activeDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const monthName = state.activeDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  monthLabel.textContent = monthName;
  calendarGrid.innerHTML = "";

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    calendarGrid.insertAdjacentHTML("beforeend", `<div class="weekday">${day}</div>`);
  });

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const displayDay = isCurrentMonth
      ? dayNumber
      : dayNumber <= 0
        ? previousMonthDays + dayNumber
        : dayNumber - daysInMonth;
    const dateKey = isCurrentMonth ? toDateKey(year, month, dayNumber) : "";
    const dayShips = ships.filter((ship) => ship.dates.includes(dateKey));
    const dayBookings = bookings.filter((booking) => booking.date === dateKey);
    const countLabel = dayShips.length ? `${dayShips.length} ships` : "Open call";

    const cell = document.createElement("article");
    cell.className = `day-cell${isCurrentMonth ? "" : " is-muted"}`;
    cell.innerHTML = `
      <div class="day-number">
        <span>${displayDay}</span>
        ${isCurrentMonth ? `<small>${countLabel}</small>` : ""}
      </div>
    `;

    if (isCurrentMonth) {
      const visibleShips = dayShips.slice(0, 3);
      visibleShips.forEach((ship) => {
        cell.insertAdjacentHTML("beforeend", availabilityPill(ship.ship, ship.owner, "available"));
      });

      dayBookings.forEach((booking) => {
        cell.insertAdjacentHTML("beforeend", availabilityPill(booking.ship, booking.owner, booking.status));
      });

      if (!visibleShips.length && !dayBookings.length) {
        cell.insertAdjacentHTML("beforeend", availabilityPill("No listings yet", "Owners can claim this day", "owner"));
      }
    }

    calendarGrid.appendChild(cell);
  }
}

function availabilityPill(title, subtitle, status) {
  return `
    <div class="availability-pill ${status}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(subtitle)}</span>
    </div>
  `;
}

function renderFleet() {
  fleetList.innerHTML = ships
    .map(
      (ship) => `
        <article class="fleet-card">
          ${shipImage(ship)}
          <div class="card-top">
            <h2>${escapeHtml(ship.ship)}</h2>
            <span class="tag">${escapeHtml(ship.role)}</span>
          </div>
          <ul class="meta-list">
            <li>Owner: ${escapeHtml(ship.owner)}</li>
            <li>Ship rate: ${formatCredits(ship.rate)} UEC / hour</li>
            ${listingPriceFacts(ship)}
            <li>Dates: ${ship.dates.map(formatShortDate).join(", ")}</li>
            ${vehicleFacts(ship)}
          </ul>
          ${configurationSummary(ship)}
          <div class="option-line">
            ${ship.options.map((option) => `<span class="chip">${escapeHtml(option)}</span>`).join("")}
          </div>
          ${hangarServicesSummary(ship)}
        </article>
      `,
    )
    .join("");
}

function renderRentalResults() {
  const form = new FormData(rentForm);
  const neededDate = form.get("date");
  const query = String(form.get("query") || "").trim().toLowerCase();
  const budget = Number(form.get("budget") || Infinity);
  const results = ships.filter((ship) => {
    const matchesDate = !neededDate || ship.dates.includes(neededDate);
    const matchesBudget = Number.isNaN(budget) || ship.rate <= budget;
    const haystack = `${ship.ship} ${ship.role} ${ship.owner} ${ship.options.join(" ")}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesDate && matchesBudget && matchesQuery;
  });

  rentalResults.innerHTML = results.length
    ? results
        .map(
          (ship) => `
            <article class="result-card">
              ${shipImage(ship)}
              <div class="card-top">
                <h2>${escapeHtml(ship.ship)}</h2>
                <span class="tag">${ship.rate.toLocaleString()} UEC/hr</span>
              </div>
              <ul class="meta-list">
                <li>Owner: ${escapeHtml(ship.owner)}</li>
                <li>Role: ${escapeHtml(ship.role)}</li>
                ${listingPriceFacts(ship)}
                <li>Available: ${ship.dates.map(formatShortDate).join(", ")}</li>
                ${vehicleFacts(ship)}
              </ul>
              ${configurationSummary(ship)}
              <div class="option-line">
                ${ship.options.map((option) => `<span class="chip">${escapeHtml(option)}</span>`).join("")}
              </div>
              ${hangarServicesSummary(ship)}
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">No ships match that request yet. Try a wider budget or another date.</div>`;
}

function renderHangarServiceRows() {
  hangarServiceRows.innerHTML = hangarServiceOptions.map((service) => renderHangarServiceRow(service)).join("");
  hangarServiceRows.querySelectorAll(".service-row").forEach((row) => {
    updateServiceSystemOptions(row);
    updateServicePlanetOptions(row);
    updateServiceTerminalOptions(row);
    updateServicePrice(row);
  });
}

function renderHangarServiceRow(service) {
  const hasLocations = getServiceLocations(service.label).length > 0;
  const locationNote = hasLocations ? "" : `<small class="service-note">No UEX purchase rows yet</small>`;

  return `
    <div class="service-row" data-service="${escapeHtml(service.label)}">
      <label class="check service-offer">
        <input type="checkbox" class="service-enabled" />
        <span>${escapeHtml(service.label)}</span>
        ${locationNote}
      </label>
      <label class="visually-hidden" for="${service.key}-quantity">${escapeHtml(service.label)} quantity</label>
      <input id="${service.key}-quantity" class="service-quantity" type="number" min="0" step="1" placeholder="Quantity" />
      <output class="service-price">-</output>
      <select class="service-system" aria-label="${escapeHtml(service.label)} system"></select>
      <select class="service-planet" aria-label="${escapeHtml(service.label)} planet"></select>
      <select class="service-terminal" aria-label="${escapeHtml(service.label)} terminal"></select>
    </div>
  `;
}

function updateServiceSystemOptions(row) {
  const service = row.dataset.service;
  const select = row.querySelector(".service-system");
  const selected = select.value;
  const systems = uniqueSorted(getServiceLocations(service).map((location) => location.system));
  setSelectOptions(select, systems, "System", selected);
}

function updateServicePlanetOptions(row) {
  const service = row.dataset.service;
  const system = row.querySelector(".service-system").value;
  const select = row.querySelector(".service-planet");
  const selected = select.value;
  const planets = uniqueSorted(
    getServiceLocations(service)
      .filter((location) => !system || location.system === system)
      .map((location) => location.planet),
  );
  setSelectOptions(select, planets, "Planet", selected);
}

function updateServiceTerminalOptions(row) {
  const service = row.dataset.service;
  const system = row.querySelector(".service-system").value;
  const planet = row.querySelector(".service-planet").value;
  const select = row.querySelector(".service-terminal");
  const selected = select.value;
  const terminals = getServiceLocations(service)
    .filter((location) => !system || location.system === system)
    .filter((location) => !planet || location.planet === planet)
    .map((location) => location.terminal);

  setSelectOptions(select, uniqueSorted(terminals), "Terminal", selected);
}

function updateServicePrice(row) {
  const service = row.dataset.service;
  const system = row.querySelector(".service-system").value;
  const planet = row.querySelector(".service-planet").value;
  const terminal = row.querySelector(".service-terminal").value;
  const price = row.querySelector(".service-price");
  const match = getServiceLocations(service).find(
    (location) => location.system === system && location.planet === planet && location.terminal === terminal,
  );

  price.value = match ? `${formatCredits(match.price)} UEC` : "-";
  price.dataset.price = match ? String(match.price) : "";
}

function setSelectOptions(select, options, placeholder, selectedValue) {
  select.innerHTML = [
    `<option value="">${placeholder}</option>`,
    ...options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`),
  ].join("");

  if (selectedValue && options.includes(selectedValue)) {
    select.value = selectedValue;
  } else if (options.length === 1) {
    select.value = options[0];
  }
}

function getServiceLocations(serviceLabel) {
  return hangarMarketRows.filter((row) => row.label === serviceLabel);
}

function collectHangarServices() {
  const selectedVehicle = findVehicle(ownerShipInput.value);
  if (!offerHangarServices.checked || !isHangarServiceEligible(selectedVehicle || ownerShipInput.value)) {
    return [];
  }

  return Array.from(hangarServiceRows.querySelectorAll(".service-row"))
    .map((row) => {
      const enabled = row.querySelector(".service-enabled").checked;
      const quantity = Number(row.querySelector(".service-quantity").value || 0);
      const priceOutput = row.querySelector(".service-price");

      if (!enabled) {
        return null;
      }

      return {
        label: row.dataset.service,
        quantity,
        price: Number(priceOutput.dataset.price || 0),
        system: row.querySelector(".service-system").value,
        planet: row.querySelector(".service-planet").value,
        terminal: row.querySelector(".service-terminal").value,
      };
    })
    .filter(Boolean);
}

function resetHangarRows() {
  hangarServiceRows.querySelectorAll(".service-row").forEach((row) => {
    row.querySelector(".service-enabled").checked = false;
    row.querySelector(".service-quantity").value = "";
  });
}

function hangarServicesSummary(ship) {
  if (!ship.hangarServices?.length) {
    return "";
  }

  return `
    <div class="hangar-summary">
      <strong>Hangar Services${ship.hangarLoadCost ? ` · Load time ${formatCredits(ship.hangarLoadCost)} UEC` : ""}</strong>
      ${ship.hangarServices
        .map(
          (service) => `
            <div class="hangar-summary-line">
              <span>${escapeHtml(service.label)}</span>
              <small>${service.quantity ? `${Number(service.quantity).toLocaleString()} qty` : "Qty open"} ${
                service.price ? `@ ${formatCredits(service.price)} UEC` : ""
              }</small>
              <small>${[service.system, service.planet, service.terminal].filter(Boolean).map(escapeHtml).join(" / ")}</small>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function listingPriceFacts(ship) {
  return [
    ship.configPrice ? `<li>Config price: ${formatCredits(ship.configPrice)} UEC</li>` : "",
    ship.pilotIncluded ? `<li>Pilot: offered${ship.pilotRate ? ` at ${formatCredits(ship.pilotRate)} UEC / hour` : ""}</li>` : "",
  ].join("");
}

function configurationSummary(ship) {
  const hasSummary = ship.configName || ship.notes;
  if (!hasSummary) {
    return "";
  }

  return `
    <div class="config-summary">
      ${ship.configName ? `<strong>${escapeHtml(ship.configName)}</strong>` : ""}
      ${ship.notes ? `<p>${escapeHtml(ship.notes)}</p>` : ""}
    </div>
  `;
}

function normalizeVehicle(vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name || "",
    nameFull: vehicle.name_full || vehicle.name || "",
    company: vehicle.company_name || "",
    role: inferVehicleRole(vehicle),
    scu: Number(vehicle.scu || 0),
    crew: vehicle.crew || "",
    padType: vehicle.pad_type || "",
    photo: vehicle.url_photo || "",
    isAddon: Boolean(Number(vehicle.is_addon || 0)),
    searchText: [
      vehicle.name,
      vehicle.name_full,
      vehicle.company_name,
      inferVehicleRole(vehicle),
      vehicle.pad_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function inferVehicleRole(vehicle) {
  const roleFlags = [
    ["is_cargo", "Cargo"],
    ["is_mining", "Mining"],
    ["is_salvage", "Salvage"],
    ["is_medical", "Medical"],
    ["is_refuel", "Refuel"],
    ["is_repair", "Repair"],
    ["is_exploration", "Exploration"],
    ["is_racing", "Racing"],
    ["is_passenger", "Touring"],
    ["is_bomber", "Combat"],
    ["is_military", "Combat"],
    ["is_industrial", "Industrial"],
    ["is_ground_vehicle", "Ground"],
    ["is_starter", "Starter"],
  ];

  const match = roleFlags.find(([flag]) => Number(vehicle[flag] || 0) === 1);
  return match ? match[1] : "General";
}

function renderShipOptions() {
  shipOptions.innerHTML = vehicleCatalog
    .map(
      (vehicle) =>
        `<option value="${escapeHtml(vehicle.nameFull)}">${escapeHtml(vehicle.company)} ${escapeHtml(vehicle.role)}</option>`,
    )
    .join("");
}

function findVehicle(value) {
  const query = String(value || "").trim().toLowerCase();
  if (!query) {
    return null;
  }

  return (
    vehicleCatalog.find((vehicle) => vehicle.nameFull.toLowerCase() === query) ||
    vehicleCatalog.find((vehicle) => vehicle.name.toLowerCase() === query) ||
    vehicleCatalog.find((vehicle) => vehicle.searchText.includes(query))
  );
}

function syncOwnerShipFields(value) {
  const vehicle = findVehicle(value);
  if (!vehicle) {
    updateHangarEligibility();
    return;
  }

  ownerRoleSelect.value = roleForSelect(vehicle.role);
  updateHangarEligibility(vehicle);
}

function roleForSelect(role) {
  const knownRoles = Array.from(ownerRoleSelect.options).map((option) => option.value);
  return knownRoles.includes(role) ? role : role === "Mining" || role === "Salvage" ? "Industrial" : "Cargo";
}

function enrichSeedShips() {
  ships.forEach((ship) => {
    const vehicle = findVehicle(ship.ship);
    if (vehicle) {
      ship.ship = vehicle.nameFull;
      ship.role = vehicle.role;
      ship.vehicle = vehicle;
    }

    if (!isHangarServiceEligible(vehicle || ship.ship)) {
      ship.hangarServices = [];
    }
  });

  updateHangarEligibility();
}

function shipImage(ship) {
  const photo = ship.vehicle?.photo;
  if (!photo) {
    return `<div class="ship-image placeholder">SSR</div>`;
  }

  return `<img class="ship-image" src="${escapeHtml(photo)}" alt="${escapeHtml(ship.ship)}" loading="lazy" />`;
}

function vehicleFacts(ship) {
  if (!ship.vehicle) {
    return "";
  }

  const facts = [
    ship.vehicle.company && `Maker: ${escapeHtml(ship.vehicle.company)}`,
    ship.vehicle.scu ? `SCU: ${ship.vehicle.scu.toLocaleString()}` : "",
    ship.vehicle.crew && `Crew: ${escapeHtml(ship.vehicle.crew)}`,
    ship.vehicle.padType && `Pad: ${escapeHtml(ship.vehicle.padType)}`,
  ].filter(Boolean);

  return facts.map((fact) => `<li>${fact}</li>`).join("");
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) => first.localeCompare(second));
}

function normalizeShipName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(rsi|roberts space industries)\b/g, "rsi")
    .replace(/\s+/g, " ")
    .trim();
}

function isHangarServiceEligible(vehicleOrName) {
  const names =
    typeof vehicleOrName === "string"
      ? [vehicleOrName]
      : [vehicleOrName?.nameFull, vehicleOrName?.name].filter(Boolean);

  return names.some((name) => hangarServiceEligibleShips.has(normalizeShipName(name)));
}

function updateHangarEligibility(vehicle = findVehicle(ownerShipInput.value)) {
  const eligible = isHangarServiceEligible(vehicle || ownerShipInput.value);
  offerHangarServices.disabled = !eligible;

  if (!eligible) {
    offerHangarServices.checked = false;
    hangarServicesPanel.classList.add("is-hidden");
    hangarServiceStatus.textContent = ownerShipInput.value
      ? "Hangar Services are only available for R/R/R capable flight-ready ships"
      : "Select an R/R/R capable ship to offer Hangar Services";
    return;
  }

  hangarServiceStatus.textContent = hangarMarketRows.length
    ? `${hangarMarketRows.length.toLocaleString()} UEX purchase locations loaded`
    : "Loading UEX purchase locations...";
  hangarServicesPanel.classList.toggle("is-hidden", !offerHangarServices.checked);
}

function formatCredits(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatShortDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderCalendar();
renderFleet();
renderRentalResults();
loadVehicles();
loadHangarServices();
