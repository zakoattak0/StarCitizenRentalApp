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
let editingShipIndex = null;

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
    name: "Redeemer",
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
    name: "600i Touring",
    nameFull: "Origin 600i Touring",
    company: "Origin Jumpworks",
    role: "Touring",
    scu: 16,
    crew: "1-5",
    padType: "L",
    photo: "",
  },
];

const ships = [];

const bookings = [];

const state = {
  activeDate: new Date(2026, 5, 1),
  calendarMode: "availability",
  calendarFilters: {
    owner: "",
    ship: "",
    configMode: "any",
  },
};

const monthLabel = document.querySelector("#month-label");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarModeSelect = document.querySelector("#calendar-mode");
const calendarFilterButton = document.querySelector("#calendar-filter-button");
const calendarFilterModal = document.querySelector("#calendar-filter-modal");
const calendarFilterForm = document.querySelector("#calendar-filter-form");
const calendarFilterClose = document.querySelector("#calendar-filter-close");
const calendarFilterClear = document.querySelector("#calendar-filter-clear");
const calendarOwnerOptions = document.querySelector("#calendar-owner-options");
const calendarShipOptions = document.querySelector("#calendar-ship-options");
const filterSummary = document.querySelector("#filter-summary");
const generateRequestButton = document.querySelector("#generate-request-button");
const fleetList = document.querySelector("#fleet-list");
const rentalResults = document.querySelector("#rental-results");
const ownerForm = document.querySelector("#owner-form");
const rentForm = document.querySelector("#rent-form");
const ownerShipOptions = document.querySelector("#owner-ship-options");
const rentShipOptions = document.querySelector("#rent-ship-options");
const shipApiStatus = document.querySelector("#ship-api-status");
const ownerShipInput = ownerForm.querySelector("[name='ship']");
const ownerRoleSelect = ownerForm.querySelector("[name='role']");
const ownerManufacturerSelect = document.querySelector("#owner-manufacturer");
const rentManufacturerSelect = document.querySelector("#rent-manufacturer");
const availabilityForm = document.querySelector("#availability-form");
const availabilityShipSelect = document.querySelector("#availability-ship");
const ownerCalendar = document.querySelector("#owner-calendar");
const offerHangarServices = document.querySelector("#offer-hangar-services");
const hangarServiceStatus = document.querySelector("#hangar-service-status");
const hangarServicesPanel = document.querySelector("#hangar-services-panel");
const hangarServiceRows = document.querySelector("#hangar-service-rows");
const addFleetShipButton = document.querySelector("#add-fleet-ship");
const hangarLoadModeSelect = document.querySelector("#hangar-load-mode");
const hangarLoadCostInput = document.querySelector("#hangar-load-cost");
const hangarLoadPercentInput = document.querySelector("#hangar-load-percent");
const ownerSubmitButton = ownerForm.querySelector("button[type='submit']");

window.handleShipImageError = (image) => {
  const fallback = image.dataset.fallbackSrc;
  if (fallback) {
    image.dataset.fallbackSrc = "";
    image.src = fallback;
    return;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "ship-image placeholder";
  placeholder.textContent = "SSR";
  image.replaceWith(placeholder);
};

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

document.querySelectorAll(".sub-tab").forEach((tab) => {
  tab.addEventListener("click", () => setOwnerView(tab.dataset.ownerView));
});

document.querySelector("#prev-month").addEventListener("click", () => {
  state.activeDate.setMonth(state.activeDate.getMonth() - 1);
  renderCalendar();
  renderOwnerSchedule();
});

document.querySelector("#next-month").addEventListener("click", () => {
  state.activeDate.setMonth(state.activeDate.getMonth() + 1);
  renderCalendar();
  renderOwnerSchedule();
});

calendarModeSelect.addEventListener("change", () => {
  state.calendarMode = calendarModeSelect.value;
  renderCalendar();
});

calendarFilterButton.addEventListener("click", () => {
  renderCalendarFilterOptions();
  calendarFilterModal.classList.remove("is-hidden");
});

calendarFilterClose.addEventListener("click", () => {
  calendarFilterModal.classList.add("is-hidden");
});

calendarFilterModal.addEventListener("click", (event) => {
  if (event.target === calendarFilterModal) {
    calendarFilterModal.classList.add("is-hidden");
  }
});

calendarFilterClear.addEventListener("click", () => {
  state.calendarFilters = {
    owner: "",
    ship: "",
    configMode: "any",
  };
  calendarFilterForm.reset();
  updateFilterSummary();
  renderCalendar();
});

calendarFilterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(calendarFilterForm);
  state.calendarFilters = {
    owner: String(data.get("owner") || "").trim(),
    ship: String(data.get("ship") || "").trim(),
    configMode: data.get("configMode") || "any",
  };
  calendarFilterModal.classList.add("is-hidden");
  updateFilterSummary();
  renderCalendar();
});

