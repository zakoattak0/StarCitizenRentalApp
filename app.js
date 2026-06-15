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

const apolloModuleLabels = {
  "tier-1": "1x Tier 1 Medbed",
  "tier-2": "2x Tier 2 Medbeds",
  "tier-3": "3x Tier 3 Medbeds",
};

const salvageHeadOptions = ["Trawler", "Cinch", "Abrade"];
const salvageHeadCounts = new Map([
  ["reclaimer", 2],
  ["vulture", 2],
  ["moth", 3],
  ["fortune", 1],
]);

const miningShips = new Map([
  ["mole", { headCapacity: 3, headSize: 2 }],
  ["prospector", { headCapacity: 1, headSize: 1 }],
  ["golem", { headCapacity: 1, headSize: 1 }],
]);

const miningHeads = [
  { name: "Arbor MH1 Mining Laser", size: 1, moduleSlots: 1 },
  { name: "Helix I Mining Laser", size: 1, moduleSlots: 2 },
  { name: "Hofstede-S1 Mining Laser", size: 1, moduleSlots: 1 },
  { name: "Impact I Mining Laser", size: 1, moduleSlots: 2 },
  { name: "Klein-S1 Mining Laser", size: 1, moduleSlots: 0 },
  { name: "Lancet MH1 Mining Laser", size: 1, moduleSlots: 1 },
  { name: "Pitman Mining Laser", size: 1, moduleSlots: 2 },
  { name: "Arbor MH2 Mining Laser", size: 2, moduleSlots: 2 },
  { name: "Helix II Mining Laser", size: 2, moduleSlots: 3 },
  { name: "Hofstede-S2 Mining Laser", size: 2, moduleSlots: 2 },
  { name: "Impact II Mining Laser", size: 2, moduleSlots: 3 },
  { name: "Klein-S2 Mining Laser", size: 2, moduleSlots: 1 },
  { name: "Lancet MH2 Mining Laser", size: 2, moduleSlots: 2 },
];

const miningModules = {
  Active: [
    "Brandt Module",
    "Forel Module",
    "Lifeline Module",
    "Optimum Module",
    "Rime Module",
    "Stampede Module",
    "Surge Module",
    "Torpid Module",
  ],
  Passive: [
    "FLTR Module", "FLTR-L Module", "FLTR-XL Module", "Focus Module", "Focus II Module",
    "Focus III Module", "Rieger Module", "Rieger-C2 Module", "Rieger-C3 Module", "Torrent Module",
    "Torrent II Module", "Torrent III Module", "Vaux Module", "Vaux-C2 Module", "Vaux-C3 Module",
    "XTR Module", "XTR-L Module", "XTR-XL Module",
  ],
};

const idrisShips = new Set(["idris m", "idris p"]);

const idrisS10NoseWeapons = [
  "Exodus-10",
  "Destroyer Mass Driver",
  "HMF-12 Hammerfall Torpedo Launcher",
];

const idrisS7NoseTurrets = [
  "IFR-BC7 (Conqueror-7 x2)",
  "IFR-MS7 (Idris-5163 Missile Turret Viper III x32)",
  "IFR-W57 Turret",
];

const idrisW57TurretOption = "IFR-W57 Turret";