generateRequestButton.addEventListener("click", () => {
  generateRequestButton.textContent = "Request builder coming soon";
  window.setTimeout(() => {
    generateRequestButton.textContent = "Generate Request";
  }, 1800);
});

ownerManufacturerSelect.addEventListener("change", () => {
  ownerShipInput.value = "";
  renderShipOptions();
  updateHangarEligibility();
});

rentManufacturerSelect.addEventListener("change", () => {
  renderShipOptions();
  renderRentalResults();
});

ownerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(ownerForm);
  const selectedVehicle = findVehicle(data.get("ship"));
  const hangarServices = collectHangarServices();
  const dates = String(data.get("dates"))
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);

  const listing = {
    owner: data.get("owner"),
    ship: selectedVehicle?.name || data.get("ship"),
    role: selectedVehicle?.role || data.get("role"),
    rate: Number(data.get("rate")),
    ratePeriod: data.get("ratePeriod"),
    manufacturer: selectedVehicle?.company || data.get("manufacturer"),
    configName: data.get("configName"),
    configPrice: Number(data.get("configPrice") || 0),
    pilotIncluded: data.has("pilotIncluded"),
    pilotRate: Number(data.get("pilotRate") || 0),
    hangarLoadCost: Number(data.get("hangarLoadCost") || 0),
    hangarLoadMode: data.get("hangarLoadMode") || "flat",
    hangarLoadPercent: Number(data.get("hangarLoadPercent") || 0),
    notes: data.get("notes"),
    dates,
    hangarServices,
    vehicle: selectedVehicle,
  };

  if (editingShipIndex === null) {
    ships.unshift(listing);
  } else {
    listing.unavailableDates = ships[editingShipIndex]?.unavailableDates || [];
    ships[editingShipIndex] = listing;
  }

  resetOwnerForm();
  renderFleet();
  renderCalendar();
  renderRentalResults();
  renderOwnerSchedule();
  updateFilterSummary();
});

addFleetShipButton.addEventListener("click", () => {
  resetOwnerForm();
  ownerForm.scrollIntoView({ behavior: "smooth", block: "start" });
  ownerForm.querySelector("[name='owner']").focus();
});

fleetList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-fleet-action]");
  if (!actionButton) {
    return;
  }

  const index = Number(actionButton.dataset.shipIndex);
  if (actionButton.dataset.fleetAction === "modify") {
    populateOwnerForm(index);
  }

  if (actionButton.dataset.fleetAction === "remove") {
    ships.splice(index, 1);
    resetOwnerForm();
    renderFleet();
    renderCalendar();
    renderRentalResults();
    renderOwnerSchedule();
    renderCalendarFilterOptions();
    updateFilterSummary();
  }
});

ownerShipInput.addEventListener("change", () => syncOwnerShipFields(ownerShipInput.value));
ownerShipInput.addEventListener("input", () => syncOwnerShipFields(ownerShipInput.value));

offerHangarServices.addEventListener("change", () => {
  updateHangarEligibility();
});