const size5WeaponOptions = [
  "'WAR'",
  "'WRATH'",
  "Absolution Distortion Scattergun",
  "AD5B Ballistic Gatling",
  "Attrition-5 Repeater",
  "CF-557 Galdereen Repeater",
  "CF-557 Galdereen Repeater (Idris)",
  "Deadbolt V Cannon",
  "Echion Repeater",
  "Leonids Cannon",
  "Lightstrike V Cannon",
  "M7A Cannon",
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
let hangarMarketError = "";
let editingShipIndex = null;
let pendingRemoveShipIndex = null;
let availabilityShipIndex = null;
let availabilityView = "week";
let scheduleView = "month";
let scheduleCursor = startOfDay(new Date());
let availabilityCursor = startOfDay(new Date());
let availabilityDraft = new Map();

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
const ownerManufacturerSelect = document.querySelector("#owner-manufacturer");
const rentManufacturerSelect = document.querySelector("#rent-manufacturer");
const availabilityForm = document.querySelector("#availability-form");
const availabilityShipSelect = document.querySelector("#availability-ship");
const ownerCalendar = document.querySelector("#owner-calendar");
const shipConfigFieldset = document.querySelector("#ship-config-fieldset");
const apolloConfig = document.querySelector("#apollo-config");
const salvageConfig = document.querySelector("#salvage-config");
const salvageConfigDescription = document.querySelector("#salvage-config-description");
const salvageHeadGrid = document.querySelector("#salvage-head-grid");
const miningConfig = document.querySelector("#mining-config");
const miningConfigDescription = document.querySelector("#mining-config-description");
const miningHeadGrid = document.querySelector("#mining-head-grid");
const miningAvailableHeadGrid = document.querySelector("#mining-available-head-grid");
const miningModuleGroups = document.querySelector("#mining-module-groups");
const idrisConfig = document.querySelector("#idris-config");
const idrisS10Group = document.querySelector("#idris-s10-group");
const idrisS7Group = document.querySelector("#idris-s7-group");
const idrisS5Field = document.querySelector("#idris-s5-field");
const idrisS5WeaponSelect = document.querySelector("#idris-s5-weapon");
const schedulePeriodLabel = document.querySelector("#schedule-period-label");
const schedulePrev = document.querySelector("#schedule-prev");
const scheduleToday = document.querySelector("#schedule-today");
const scheduleNext = document.querySelector("#schedule-next");
const offerHangarServices = document.querySelector("#offer-hangar-services");
const hangarServiceStatus = document.querySelector("#hangar-service-status");
const hangarFieldset = document.querySelector("#hangar-fieldset");
const hangarServicesPanel = document.querySelector("#hangar-services-panel");
const hangarFeeControls = document.querySelector("#hangar-fee-controls");
const hangarServiceRows = document.querySelector("#hangar-service-rows");
const addFleetShipButton = document.querySelector("#add-fleet-ship");
const ownerConfiguratorModal = document.querySelector("#owner-configurator-modal");
const ownerConfiguratorTitle = document.querySelector("#owner-configurator-title");
const ownerConfiguratorClose = document.querySelector("#owner-configurator-close");
const removeShipModal = document.querySelector("#remove-ship-modal");
const removeShipMessage = document.querySelector("#remove-ship-message");
const removeShipCancel = document.querySelector("#remove-ship-cancel");
const removeShipConfirm = document.querySelector("#remove-ship-confirm");
const availabilityModal = document.querySelector("#availability-modal");
const availabilityModalTitle = document.querySelector("#availability-modal-title");
const availabilityModalClose = document.querySelector("#availability-modal-close");
const availabilityPicker = document.querySelector("#availability-picker");
const availabilityPeriodLabel = document.querySelector("#availability-period-label");
const availabilityPrev = document.querySelector("#availability-prev");
const availabilityToday = document.querySelector("#availability-today");
const availabilityNext = document.querySelector("#availability-next");
const availabilityCancel = document.querySelector("#availability-cancel");
const availabilitySave = document.querySelector("#availability-save");
const availabilitySelectAll = document.querySelector("#availability-select-all");
const availabilityDeselectAll = document.querySelector("#availability-deselect-all");
const hangarLoadModeSelect = document.querySelector("#hangar-load-mode");
const hangarLoadCostInput = document.querySelector("#hangar-load-cost");
const hangarLoadPercentInput = document.querySelector("#hangar-load-percent");
const hangarLoadPercentValue = document.querySelector("#hangar-load-percent-value");
const hangarFlatPriceField = document.querySelector("#hangar-flat-price-field");
const hangarMarkupField = document.querySelector("#hangar-markup-field");
const hangarFeeTreatmentSelect = document.querySelector("#hangar-fee-treatment");
const hangarFeeTotal = document.querySelector("#hangar-fee-total");
const adjustedRentalTotals = document.querySelector("#adjusted-rental-totals");
const ownerSubmitButton = ownerForm.querySelector("button[type='submit']");
const rateBasePeriodSelect = document.querySelector("#rate-base-period");
const rateBaseInput = document.querySelector("#rate-base");
const rateFormula = document.querySelector("#rate-formula");
const rateInputs = {
  hour: ownerForm.elements.rateHour,
  day: ownerForm.elements.rateDay,
  week: ownerForm.elements.rateWeek,
};
const rateOfferInputs = {
  hour: ownerForm.elements.offerRateHour,
  day: ownerForm.elements.offerRateDay,
  week: ownerForm.elements.offerRateWeek,
};
const rateAdjustmentInputs = {
  hour: ownerForm.elements.adjustmentHour,
  day: ownerForm.elements.adjustmentDay,
  week: ownerForm.elements.adjustmentWeek,
};
const rateError = document.querySelector("#rate-error");
const pilotIncludedInput = document.querySelector("#pilot-included");
const pilotRateField = document.querySelector("#pilot-rate-field");

window.handleShipImageError = (image) => {
  const fallback = image.dataset.fallbackSrc;
  if (fallback) {
    image.dataset.fallbackSrc = "";
    image.src = fallback;
    return;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "ship-image placeholder";
  placeholder.textContent = "FFE";
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
  rentShipOptions.value = "";
  renderShipOptions();
  renderRentalResults();
});

rateBasePeriodSelect.addEventListener("change", updateRateCalculator);
rateBaseInput.addEventListener("input", () => {
  formatCreditInput(rateBaseInput);
  updateRateCalculator();
});
Object.values(rateOfferInputs).forEach((input) => {
  input.addEventListener("change", updateRateCalculator);
});
Object.values(rateAdjustmentInputs).forEach((input) => {
  input.addEventListener("input", updateRateCalculator);
});

pilotIncludedInput.addEventListener("change", () => {
  updatePilotRateVisibility();
  updateHangarFeeSummary();
});
ownerForm.elements.pilotRate.addEventListener("input", () => {
  formatCreditInput(ownerForm.elements.pilotRate);
  updateHangarFeeSummary();
});
hangarLoadCostInput.addEventListener("input", () => formatCreditInput(hangarLoadCostInput));
ownerForm.addEventListener("change", (event) => {
  if (event.target?.name === "idrisS7Turrets") {
    updateIdrisS5WeaponVisibility();
  }

  if (event.target?.name === "miningCurrentHeads") {
    updateMiningCurrentModuleSlots(event.target.dataset.slot);
  }

  if (event.target?.name === "miningAvailableHeads") {
    const quantityInput = ownerForm.querySelector(`input[name="miningAvailableHeadQuantities"][data-head="${cssEscape(event.target.value)}"]`);
    if (quantityInput) {
      quantityInput.value = event.target.checked ? quantityInput.value || "1" : "";
    }
  }

  if (event.target?.name === "miningModules") {
    const quantityInput = ownerForm.querySelector(`input[name="miningModuleQuantities"][data-module="${cssEscape(event.target.value)}"]`);
    if (quantityInput) {
      quantityInput.value = event.target.checked ? quantityInput.value || "1" : "";
    }
  }
});
ownerForm.addEventListener("input", (event) => {
  if (event.target?.name === "miningAvailableHeadQuantities") {
    const checkbox = ownerForm.querySelector(`input[name="miningAvailableHeads"][value="${cssEscape(event.target.dataset.head)}"]`);
    if (checkbox && Number(event.target.value || 0) > 0) {
      checkbox.checked = true;
    }
    return;
  }

  if (event.target?.name !== "miningModuleQuantities") {
    return;
  }

  const checkbox = ownerForm.querySelector(`input[name="miningModules"][value="${cssEscape(event.target.dataset.module)}"]`);
  if (checkbox && Number(event.target.value || 0) > 0) {
    checkbox.checked = true;
  }
});

ownerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(ownerForm);
  const selectedVehicle = findVehicle(data.get("ship"));
  const hangarServices = collectHangarServices();
  const existingShip = editingShipIndex === null ? null : ships[editingShipIndex];
  const offeredRates = getOfferedRatePeriods();
  const rates = calculateRates();

  if (parseCredits(data.get("rateBase")) <= 0 || offeredRates.length === 0) {
    rateError.classList.remove("is-hidden");
    rateBaseInput.focus();
    return;
  }

  const listing = {
    owner: data.get("owner"),
    ship: selectedVehicle?.name || data.get("ship"),
    role: selectedVehicle?.role || existingShip?.role || "General",
    rates,
    offeredRates,
    rateBasePeriod: data.get("rateBasePeriod") || "hour",
    rateBase: parseCredits(data.get("rateBase")),
    rateAdjustments: getRateAdjustments(),
    manufacturer: selectedVehicle?.company || data.get("manufacturer"),
    pilotIncluded: data.has("pilotIncluded"),
    pilotRate: data.has("pilotIncluded") ? parseCredits(data.get("pilotRate")) : 0,
    hangarLoadCost: data.get("hangarLoadMode") === "flat" ? parseCredits(data.get("hangarLoadCost")) : 0,
    hangarLoadMode: data.get("hangarLoadMode") || "flat",
    hangarLoadPercent: data.get("hangarLoadMode") === "percent" ? getHangarLoadPercent() : 0,
    hangarFeeTreatment: data.get("hangarFeeTreatment") || "add",
    notes: data.get("notes"),
    dates: existingShip?.dates || [],
    shipConfig: collectShipConfiguration(selectedVehicle),
    hangarServices,
    vehicle: selectedVehicle,
  };

  if (editingShipIndex === null) {
    ships.unshift(listing);
  } else {
    ships[editingShipIndex] = listing;
  }

  resetOwnerForm();
  closeOwnerConfigurator();
  renderFleet();
  renderCalendar();
  renderRentalResults();
  renderOwnerSchedule();
  updateFilterSummary();
});

addFleetShipButton.addEventListener("click", () => {
  resetOwnerForm();
  openOwnerConfigurator("add");
});

ownerConfiguratorClose.addEventListener("click", closeOwnerConfigurator);

ownerConfiguratorModal.addEventListener("click", (event) => {
  if (event.target === ownerConfiguratorModal) {
    closeOwnerConfigurator();
  }
});

removeShipCancel.addEventListener("click", closeRemoveConfirmation);

removeShipModal.addEventListener("click", (event) => {
  if (event.target === removeShipModal) {
    closeRemoveConfirmation();
  }
});

removeShipConfirm.addEventListener("click", () => {
  if (pendingRemoveShipIndex === null || !ships[pendingRemoveShipIndex]) {
    closeRemoveConfirmation();
    return;
  }

  ships.splice(pendingRemoveShipIndex, 1);
  closeRemoveConfirmation();
  resetOwnerForm();
  renderFleet();
  renderCalendar();
  renderRentalResults();
  renderOwnerSchedule();
  renderCalendarFilterOptions();
  updateFilterSummary();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!availabilityModal.classList.contains("is-hidden")) {
    closeAvailabilityModal();
  } else if (!removeShipModal.classList.contains("is-hidden")) {
    closeRemoveConfirmation();
  } else if (!ownerConfiguratorModal.classList.contains("is-hidden")) {
    closeOwnerConfigurator();
  }
});

fleetList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-fleet-action]");
  if (!actionButton) {
    return;
  }

  const index = Number(actionButton.dataset.shipIndex);
  if (actionButton.dataset.fleetAction === "availability") {
    openAvailabilityModal(index);
  }

  if (actionButton.dataset.fleetAction === "modify") {
    populateOwnerForm(index);
    openOwnerConfigurator("modify");
  }

  if (actionButton.dataset.fleetAction === "remove") {
    openRemoveConfirmation(index);
  }
});

availabilityModalClose.addEventListener("click", closeAvailabilityModal);
availabilityCancel.addEventListener("click", closeAvailabilityModal);

availabilityModal.addEventListener("click", (event) => {
  if (event.target === availabilityModal) {
    closeAvailabilityModal();
  }
});

document.querySelectorAll("[data-availability-view]").forEach((button) => {
  button.addEventListener("click", () => {
    availabilityView = button.dataset.availabilityView;
    renderAvailabilityPicker();
  });
});

availabilityPrev.addEventListener("click", () => {
  availabilityCursor = shiftAvailabilityPeriod(availabilityCursor, -1);
  renderAvailabilityPicker();
});

availabilityToday.addEventListener("click", () => {
  availabilityCursor = startOfDay(new Date());
  renderAvailabilityPicker();
});

availabilityNext.addEventListener("click", () => {
  availabilityCursor = shiftAvailabilityPeriod(availabilityCursor, 1);
  renderAvailabilityPicker();
});

availabilityPicker.addEventListener("click", (event) => {
  const dateButton = event.target.closest("[data-availability-date]");
  if (!dateButton) {
    return;
  }

  const dateKey = dateButton.dataset.availabilityDate;
  const currentStatus = availabilityDraft.get(dateKey) || "unset";
  availabilityDraft.set(dateKey, currentStatus === "available" ? "unset" : "available");
  renderAvailabilityPicker();
});

availabilitySave.addEventListener("click", saveAvailabilityChanges);
availabilitySelectAll.addEventListener("click", () => {
  getSelectableAvailabilityDays().forEach((date) => availabilityDraft.set(dateToKey(date), "available"));
  renderAvailabilityPicker();
});
availabilityDeselectAll.addEventListener("click", () => {
  getSelectableAvailabilityDays().forEach((date) => availabilityDraft.delete(dateToKey(date)));
  renderAvailabilityPicker();
});

document.querySelectorAll("[data-schedule-view]").forEach((button) => {
  button.addEventListener("click", () => {
    scheduleView = button.dataset.scheduleView;
    document.querySelectorAll("[data-schedule-view]").forEach((candidate) => {
      candidate.classList.toggle("active", candidate.dataset.scheduleView === scheduleView);
    });
    renderOwnerSchedule();
  });
});

schedulePrev.addEventListener("click", () => {
  scheduleCursor = shiftSchedulePeriod(scheduleCursor, -1);
  renderOwnerSchedule();
});

scheduleToday.addEventListener("click", () => {
  scheduleCursor = startOfDay(new Date());
  renderOwnerSchedule();
});

scheduleNext.addEventListener("click", () => {
  scheduleCursor = shiftSchedulePeriod(scheduleCursor, 1);
  renderOwnerSchedule();
});

ownerShipInput.addEventListener("change", () => syncOwnerShipFields(ownerShipInput.value));

offerHangarServices.addEventListener("change", () => {
  updateHangarEligibility();
  updateHangarFeeSummary();
});

hangarLoadModeSelect.addEventListener("change", () => {
  updateHangarLoadPriceControls();
  updateAllServicePrices();
});
hangarLoadPercentInput.addEventListener("input", () => {
  updateHangarLoadPriceControls();
  updateAllServicePrices();
});
hangarLoadCostInput.addEventListener("input", updateHangarFeeSummary);
hangarFeeTreatmentSelect.addEventListener("change", updateHangarFeeSummary);

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

  if (event.target.matches(".service-enabled")) {
    updateServiceRowTotal(row);
  }
});

hangarServiceRows.addEventListener("input", (event) => {
  const row = event.target.closest(".service-row");
  if (row && event.target.matches(".service-quantity")) {
    updateServiceRowTotal(row);
  }
});

rentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderRentalResults();
});

availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedIndex = availabilityShipSelect.value;
  if (selectedIndex !== "all" && ships[Number(selectedIndex)]) {
    openAvailabilityModal(Number(selectedIndex));
  }
});