hangarLoadModeSelect.addEventListener("change", () => updateAllServicePrices());
hangarLoadPercentInput.addEventListener("input", () => updateAllServicePrices());
hangarLoadCostInput.addEventListener("input", () => updateAllServicePrices());

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

availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(availabilityForm);
  const ship = ships[Number(data.get("shipIndex"))];
  const dates = parseDateList(data.get("dates"));
  const status = data.get("status");

  if (!ship || dates.length === 0) {
    return;
  }

  if (status === "available") {
    ship.dates = uniqueSorted([...ship.dates, ...dates]);
    ship.unavailableDates = (ship.unavailableDates || []).filter((date) => !dates.includes(date));
  } else {
    ship.dates = ship.dates.filter((date) => !dates.includes(date));
    ship.unavailableDates = uniqueSorted([...(ship.unavailableDates || []), ...dates]);
  }

  availabilityForm.reset();
  renderFleet();
  renderCalendar();
  renderRentalResults();
  renderOwnerSchedule();
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
      .sort((a, b) => a.name.localeCompare(b.name));

    enrichSeedShips();
    renderManufacturerOptions();
    renderShipOptions();
    shipApiStatus.textContent = `${vehicleCatalog.length.toLocaleString()} ships loaded from UEX`;
  } catch (error) {
    vehicleCatalog = fallbackVehicles.map((vehicle) => ({
      ...vehicle,
      name: stripManufacturer(vehicle.name, vehicle.company),
      searchText: [vehicle.name, vehicle.nameFull, vehicle.company, vehicle.role, vehicle.padType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
    renderManufacturerOptions();
    renderShipOptions();
    shipApiStatus.textContent = "Using fallback ship list; UEX is not reachable from this browser";
  }

  renderFleet();
  renderCalendar();
  renderRentalResults();
  renderOwnerSchedule();
  renderCalendarFilterOptions();
  updateFilterSummary();
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

function setOwnerView(viewName) {
  document.querySelectorAll(".sub-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.ownerView === viewName);
  });

  document.querySelectorAll(".owner-view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.ownerPanel === viewName);
  });

  if (viewName === "schedule") {
    renderOwnerSchedule();
  }
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
    const dayShips = filterCalendarShips(ships).filter((ship) => ship.dates.includes(dateKey));
    const dayBookings = filterCalendarBookings(bookings).filter((booking) => booking.date === dateKey);
    const activeCount = state.calendarMode === "rentals" ? dayBookings.length : dayShips.length;
    const countLabel = activeCount ? `${activeCount} ${state.calendarMode === "rentals" ? "rentals" : "ships"}` : "Open";

    const cell = document.createElement("article");
    cell.className = `day-cell${isCurrentMonth ? "" : " is-muted"}`;
    cell.innerHTML = `
      <div class="day-number">
        <span>${displayDay}</span>
        ${isCurrentMonth ? `<small>${countLabel}</small>` : ""}
      </div>
    `;

    if (isCurrentMonth) {
      if (state.calendarMode === "rentals") {
        dayBookings.forEach((booking) => {
          cell.insertAdjacentHTML("beforeend", availabilityPill(booking.ship, booking.owner, booking.status));
        });

        if (!dayBookings.length) {
          cell.insertAdjacentHTML("beforeend", availabilityPill("No rentals scheduled", "Requests will appear here", "owner"));
        }
      } else {
        const visibleShips = dayShips.slice(0, 3);
        visibleShips.forEach((ship) => {
          cell.insertAdjacentHTML("beforeend", availabilityPill(ship.ship, ship.owner, "available"));
        });

        if (!visibleShips.length) {
          cell.insertAdjacentHTML("beforeend", availabilityPill("No listings yet", "Owners can claim this day", "owner"));
        }
      }
    }

    calendarGrid.appendChild(cell);
  }
}

function filterCalendarShips(sourceShips) {
  const ownerFilter = normalizeFilterValue(state.calendarFilters.owner);
  const shipFilter = normalizeFilterValue(state.calendarFilters.ship);
  const configMode = state.calendarFilters.configMode;

  return sourceShips.filter((ship) => {
    const matchesOwner = !ownerFilter || normalizeFilterValue(ship.owner).includes(ownerFilter);
    const matchesShip = !shipFilter || normalizeFilterValue(ship.ship).includes(shipFilter);
    const matchesConfig = configMode !== "custom" || Boolean(ship.configName || ship.configPrice || ship.hangarServices?.length);
    return matchesOwner && matchesShip && matchesConfig;
  });
}

function filterCalendarBookings(sourceBookings) {
  const ownerFilter = normalizeFilterValue(state.calendarFilters.owner);
  const shipFilter = normalizeFilterValue(state.calendarFilters.ship);

  return sourceBookings.filter((booking) => {
    const matchesOwner = !ownerFilter || normalizeFilterValue(booking.owner).includes(ownerFilter);
    const matchesShip = !shipFilter || normalizeFilterValue(booking.ship).includes(shipFilter);
    return matchesOwner && matchesShip;
  });
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
  fleetList.innerHTML = ships.length
    ? ships
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
                <li>Ship rate: ${formatCredits(ship.rate)} UEC / ${ratePeriodLabel(ship.ratePeriod)}</li>
                ${listingPriceFacts(ship)}
                <li>Dates: ${ship.dates.map(formatShortDate).join(", ")}</li>
                ${vehicleFacts(ship)}
              </ul>
              ${configurationSummary(ship)}
              <div class="card-actions">
                <button class="secondary-button" type="button" data-fleet-action="modify" data-ship-index="${ships.indexOf(ship)}">Modify</button>
                <button class="secondary-button danger-button" type="button" data-fleet-action="remove" data-ship-index="${ships.indexOf(ship)}">Remove</button>
              </div>
              ${hangarServicesSummary(ship)}
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">No owner listings yet. Add a ship to start building the fleet.</div>`;
}

function renderRentalResults() {
  const form = new FormData(rentForm);
  const neededDate = form.get("date");
  const query = String(form.get("query") || "").trim().toLowerCase();
  const budget = Number(form.get("budget") || Infinity);
  const budgetPeriod = form.get("budgetPeriod") || "hour";
  const manufacturer = String(form.get("manufacturer") || "");
  const results = ships.filter((ship) => {
    const matchesDate = !neededDate || ship.dates.includes(neededDate);
    const matchesBudget = Number.isNaN(budget) || convertRate(ship.rate, ship.ratePeriod, budgetPeriod) <= budget;
    const matchesManufacturer = !manufacturer || ship.manufacturer === manufacturer || ship.vehicle?.company === manufacturer;
    const haystack = `${ship.ship} ${ship.role} ${ship.owner} ${ship.manufacturer || ""}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesDate && matchesBudget && matchesManufacturer && matchesQuery;
  });

  rentalResults.innerHTML = results.length
    ? results
        .map(
          (ship) => `
            <article class="result-card">
              ${shipImage(ship)}
              <div class="card-top">
                <h2>${escapeHtml(ship.ship)}</h2>
                <span class="tag">${formatCredits(ship.rate)} UEC/${ratePeriodLabel(ship.ratePeriod)}</span>
              </div>
              <ul class="meta-list">
                <li>Owner: ${escapeHtml(ship.owner)}</li>
                <li>Role: ${escapeHtml(ship.role)}</li>
                ${listingPriceFacts(ship)}
                <li>Available: ${ship.dates.map(formatShortDate).join(", ")}</li>
                ${vehicleFacts(ship)}
              </ul>
              ${configurationSummary(ship)}
              ${hangarServicesSummary(ship)}
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">No ships match that request yet. Try a wider budget or another date.</div>`;
}

function renderOwnerSchedule() {
  availabilityShipSelect.innerHTML = ships.length
    ? ships
        .map((ship, index) => `<option value="${index}">${escapeHtml(ship.ship)} - ${escapeHtml(ship.owner)}</option>`)
        .join("")
    : `<option value="">No fleet ships yet</option>`;

  availabilityForm.querySelectorAll("input, select, button").forEach((control) => {
    control.disabled = ships.length === 0;
  });

  if (!ships.length) {
    ownerCalendar.innerHTML = `<div class="empty-state">Add ships to your fleet, then use this schedule view to set availability.</div>`;
    return;
  }

  const year = state.activeDate.getFullYear();
  const month = state.activeDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  let markup = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((day) => `<div class="weekday">${day}</div>`)
    .join("");

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const dateKey = isCurrentMonth ? toDateKey(year, month, dayNumber) : "";
    const availableShips = ships.filter((ship) => ship.dates.includes(dateKey));
    const unavailableShips = ships.filter((ship) => ship.unavailableDates?.includes(dateKey));
    const pills = [
      ...availableShips.map((ship) => availabilityPill(ship.ship, "Available", "available")),
      ...unavailableShips.map((ship) => availabilityPill(ship.ship, "Unavailable", "booked")),
    ].join("");

    markup += `
      <article class="day-cell${isCurrentMonth ? "" : " is-muted"}">
        <div class="day-number">
          <span>${isCurrentMonth ? dayNumber : ""}</span>
          ${isCurrentMonth ? `<small>${availableShips.length} available</small>` : ""}
        </div>
        ${isCurrentMonth ? pills || availabilityPill("No fleet availability", "Set dates above", "owner") : ""}
      </article>
    `;
  }

  ownerCalendar.innerHTML = markup;
}

function renderCalendarFilterOptions() {
  calendarOwnerOptions.innerHTML = uniqueSorted([
    ...ships.map((ship) => ship.owner),
    ...bookings.map((booking) => booking.owner),
  ])
    .map((owner) => `<option value="${escapeHtml(owner)}"></option>`)
    .join("");
  calendarShipOptions.innerHTML = uniqueSorted([
    ...ships.map((ship) => ship.ship),
    ...bookings.map((booking) => booking.ship),
  ])
    .map((ship) => `<option value="${escapeHtml(ship)}"></option>`)
    .join("");

  calendarFilterForm.elements.owner.value = state.calendarFilters.owner;
  calendarFilterForm.elements.ship.value = state.calendarFilters.ship;
  calendarFilterForm.elements.configMode.value = state.calendarFilters.configMode;
}

function updateFilterSummary() {
  const filters = [];
  if (state.calendarFilters.owner) {
    filters.push(`Owner: ${state.calendarFilters.owner}`);
  }
  if (state.calendarFilters.ship) {
    filters.push(`Ship: ${state.calendarFilters.ship}`);
  }
  if (state.calendarFilters.configMode === "custom") {
    filters.push("Config: Custom");
  }

  filterSummary.textContent = filters.length ? filters.join(" · ") : "No filters applied";
  generateRequestButton.classList.toggle("is-hidden", filters.length === 0);
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
  const matches = getServiceLocations(service)
    .filter((location) => !system || location.system === system)
    .filter((location) => !planet || location.planet === planet)
    .filter((location) => !terminal || location.terminal === terminal)
    .sort((first, second) => Number(first.price) - Number(second.price));
  const match = matches[0];
  const adjustedPrice = match ? applyHangarLoadMarkup(match.price) : 0;

  price.value = match ? `${formatCredits(adjustedPrice)} UEC` : "-";
  price.dataset.price = match ? String(adjustedPrice) : "";
  price.dataset.basePrice = match ? String(match.price) : "";
}

function updateAllServicePrices() {
  hangarServiceRows.querySelectorAll(".service-row").forEach((row) => updateServicePrice(row));
}

function applyHangarLoadMarkup(price) {
  if (hangarLoadModeSelect.value !== "percent") {
    return Number(price || 0);
  }

  const percent = Math.max(0, Number(hangarLoadPercentInput.value || 0));
  return Math.round(Number(price || 0) * (1 + percent / 100));
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
        basePrice: Number(priceOutput.dataset.basePrice || 0),
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

function resetOwnerForm() {
  editingShipIndex = null;
  ownerForm.reset();
  hangarLoadModeSelect.value = "flat";
  hangarLoadCostInput.value = "0";
  hangarLoadPercentInput.value = "0";
  ownerSubmitButton.textContent = "Add ship";
  resetHangarRows();
  updateHangarEligibility();
  updateAllServicePrices();
}

function populateOwnerForm(index) {
  const ship = ships[index];
  if (!ship) {
    return;
  }

  editingShipIndex = index;
  ownerForm.elements.owner.value = ship.owner || "";
  ownerManufacturerSelect.value = ship.manufacturer || ship.vehicle?.company || "";
  renderShipOptions();
  ownerForm.elements.ship.value = ship.ship || "";
  ownerRoleSelect.value = roleForSelect(ship.role || "Cargo");
  ownerForm.elements.rate.value = ship.rate || "";
  ownerForm.elements.ratePeriod.value = ship.ratePeriod || "hour";
  ownerForm.elements.dates.value = (ship.dates || []).join(", ");
  ownerForm.elements.configName.value = ship.configName || "";
  ownerForm.elements.configPrice.value = ship.configPrice || 0;
  ownerForm.elements.pilotRate.value = ship.pilotRate || 0;
  ownerForm.elements.pilotIncluded.checked = Boolean(ship.pilotIncluded);
  ownerForm.elements.notes.value = ship.notes || "";
  offerHangarServices.checked = Boolean(ship.hangarServices?.length);
  hangarLoadModeSelect.value = ship.hangarLoadMode || "flat";
  hangarLoadCostInput.value = ship.hangarLoadCost || 0;
  hangarLoadPercentInput.value = ship.hangarLoadPercent || 0;
  ownerSubmitButton.textContent = "Update ship";
  updateHangarEligibility(ship.vehicle || ship.ship);
  resetHangarRows();
  applySavedHangarServices(ship.hangarServices || []);
  ownerForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applySavedHangarServices(services) {
  services.forEach((service) => {
    const row = Array.from(hangarServiceRows.querySelectorAll(".service-row")).find(
      (candidate) => candidate.dataset.service === service.label,
    );
    if (!row) {
      return;
    }

    row.querySelector(".service-enabled").checked = true;
    row.querySelector(".service-quantity").value = service.quantity || "";
    row.querySelector(".service-system").value = service.system || "";
    updateServicePlanetOptions(row);
    row.querySelector(".service-planet").value = service.planet || "";
    updateServiceTerminalOptions(row);
    row.querySelector(".service-terminal").value = service.terminal || "";
    updateServicePrice(row);
  });
}

function hangarServicesSummary(ship) {
  if (!ship.hangarServices?.length) {
    return "";
  }

  return `
    <div class="hangar-summary">
      <strong>${hangarLoadSummary(ship)}</strong>
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

function hangarLoadSummary(ship) {
  if (ship.hangarLoadMode === "percent" && ship.hangarLoadPercent) {
    return `Hangar Services · ${Number(ship.hangarLoadPercent).toLocaleString()}% load markup included`;
  }

  return `Hangar Services${ship.hangarLoadCost ? ` · Load time ${formatCredits(ship.hangarLoadCost)} UEC` : ""}`;
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
  const modelName = stripManufacturer(vehicle.name || "", vehicle.company_name || "");
  return {
    id: vehicle.id,
    name: modelName,
    nameFull: vehicle.name_full || vehicle.name || "",
    slug: vehicle.slug || "",
    company: vehicle.company_name || "",
    role: inferVehicleRole(vehicle),
    scu: Number(vehicle.scu || 0),
    crew: vehicle.crew || "",
    padType: vehicle.pad_type || "",
    photo: vehicle.url_photo || "",
    isAddon: Boolean(Number(vehicle.is_addon || 0)),
    searchText: [
      modelName,
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
  ownerShipOptions.innerHTML = filteredVehicles(ownerManufacturerSelect.value)
    .map(
      (vehicle) =>
        `<option value="${escapeHtml(vehicle.name)}"></option>`,
    )
    .join("");
  rentShipOptions.innerHTML = filteredVehicles(rentManufacturerSelect.value)
    .map(
      (vehicle) =>
        `<option value="${escapeHtml(vehicle.name)}"></option>`,
    )
    .join("");
}

function findVehicle(value) {
  const query = String(value || "").trim().toLowerCase();
  if (!query) {
    return null;
  }

  return (
    vehicleCatalog.find(
      (vehicle) =>
        vehicle.name.toLowerCase() === query &&
        (!ownerManufacturerSelect.value || vehicle.company === ownerManufacturerSelect.value),
    ) ||
    vehicleCatalog.find((vehicle) => vehicle.nameFull.toLowerCase() === query) ||
    vehicleCatalog.find((vehicle) => vehicle.name.toLowerCase() === query) ||
    vehicleCatalog.find((vehicle) => vehicle.searchText.includes(query))
  );
}

function renderManufacturerOptions() {
  const manufacturers = uniqueSorted(vehicleCatalog.map((vehicle) => vehicle.company));
  const options = [`<option value="">All manufacturers</option>`]
    .concat(manufacturers.map((manufacturer) => `<option value="${escapeHtml(manufacturer)}">${escapeHtml(manufacturer)}</option>`))
    .join("");

  ownerManufacturerSelect.innerHTML = options;
  rentManufacturerSelect.innerHTML = options;
}

function filteredVehicles(manufacturer) {
  return manufacturer ? vehicleCatalog.filter((vehicle) => vehicle.company === manufacturer) : vehicleCatalog;
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
      ship.ship = vehicle.name;
      ship.role = vehicle.role;
      ship.manufacturer = vehicle.company;
      ship.vehicle = vehicle;
    }

    if (!isHangarServiceEligible(vehicle || ship.ship)) {
      ship.hangarServices = [];
    }
  });

  updateHangarEligibility();
}

function shipImage(ship) {
  const localPhoto = ship.vehicle?.slug ? `/ships/${ship.vehicle.slug}.webp` : "";
  const fallbackPhoto = ship.vehicle?.photo || "";
  const photo = localPhoto || fallbackPhoto;
  if (!photo) {
    return `<div class="ship-image placeholder">SSR</div>`;
  }

  const fallbackAttr = localPhoto && fallbackPhoto ? ` data-fallback-src="${escapeHtml(fallbackPhoto)}"` : "";
  return `<img class="ship-image" src="${escapeHtml(photo)}" alt="${escapeHtml(ship.ship)}" loading="lazy"${fallbackAttr} onerror="handleShipImageError(this)" />`;
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

function normalizeFilterValue(value) {
  return String(value || "").trim().toLowerCase();
}

function ratePeriodLabel(period = "hour") {
  return period === "day" ? "day" : period === "week" ? "week" : "hour";
}

function convertRate(rate, fromPeriod = "hour", toPeriod = "hour") {
  const periodHours = {
    hour: 1,
    day: 24,
    week: 168,
  };
  const hourlyRate = Number(rate || 0) / (periodHours[fromPeriod] || 1);
  return hourlyRate * (periodHours[toPeriod] || 1);
}

function normalizeShipName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(rsi|roberts space industries)\b/g, "rsi")
    .replace(/\s+/g, " ")
    .trim();
}

function stripManufacturer(name, manufacturer) {
  const cleanName = String(name || "").trim();
  const cleanManufacturer = String(manufacturer || "").trim();
  if (!cleanManufacturer) {
    return cleanName;
  }

  return cleanName.replace(new RegExp(`^${escapeRegExp(cleanManufacturer)}\\s+`, "i"), "").trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function parseDateList(value) {
  return String(value || "")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);
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
renderOwnerSchedule();
renderCalendarFilterOptions();
updateFilterSummary();
loadVehicles();
loadHangarServices();