availabilityShipSelect.addEventListener("change", () => {
  availabilityForm.querySelector("button[type='submit']").disabled = availabilityShipSelect.value === "all";
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
  hangarMarketError = "";

  try {
    const response = await fetch(HANGAR_SERVICES_URL);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `Hangar services returned ${response.status}`);
    }

    hangarMarketRows = Array.isArray(payload.rows) ? payload.rows : [];
  } catch (error) {
    hangarMarketRows = [];
    hangarMarketError = error instanceof Error ? error.message : "Unable to load UEX purchase locations";
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
    const matchesConfig = configMode !== "custom" || Boolean(ship.hangarServices?.length || ship.shipConfig);
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
                ${rateFacts(ship)}
                ${listingPriceFacts(ship)}
                ${vehicleFacts(ship)}
              </ul>
              ${configurationSummary(ship)}
              <div class="card-actions">
                <button class="primary-button" type="button" data-fleet-action="availability" data-ship-index="${ships.indexOf(ship)}">Availability</button>
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
  const budget = Number(form.get("budget") || Infinity);
  const budgetPeriod = form.get("budgetPeriod") || "hour";
  const manufacturer = String(form.get("manufacturer") || "");
  const selectedVehicleId = String(form.get("query") || "");
  const results = ships.filter((ship) => {
    const matchesDate = !neededDate || ship.dates.includes(neededDate);
    const comparableRate = getShipRate(ship, budgetPeriod);
    const matchesBudget = Number.isNaN(budget) || (comparableRate > 0 && comparableRate <= budget);
    const matchesManufacturer = !manufacturer || ship.manufacturer === manufacturer || ship.vehicle?.company === manufacturer;
    const matchesShip = !selectedVehicleId || String(ship.vehicle?.id || "") === selectedVehicleId;
    return matchesDate && matchesBudget && matchesManufacturer && matchesShip;
  });

  rentalResults.innerHTML = results.length
    ? results
        .map(
          (ship) => `
            <article class="result-card">
              ${shipImage(ship)}
              <div class="card-top">
                <h2>${escapeHtml(ship.ship)}</h2>
                <span class="tag">${formatCredits(getShipRate(ship, budgetPeriod))} UEC/${ratePeriodLabel(budgetPeriod)}</span>
              </div>
              <ul class="meta-list">
                <li>Owner: ${escapeHtml(ship.owner)}</li>
                <li>Role: ${escapeHtml(ship.role)}</li>
                ${rateFacts(ship)}
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
  const previousSelection = availabilityShipSelect.value || "all";
  availabilityShipSelect.innerHTML = ships.length
    ? [
        `<option value="all">All fleet ships</option>`,
        ...ships.map((ship, index) => `<option value="${index}">${escapeHtml(ship.ship)} - ${escapeHtml(ship.owner)}</option>`),
      ].join("")
    : `<option value="">No fleet ships yet</option>`;
  availabilityShipSelect.value = previousSelection === "all" || ships[Number(previousSelection)]
    ? previousSelection
    : "all";

  availabilityForm.querySelectorAll("select, button").forEach((control) => {
    control.disabled = ships.length === 0;
  });
  availabilityForm.querySelector("button[type='submit']").disabled = ships.length === 0 || availabilityShipSelect.value === "all";

  const visibleMonth = scheduleCursor.getMonth();
  const calendarDays = scheduleView === "week"
    ? availabilityWeekDays(scheduleCursor)
    : availabilityMonthDays(scheduleCursor);
  schedulePeriodLabel.textContent = scheduleView === "week"
    ? formatWeekRange(calendarDays[0], calendarDays[calendarDays.length - 1])
    : scheduleCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (!ships.length) {
    ownerCalendar.innerHTML = `<div class="empty-state">Add ships to your fleet, then use this schedule view to set availability.</div>`;
    return;
  }

  const selectedShips = availabilityShipSelect.value === "all"
    ? ships
    : ships[Number(availabilityShipSelect.value)]
      ? [ships[Number(availabilityShipSelect.value)]]
      : ships;

  let markup = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((day) => `<div class="weekday">${day}</div>`)
    .join("");

  calendarDays.forEach((date) => {
    const isVisibleDate = scheduleView === "week" || date.getMonth() === visibleMonth;
    const dateKey = dateToKey(date);
    const matchingShips = selectedShips.filter((ship) => ship.dates.includes(dateKey));
    const pills = matchingShips.map((ship) => scheduleShipPill(ship.ship)).join("");

    markup += `
      <article class="day-cell${isVisibleDate ? "" : " is-muted"}">
        <div class="day-number">
          <span>${isVisibleDate ? date.getDate() : ""}</span>
          ${isVisibleDate && matchingShips.length ? `<small>${matchingShips.length}</small>` : ""}
        </div>
        ${isVisibleDate ? pills : ""}
      </article>
    `;
  });

  ownerCalendar.innerHTML = markup;
}

function scheduleShipPill(shipName) {
  return `<div class="availability-pill available"><strong>${escapeHtml(shipName)}</strong></div>`;
}

function shiftSchedulePeriod(date, direction) {
  const shifted = new Date(date);
  if (scheduleView === "month") {
    shifted.setDate(1);
    shifted.setMonth(shifted.getMonth() + direction);
  } else {
    shifted.setDate(shifted.getDate() + direction * 7);
  }
  return startOfDay(shifted);
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
      <output class="service-price" data-label="Price / SCU">-</output>
      <output class="service-total" data-label="Total">-</output>
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
  updateServiceRowTotal(row);
}

function updateAllServicePrices() {
  hangarServiceRows.querySelectorAll(".service-row").forEach((row) => updateServicePrice(row));
  updateHangarFeeSummary();
}

function applyHangarLoadMarkup(price) {
  if (hangarLoadModeSelect.value !== "percent") {
    return Number(price || 0);
  }

  const percent = getHangarLoadPercent();
  return Math.round(Number(price || 0) * (1 + percent / 100));
}

function getHangarLoadPercent() {
  return Math.max(0, Number(hangarLoadPercentInput.value || 0));
}

function updateHangarLoadPriceControls() {
  const usesFlatRate = hangarLoadModeSelect.value === "flat";
  hangarFlatPriceField.classList.toggle("is-hidden", !usesFlatRate);
  hangarMarkupField.classList.toggle("is-hidden", usesFlatRate);
  hangarLoadCostInput.disabled = !usesFlatRate;
  hangarLoadPercentInput.disabled = usesFlatRate;
  hangarLoadPercentValue.textContent = `${getHangarLoadPercent()}%`;
}

function setHangarLoadPercent(value) {
  hangarLoadPercentInput.value = String(Math.min(500, Math.max(0, Number(value || 0))));
}

function updateServiceRowTotal(row) {
  const quantity = Number(row.querySelector(".service-quantity").value || 0);
  const unitPrice = Number(row.querySelector(".service-price").dataset.price || 0);
  const enabled = row.querySelector(".service-enabled").checked;
  const total = enabled ? quantity * unitPrice : 0;
  const output = row.querySelector(".service-total");
  output.value = total ? `${formatCredits(total)} UEC` : "-";
  output.dataset.total = String(total);
  updateHangarFeeSummary();
}

function updateHangarFeeSummary() {
  if (!hangarFeeTotal || !adjustedRentalTotals) {
    return;
  }

  const commodityTotal = Array.from(hangarServiceRows.querySelectorAll(".service-row")).reduce(
    (total, row) => total + Number(row.querySelector(".service-total")?.dataset.total || 0),
    0,
  );
  const flatLoadPrice = offerHangarServices.checked && hangarLoadModeSelect.value === "flat"
    ? parseCredits(hangarLoadCostInput.value)
    : 0;
  const totalFee = offerHangarServices.checked ? commodityTotal + flatLoadPrice : 0;
  const treatment = hangarFeeTreatmentSelect.value;
  const rates = calculateRates();
  const offeredRates = getOfferedRatePeriods();
  const adjustedRates = Object.fromEntries(
    offeredRates.map((period) => {
      const rentalRate = Number(rates[period] || 0);
      return [
        period,
        treatment === "subtract" ? Math.max(0, rentalRate - totalFee) : rentalRate + totalFee,
      ];
    }),
  );
  const pilotRate = pilotIncludedInput.checked ? parseCredits(ownerForm.elements.pilotRate.value) : 0;
  const hourlyRentalTotal = treatment === "subtract"
    ? Math.max(0, Number(rates.hour || 0) - totalFee)
    : Number(rates.hour || 0) + totalFee;

  hangarFeeTotal.textContent = `${formatCredits(totalFee)} UEC`;
  const standardTotals = offeredRates.map(
    (period) => `<div><span>${totalRateLabel(period)}</span><strong>${formatCredits(adjustedRates[period])} UEC</strong></div>`,
  );
  const hourlyIndex = offeredRates.indexOf("hour");
  const pilotTotal = pilotIncludedInput.checked
    ? `<div class="pilot-total"><span>Hourly with pilot</span><strong>${formatCredits(hourlyRentalTotal + pilotRate)} UEC</strong></div>`
    : "";
  if (pilotTotal) {
    standardTotals.splice(hourlyIndex >= 0 ? hourlyIndex + 1 : 0, 0, pilotTotal);
  }
  adjustedRentalTotals.innerHTML = [
    ...standardTotals,
  ].join("");
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
        total: Number(row.querySelector(".service-total").dataset.total || 0),
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
    updateServiceRowTotal(row);
  });
}

function resetOwnerForm() {
  editingShipIndex = null;
  ownerForm.reset();
  rateBasePeriodSelect.value = "hour";
  rateBaseInput.value = "";
  Object.values(rateOfferInputs).forEach((input) => {
    input.checked = true;
  });
  Object.values(rateAdjustmentInputs).forEach((input) => {
    input.value = "0";
  });
  hangarLoadModeSelect.value = "flat";
  hangarLoadCostInput.value = "0";
  hangarLoadPercentInput.value = "0";
  hangarFeeTreatmentSelect.value = "add";
  ownerSubmitButton.textContent = "Add ship";
  rateError.classList.add("is-hidden");
  updateRateCalculator();
  updatePilotRateVisibility();
  updateShipConfiguration();
  updateHangarLoadPriceControls();
  resetHangarRows();
  updateHangarEligibility();
  updateAllServicePrices();
}

function openOwnerConfigurator(mode) {
  const isEditing = mode === "modify";
  ownerConfiguratorTitle.textContent = isEditing ? "Modify ship" : "Add ship";
  ownerSubmitButton.textContent = isEditing ? "Update ship" : "Add ship";
  ownerConfiguratorModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  window.setTimeout(() => ownerForm.querySelector("[name='owner']").focus(), 0);
}

function closeOwnerConfigurator() {
  ownerConfiguratorModal.classList.add("is-hidden");
  if (removeShipModal.classList.contains("is-hidden") && availabilityModal.classList.contains("is-hidden")) {
    document.body.classList.remove("modal-open");
  }
}

function openAvailabilityModal(index) {
  const ship = ships[index];
  if (!ship) {
    return;
  }

  availabilityShipIndex = index;
  availabilityView = "week";
  availabilityCursor = startOfDay(new Date());
  availabilityDraft = new Map();
  (ship.dates || []).forEach((date) => availabilityDraft.set(date, "available"));
  availabilityModalTitle.textContent = `${ship.ship} availability`;
  availabilityModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  renderAvailabilityPicker();
  availabilityModalClose.focus();
}

function closeAvailabilityModal() {
  availabilityShipIndex = null;
  availabilityDraft = new Map();
  availabilityModal.classList.add("is-hidden");
  if (ownerConfiguratorModal.classList.contains("is-hidden") && removeShipModal.classList.contains("is-hidden")) {
    document.body.classList.remove("modal-open");
  }
}

function saveAvailabilityChanges() {
  const ship = ships[availabilityShipIndex];
  if (!ship) {
    closeAvailabilityModal();
    return;
  }

  ship.dates = uniqueSorted(
    Array.from(availabilityDraft.entries())
      .filter(([, status]) => status === "available")
      .map(([date]) => date),
  );
  closeAvailabilityModal();
  renderFleet();
  renderCalendar();
  renderRentalResults();
  renderOwnerSchedule();
}

function renderAvailabilityPicker() {
  updateAvailabilityControls();
  const days = availabilityView === "month"
    ? availabilityMonthDays(availabilityCursor)
    : availabilityWeekDays(availabilityCursor);
  const visibleMonth = availabilityCursor.getMonth();
  const todayKey = dateToKey(new Date());

  availabilityPeriodLabel.textContent = availabilityView === "month"
    ? availabilityCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : formatWeekRange(days[0], days[days.length - 1]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((day) => `<div class="weekday">${day}</div>`)
    .join("");
  const dateButtons = days
    .map((date) => {
      const dateKey = dateToKey(date);
      const status = availabilityDraft.get(dateKey) || "unset";
      const statusLabel = status === "available" ? "Available" : "Not set";
      const mutedClass = availabilityView === "month" && date.getMonth() !== visibleMonth ? " is-muted" : "";
      const todayClass = dateKey === todayKey ? " is-today" : "";
      return `
        <button class="availability-date ${status}${mutedClass}${todayClass}" type="button" data-availability-date="${dateKey}" aria-label="${escapeHtml(date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}: ${statusLabel}">
          <strong>${date.getDate()}</strong>
          <small>${statusLabel}</small>
        </button>
      `;
    })
    .join("");

  availabilityPicker.innerHTML = weekdays + dateButtons;
}

function getSelectableAvailabilityDays() {
  const days = availabilityView === "month"
    ? availabilityMonthDays(availabilityCursor)
    : availabilityWeekDays(availabilityCursor);
  return availabilityView === "month"
    ? days.filter((date) => date.getMonth() === availabilityCursor.getMonth())
    : days;
}

function updateAvailabilityControls() {
  document.querySelectorAll("[data-availability-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.availabilityView === availabilityView);
  });
}

function shiftAvailabilityPeriod(date, direction) {
  const shifted = new Date(date);
  if (availabilityView === "month") {
    shifted.setDate(1);
    shifted.setMonth(shifted.getMonth() + direction);
  } else {
    shifted.setDate(shifted.getDate() + direction * 7);
  }
  return startOfDay(shifted);
}

function availabilityWeekDays(date) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function availabilityMonthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));
  const totalDays = Math.round((end - start) / 86400000) + 1;
  return Array.from({ length: totalDays }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatWeekRange(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function openRemoveConfirmation(index) {
  const ship = ships[index];
  if (!ship) {
    return;
  }

  pendingRemoveShipIndex = index;
  removeShipMessage.textContent = `Are you sure you want to remove ${ship.ship} from your fleet?`;
  removeShipModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  removeShipCancel.focus();
}

function closeRemoveConfirmation() {
  pendingRemoveShipIndex = null;
  removeShipModal.classList.add("is-hidden");
  if (ownerConfiguratorModal.classList.contains("is-hidden") && availabilityModal.classList.contains("is-hidden")) {
    document.body.classList.remove("modal-open");
  }
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
  ownerForm.elements.ship.value = ship.vehicle?.id || findVehicle(ship.ship, ship.manufacturer)?.id || "";
  const basePeriod = ship.rateBasePeriod || firstShipRatePeriod(ship);
  rateBasePeriodSelect.value = basePeriod;
  rateBaseInput.value = formatCreditInputValue(ship.rateBase || getStoredShipRate(ship, basePeriod) || "");
  const offeredRates = ship.offeredRates || positiveShipRatePeriods(ship);
  Object.entries(rateOfferInputs).forEach(([period, input]) => {
    input.checked = offeredRates.includes(period);
  });
  Object.entries(rateAdjustmentInputs).forEach(([period, input]) => {
    input.value = String(ship.rateAdjustments?.[period] || 0);
  });
  ownerForm.elements.pilotRate.value = formatCreditInputValue(ship.pilotRate || 0);
  ownerForm.elements.pilotIncluded.checked = Boolean(ship.pilotIncluded);
  ownerForm.elements.notes.value = ship.notes || "";
  updateShipConfiguration(ship.vehicle || ship.ship);
  applyShipConfiguration(ship.shipConfig);
  offerHangarServices.checked = Boolean(ship.hangarServices?.length);
  hangarLoadModeSelect.value = ship.hangarLoadMode || "flat";
  hangarLoadCostInput.value = formatCreditInputValue(ship.hangarLoadCost || 0);
  setHangarLoadPercent(ship.hangarLoadPercent || 0);
  hangarFeeTreatmentSelect.value = ship.hangarFeeTreatment || "add";
  ownerSubmitButton.textContent = "Update ship";
  updatePilotRateVisibility();
  updateRateCalculator();
  updateHangarLoadPriceControls();
  updateHangarEligibility(ship.vehicle || ship.ship);
  resetHangarRows();
  applySavedHangarServices(ship.hangarServices || []);
  updateHangarFeeSummary();
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
    updateServiceRowTotal(row);
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
                service.price ? `@ ${formatCredits(service.price)} UEC / SCU` : ""
              }</small>
              ${service.total ? `<small>Total: ${formatCredits(service.total)} UEC</small>` : ""}
              <small>${[service.system, service.planet, service.terminal].filter(Boolean).map(escapeHtml).join(" / ")}</small>
            </div>
          `,
        )
        .join("")}
      <div class="hangar-summary-total">
        <span>Total rental fee</span>
        <strong>${formatCredits(getShipHangarFeeTotal(ship))} UEC</strong>
        <small>${ship.hangarFeeTreatment === "subtract" ? "Subtracted from rental rate" : "Added to rental total"}</small>
      </div>
    </div>
  `;
}

function getShipHangarFeeTotal(ship) {
  const commodityTotal = (ship.hangarServices || []).reduce(
    (total, service) => total + Number(service.total || Number(service.quantity || 0) * Number(service.price || 0)),
    0,
  );
  return commodityTotal + (ship.hangarLoadMode === "flat" ? Number(ship.hangarLoadCost || 0) : 0);
}

function hangarLoadSummary(ship) {
  if (ship.hangarLoadMode === "percent" && ship.hangarLoadPercent) {
    return `Hangar Services · ${Number(ship.hangarLoadPercent).toLocaleString()}% load markup included`;
  }

  return `Hangar Services${ship.hangarLoadCost ? ` · Load price ${formatCredits(ship.hangarLoadCost)} UEC` : ""}`;
}

function listingPriceFacts(ship) {
  return ship.pilotIncluded
    ? `<li>Pilot: offered${ship.pilotRate ? ` at ${formatCredits(ship.pilotRate)} UEC / hour` : ""}</li>`
    : "";
}

function configurationSummary(ship) {
  const configLines = shipConfigurationLines(ship.shipConfig);
  if (!ship.notes && !configLines.length) {
    return "";
  }

  return `
    <div class="config-summary">
      ${configLines.map((line) => `<div class="config-summary-line"><span>${escapeHtml(line.label)}</span><strong>${escapeHtml(line.value)}</strong></div>`).join("")}
      ${ship.notes ? `<p>${escapeHtml(ship.notes)}</p>` : ""}
    </div>
  `;
}

function collectShipConfiguration(vehicle = findVehicle(ownerShipInput.value)) {
  const configType = getShipConfigurationType(vehicle);
  if (configType === "apollo") {
    return {
      type: "apollo",
      leftModules: checkedConfigValues("apolloLeftModules"),
      rightModules: checkedConfigValues("apolloRightModules"),
    };
  }

  if (configType === "salvage") {
    const shipName = normalizeShipName(vehicle?.name || ownerShipInput.value);
    const headCapacity = salvageHeadCounts.get(shipName) || 0;
    return {
      type: "salvage",
      headCapacity,
      headSlots: collectHeadSlotConfiguration("salvageHeads", headSlotNames(headCapacity)),
    };
  }

  if (configType === "mining") {
    const shipName = normalizeShipName(vehicle?.name || ownerShipInput.value);
    const miningSpec = miningShips.get(shipName);
    const headCapacity = miningSpec?.headCapacity || 0;
    return {
      type: "mining",
      headCapacity,
      headSize: miningSpec?.headSize || 1,
      currentHeads: collectCurrentMiningConfiguration(headSlotNames(headCapacity)),
      availableHeads: collectAvailableMiningHeads(),
      availableModules: collectMiningModules(),
    };
  }

  if (configType === "idris") {
    const s7Turrets = checkedConfigValues("idrisS7Turrets");
    return {
      type: "idris",
      s10NoseWeapons: checkedConfigValues("idrisS10NoseWeapons"),
      s7NoseTurrets: s7Turrets,
      ifrW57S5Weapon: s7Turrets.includes(idrisW57TurretOption) ? ownerForm.elements.idrisS5Weapon.value : "",
    };
  }

  return null;
}

function applyShipConfiguration(config) {
  if (!config) {
    return;
  }

  if (config.type === "apollo") {
    const leftModules = config.leftModules || (config.leftModule ? [config.leftModule] : []);
    const rightModules = config.rightModules || (config.rightModule ? [config.rightModule] : []);
    setCheckedConfigValues("apolloLeftModules", leftModules);
    setCheckedConfigValues("apolloRightModules", rightModules);
  }

  if (config.type === "salvage") {
    applyHeadSlotConfiguration("salvageHeads", normalizeHeadSlotConfig(config));
  }

  if (config.type === "mining") {
    applyCurrentMiningConfiguration(normalizeCurrentMiningConfig(config));
    applyAvailableMiningHeads(config.availableHeads || legacyAvailableHeads(config));
    applyMiningModules(config.availableModules || config.modules || []);
  }

  if (config.type === "idris") {
    setCheckedConfigValues("idrisS10NoseWeapons", config.s10NoseWeapons || []);
    setCheckedConfigValues("idrisS7Turrets", config.s7NoseTurrets || []);
    idrisS5WeaponSelect.value = config.ifrW57S5Weapon || "";
    updateIdrisS5WeaponVisibility();
  }
}

function shipConfigurationLines(config) {
  if (config?.type === "apollo") {
    const leftModules = config.leftModules || (config.leftModule ? [config.leftModule] : []);
    const rightModules = config.rightModules || (config.rightModule ? [config.rightModule] : []);
    return [
      { label: "Left modules offered", value: configOptionLabels(leftModules, apolloModuleLabels) },
      { label: "Right modules offered", value: configOptionLabels(rightModules, apolloModuleLabels) },
    ];
  }

  if (config?.type === "salvage") {
    return [
      { label: "Head capacity", value: `${config.headCapacity || config.heads?.length || 0}` },
      ...headSlotSummaryLines(normalizeHeadSlotConfig(config), "head"),
    ];
  }

  if (config?.type === "mining") {
    const currentHeads = normalizeCurrentMiningConfig(config);
    return [
      { label: "Head capacity", value: `${config.headCapacity || 0}x Size ${config.headSize || 1}` },
      ...currentMiningSummaryLines(currentHeads),
      { label: "Additional heads available", value: inventorySummary(config.availableHeads || legacyAvailableHeads(config), "name") },
      { label: "Additional modules available", value: miningModuleSummary(config.availableModules || config.modules || []) },
    ];
  }

  if (config?.type === "idris") {
    const lines = [
      { label: "S10 nose weapon", value: (config.s10NoseWeapons || []).join(", ") || "None selected" },
      { label: "S7 nose turret", value: (config.s7NoseTurrets || []).join(", ") || "None selected" },
    ];
    if ((config.s7NoseTurrets || []).includes(idrisW57TurretOption)) {
      lines.push({ label: "IFR-W57 S5 weapon", value: config.ifrW57S5Weapon || "None selected" });
    }
    return lines;
  }

  return [];
}

function headSlotNames(count) {
  if (count <= 1) {
    return ["main"];
  }
  if (count === 2) {
    return ["left", "right"];
  }
  if (count === 3) {
    return ["left", "center", "right"];
  }
  return Array.from({ length: count }, (_, index) => `head-${index + 1}`);
}

function headSlotLabel(slot) {
  if (slot === "main") {
    return "Main";
  }
  if (slot.startsWith("head-")) {
    return `Head ${slot.split("-")[1]}`;
  }
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

function equipmentSlotMarkup({ slot, inputName, options }) {
  const slotLabel = headSlotLabel(slot);
  return `
    <div class="equipment-slot">
      <strong>${slotLabel} head</strong>
      ${options.map((option) => `
        <label class="check equipment-check">
          <input type="checkbox" name="${inputName}" data-slot="${slot}" value="${escapeHtml(option.value)}" />
          <span>
            <strong>${escapeHtml(option.label)}</strong>
            ${option.detail ? `<small>${escapeHtml(option.detail)}</small>` : ""}
          </span>
        </label>
      `).join("")}
    </div>
  `;
}

function collectHeadSlotConfiguration(inputName, slots) {
  return slots.reduce((headSlots, slot) => {
    headSlots[slot] = Array.from(ownerForm.querySelectorAll(`input[name="${inputName}"][data-slot="${slot}"]:checked`))
      .map((input) => input.value);
    return headSlots;
  }, {});
}

function normalizeHeadSlotConfig(config) {
  if (config?.headSlots) {
    return config.headSlots;
  }

  const legacyHeads = config?.heads || [];
  if (!legacyHeads.length) {
    return {};
  }

  const slots = headSlotNames(config?.headCapacity || legacyHeads.length);
  return slots.reduce((headSlots, slot) => {
    headSlots[slot] = legacyHeads;
    return headSlots;
  }, {});
}

function applyHeadSlotConfiguration(inputName, headSlots) {
  ownerForm.querySelectorAll(`input[name="${inputName}"]`).forEach((input) => {
    input.checked = (headSlots[input.dataset.slot] || []).includes(input.value);
  });
}

function headSlotSummaryLines(headSlots, noun) {
  const slots = Object.keys(headSlots);
  if (!slots.length) {
    return [{ label: `${noun.charAt(0).toUpperCase() + noun.slice(1)} loadout`, value: "None selected" }];
  }

  return slots.map((slot) => ({
    label: `${headSlotLabel(slot)} ${noun}`,
    value: (headSlots[slot] || []).join(", ") || "None selected",
  }));
}

function collectCurrentMiningConfiguration(slots) {
  return slots.reduce((currentHeads, slot) => {
    const head = ownerForm.querySelector(`select[name="miningCurrentHeads"][data-slot="${slot}"]`)?.value || "";
    const modules = Array.from(ownerForm.querySelectorAll(`select[name="miningCurrentModules"][data-slot="${slot}"]`))
      .map((select) => select.value)
      .filter(Boolean);
    currentHeads[slot] = { head, modules };
    return currentHeads;
  }, {});
}

function normalizeCurrentMiningConfig(config) {
  if (config?.currentHeads) {
    return config.currentHeads;
  }

  const legacySlots = normalizeHeadSlotConfig(config);
  return Object.entries(legacySlots).reduce((currentHeads, [slot, heads]) => {
    currentHeads[slot] = { head: heads[0] || "", modules: [] };
    return currentHeads;
  }, {});
}

function applyCurrentMiningConfiguration(currentHeads) {
  Object.entries(currentHeads || {}).forEach(([slot, config]) => {
    const headSelect = ownerForm.querySelector(`select[name="miningCurrentHeads"][data-slot="${slot}"]`);
    if (headSelect) {
      headSelect.value = config.head || "";
      updateMiningCurrentModuleSlots(slot);
    }
    ownerForm.querySelectorAll(`select[name="miningCurrentModules"][data-slot="${slot}"]`).forEach((select, index) => {
      select.value = (config.modules || [])[index] || "";
    });
  });
}

function currentMiningSummaryLines(currentHeads) {
  const slots = Object.keys(currentHeads || {});
  if (!slots.length) {
    return [{ label: "Current mining loadout", value: "None selected" }];
  }

  return slots.map((slot) => {
    const config = currentHeads[slot] || {};
    const modules = (config.modules || []).filter(Boolean);
    return {
      label: `${headSlotLabel(slot)} current head`,
      value: config.head
        ? `${config.head}${modules.length ? ` | Modules: ${modules.join(", ")}` : ""}`
        : "None selected",
    };
  });
}

function collectAvailableMiningHeads() {
  return Array.from(ownerForm.querySelectorAll('input[name="miningAvailableHeads"]:checked')).map((input) => {
    const quantityInput = ownerForm.querySelector(`input[name="miningAvailableHeadQuantities"][data-head="${cssEscape(input.value)}"]`);
    return {
      name: input.value,
      quantity: Math.max(1, Number.parseInt(quantityInput?.value || "1", 10) || 1),
    };
  });
}

function applyAvailableMiningHeads(heads) {
  const normalizedHeads = normalizeInventory(heads, "name");
  const quantities = new Map(normalizedHeads.map((head) => [head.name, head.quantity]));
  ownerForm.querySelectorAll('input[name="miningAvailableHeads"]').forEach((input) => {
    input.checked = quantities.has(input.value);
  });
  ownerForm.querySelectorAll('input[name="miningAvailableHeadQuantities"]').forEach((input) => {
    input.value = quantities.get(input.dataset.head) || "";
  });
}

function legacyAvailableHeads(config) {
  const legacyHeads = Object.values(normalizeHeadSlotConfig(config || {})).flat();
  return Array.from(new Set(legacyHeads)).map((name) => ({ name, quantity: 1 }));
}

function inventorySummary(items, key = "name") {
  return normalizeInventory(items, key)
    .map((item) => `${item[key]} x${item.quantity}`)
    .join(", ") || "None selected";
}

function normalizeInventory(items, key = "name") {
  return (items || []).map((item) => (
    typeof item === "string"
      ? { [key]: item, quantity: 1 }
      : { [key]: item[key], quantity: Math.max(1, Number(item.quantity || 1)) }
  )).filter((item) => item[key]);
}

function collectMiningModules() {
  return Array.from(ownerForm.querySelectorAll('input[name="miningModules"]:checked')).map((input) => {
    const quantityInput = ownerForm.querySelector(`input[name="miningModuleQuantities"][data-module="${cssEscape(input.value)}"]`);
    return {
      name: input.value,
      quantity: Math.max(1, Number.parseInt(quantityInput?.value || "1", 10) || 1),
    };
  });
}

function applyMiningModules(modules) {
  const normalizedModules = normalizeMiningModules(modules);
  const quantities = new Map(normalizedModules.map((module) => [module.name, module.quantity]));
  ownerForm.querySelectorAll('input[name="miningModules"]').forEach((input) => {
    input.checked = quantities.has(input.value);
  });
  ownerForm.querySelectorAll('input[name="miningModuleQuantities"]').forEach((input) => {
    input.value = quantities.get(input.dataset.module) || "";
  });
}

function normalizeMiningModules(modules) {
  return normalizeInventory(modules, "name");
}

function miningModuleSummary(modules) {
  return normalizeMiningModules(modules)
    .map((module) => `${module.name} x${module.quantity}`)
    .join(", ") || "None selected";
}

function checkedConfigValues(name) {
  return Array.from(ownerForm.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setCheckedConfigValues(name, values) {
  const selectedValues = new Set(values || []);
  ownerForm.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = selectedValues.has(input.value);
  });
}

function configOptionLabels(values, labels) {
  return values.map((value) => labels[value] || value).join(", ") || "None selected";
}

function getShipConfigurationType(vehicleOrName) {
  const name = normalizeShipName(typeof vehicleOrName === "string" ? vehicleOrName : vehicleOrName?.name);
  if (name === "apollo medivac" || name === "apollo triage") {
    return "apollo";
  }
  if (salvageHeadCounts.has(name)) {
    return "salvage";
  }
  if (miningShips.has(name)) {
    return "mining";
  }
  return idrisShips.has(name) ? "idris" : "";
}

function updateShipConfiguration(vehicle = findVehicle(ownerShipInput.value)) {
  const configType = getShipConfigurationType(vehicle || ownerShipInput.value);
  shipConfigFieldset.classList.toggle("is-hidden", !configType);
  apolloConfig.classList.toggle("is-hidden", configType !== "apollo");
  salvageConfig.classList.toggle("is-hidden", configType !== "salvage");
  miningConfig.classList.toggle("is-hidden", configType !== "mining");
  idrisConfig.classList.toggle("is-hidden", configType !== "idris");

  if (configType === "salvage") {
    const shipName = normalizeShipName(typeof vehicle === "string" ? vehicle : vehicle?.name || ownerShipInput.value);
    const headCount = salvageHeadCounts.get(shipName) || 0;
    salvageConfigDescription.textContent = `${headCount} salvage head${headCount === 1 ? "" : "s"}`;
    salvageHeadGrid.innerHTML = headSlotNames(headCount).map((slot) => equipmentSlotMarkup({
      slot,
      inputName: "salvageHeads",
      options: salvageHeadOptions.map((head) => ({ value: head, label: head })),
    })).join("");
  } else {
    salvageHeadGrid.innerHTML = "";
  }

  if (configType === "mining") {
    const shipName = normalizeShipName(typeof vehicle === "string" ? vehicle : vehicle?.name || ownerShipInput.value);
    const miningSpec = miningShips.get(shipName);
    const compatibleHeads = miningHeads.filter((head) => head.size === miningSpec?.headSize);
    const capacityLabel = miningSpec?.headCapacity === 1 ? "head" : "heads";
    const maxModuleSlots = compatibleHeads.reduce((max, head) => Math.max(max, head.moduleSlots), 0);
    const allMiningModuleOptions = Object.values(miningModules).flat();
    miningConfigDescription.textContent = `${miningSpec?.headCapacity || 0} equipped Size ${miningSpec?.headSize || 1} mining ${capacityLabel}. Current modules follow the selected head slot count.`;
    miningHeadGrid.innerHTML = headSlotNames(miningSpec?.headCapacity || 0).map((slot) => `
      <div class="equipment-slot current-mining-slot" data-slot="${slot}">
        <strong>${headSlotLabel(slot)} current head</strong>
        <label>
          Head
          <select name="miningCurrentHeads" data-slot="${slot}">
            <option value="">Select head</option>
            ${compatibleHeads.map((head) => `<option value="${escapeHtml(head.name)}" data-module-slots="${head.moduleSlots}">${escapeHtml(head.name)} (${head.moduleSlots} slot${head.moduleSlots === 1 ? "" : "s"})</option>`).join("")}
          </select>
        </label>
        <div class="current-module-selects">
          ${Array.from({ length: maxModuleSlots }, (_, index) => `
            <label>
              Module ${index + 1}
              <select name="miningCurrentModules" data-slot="${slot}" data-module-index="${index}">
                <option value="">No module</option>
                ${allMiningModuleOptions.map((module) => `<option value="${escapeHtml(module)}">${escapeHtml(module)}</option>`).join("")}
              </select>
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");
    miningAvailableHeadGrid.innerHTML = compatibleHeads.map((head) => `
      <div class="module-quantity-row">
        <label class="check equipment-check">
          <input type="checkbox" name="miningAvailableHeads" value="${escapeHtml(head.name)}" />
          <span>
            <strong>${escapeHtml(head.name)}</strong>
            <small>Size ${head.size} - ${head.moduleSlots ? `${head.moduleSlots} module slot${head.moduleSlots === 1 ? "" : "s"}` : "No module slots"}</small>
          </span>
        </label>
        <label>
          Qty
          <input type="number" name="miningAvailableHeadQuantities" data-head="${escapeHtml(head.name)}" min="0" step="1" inputmode="numeric" />
        </label>
      </div>
    `).join("");
    miningModuleGroups.innerHTML = Object.entries(miningModules).map(([group, modules]) => `
      <div class="mining-module-group">
        <strong>Additional ${group.toLowerCase()} modules</strong>
        ${modules.map((module) => `
          <div class="module-quantity-row">
            <label class="check">
              <input type="checkbox" name="miningModules" value="${module}" />
              ${module}
            </label>
            <label>
              Qty
              <input type="number" name="miningModuleQuantities" data-module="${escapeHtml(module)}" min="0" step="1" inputmode="numeric" />
            </label>
          </div>
        `).join("")}
      </div>
    `).join("");
    headSlotNames(miningSpec?.headCapacity || 0).forEach(updateMiningCurrentModuleSlots);
  } else {
    miningHeadGrid.innerHTML = "";
    miningAvailableHeadGrid.innerHTML = "";
    miningModuleGroups.innerHTML = "";
  }

  if (configType === "idris") {
    idrisS10Group.innerHTML = `
      <strong>S10 nose weapon</strong>
      ${idrisS10NoseWeapons.map((weapon) => `
        <label class="check">
          <input type="checkbox" name="idrisS10NoseWeapons" value="${escapeHtml(weapon)}" />
          ${escapeHtml(weapon)}
        </label>
      `).join("")}
    `;
    idrisS7Group.innerHTML = `
      <strong>S7 nose turret</strong>
      ${idrisS7NoseTurrets.map((turret) => `
        <label class="check">
          <input type="checkbox" name="idrisS7Turrets" value="${escapeHtml(turret)}" />
          ${escapeHtml(turret)}
        </label>
      `).join("")}
    `;
    idrisS5WeaponSelect.innerHTML = [
      `<option value="">Select S5 weapon</option>`,
      ...size5WeaponOptions.map((weapon) => `<option value="${escapeHtml(weapon)}">${escapeHtml(weapon)}</option>`),
    ].join("");
    updateIdrisS5WeaponVisibility();
  } else {
    idrisS10Group.innerHTML = `<strong>S10 nose weapon</strong>`;
    idrisS7Group.innerHTML = `<strong>S7 nose turret</strong>`;
    idrisS5WeaponSelect.value = "";
    updateIdrisS5WeaponVisibility();
  }
}

function updateIdrisS5WeaponVisibility() {
  const hasW57Turret = checkedConfigValues("idrisS7Turrets").includes(idrisW57TurretOption);
  idrisS5Field.classList.toggle("is-hidden", !hasW57Turret);
  if (!hasW57Turret) {
    idrisS5WeaponSelect.value = "";
  }
}

function updateMiningCurrentModuleSlots(slot) {
  const headSelect = ownerForm.querySelector(`select[name="miningCurrentHeads"][data-slot="${slot}"]`);
  if (!headSelect) {
    return;
  }

  const selectedOption = headSelect.selectedOptions[0];
  const moduleSlots = Number(selectedOption?.dataset.moduleSlots || 0);
  ownerForm.querySelectorAll(`select[name="miningCurrentModules"][data-slot="${slot}"]`).forEach((select) => {
    const moduleIndex = Number(select.dataset.moduleIndex || 0);
    const enabled = Boolean(headSelect.value) && moduleIndex < moduleSlots;
    select.disabled = !enabled;
    if (!enabled) {
      select.value = "";
    }
  });
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
  const selectedOwnerShip = ownerShipOptions.value;
  const selectedRentShip = rentShipOptions.value;
  ownerShipOptions.innerHTML = [
    `<option value="">Select ship</option>`,
    ...filteredVehicles(ownerManufacturerSelect.value).map(
      (vehicle) => `<option value="${vehicle.id}">${escapeHtml(vehicle.name)}</option>`,
    ),
  ].join("");
  rentShipOptions.innerHTML = [
    `<option value="">All ships</option>`,
    ...filteredVehicles(rentManufacturerSelect.value).map(
      (vehicle) => `<option value="${vehicle.id}">${escapeHtml(vehicle.name)}</option>`,
    ),
  ].join("");

  if (Array.from(ownerShipOptions.options).some((option) => option.value === selectedOwnerShip)) {
    ownerShipOptions.value = selectedOwnerShip;
  }
  if (Array.from(rentShipOptions.options).some((option) => option.value === selectedRentShip)) {
    rentShipOptions.value = selectedRentShip;
  }
}

function findVehicle(value, manufacturer = ownerManufacturerSelect.value) {
  const query = String(value || "").trim().toLowerCase();
  if (!query) {
    return null;
  }

  return (
    vehicleCatalog.find((vehicle) => String(vehicle.id) === query) ||
    vehicleCatalog.find(
      (vehicle) =>
        vehicle.name.toLowerCase() === query &&
        (!manufacturer || vehicle.company === manufacturer),
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
  const vehicle = findVehicle(value, ownerManufacturerSelect.value);
  if (!vehicle) {
    updateShipConfiguration();
    updateHangarEligibility();
    return;
  }

  updateShipConfiguration(vehicle);
  updateHangarEligibility(vehicle);
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
    return `<div class="ship-image placeholder">FFE</div>`;
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

function parseCredits(value) {
  return Number(String(value || "").replace(/[^0-9]/g, "")) || 0;
}

function formatCreditInput(input) {
  const digits = String(input.value || "").replace(/[^0-9]/g, "");
  input.value = digits ? Number(digits).toLocaleString("en-US") : "";
}

function formatCreditInputValue(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const amount = parseCredits(value);
  return amount ? amount.toLocaleString("en-US") : "0";
}

function updatePilotRateVisibility() {
  const isIncluded = pilotIncludedInput.checked;
  pilotRateField.classList.toggle("is-hidden", !isIncluded);
  ownerForm.elements.pilotRate.disabled = !isIncluded;
  if (!isIncluded) {
    ownerForm.elements.pilotRate.value = "0";
  }
}

function updateRateCalculator() {
  const basePeriod = rateBasePeriodSelect.value;
  const baseRate = parseCredits(rateBaseInput.value);
  rateOfferInputs[basePeriod].checked = true;
  rateError.classList.add("is-hidden");

  const rates = calculateRates();
  Object.keys(rateInputs).forEach((period) => {
    const row = document.querySelector(`[data-rate-period="${period}"]`);
    const offered = rateOfferInputs[period].checked;
    const isBase = period === basePeriod;
    const adjustment = Number(rateAdjustmentInputs[period].value || 0);

    rateInputs[period].value = baseRate ? formatCreditInputValue(rates[period]) : "";
    rateInputs[period].disabled = !offered;
    rateAdjustmentInputs[period].disabled = isBase || !offered;
    row.classList.toggle("is-disabled", !offered);
    row.querySelector(".rate-adjustment-value").textContent = isBase ? "Base" : formatAdjustment(adjustment);
  });

  rateFormula.textContent = baseRate
    ? `${formatCredits(baseRate)} UEC / ${ratePeriodLabel(basePeriod)} converted by time, then adjusted by each slider.`
    : "Enter a base price to calculate all offered rates.";
  updateHangarFeeSummary();
}

function calculateRates() {
  const basePeriod = rateBasePeriodSelect.value;
  const baseRate = parseCredits(rateBaseInput.value);
  const adjustments = getRateAdjustments();

  return Object.fromEntries(
    ["hour", "day", "week"].map((period) => {
      const converted = convertPeriodRate(baseRate, basePeriod, period);
      const adjusted = period === basePeriod ? converted : converted * (1 + adjustments[period] / 100);
      return [period, Math.max(0, Math.round(adjusted))];
    }),
  );
}

function getRateAdjustments() {
  return Object.fromEntries(
    Object.entries(rateAdjustmentInputs).map(([period, input]) => [period, Number(input.value || 0)]),
  );
}

function getOfferedRatePeriods() {
  return Object.entries(rateOfferInputs)
    .filter(([, input]) => input.checked)
    .map(([period]) => period);
}

function formatAdjustment(value) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function positiveShipRatePeriods(ship) {
  return ["hour", "day", "week"].filter((period) => getStoredShipRate(ship, period) > 0);
}

function firstShipRatePeriod(ship) {
  return ship.ratePeriod || positiveShipRatePeriods(ship)[0] || "hour";
}

function getStoredShipRate(ship, period) {
  if (Number(ship.rates?.[period] || 0) > 0) {
    return Number(ship.rates[period]);
  }
  return ship.ratePeriod === period ? Number(ship.rate || 0) : 0;
}

function convertPeriodRate(rate, fromPeriod, toPeriod) {
  const periodHours = { hour: 1, day: 24, week: 168 };
  return (Number(rate || 0) / periodHours[fromPeriod]) * periodHours[toPeriod];
}

function getShipRate(ship, period) {
  if (ship.offeredRates && !ship.offeredRates.includes(period)) {
    return 0;
  }
  const explicitRate = Number(ship.rates?.[period] || 0);
  if (explicitRate > 0) {
    return explicitRate;
  }

  if (ship.rate && ship.ratePeriod) {
    return convertPeriodRate(ship.rate, ship.ratePeriod, period);
  }

  const sourcePeriod = ["hour", "day", "week"].find((candidate) => Number(ship.rates?.[candidate] || 0) > 0);
  return sourcePeriod ? convertPeriodRate(ship.rates[sourcePeriod], sourcePeriod, period) : 0;
}

function rateFacts(ship) {
  const rates = ship.rates || (ship.rate ? { [ship.ratePeriod || "hour"]: ship.rate } : {});
  const offeredRates = ship.offeredRates || ["hour", "day", "week"];
  return offeredRates
    .filter((period) => Number(rates[period] || 0) > 0)
    .map((period) => `<li>${formatCredits(rates[period])} UEC / ${ratePeriodLabel(period)}</li>`)
    .join("");
}

function ratePeriodLabel(period = "hour") {
  return period === "day" ? "day" : period === "week" ? "week" : "hour";
}

function totalRateLabel(period = "hour") {
  return period === "day" ? "Daily" : period === "week" ? "Weekly" : "Hourly";
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
  hangarFieldset.classList.toggle("is-hidden", !eligible);
  offerHangarServices.disabled = !eligible;

  if (!eligible) {
    offerHangarServices.checked = false;
    hangarServicesPanel.classList.add("is-hidden");
    hangarFeeControls.classList.add("is-hidden");
    hangarServiceStatus.textContent = ownerShipInput.value
      ? "Hangar Services are only available for R/R/R capable flight-ready ships"
      : "Select an R/R/R capable ship to offer Hangar Services";
    return;
  }

  hangarServiceStatus.textContent = hangarMarketRows.length
    ? `${hangarMarketRows.length.toLocaleString()} UEX purchase locations loaded`
    : hangarMarketError || "No UEX purchase locations available";
  hangarServicesPanel.classList.toggle("is-hidden", !offerHangarServices.checked);
  hangarFeeControls.classList.toggle("is-hidden", !offerHangarServices.checked);
}

function formatCredits(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateToKey(date) {
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function cssEscape(value) {
  return window.CSS?.escape ? CSS.escape(String(value)) : String(value).replaceAll('"', '\\"');
}

renderCalendar();
renderFleet();
renderRentalResults();
renderOwnerSchedule();
renderCalendarFilterOptions();
updateFilterSummary();
loadVehicles();
loadHangarServices();
