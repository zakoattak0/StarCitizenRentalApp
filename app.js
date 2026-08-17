const UEX_VEHICLES_URL = "https://api.uexcorp.uk/2.0/vehicles";
const HANGAR_SERVICES_URL = "/api/hangar-services";
const SHIP_LISTINGS_URL = "/api/ship-listings";
const CREW_LISTINGS_URL = "/api/crew-listings";
const MATERIAL_REQUESTS_URL = "/api/material-requests";
const MATERIAL_OPTIONS_URL = "/api/material-options";
const DEALS_URL = "/api/deals";
const RATING_STATS_URL = "/api/rating-stats";

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

const oreOptions = [
  "Quantainium",
  "Bexalite",
  "Taranite",
  "Laranite",
  "Agricium",
  "Hephaestanite",
  "Titanium",
  "Gold",
  "Diamond",
  "Recycled Material Composite (RMC)",
  "Construction Materials",
  "Hydrogen Fuel",
  "Quantum Fuel",
  "Iron",
  "Copper",
  "Aluminum",
];

let materialNameOptions = [...oreOptions];
let materialLocationOptions = [];
let materialSellPriceByName = new Map();

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

const crewListings = [];

const materialRequests = [];

const demoOwnerPrefix = "FAKE DEMO - ";
const dismissedDemoShipStorageKey = "fsx.dismissedDemoShipListings";

const demoShipListings = [
  {
    id: "fake-demo-ship-cargo-c2",
    ownerId: "fake-demo-provider-cargo",
    owner: `${demoOwnerPrefix}Cargo Placeholder`,
    ship: "C2 Hercules Starlifter",
    role: "Cargo",
    manufacturer: "Crusader Industries",
    rates: { hour: 18000, day: 115000, week: 620000 },
    offeredRates: ["hour", "day", "week"],
    rateBasePeriod: "hour",
    rateBase: 18000,
    rateAdjustments: { day: -15, week: -30 },
    pilotIncluded: false,
    pilotRate: 0,
    notes: "FAKE DEMO POST - placeholder cargo rental. Delete/replace with real listing data before launch.",
    dates: demoDateKeys([1, 2, 4, 6, 8]),
    rating: 4.8,
    completedJobs: 42,
  },
  {
    id: "fake-demo-ship-mining-mole",
    ownerId: "fake-demo-provider-mining",
    owner: `${demoOwnerPrefix}Mining Placeholder`,
    ship: "MOLE Carbon Edition",
    role: "Mining",
    manufacturer: "Argo Astronautics",
    rates: { hour: 24000, day: 155000, week: 820000 },
    offeredRates: ["hour", "day", "week"],
    rateBasePeriod: "hour",
    rateBase: 24000,
    rateAdjustments: { day: -12, week: -28 },
    pilotIncluded: true,
    pilotRate: 8000,
    notes: "FAKE DEMO POST - placeholder mining rental with pretend loadout data.",
    dates: demoDateKeys([0, 1, 3, 5, 9]),
    shipConfig: {
      type: "mining",
      headCapacity: 3,
      headSize: 2,
      currentHeads: { left: "Helix II Mining Laser", center: "Lancet MH2 Mining Laser", right: "Helix II Mining Laser" },
      availableHeads: [{ name: "Hofstede-S2 Mining Laser", quantity: 2 }],
      availableModules: [{ name: "Rieger-C2 Module", quantity: 4 }],
    },
    rating: 4.6,
    completedJobs: 27,
  },
  {
    id: "fake-demo-ship-combat-redeemer",
    ownerId: "fake-demo-provider-combat",
    owner: `${demoOwnerPrefix}Combat Placeholder`,
    ship: "Redeemer",
    role: "Combat",
    manufacturer: "Aegis Dynamics",
    rates: { hour: 30000, day: 190000 },
    offeredRates: ["hour", "day"],
    rateBasePeriod: "hour",
    rateBase: 30000,
    rateAdjustments: { day: -10 },
    pilotIncluded: true,
    pilotRate: 12000,
    notes: "FAKE DEMO POST - placeholder escort/gunship rental. Not an actual offer.",
    dates: demoDateKeys([2, 3, 4, 7]),
    rating: 4.9,
    completedJobs: 58,
  },
  {
    id: "fake-demo-ship-exploration-carrack",
    ownerId: "fake-demo-provider-exploration",
    owner: `${demoOwnerPrefix}Exploration Placeholder`,
    ship: "Carrack Expedition",
    role: "Exploration",
    manufacturer: "Anvil Aerospace",
    rates: { hour: 36000, day: 225000, week: 1200000 },
    offeredRates: ["hour", "day", "week"],
    rateBasePeriod: "hour",
    rateBase: 36000,
    rateAdjustments: { day: -14, week: -32 },
    pilotIncluded: true,
    pilotRate: 10000,
    notes: "FAKE DEMO POST - placeholder expedition listing for UI testing.",
    dates: demoDateKeys([1, 5, 6, 10, 11]),
    rating: 4.7,
    completedJobs: 19,
  },
  {
    id: "fake-demo-ship-medical-apollo",
    ownerId: "fake-demo-provider-medical",
    owner: `${demoOwnerPrefix}Medical Placeholder`,
    ship: "Apollo Medivac",
    role: "Medical",
    manufacturer: "Roberts Space Industries",
    rates: { hour: 22000, day: 140000 },
    offeredRates: ["hour", "day"],
    rateBasePeriod: "hour",
    rateBase: 22000,
    rateAdjustments: { day: -12 },
    pilotIncluded: true,
    pilotRate: 9000,
    notes: "FAKE DEMO POST - placeholder med-run support. This is not a real service.",
    dates: demoDateKeys([0, 2, 5, 8]),
    shipConfig: {
      type: "apollo",
      leftModules: ["tier-2"],
      rightModules: ["tier-3"],
    },
    rating: 4.5,
    completedJobs: 13,
    medical: true,
  },
  {
    id: "fake-demo-ship-hangar-600i",
    ownerId: "fake-demo-provider-hangar",
    owner: `${demoOwnerPrefix}Hangar Services Placeholder`,
    ship: "600i Touring",
    role: "Touring",
    manufacturer: "Origin Jumpworks",
    rates: { hour: 28000, day: 175000 },
    offeredRates: ["hour", "day"],
    rateBasePeriod: "hour",
    rateBase: 28000,
    rateAdjustments: { day: -12 },
    pilotIncluded: false,
    pilotRate: 0,
    hangarLoadCost: 15000,
    hangarLoadMode: "flat",
    hangarFeeTreatment: "add",
    hangarServices: [
      { label: "Hydrogen Fuel", quantity: 300, price: 50, total: 15000, system: "Stanton", planet: "microTech", terminal: "FAKE DEMO terminal" },
      { label: "Quantum Fuel", quantity: 120, price: 120, total: 14400, system: "Stanton", planet: "ArcCorp", terminal: "FAKE DEMO terminal" },
    ],
    notes: "FAKE DEMO POST - placeholder luxury transport with fake hangar service prices.",
    dates: demoDateKeys([1, 2, 6, 9]),
    rating: 4.4,
    completedJobs: 11,
  },
].map(markDemoPost);

const demoCrewListings = [
  {
    id: "fake-demo-crew-pilot",
    ownerId: "fake-demo-crew-provider-pilot",
    name: `${demoOwnerPrefix}Pilot Placeholder`,
    role: "Pilot",
    price: 7000,
    payType: "flat",
    rating: 4.8,
    completedJobs: 36,
    availabilityStatus: "Available now",
    summary: "FAKE DEMO POST - pretend pilot listing for testing the crew marketplace.",
  },
  {
    id: "fake-demo-crew-gunner",
    ownerId: "fake-demo-crew-provider-gunner",
    name: `${demoOwnerPrefix}Gunner Placeholder`,
    role: "Gunner",
    price: 5000,
    payType: "flat",
    rating: 4.6,
    completedJobs: 24,
    availabilityStatus: "Available today",
    summary: "FAKE DEMO POST - pretend turret/gunner service. Not a real player.",
  },
  {
    id: "fake-demo-crew-engineer",
    ownerId: "fake-demo-crew-provider-engineer",
    name: `${demoOwnerPrefix}Engineer Placeholder`,
    role: "Engineer",
    price: 8000,
    payType: "flat",
    rating: 4.7,
    completedJobs: 18,
    availabilityStatus: "Scheduled",
    summary: "FAKE DEMO POST - placeholder repair and power-management crew listing.",
  },
  {
    id: "fake-demo-crew-box-jockey",
    ownerId: "fake-demo-crew-provider-box",
    name: `${demoOwnerPrefix}Box Jockey Placeholder`,
    role: "Box Jockey",
    price: 4500,
    payType: "flat",
    rating: 4.3,
    completedJobs: 15,
    availabilityStatus: "Available now",
    summary: "FAKE DEMO POST - placeholder cargo loading/unloading helper.",
  },
  {
    id: "fake-demo-crew-ground-team",
    ownerId: "fake-demo-crew-provider-ground",
    name: `${demoOwnerPrefix}FPS Ground Team Placeholder`,
    role: "FPS Ground Team",
    price: 15,
    payType: "cut",
    rating: 4.9,
    completedJobs: 31,
    availabilityStatus: "Available today",
    summary: "FAKE DEMO POST - pretend bunker/security squad listing for UI testing.",
  },
  {
    id: "fake-demo-crew-medic",
    ownerId: "fake-demo-crew-provider-medic",
    name: `${demoOwnerPrefix}Medic Placeholder`,
    role: "Medic",
    price: 6000,
    payType: "flat",
    rating: 4.5,
    completedJobs: 22,
    availabilityStatus: "Scheduled",
    summary: "FAKE DEMO POST - placeholder rescue/medical crew listing. Not real.",
  },
].map(markDemoPost);

const demoMaterialRequests = [
  ["rmc-700-01", "Recycled Material Composite", 96, "700+", 6400, "Orison TDD"],
  ["rmc-700-02", "Recycled Material Composite", 140, "725+", 6800, "Seraphim Station"],
  ["rmc-700-03", "Recycled Material Composite", 72, "735+", 7100, "Everus Harbor"],
  ["rmc-700-outlier", "Recycled Material Composite", 10, "740+", 99000, "FAKE DEMO outlier terminal"],
  ["rmc-750-01", "Recycled Material Composite", 120, "765+", 7600, "Area18 TDD"],
  ["rmc-750-02", "Recycled Material Composite", 80, "790+", 8050, "Lorville CBD"],
  ["quant-700-01", "Quantainium", 32, "700+", 18200, "ARC-L1 Refinery"],
  ["quant-700-02", "Quantainium", 48, "735+", 19100, "HUR-L2 Refinery"],
  ["quant-750-01", "Quantainium", 24, "765+", 21400, "MIC-L1 Refinery"],
  ["quant-800-01", "Quantainium", 18, "820+", 24000, "CRU-L1 Refinery"],
  ["bex-650-01", "Bexalite", 35, "650+", 8200, "ARC-L1 Refinery"],
  ["bex-650-02", "Bexalite", 44, "680+", 8700, "HUR-L1 Refinery"],
  ["bex-700-01", "Bexalite", 28, "710+", 9300, "MIC-L2 Refinery"],
  ["bex-750-01", "Bexalite", 22, "760+", 10100, "CRU-L5 Refinery"],
  ["gold-500-01", "Gold", 100, "500+", 7100, "Area18 TDD"],
  ["gold-500-02", "Gold", 64, "545+", 7600, "Lorville CBD"],
  ["taranite-700-01", "Taranite", 30, "735+", 7800, "ARC-L2 Refinery"],
  ["diamond-450-01", "Diamond", 200, "450+", 6200, "New Babbage TDD"],
  ["agricium-750-01", "Agricium", 40, "750+", 9800, "Orison TDD"],
  ["laranite-600-01", "Laranite", 55, "600+", 6500, "Everus Harbor"],
].map(([id, material, quantity, quality, price, location]) => markDemoPost({
  id: `fake-demo-material-stileron-${id}`,
  requesterId: "fake-demo-material-requester-stileron",
  postedBy: `${demoOwnerPrefix}Stileron`,
  location: `FAKE DEMO trade - ${location}`,
  neededBy: "FAKE DEMO date - benchmark sample",
  price: `FAKE DEMO: ${price.toLocaleString("en-US")} UEC / SCU`,
  materials: [{ material, quantity, quality }],
}));

const deals = [];

let ratingStats = {};
let activeDealFilter = "open";

const dataStatus = {
  shipListings: { loading: false, saving: false, error: "" },
  crewListings: { loading: false, saving: false, error: "" },
  materialRequests: { loading: false, saving: false, error: "" },
  deals: { loading: false, saving: false, error: "" },
  ratingStats: { loading: false, error: "" },
};

const state = {
  activeDate: new Date(2026, 5, 1),
  calendarMode: "availability",
  calendarFilters: {
    owner: "",
    ship: "",
    configMode: "any",
  },
};

const authState = {
  loading: true,
  user: null,
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
const shipMarketForm = document.querySelector("#ship-market-form");
const shipMarketResults = document.querySelector("#ship-market-results");
const shipRoleFilter = document.querySelector("#ship-role-filter");
const shipMarketManufacturerSelect = document.querySelector("#ship-market-manufacturer");
const crewMarketForm = document.querySelector("#crew-market-form");
const crewMarketResults = document.querySelector("#crew-market-results");
const materialRequestResults = document.querySelector("#material-request-results");
const ownerForm = document.querySelector("#owner-form");
const ownerShipOptions = document.querySelector("#owner-ship-options");
const shipApiStatus = document.querySelector("#ship-api-status");
const ownerShipInput = ownerForm.querySelector("[name='ship']");
const ownerManufacturerSelect = document.querySelector("#owner-manufacturer");
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
const authLogin = document.querySelector(".auth-login");
const authUser = document.querySelector("#auth-user");
const authDisplayName = document.querySelector("#auth-display-name");
const authAvatar = document.querySelector("#auth-avatar");
const authAvatarPlaceholder = document.querySelector("#auth-avatar-placeholder");
const accountTab = document.querySelector(".auth-account-tab");
const accountSignedOut = document.querySelector("#account-signed-out");
const accountDashboard = document.querySelector("#account-dashboard");
const accountAvatar = document.querySelector("#account-avatar");
const accountAvatarPlaceholder = document.querySelector("#account-avatar-placeholder");
const accountDisplayName = document.querySelector("#account-display-name");
const accountUsername = document.querySelector("#account-username");
const accountCreatedAt = document.querySelector("#account-created-at");
const accountRsiHandle = document.querySelector("#account-rsi-handle");
const accountDiscordStatus = document.querySelector("#account-discord-status");
const accountRsiStatus = document.querySelector("#account-rsi-status");
const accountPublicName = document.querySelector("#account-public-name");
const rsiLinkForm = document.querySelector("#rsi-link-form");
const rsiCodeField = document.querySelector("#rsi-code-field");
const rsiCodeInput = document.querySelector("#account-rsi-code");
const rsiVerificationCode = document.querySelector("#rsi-verification-code");
const rsiStartButton = document.querySelector("#rsi-start-button");
const rsiVerifyButton = document.querySelector("#rsi-verify-button");
const rsiClearButton = document.querySelector("#rsi-clear-button");
const rsiStatusMessage = document.querySelector("#rsi-status-message");
const accountRating = document.querySelector("#account-rating");
const accountContracts = document.querySelector("#account-contracts");
const accountListings = document.querySelector("#account-listings");
const accountOrg = document.querySelector("#account-org");
const accountServicesList = document.querySelector("#account-services-list");
const accountListingsList = document.querySelector("#account-listings-list");
const accountCreateServiceButton = document.querySelector("#account-create-service-button");
const accountDealsList = document.querySelector("#account-deals-list");
const accountDealFilters = document.querySelector("#account-deal-filters");
const authPromptModal = document.querySelector("#auth-prompt-modal");
const authPromptMessage = document.querySelector("#auth-prompt-message");
const authPromptCancel = document.querySelector("#auth-prompt-cancel");
const navDropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));
const navDropdownTriggers = Array.from(document.querySelectorAll(".nav-dropdown-trigger"));
const postShipListingMenuButton = document.querySelector("#post-ship-listing-menu-button");
const createCrewPostingButton = document.querySelector("#create-crew-posting-button");
const createCrewPostingMenuButton = document.querySelector("#create-crew-posting-menu-button");
const crewPostingModal = document.querySelector("#crew-posting-modal");
const crewPostingForm = document.querySelector("#crew-posting-form");
const crewPostingClose = document.querySelector("#crew-posting-close");
const crewPostingCancel = document.querySelector("#crew-posting-cancel");
const crewPostingPayType = document.querySelector("#crew-posting-pay-type");
const crewPostingPayValue = document.querySelector("#crew-posting-pay-value");
const crewPostingPayValueLabel = document.querySelector("#crew-posting-pay-value-label");
const crewPostingName = document.querySelector("#crew-posting-name");

const postMaterialRequestMenuButton = document.querySelector("#post-material-request-menu-button");
const postMaterialRequestButton = document.querySelector("#post-material-request-button");
const materialRequestModal = document.querySelector("#material-request-modal");
const materialRequestForm = document.querySelector("#material-request-form");
const materialRequestClose = document.querySelector("#material-request-close");
const materialRequestCancel = document.querySelector("#material-request-cancel");
const materialRequestName = document.querySelector("#material-request-name");
const materialLocationInput = document.querySelector("#material-location-input");
const materialLocationOptionsList = document.querySelector("#material-location-options");
const materialNameOptionsList = document.querySelector("#material-name-options");
const materialLineItemsContainer = document.querySelector("#material-line-items");
const addMaterialLineButton = document.querySelector("#add-material-line");
const materialPaymentType = document.querySelector("#material-payment-type");
const materialPaymentValue = document.querySelector("#material-payment-value");
const materialPaymentValueLabel = document.querySelector("#material-payment-value-label");

window.handleShipImageError = (image) => {
  const fallback = image.dataset.fallbackSrc;
  if (fallback) {
    image.dataset.fallbackSrc = "";
    image.src = fallback;
    return;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "ship-image placeholder";
  placeholder.textContent = "FSX";
  image.replaceWith(placeholder);
};

document.querySelectorAll(".tab").forEach((tab) => {
  if (!tab.classList.contains("nav-dropdown-trigger")) {
    tab.addEventListener("click", () => navigateToPanel(tab.dataset.tab));
  }
});

document.querySelectorAll("[data-route]").forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    navigateToPanel(control.dataset.route);
    closeAllNavMenus();
  });
});

navDropdownTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    toggleNavMenu(trigger.closest(".nav-dropdown"));
  });
});

postShipListingMenuButton.addEventListener("click", () => {
  closeAllNavMenus();
  openPostShipListingFlow();
});

createCrewPostingMenuButton.addEventListener("click", () => {
  closeAllNavMenus();
  openPostCrewListingFlow();
});

postMaterialRequestMenuButton.addEventListener("click", () => {
  closeAllNavMenus();
  openPostMaterialRequestFlow();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-dropdown")) {
    closeAllNavMenus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllNavMenus();
  }
});

document.addEventListener("click", (event) => {
  const protectedAction = event.target.closest("[data-auth-action]");
  if (!protectedAction || canCreatePosting(authState.user)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  showAuthPrompt();
}, true);

document.querySelectorAll(".sub-tab").forEach((tab) => {
  if (tab.dataset.ownerView) {
    tab.addEventListener("click", () => setOwnerView(tab.dataset.ownerView));
  }
  if (tab.dataset.accountView) {
    tab.addEventListener("click", () => setAccountView(tab.dataset.accountView));
  }
});

document.querySelectorAll("[data-account-target]").forEach((control) => {
  control.addEventListener("click", () => setAccountView(control.dataset.accountTarget));
});

accountDealFilters?.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-deal-filter]");
  if (!filterButton) {
    return;
  }

  activeDealFilter = filterButton.dataset.dealFilter;
  accountDealFilters.querySelectorAll("[data-deal-filter]").forEach((button) => {
    button.classList.toggle("active", button === filterButton);
  });
  renderAccountDeals();
});

accountDealsList?.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-deal-action]");
  const ratingButton = event.target.closest("[data-deal-rate]");

  if (actionButton) {
    await handleDealAction(actionButton.dataset.dealAction, actionButton.dataset.dealId);
  }
  if (ratingButton) {
    await handleDealRating(ratingButton.dataset.dealRate);
  }
});

document.addEventListener("click", async (event) => {
  const requestButton = event.target.closest("[data-deal-request]");
  if (!requestButton) {
    return;
  }

  event.preventDefault();
  await handleDealRequest(requestButton);
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

shipMarketForm.addEventListener("input", renderShipMarketplace);
shipMarketForm.addEventListener("change", renderShipMarketplace);
shipMarketForm.addEventListener("submit", (event) => event.preventDefault());
crewMarketForm.addEventListener("input", renderCrewMarketplace);
crewMarketForm.addEventListener("change", renderCrewMarketplace);
crewMarketForm.addEventListener("submit", (event) => event.preventDefault());

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
Object.entries(rateInputs).forEach(([period, input]) => {
  input.addEventListener("input", () => syncManualRateInput(period));
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

ownerForm.addEventListener("submit", async (event) => {
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
    id: existingShip?.id || "",
    ownerId: authState.user?.id || existingShip?.ownerId || "",
    owner: data.get("owner") || preferredDisplayName(authState.user),
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

  setListingSaving("shipListings", true);
  clearFormError();

  try {
    const savedListing = await saveShipListing(listing);
    if (editingShipIndex === null) {
      ships.unshift(savedListing);
    } else {
      ships[editingShipIndex] = savedListing;
    }

    resetOwnerForm();
    closeOwnerConfigurator();
    renderFleet();
    renderCalendar();
    renderShipMarketplace();
    renderOwnerSchedule();
    renderCalendarFilterOptions();
    updateFilterSummary();
    renderAccountListings();
  } catch (error) {
    showFormError(error instanceof Error ? error.message : "Ship listing could not be saved");
  } finally {
    setListingSaving("shipListings", false);
  }
});

addFleetShipButton.addEventListener("click", openAddShipFlow);

ownerConfiguratorClose.addEventListener("click", closeOwnerConfigurator);

removeShipCancel.addEventListener("click", closeRemoveConfirmation);

removeShipConfirm.addEventListener("click", async () => {
  if (pendingRemoveShipIndex === null || !ships[pendingRemoveShipIndex]) {
    closeRemoveConfirmation();
    return;
  }

  const removeIndex = pendingRemoveShipIndex;
  const listing = ships[removeIndex];
  removeShipConfirm.disabled = true;
  removeShipConfirm.textContent = "Removing...";

  try {
    if (listing.isDemo) {
      dismissDemoShipListing(listing.id);
    } else {
      await deleteShipListing(listing);
    }
    ships.splice(removeIndex, 1);
    closeRemoveConfirmation();
    resetOwnerForm();
    renderFleet();
    renderCalendar();
    renderShipMarketplace();
    renderOwnerSchedule();
    renderCalendarFilterOptions();
    updateFilterSummary();
    renderAccountListings();
  } catch (error) {
    dataStatus.shipListings.error = error instanceof Error ? error.message : "Ship listing could not be removed";
    renderFleet();
  } finally {
    removeShipConfirm.disabled = false;
    removeShipConfirm.textContent = "Remove ship";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!availabilityModal.classList.contains("is-hidden")) {
    closeAvailabilityModal();
  } else if (!authPromptModal.classList.contains("is-hidden")) {
    closeAuthPrompt();
  } else if (!removeShipModal.classList.contains("is-hidden")) {
    closeRemoveConfirmation();
  } else if (!ownerConfiguratorModal.classList.contains("is-hidden")) {
    closeOwnerConfigurator();
  }
});

authPromptCancel.addEventListener("click", closeAuthPrompt);

rsiLinkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await updateRsiProfile("start-rsi", {
    rsiHandle: accountRsiHandle.value,
  });
});

rsiVerifyButton.addEventListener("click", async () => {
  await updateRsiProfile("verify-rsi");
});

rsiClearButton.addEventListener("click", async () => {
  await updateRsiProfile("clear-rsi");
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

accountServicesList.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-account-action]");
  if (!actionButton) {
    return;
  }

  if (actionButton.dataset.accountAction === "delete-crew") {
    await removeCrewListing(actionButton.dataset.listingId);
  }
});

accountListingsList.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-account-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.accountAction;
  const id = actionButton.dataset.listingId;

  if (action === "edit-ship" || action === "delete-ship") {
    const index = ships.findIndex((ship) => ship.id === id);
    if (index < 0) {
      return;
    }
    if (action === "edit-ship") {
      setAccountView("fleet");
      populateOwnerForm(index);
      openOwnerConfigurator("modify");
    } else {
      openRemoveConfirmation(index);
    }
  }

  if (action === "delete-crew") {
    await removeCrewListing(id);
  }

  if (action === "delete-material") {
    await removeMaterialRequest(id);
  }
});

availabilityModalClose.addEventListener("click", closeAvailabilityModal);
availabilityCancel.addEventListener("click", closeAvailabilityModal);

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
  if (dateButton.disabled) {
    return;
  }

  const dateKey = dateButton.dataset.availabilityDate;
  const currentStatus = availabilityDraft.get(dateKey) || "unavailable";
  if (currentStatus === "rented") {
    return;
  }
  if (currentStatus === "available") {
    availabilityDraft.delete(dateKey);
  } else {
    availabilityDraft.set(dateKey, "available");
  }
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

availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedIndex = availabilityShipSelect.value;
  if (selectedIndex === "all" && ships.length) {
    openAvailabilityModal("all");
    return;
  }

  if (ships[Number(selectedIndex)]) {
    openAvailabilityModal(Number(selectedIndex));
  }
});

availabilityShipSelect.addEventListener("change", () => {
  availabilityForm.querySelector("button[type='submit']").disabled = ships.length === 0;
  renderOwnerSchedule();
});

createCrewPostingButton.addEventListener("click", openPostCrewListingFlow);
accountCreateServiceButton.addEventListener("click", openCrewPostingModal);
crewPostingClose.addEventListener("click", closeCrewPostingModal);
crewPostingCancel.addEventListener("click", closeCrewPostingModal);

crewPostingPayType.addEventListener("change", updateCrewPostingPayUI);
crewPostingPayValue.addEventListener("input", () => {
  if (crewPostingPayType.value === "flat") {
    formatCreditInput(crewPostingPayValue);
  }
});

crewPostingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(crewPostingForm);
  const payType = data.get("payType");
  const rawValue = data.get("payValue");

  const listing = {
    ownerId: authState.user?.id || "",
    name: data.get("name"),
    role: data.get("role"),
    price: parseCredits(rawValue),
    payType,
    rating: 5.0,
    completedJobs: 0,
    availabilityStatus: "Available now",
    summary: data.get("summary"),
  };

  setListingSaving("crewListings", true);

  try {
    const savedListing = await saveCrewListing(listing);
    crewListings.unshift(savedListing);
    closeCrewPostingModal();
    renderCrewMarketplace();
    renderAccountServices();
    renderAccountListings();
  } catch (error) {
    dataStatus.crewListings.error = error instanceof Error ? error.message : "Crew listing could not be saved";
    renderCrewMarketplace();
  } finally {
    setListingSaving("crewListings", false);
  }
});

postMaterialRequestButton.addEventListener("click", openPostMaterialRequestFlow);
materialRequestClose.addEventListener("click", closeMaterialRequestModal);
materialRequestCancel.addEventListener("click", closeMaterialRequestModal);

addMaterialLineButton.addEventListener("click", () => addMaterialLineItem());

materialPaymentType.addEventListener("change", updateMaterialPaymentUI);
materialPaymentValue.addEventListener("input", () => formatCreditInput(materialPaymentValue));

materialLineItemsContainer.addEventListener("change", (event) => {
  if (event.target.matches("[name='material']")) {
    updateMaterialPriceHint(event.target.closest(".material-line-item"));
  }

  if (!event.target.matches(".material-any-quantity")) {
    return;
  }

  updateMaterialQuantityMode(event.target.closest(".material-line-item"));
});

materialLineItemsContainer.addEventListener("input", (event) => {
  if (event.target.matches("[name='material'], [name='quality']")) {
    updateMaterialPriceHint(event.target.closest(".material-line-item"));
  }
});

materialRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(materialRequestForm);
  const payType = formData.get("paymentType");
  const payValue = formData.get("paymentValue");
  
  const lineItems = Array.from(materialLineItemsContainer.querySelectorAll(".material-line-item")).map((row) => {
    const anyQuantity = row.querySelector(".material-any-quantity").checked;
    const quantity = anyQuantity ? "Any quantity" : row.querySelector("[name='quantity']").value;
    return {
      material: row.querySelector("[name='material']").value,
      quantity,
      anyQuantity,
      quality: row.querySelector("[name='quality']").value,
    };
  });

  if (lineItems.length === 0) {
    alert("Please add at least one material.");
    return;
  }

  const request = {
    requesterId: authState.user?.id || "",
    postedBy: formData.get("postedBy"),
    location: formData.get("location"),
    neededBy: formData.get("neededBy"),
    materials: lineItems,
    price: payType === "perscu" ? `${payValue} UEC / SCU` : `${payValue} UEC Total`,
    // For backwards compatibility/rendering single item if only one
    material: lineItems[0].material,
    quantity: formatMaterialQuantity(lineItems[0]),
    quality: lineItems[0].quality,
  };

  setListingSaving("materialRequests", true);

  try {
    const savedRequest = await saveMaterialRequest(request);
    materialRequests.unshift(savedRequest);
    closeMaterialRequestModal();
    renderMaterialRequests();
    renderAccountListings();
  } catch (error) {
    dataStatus.materialRequests.error = error instanceof Error ? error.message : "Material request could not be saved";
    renderMaterialRequests();
  } finally {
    setListingSaving("materialRequests", false);
  }
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
      .filter((vehicle) => vehicle.nameFull && !vehicle.isAddon && !vehicle.isConcept)
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
  renderShipMarketplace();
  renderCrewMarketplace();
  renderMaterialRequests();
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

async function loadMaterialOptions() {
  updateMaterialNameOptions();
  updateMaterialLocationOptions();

  try {
    const payload = await fetch(MATERIAL_OPTIONS_URL, { cache: "no-store" }).then(readJson);
    materialNameOptions = uniqueSorted([...oreOptions, ...(payload.materials || [])]);
    materialSellPriceByName = new Map(Object.entries(payload.materialPrices || {}));
    materialLocationOptions = Array.isArray(payload.locations) ? payload.locations : [];
  } catch {
    materialNameOptions = uniqueSorted(oreOptions);
    materialSellPriceByName = new Map();
    materialLocationOptions = [];
  }

  updateMaterialNameOptions();
  updateMaterialPriceHints();
  updateMaterialLocationOptions();
}

function navigateToPanel(tabName) {
  const panelName = tabName || "home";
  const route = panelRoute(panelName);
  setActiveTab(panelName);
  if (window.location.pathname !== route) {
    window.history.pushState({ panel: panelName }, "", route);
  }
}

function toggleNavMenu(dropdown) {
  if (!dropdown) {
    return;
  }

  const isOpen = dropdown.classList.contains("is-open");
  closeAllNavMenus(dropdown);
  dropdown.classList.toggle("is-open", !isOpen);
  dropdown.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", String(!isOpen));
}

function closeAllNavMenus(exceptDropdown = null) {
  navDropdowns.forEach((dropdown) => {
    if (dropdown === exceptDropdown) {
      return;
    }

    dropdown.classList.remove("is-open");
    dropdown.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function panelRoute(tabName) {
  return {
    home: "/",
    ships: "/ships",
    crew: "/crew",
    materials: "/materials",
    calendar: "/calendar",
    account: "/account",
  }[tabName] || "/";
}

function panelFromPath(pathname) {
  return {
    "/": "home",
    "/ships": "ships",
    "/crew": "crew",
    "/materials": "materials",
    "/calendar": "calendar",
    "/account": "account",
  }[pathname] || "home";
}

window.addEventListener("popstate", () => {
  setActiveTab(panelFromPath(window.location.pathname));
});

function setActiveTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });

  if (tabName === "ships") {
    renderShipMarketplace();
  } else if (tabName === "crew") {
    renderCrewMarketplace();
  } else if (tabName === "materials") {
    renderMaterialRequests();
  } else if (tabName === "account") {
    renderAccountPanel();
  }
}

function setOwnerView(viewName) {
  document.querySelectorAll("[data-owner-view]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.ownerView === viewName);
  });

  document.querySelectorAll(".owner-view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.ownerPanel === viewName);
  });

  if (viewName === "schedule") {
    renderOwnerSchedule();
  }
}

function setAccountView(viewName) {
  document.querySelectorAll("[data-account-view]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.accountView === viewName);
  });

  document.querySelectorAll("[data-account-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.accountPanel === viewName);
  });

  if (viewName === "fleet") {
    setOwnerView("fleet");
    renderFleet();
    renderOwnerSchedule();
  }
  if (viewName === "services") {
    renderAccountServices();
  }
  if (viewName === "listings") {
    renderAccountListings();
  }
  if (viewName === "deals") {
    renderAccountDeals();
  }
}

function openAddShipFlow() {
  if (!canCreatePosting(authState.user)) {
    showAuthPrompt("Create an account with Discord or a verified RSI handle to post ship listings.");
    return;
  }

  resetOwnerForm();
  openOwnerConfigurator("add");
}

function openPostShipListingFlow() {
  navigateToPanel("ships");
  openAddShipFlow();
}

function openPostCrewListingFlow() {
  navigateToPanel("crew");
  openCrewPostingModal();
}

function openPostMaterialRequestFlow() {
  navigateToPanel("materials");
  openMaterialRequestModal();
}

async function loadSession() {
  authState.loading = true;
  updateAuthUI();

  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const session = await response.json();
    authState.user = session.authenticated ? session.user : null;
  } catch (error) {
    authState.user = null;
  } finally {
    authState.loading = false;
    updateAuthUI();
    loadDeals();
  }
}

function updateAuthUI() {
  const user = authState.user;
  authLogin.classList.toggle("is-hidden", Boolean(user));
  authUser.classList.toggle("is-hidden", !user);

  if (user) {
    authDisplayName.textContent = preferredDisplayName(user);
    setAvatar(authAvatar, authAvatarPlaceholder, user.avatarUrl);
  } else {
    authDisplayName.textContent = "Account";
    setAvatar(authAvatar, authAvatarPlaceholder, "");
  }

  renderAccountPanel();
}

function renderAccountPanel() {
  const user = authState.user;
  accountSignedOut.classList.toggle("is-hidden", Boolean(user));
  accountDashboard.classList.toggle("is-hidden", !user);

  if (!user) {
    return;
  }

  accountDisplayName.textContent = preferredDisplayName(user);
  accountUsername.textContent = user.username ? `Discord: @${user.username}` : "Discord connected";
  accountCreatedAt.textContent = user.createdAt ? formatDateTime(user.createdAt) : "Available after database setup";
  accountDiscordStatus.textContent = user.discordId ? "Linked" : "Not linked";
  accountRsiHandle.value = user.profile?.rsiHandle || "";
  accountRsiStatus.textContent = rsiStatusLabel(user.profile);
  accountPublicName.textContent = preferredDisplayName(user);
  const myRatingStats = ratingStats[user.id] || {};
  accountRating.textContent = Number(myRatingStats.averageRating || user.stats?.rating || 0).toFixed(1);
  accountContracts.textContent = Number(myRatingStats.ratedDeals || user.stats?.completedContracts || 0).toLocaleString();
  accountListings.textContent = Number(user.stats?.activeListings || marketplaceUserListingCount(user)).toLocaleString();
  accountOrg.textContent = user.stats?.orgAffiliation || "None";
  setAvatar(accountAvatar, accountAvatarPlaceholder, user.avatarUrl);
  renderRsiLinkControls(user.profile);
  renderAccountServices();
  renderAccountListings();
  renderAccountDeals();
}

function canCreatePosting(userProfile) {
  return Boolean(
    userProfile?.discordId ||
    userProfile?.id?.startsWith("discord:") ||
    (userProfile?.profile?.rsiStatus === "verified" && userProfile.profile.rsiHandle),
  );
}

function preferredDisplayName(user = authState.user) {
  const verifiedRsi = verifiedRsiHandle(user);
  return verifiedRsi || user?.username || user?.displayName || user?.email || "Account";
}

function verifiedRsiHandle(user = authState.user) {
  return user?.profile?.rsiStatus === "verified" ? user.profile.rsiHandle : "";
}

function identitySearchValues(user = authState.user) {
  return [
    verifiedRsiHandle(user),
    user?.username,
    user?.displayName,
    user?.email,
  ]
    .map(normalizeFilterValue)
    .filter(Boolean);
}

function listingSearchValues(item, fields = []) {
  return fields
    .flatMap((field) => [item?.[field]])
    .concat([item?.rsiHandle, item?.discordUsername, item?.providerName])
    .map(normalizeFilterValue)
    .filter(Boolean);
}

function rsiStatusLabel(profile) {
  if (profile?.rsiStatus === "verified") {
    return `Verified: ${profile.rsiHandle}`;
  }
  if (profile?.rsiStatus === "pending") {
    return `Pending verification: ${profile.rsiHandle}`;
  }
  return "Not linked";
}

function renderRsiLinkControls(profile = {}) {
  const status = profile.rsiStatus || "not_linked";
  const pending = status === "pending";
  const verified = status === "verified";

  rsiCodeField.classList.add("is-hidden");
  rsiVerifyButton.classList.toggle("is-hidden", !pending);
  rsiClearButton.classList.toggle("is-hidden", !profile.rsiHandle);
  rsiStartButton.textContent = profile.rsiHandle ? "Update RSI handle" : "Link RSI handle";
  rsiVerificationCode.classList.toggle("is-hidden", !pending);
  rsiVerificationCode.textContent = pending
    ? `Verification code: ${profile.rsiVerificationCode}. Add this code to your public RSI profile bio, save it, then check the profile.`
    : "";
  rsiStatusMessage.textContent = verified
    ? "RSI handle verified. This handle will display publicly before your Discord username."
    : "A verified RSI handle can qualify your posting identity and display publicly before your Discord username.";
}

async function updateRsiProfile(action, payload = {}) {
  rsiStatusMessage.textContent = action === "verify-rsi" ? "Checking the public RSI profile..." : "Saving RSI profile...";
  try {
    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await readJson(response);
    authState.user = result.user;
    rsiCodeInput.value = "";
    updateAuthUI();
  } catch (error) {
    rsiStatusMessage.textContent = error instanceof Error ? error.message : "RSI profile could not be updated.";
  }
}

function isOwnedByCurrentUser(item, fallbackNameKey = "owner") {
  const user = authState.user;
  if (!user) {
    return false;
  }

  return (
    item.ownerId === user.id ||
    item.requesterId === user.id ||
    identitySearchValues(user).includes(normalizeFilterValue(item[fallbackNameKey]))
  );
}

function ownedShips() {
  return ships.filter((ship) => isOwnedByCurrentUser(ship, "owner"));
}

function ownedCrewListings() {
  return crewListings.filter((listing) => isOwnedByCurrentUser(listing, "name"));
}

function ownedMaterialRequests() {
  return materialRequests.filter((request) => isOwnedByCurrentUser(request, "postedBy"));
}

function renderAccountServices() {
  if (!accountServicesList) {
    return;
  }

  const listings = ownedCrewListings();
  accountServicesList.innerHTML = listings.length
    ? listings.map(accountServiceCard).join("")
    : `<div class="empty-state">No service listings yet. Create a service listing to offer pilot, gunner, engineer, medic, ground team, escort, salvage, or support work.</div>`;
}

function renderAccountListings() {
  if (!accountListingsList) {
    return;
  }

  const listingCards = [
    ...ownedShips().map(accountShipListingCard),
    ...ownedCrewListings().map(accountCrewListingCard),
    ...ownedMaterialRequests().map(accountMaterialListingCard),
  ];

  accountListingsList.innerHTML = listingCards.length
    ? listingCards.join("")
    : `<div class="empty-state">No active marketplace listings yet. Add a ship, create a service, or post a material request.</div>`;
}

function renderAccountDeals() {
  if (!accountDealsList) {
    return;
  }

  if (!authState.user) {
    accountDealsList.innerHTML = `<div class="empty-state">Sign in with Discord to view your deals.</div>`;
    return;
  }

  if (dataStatus.deals.loading && !deals.length) {
    accountDealsList.innerHTML = `<div class="empty-state">Loading your deals...</div>`;
    return;
  }

  if (dataStatus.deals.error && !deals.length) {
    accountDealsList.innerHTML = `<div class="empty-state error-state">Deals unavailable: ${escapeHtml(dataStatus.deals.error)}</div>`;
    return;
  }

  const filteredDeals = deals.filter((deal) => dealMatchesFilter(deal, activeDealFilter));
  accountDealsList.innerHTML = filteredDeals.length
    ? filteredDeals.map(accountDealCard).join("")
    : `<div class="empty-state">No ${dealFilterLabel(activeDealFilter).toLowerCase()} yet.</div>`;
}

function dealMatchesFilter(deal, filter) {
  const status = deal.status || "pending";
  if (filter === "completed") {
    return status === "completed";
  }
  if (filter === "closed") {
    return ["cancelled", "rejected", "disputed"].includes(status);
  }
  if (filter === "waiting") {
    return dealNeedsCurrentUserAction(deal);
  }
  return ["pending", "in_progress", "completion_requested"].includes(status);
}

function dealFilterLabel(filter) {
  return {
    open: "Open Deals",
    waiting: "Waiting on Me",
    completed: "Completed Deals",
    closed: "Cancelled/Rejected Deals",
  }[filter] || "Deals";
}

function dealNeedsCurrentUserAction(deal) {
  const userId = authState.user?.id;
  if (!userId) {
    return false;
  }
  if (deal.status === "pending") {
    return deal.providerUserId === userId;
  }
  if (deal.status === "completion_requested") {
    return (
      (deal.requesterUserId === userId && !deal.requesterConfirmedComplete) ||
      (deal.providerUserId === userId && !deal.providerConfirmedComplete)
    );
  }
  if (deal.status === "completed") {
    return !deal.myRating;
  }
  return false;
}

function accountDealCard(deal) {
  const userId = authState.user?.id;
  const isRequester = deal.requesterUserId === userId;
  const otherParty = isRequester ? deal.providerName : deal.requesterName;
  const roleLabel = isRequester ? "Provider" : "Requester";
  const waitingText = completionWaitingText(deal);

  return `
    <article class="account-listing-card deal-card">
      <div>
        <p class="eyebrow">${escapeHtml(dealTypeLabel(deal.dealType))}</p>
        <h3>${escapeHtml(deal.listingName || "General service")}</h3>
        <p>${escapeHtml(roleLabel)}: ${escapeHtml(otherParty || "Unknown")} / Requested ${escapeHtml(formatDateTime(deal.requestedAt))}</p>
        ${waitingText ? `<p class="deal-note">${escapeHtml(waitingText)}</p>` : ""}
      </div>
      <div class="account-listing-meta">
        ${listingStatusBadge(dealStatusLabel(deal.status))}
        <strong>${escapeHtml(deal.myRating ? `You rated ${deal.myRating.rating} / 5` : "Deal")}</strong>
      </div>
      <div class="card-actions">
        ${dealActionButtons(deal)}
      </div>
    </article>
  `;
}

function dealTypeLabel(dealType) {
  return {
    ship_rental: "Ship rental",
    crew_service: "Crew service",
    material_order: "Material order",
    contract: "Contract",
    general: "General deal",
  }[dealType] || "Deal";
}

function dealStatusLabel(status) {
  return {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    cancelled: "Cancelled",
    in_progress: "In progress",
    completion_requested: "Completion requested",
    completed: "Completed",
    disputed: "Disputed",
  }[status] || "Pending";
}

function completionWaitingText(deal) {
  if (deal.status !== "completion_requested") {
    return "";
  }
  const userId = authState.user?.id;
  const currentUserConfirmed = (
    (deal.requesterUserId === userId && deal.requesterConfirmedComplete) ||
    (deal.providerUserId === userId && deal.providerConfirmedComplete)
  );
  return currentUserConfirmed ? "Waiting for the other party to confirm completion." : "The other party requested completion. Confirm only when the work is done.";
}

function dealActionButtons(deal) {
  const userId = authState.user?.id;
  const buttons = [];
  const escapedId = escapeHtml(deal.id);

  if (deal.status === "pending" && deal.requesterUserId === userId) {
    buttons.push(`<button class="secondary-button danger-button" type="button" data-deal-action="cancel" data-deal-id="${escapedId}">Cancel Request</button>`);
  }
  if (deal.status === "pending" && deal.providerUserId === userId) {
    buttons.push(`<button class="primary-button" type="button" data-deal-action="accept" data-deal-id="${escapedId}">Accept</button>`);
    buttons.push(`<button class="secondary-button danger-button" type="button" data-deal-action="reject" data-deal-id="${escapedId}">Reject</button>`);
  }
  if (deal.status === "in_progress") {
    buttons.push(`<button class="primary-button" type="button" data-deal-action="mark_complete" data-deal-id="${escapedId}">Mark Complete</button>`);
  }
  if (deal.status === "completion_requested") {
    const needsConfirmation = (
      (deal.requesterUserId === userId && !deal.requesterConfirmedComplete) ||
      (deal.providerUserId === userId && !deal.providerConfirmedComplete)
    );
    buttons.push(needsConfirmation
      ? `<button class="primary-button" type="button" data-deal-action="mark_complete" data-deal-id="${escapedId}">Confirm Complete</button>`
      : `<button class="secondary-button" type="button" disabled>Waiting for other party</button>`);
  }
  if (deal.status === "completed" && !deal.myRating) {
    buttons.push(`<button class="primary-button" type="button" data-deal-rate="${escapedId}">Rate User</button>`);
  }

  return buttons.length ? buttons.join("") : `<button class="secondary-button" type="button" disabled>No actions</button>`;
}

async function handleDealRequest(button) {
  if (!canCreatePosting(authState.user)) {
    showAuthPrompt();
    return;
  }

  const deal = {
    providerUserId: button.dataset.providerId || "",
    providerName: button.dataset.providerName || "Provider",
    listingId: button.dataset.listingId || "",
    listingType: button.dataset.listingType || "",
    listingName: button.dataset.listingName || "General service",
    dealType: button.dataset.dealType || "general",
  };

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Sending...";

  try {
    await createDeal(deal);
    await loadDeals();
    activeDealFilter = "open";
    accountDealFilters?.querySelectorAll("[data-deal-filter]").forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton.dataset.dealFilter === "open");
    });
    window.alert("Deal request sent. You can track it under Account > My Deals.");
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Deal request could not be created.");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function handleDealAction(action, dealId) {
  if (!action || !dealId) {
    return;
  }

  try {
    await updateDeal(action, dealId);
    await loadDeals();
  } catch (error) {
    dataStatus.deals.error = error instanceof Error ? error.message : "Deal could not be updated";
    renderAccountDeals();
  }
}

async function handleDealRating(dealId) {
  if (!dealId) {
    return;
  }

  const rawRating = window.prompt("Rate the other user from 1 to 5 stars.");
  if (rawRating === null) {
    return;
  }
  const rating = Number(rawRating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    window.alert("Enter a whole number from 1 to 5.");
    return;
  }
  const comment = window.prompt("Optional feedback comment:") || "";

  try {
    await rateDeal(dealId, rating, comment);
    await loadDeals();
    await loadRatingStats();
  } catch (error) {
    dataStatus.deals.error = error instanceof Error ? error.message : "Rating could not be saved";
    renderAccountDeals();
  }
}

function listingStatusBadge(status = "Active") {
  return `<span class="status-badge">${escapeHtml(status)}</span>`;
}

function accountServiceCard(listing) {
  return `
    <article class="account-listing-card">
      <div>
        <p class="eyebrow">Service listing</p>
        <h3>${escapeHtml(listing.role || "Service")}</h3>
        <p>${escapeHtml(listing.summary || "No service summary provided.")}</p>
      </div>
      <div class="account-listing-meta">
        ${listingStatusBadge(listing.availabilityStatus || "Active")}
        <strong>${listing.payType === "cut" ? `${formatCredits(listing.price)}% cut` : `${formatCredits(listing.price)} UEC / hour`}</strong>
      </div>
      <div class="card-actions">
        <button class="secondary-button" type="button" disabled>Edit</button>
        <button class="secondary-button" type="button" disabled>Pause</button>
        <button class="secondary-button danger-button" type="button" data-account-action="delete-crew" data-listing-id="${escapeHtml(listing.id)}">Delete</button>
      </div>
    </article>
  `;
}

function accountShipListingCard(ship) {
  return `
    <article class="account-listing-card">
      <div>
        <p class="eyebrow">Ship listing</p>
        <h3>${escapeHtml(ship.ship)}</h3>
        <p>${escapeHtml(ship.manufacturer || ship.vehicle?.company || "Independent")} / ${escapeHtml(ship.role || "General")}</p>
      </div>
      <div class="account-listing-meta">
        ${listingStatusBadge(ship.dates?.length ? "Active" : "Unavailable")}
        <strong>${formatCredits(getShipRate(ship, "hour") || 0)} UEC / hour</strong>
      </div>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-account-action="edit-ship" data-listing-id="${escapeHtml(ship.id)}">Edit</button>
        <button class="secondary-button" type="button" disabled>Pause</button>
        <button class="secondary-button danger-button" type="button" data-account-action="delete-ship" data-listing-id="${escapeHtml(ship.id)}">Delete</button>
      </div>
    </article>
  `;
}

function accountCrewListingCard(listing) {
  return `
    <article class="account-listing-card">
      <div>
        <p class="eyebrow">Crew/service listing</p>
        <h3>${escapeHtml(listing.role || "Service")}</h3>
        <p>${escapeHtml(listing.summary || "No service summary provided.")}</p>
      </div>
      <div class="account-listing-meta">
        ${listingStatusBadge(listing.availabilityStatus || "Active")}
        <strong>${listing.payType === "cut" ? `${formatCredits(listing.price)}% cut` : `${formatCredits(listing.price)} UEC / hour`}</strong>
      </div>
      <div class="card-actions">
        <button class="secondary-button" type="button" disabled>Edit</button>
        <button class="secondary-button" type="button" disabled>Pause</button>
        <button class="secondary-button danger-button" type="button" data-account-action="delete-crew" data-listing-id="${escapeHtml(listing.id)}">Delete</button>
      </div>
    </article>
  `;
}

function accountMaterialListingCard(request) {
  return `
    <article class="account-listing-card">
      <div>
        <p class="eyebrow">Material listing</p>
        <h3>${escapeHtml(request.material || "Material request")}</h3>
        <p>${escapeHtml(formatMaterialQuantity(request))} / ${escapeHtml(request.location || "No location set")}</p>
      </div>
      <div class="account-listing-meta">
        ${listingStatusBadge("Active")}
        <strong>${escapeHtml(request.price || "Open bid")}</strong>
      </div>
      <div class="card-actions">
        <button class="secondary-button" type="button" disabled>Edit</button>
        <button class="secondary-button" type="button" disabled>Pause</button>
        <button class="secondary-button danger-button" type="button" data-account-action="delete-material" data-listing-id="${escapeHtml(request.id)}">Delete</button>
      </div>
    </article>
  `;
}

function replaceCollection(target, source) {
  target.splice(0, target.length, ...(Array.isArray(source) ? source : []));
}

function applyDemoPostsWhenEmpty(target, demoPosts, dismissedDemoIds = new Set()) {
  if (!target.length) {
    replaceCollection(
      target,
      demoPosts
        .filter((post) => !dismissedDemoIds.has(post.id))
        .map(cloneDemoPost),
    );
  }
}

function getDismissedDemoShipIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(dismissedDemoShipStorageKey) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function saveDismissedDemoShipIds(ids) {
  try {
    localStorage.setItem(dismissedDemoShipStorageKey, JSON.stringify([...ids]));
  } catch {
    // Demo removal is best-effort; browsers can block localStorage in some privacy modes.
  }
}

function dismissDemoShipListing(id) {
  if (!id) {
    return;
  }

  const dismissedIds = getDismissedDemoShipIds();
  dismissedIds.add(id);
  saveDismissedDemoShipIds(dismissedIds);
}

function cloneDemoPost(post) {
  return JSON.parse(JSON.stringify(post));
}

function markDemoPost(post) {
  return {
    ...post,
    isDemo: true,
  };
}

function demoDateKeys(dayOffsets) {
  return dayOffsets.map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return dateToKey(date);
  });
}

function demoOnlyButton(label) {
  return `<button class="primary-button demo-button" type="button" disabled title="FAKE DEMO POST - placeholder only">${escapeHtml(label)}</button>`;
}

function demoBadge() {
  return `<span class="tag demo-tag">FAKE DEMO</span>`;
}

function setListingSaving(statusKey, isSaving) {
  dataStatus[statusKey].saving = isSaving;

  if (statusKey === "shipListings") {
    ownerSubmitButton.disabled = isSaving;
    ownerSubmitButton.textContent = isSaving
      ? "Saving..."
      : editingShipIndex === null
        ? "Add ship"
        : "Update ship";
  }
}

function clearFormError() {
  rateError.textContent = "Enter a base price and offer at least one rate.";
  rateError.classList.add("is-hidden");
}

function showFormError(message) {
  rateError.textContent = message;
  rateError.classList.remove("is-hidden");
}

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }
  return payload;
}

async function loadShipListings() {
  dataStatus.shipListings.loading = true;
  dataStatus.shipListings.error = "";
  renderFleet();
  renderShipMarketplace();

  try {
    const payload = await fetch(SHIP_LISTINGS_URL, { cache: "no-store" }).then(readJson);
    replaceCollection(ships, payload.listings);
    applyDemoPostsWhenEmpty(ships, demoShipListings, getDismissedDemoShipIds());
    enrichSeedShips();
  } catch (error) {
    dataStatus.shipListings.error = error instanceof Error ? error.message : "Unable to load ship listings";
    applyDemoPostsWhenEmpty(ships, demoShipListings, getDismissedDemoShipIds());
    enrichSeedShips();
  } finally {
    dataStatus.shipListings.loading = false;
    renderFleet();
    renderCalendar();
    renderShipMarketplace();
    renderOwnerSchedule();
    renderCalendarFilterOptions();
    updateFilterSummary();
    renderAccountPanel();
  }
}

async function loadCrewListings() {
  dataStatus.crewListings.loading = true;
  dataStatus.crewListings.error = "";
  renderCrewMarketplace();

  try {
    const payload = await fetch(CREW_LISTINGS_URL, { cache: "no-store" }).then(readJson);
    replaceCollection(crewListings, payload.listings);
  } catch (error) {
    dataStatus.crewListings.error = error instanceof Error ? error.message : "Unable to load crew listings";
  } finally {
    applyDemoPostsWhenEmpty(crewListings, demoCrewListings);
    dataStatus.crewListings.loading = false;
    renderCrewMarketplace();
    renderAccountServices();
    renderAccountListings();
  }
}

async function loadMaterialRequests() {
  dataStatus.materialRequests.loading = true;
  dataStatus.materialRequests.error = "";
  renderMaterialRequests();

  try {
    const payload = await fetch(MATERIAL_REQUESTS_URL, { cache: "no-store" }).then(readJson);
    replaceCollection(materialRequests, payload.requests);
  } catch (error) {
    dataStatus.materialRequests.error = error instanceof Error ? error.message : "Unable to load material requests";
  } finally {
    applyDemoPostsWhenEmpty(materialRequests, demoMaterialRequests);
    dataStatus.materialRequests.loading = false;
    renderMaterialRequests();
    updateMaterialPriceHints();
    renderAccountListings();
  }
}

async function loadDeals() {
  if (!authState.user) {
    replaceCollection(deals, []);
    renderAccountDeals();
    return;
  }

  dataStatus.deals.loading = true;
  dataStatus.deals.error = "";
  renderAccountDeals();

  try {
    const payload = await fetch(DEALS_URL, { cache: "no-store" }).then(readJson);
    replaceCollection(deals, payload.deals);
  } catch (error) {
    dataStatus.deals.error = error instanceof Error ? error.message : "Unable to load deals";
  } finally {
    dataStatus.deals.loading = false;
    renderAccountDeals();
  }
}

async function loadRatingStats() {
  dataStatus.ratingStats.loading = true;
  dataStatus.ratingStats.error = "";

  try {
    const payload = await fetch(RATING_STATS_URL, { cache: "no-store" }).then(readJson);
    ratingStats = payload.stats || {};
  } catch (error) {
    dataStatus.ratingStats.error = error instanceof Error ? error.message : "Unable to load rating stats";
  } finally {
    dataStatus.ratingStats.loading = false;
    renderShipMarketplace();
    renderCrewMarketplace();
    renderAccountPanel();
  }
}

async function saveShipListing(listing) {
  const payload = await fetch(SHIP_LISTINGS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ listing }),
  }).then(readJson);

  return payload.listing;
}

async function deleteShipListing(listing) {
  if (!listing?.id) {
    throw new Error("This listing was not saved to Supabase yet. Reload the page and try again.");
  }

  await fetch(`${SHIP_LISTINGS_URL}?id=${encodeURIComponent(listing.id)}`, {
    method: "DELETE",
  }).then(readJson);
}

async function deleteCrewListing(id) {
  if (!id) {
    throw new Error("Crew listing id is required");
  }

  await fetch(`${CREW_LISTINGS_URL}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then(readJson);
}

async function deleteMaterialRequest(id) {
  if (!id) {
    throw new Error("Material request id is required");
  }

  await fetch(`${MATERIAL_REQUESTS_URL}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then(readJson);
}

async function removeCrewListing(id) {
  const listing = crewListings.find((item) => item.id === id);
  if (!listing || !window.confirm(`Delete ${listing.role || "this service listing"}?`)) {
    return;
  }

  try {
    await deleteCrewListing(id);
    crewListings.splice(crewListings.indexOf(listing), 1);
    renderCrewMarketplace();
    renderAccountServices();
    renderAccountListings();
  } catch (error) {
    dataStatus.crewListings.error = error instanceof Error ? error.message : "Crew listing could not be deleted";
    renderAccountServices();
  }
}

async function removeMaterialRequest(id) {
  const request = materialRequests.find((item) => item.id === id);
  if (!request || !window.confirm(`Delete ${request.material || "this material request"}?`)) {
    return;
  }

  try {
    await deleteMaterialRequest(id);
    materialRequests.splice(materialRequests.indexOf(request), 1);
    renderMaterialRequests();
    renderAccountListings();
  } catch (error) {
    dataStatus.materialRequests.error = error instanceof Error ? error.message : "Material request could not be deleted";
    renderAccountListings();
  }
}

async function saveCrewListing(listing) {
  const payload = await fetch(CREW_LISTINGS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ listing }),
  }).then(readJson);

  return payload.listing;
}

async function saveMaterialRequest(request) {
  const payload = await fetch(MATERIAL_REQUESTS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request }),
  }).then(readJson);

  return payload.request;
}

async function createDeal(deal) {
  const payload = await fetch(DEALS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "create", deal }),
  }).then(readJson);

  return payload.deal;
}

async function updateDeal(action, dealId) {
  const payload = await fetch(DEALS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, dealId }),
  }).then(readJson);

  return payload.deal;
}

async function rateDeal(dealId, rating, comment) {
  const payload = await fetch(DEALS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "rate", dealId, rating, comment }),
  }).then(readJson);

  return payload.rating;
}

function setAvatar(image, placeholder, avatarUrl) {
  if (avatarUrl) {
    image.src = avatarUrl;
    image.classList.remove("is-hidden");
    placeholder.classList.add("is-hidden");
    return;
  }

  image.removeAttribute("src");
  image.classList.add("is-hidden");
  placeholder.classList.remove("is-hidden");
}

function marketplaceUserListingCount(user) {
  const identities = identitySearchValues(user);
  return ships.filter((ship) => ship.ownerId === user.id || identities.includes(normalizeFilterValue(ship.owner))).length;
}

function showAuthPrompt(message = "Create an account with Discord or a verified RSI handle before posting.") {
  authPromptMessage.textContent = message;
  authPromptModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeAuthPrompt() {
  authPromptModal.classList.add("is-hidden");
  if (
    ownerConfiguratorModal.classList.contains("is-hidden") &&
    removeShipModal.classList.contains("is-hidden") &&
    availabilityModal.classList.contains("is-hidden")
  ) {
    document.body.classList.remove("modal-open");
  }
}

function showAuthErrorFromUrl() {
  const error = new URLSearchParams(window.location.search).get("auth_error");
  if (!error) {
    return;
  }

  authPromptMessage.textContent = `Discord sign-in could not finish: ${error}`;
  authPromptModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  window.history.replaceState({}, "", "/");
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
  if (dataStatus.shipListings.loading && !ships.length) {
    fleetList.innerHTML = `<div class="empty-state">Loading shared fleet listings...</div>`;
    return;
  }

  if (dataStatus.shipListings.error && !ships.length) {
    fleetList.innerHTML = `<div class="empty-state error-state">Supabase listings unavailable: ${escapeHtml(dataStatus.shipListings.error)}</div>`;
    return;
  }

  fleetList.innerHTML = ships.length
    ? ships
        .map(
          (ship) => `
            <article class="fleet-card">
              ${shipImage(ship)}
              <div class="card-top">
                <h2>${escapeHtml(ship.ship)}</h2>
                <div class="card-tags">
                  ${ship.isDemo ? demoBadge() : ""}
                  <span class="tag">${escapeHtml(ship.role)}</span>
                </div>
              </div>
              <ul class="meta-list">
                <li>Owner: ${escapeHtml(ship.owner)}</li>
                ${rateFacts(ship)}
                ${listingPriceFacts(ship)}
                ${vehicleFacts(ship)}
              </ul>
              ${configurationSummary(ship)}
              ${fleetShipActions(ship)}
              ${hangarServicesSummary(ship)}
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">No shared fleet listings yet. Add a ship to start building the exchange.</div>`;
}

function fleetShipActions(ship) {
  const shipIndex = ships.indexOf(ship);

  if (ship.isDemo) {
    return `
      <div class="card-actions">
        ${demoOnlyButton("Fake Demo Only")}
        <button class="secondary-button danger-button" type="button" data-fleet-action="remove" data-ship-index="${shipIndex}">Remove</button>
      </div>
    `;
  }

  return `
    <div class="card-actions">
      <button class="primary-button" type="button" data-fleet-action="availability" data-ship-index="${shipIndex}">Availability</button>
      <button class="secondary-button" type="button" data-fleet-action="modify" data-ship-index="${shipIndex}">Modify</button>
      <button class="secondary-button danger-button" type="button" data-fleet-action="remove" data-ship-index="${shipIndex}">Remove</button>
    </div>
  `;
}

function renderShipMarketplace() {
  const form = new FormData(shipMarketForm);
  const role = String(form.get("role") || "");
  const manufacturer = String(form.get("manufacturer") || "");
  const minCargo = Number(form.get("cargo") || 0);
  const maxHourlyPrice = Number(form.get("price") || Infinity);
  const minRating = Number(form.get("rating") || 0);
  const needsMedical = form.has("medical");
  const needsHangar = form.has("hangar");
  const needsPilot = form.has("pilot");

  const listings = marketplaceShipListings()
    .filter((ship) => {
      const hourlyRate = getShipRate(ship, "hour");
      return (
        (!role || ship.role === role) &&
        (!manufacturer || ship.manufacturer === manufacturer || ship.vehicle?.company === manufacturer) &&
        Number(ship.cargoScu || ship.vehicle?.scu || 0) >= minCargo &&
        (!Number.isFinite(maxHourlyPrice) || (hourlyRate > 0 && hourlyRate <= maxHourlyPrice)) &&
        Number(ship.rating || 0) >= minRating &&
        (!needsMedical || hasMedicalCapability(ship)) &&
        (!needsHangar || Boolean(ship.hangarServices?.length)) &&
        (!needsPilot || Boolean(ship.pilotIncluded)) &&
        isShipAvailable(ship)
      );
    })
    .sort((first, second) => availabilityRank(first) - availabilityRank(second) || second.rating - first.rating);

  if (dataStatus.shipListings.loading && !ships.length) {
    shipMarketResults.innerHTML = `<div class="empty-state">Loading shared ship providers...</div>`;
    return;
  }

  if (dataStatus.shipListings.error && !ships.length) {
    shipMarketResults.innerHTML = `<div class="empty-state error-state">Supabase ship listings unavailable: ${escapeHtml(dataStatus.shipListings.error)}</div>`;
    return;
  }

  shipMarketResults.innerHTML = listings.length
    ? listings.map(shipMarketplaceCard).join("")
    : `<div class="empty-state">No available ship providers match those filters yet.</div>`;
}

function renderCrewMarketplace() {
  const form = new FormData(crewMarketForm);
  const query = String(form.get("query") || "").trim().toLowerCase();
  const role = String(form.get("role") || "");
  const maxPrice = Number(form.get("price") || Infinity);
  const minRating = Number(form.get("rating") || 0);
  const availability = String(form.get("availability") || "");
  const myPostings = form.has("myPostings");
  const sort = String(form.get("sort") || "newest");
  const userIdentities = identitySearchValues(authState.user);

  if (dataStatus.crewListings.loading && !crewListings.length) {
    crewMarketResults.innerHTML = `<div class="empty-state">Loading shared crew providers...</div>`;
    return;
  }

  if (dataStatus.crewListings.error && !crewListings.length) {
    crewMarketResults.innerHTML = `<div class="empty-state error-state">Supabase crew listings unavailable: ${escapeHtml(dataStatus.crewListings.error)}</div>`;
    return;
  }

  const listings = crewListings
    .filter((crew) => (
      (!query || listingSearchValues(crew, ["name"]).some((value) => value.includes(query))) &&
      (!role || crew.role === role) &&
      (!Number.isFinite(maxPrice) || crew.price <= maxPrice) &&
      crew.rating >= minRating &&
      (!availability || crew.availabilityStatus === availability) &&
      (!myPostings || listingSearchValues(crew, ["name"]).some((value) => userIdentities.includes(value)))
    ))
    .sort((a, b) => {
      if (sort === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sort === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sort === "rating-desc") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  crewMarketResults.innerHTML = listings.length
    ? listings.map(crewMarketplaceCard).join("")
    : `<div class="empty-state">No crew providers match those filters yet.</div>`;
}

function renderMaterialRequests() {
  if (dataStatus.materialRequests.loading && !materialRequests.length) {
    materialRequestResults.innerHTML = `<div class="empty-state">Loading shared material requests...</div>`;
    return;
  }

  if (dataStatus.materialRequests.error && !materialRequests.length) {
    materialRequestResults.innerHTML = `<div class="empty-state error-state">Supabase material requests unavailable: ${escapeHtml(dataStatus.materialRequests.error)}</div>`;
    return;
  }

  materialRequestResults.innerHTML = materialRequests.length
    ? materialRequests.map(materialRequestCard).join("")
    : `<div class="empty-state">No material requests posted yet.</div>`;
}

function marketplaceShipListings() {
  const ownerListings = ships.map((ship) => ({
    ...ship,
    rating: ship.rating || 4.5,
    completedJobs: ship.completedJobs || 0,
    availabilityStatus: ship.dates?.length ? "Available" : "Schedule pending",
    cargoScu: ship.vehicle?.scu || ship.cargoScu || 0,
    medical: hasMedicalCapability(ship),
    capabilities: marketplaceShipCapabilities(ship),
  }));

  return ownerListings;
}

function shipMarketplaceCard(ship) {
  const hourlyRate = getShipRate(ship, "hour") || ship.rates?.hour || 0;
  const capabilities = marketplaceShipCapabilities(ship);
  const ratingLine = ratingSummaryLine(ship.ownerId, ship.rating, ship.completedJobs);

  return `
    <article class="market-card">
      ${shipImage(ship)}
      <div class="card-top">
        <h2>${escapeHtml(ship.ship)}</h2>
        <div class="card-tags">
          ${ship.isDemo ? demoBadge() : ""}
          <span class="tag">${escapeHtml(ship.availabilityStatus || "Available")}</span>
        </div>
      </div>
      <div class="price-line">
        <strong>${formatCredits(hourlyRate)} UEC</strong>
        <span>/ hour</span>
      </div>
      <ul class="meta-list">
        <li>Provider: ${escapeHtml(ship.owner)}</li>
        <li>${ratingLine}</li>
        <li>${escapeHtml(ship.manufacturer || ship.vehicle?.company || "Independent")} · ${escapeHtml(ship.role || "General")}</li>
      </ul>
      <div class="capability-list">
        ${capabilities.map((capability) => `<span>${escapeHtml(capability)}</span>`).join("")}
      </div>
      ${ship.isDemo ? demoOnlyButton("Fake Demo Only") : `<button class="primary-button" type="button" data-auth-action="request a ship rental" data-deal-request data-deal-type="ship_rental" data-listing-type="ship" data-listing-id="${escapeHtml(ship.id || "")}" data-listing-name="${escapeHtml(ship.ship || "Ship rental")}" data-provider-id="${escapeHtml(ship.ownerId || "")}" data-provider-name="${escapeHtml(ship.owner || "Provider")}">Request Rental</button>`}
    </article>
  `;
}

function crewMarketplaceCard(crew) {
  const payLabel = crew.payType === "cut" ? `${crew.price}% Cut` : `${formatCredits(crew.price)} UEC / hour`;
  const ratingLine = ratingSummaryLine(crew.ownerId, crew.rating, crew.completedJobs);
  
  return `
    <article class="market-card">
      <div class="card-top">
        <h2>${escapeHtml(crew.name)}</h2>
        <div class="card-tags">
          ${crew.isDemo ? demoBadge() : ""}
          <span class="tag">${escapeHtml(crew.availabilityStatus)}</span>
        </div>
      </div>
      <div class="price-line">
        <strong>${payLabel}</strong>
      </div>
      <ul class="meta-list">
        <li>Role: ${escapeHtml(crew.role)}</li>
        <li>${ratingLine}</li>
      </ul>
      <p class="market-summary">${escapeHtml(crew.summary)}</p>
      ${crew.isDemo ? demoOnlyButton("Fake Demo Only") : `<button class="primary-button" type="button" data-auth-action="request crew services" data-deal-request data-deal-type="crew_service" data-listing-type="crew" data-listing-id="${escapeHtml(crew.id || "")}" data-listing-name="${escapeHtml(crew.role || crew.name || "Crew service")}" data-provider-id="${escapeHtml(crew.ownerId || "")}" data-provider-name="${escapeHtml(crew.name || "Provider")}">Request Crew</button>`}
    </article>
  `;
}

function materialRequestCard(request) {
  const materials = request.materials || [{ material: request.material, quantity: request.quantity, quality: request.quality }];
  const multiMaterial = materials.length > 1;
  const primaryQuantity = formatMaterialQuantity(materials[0] || request);

  return `
    <article class="market-card procurement-card">
      <div class="card-top">
        <h2>${multiMaterial ? "Multi-Material Request" : escapeHtml(materials[0].material)}</h2>
        <div class="card-tags">
          ${request.isDemo ? demoBadge() : ""}
          <span class="tag">${multiMaterial ? `${materials.length} Items` : escapeHtml(primaryQuantity)}</span>
        </div>
      </div>
      <div class="price-line">
        <strong>${escapeHtml(request.price)}</strong>
      </div>
      <div class="config-summary">
        ${materials.map((m) => `
          <div class="config-summary-line">
            <strong>${escapeHtml(m.material)}</strong>
            <span>${escapeHtml(formatMaterialQuantity(m))} (${escapeHtml(m.quality || "Any")})</span>
          </div>
        `).join("")}
      </div>
      <ul class="meta-list">
        <li>Delivery: ${escapeHtml(request.location || "Open")}</li>
        <li>Needed by: ${escapeHtml(request.neededBy || "Flexible")}</li>
        <li>Posted by: ${escapeHtml(request.postedBy)}</li>
      </ul>
      <div class="card-actions">
        ${request.isDemo ? demoOnlyButton("Fake Demo Only") : `<button class="secondary-button" type="button" data-auth-action="offer material fulfillment" data-deal-request data-deal-type="material_order" data-listing-type="material" data-listing-id="${escapeHtml(request.id || "")}" data-listing-name="${escapeHtml(multiMaterial ? "Multi-Material Request" : materials[0].material || "Material request")}" data-provider-id="${escapeHtml(request.requesterId || "")}" data-provider-name="${escapeHtml(request.postedBy || "Requester")}">Offer Fulfillment</button>`}
      </div>
    </article>
  `;
}

function formatMaterialQuantity(item) {
  const rawQuantity = String(item?.quantity || "").trim();
  if (item?.anyQuantity || normalizeFilterValue(rawQuantity) === "any quantity" || !rawQuantity) {
    return "Any quantity";
  }
  return rawQuantity.includes("SCU") ? rawQuantity : `${rawQuantity} SCU`;
}

function marketplaceShipCapabilities(ship) {
  const capabilities = [
    ship.role,
    Number(ship.cargoScu || ship.vehicle?.scu || 0) ? `${Number(ship.cargoScu || ship.vehicle?.scu).toLocaleString()} SCU` : "",
    hasMedicalCapability(ship) ? "Medical" : "",
    ship.hangarServices?.length ? "Hangar services" : "",
    ship.pilotIncluded ? "Pilot included" : "",
    ...(ship.capabilities || []),
  ].filter(Boolean);

  return uniqueSorted(capabilities).slice(0, 5);
}

function hasMedicalCapability(ship) {
  return normalizeFilterValue(ship.role).includes("medical") || normalizeFilterValue(ship.ship).includes("apollo") || Boolean(ship.medical);
}

function isShipAvailable(ship) {
  return Boolean(ship.dates?.length) && !normalizeFilterValue(ship.availabilityStatus).includes("unavailable");
}

function availabilityRank(ship) {
  const status = normalizeFilterValue(ship.availabilityStatus);
  if (status.includes("now")) {
    return 0;
  }
  if (status.includes("today") || status === "available") {
    return 1;
  }
  if (status.includes("tomorrow") || status.includes("limited")) {
    return 2;
  }
  return 3;
}

function starRating(rating) {
  const rounded = Math.round(Number(rating || 0));
  return `${"★".repeat(Math.max(0, Math.min(5, rounded)))}${"☆".repeat(Math.max(0, 5 - rounded))}`;
}

function ratingSummaryLine(userId, fallbackRating = 0, fallbackDeals = 0) {
  const stats = userId ? ratingStats[userId] : null;
  const rating = Number(stats?.averageRating || fallbackRating || 0);
  const dealCount = Number(stats?.ratedDeals || fallbackDeals || 0);
  if (!dealCount) {
    return "No rated deals yet";
  }
  return `${starRating(rating)} ${rating.toFixed(1)} / 5 &middot; ${dealCount.toLocaleString()} deals`;
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
  availabilityForm.querySelector("button[type='submit']").disabled = ships.length === 0;

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
  if (authState.user) {
    ownerForm.elements.owner.value = preferredDisplayName(authState.user);
  }
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
  const targetShips = availabilityTargetShips(index);
  if (!targetShips.length) {
    return;
  }

  availabilityShipIndex = index;
  availabilityView = "week";
  availabilityCursor = startOfDay(new Date());
  availabilityDraft = new Map();
  sharedAvailabilityDates(targetShips)
    .filter((date) => !isPastAvailabilityKey(date))
    .forEach((date) => availabilityDraft.set(date, "available"));
  availabilityModalTitle.textContent = index === "all"
    ? "All fleet ships availability"
    : `${targetShips[0].ship} availability`;
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

function openCrewPostingModal() {
  if (!canCreatePosting(authState.user)) {
    showAuthPrompt();
    return;
  }

  crewPostingForm.reset();
  crewPostingName.value = preferredDisplayName(authState.user);
  updateCrewPostingPayUI();
  crewPostingModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeCrewPostingModal() {
  crewPostingModal.classList.add("is-hidden");
  if (
    ownerConfiguratorModal.classList.contains("is-hidden") &&
    removeShipModal.classList.contains("is-hidden") &&
    availabilityModal.classList.contains("is-hidden")
  ) {
    document.body.classList.remove("modal-open");
  }
}

function updateCrewPostingPayUI() {
  const isFlat = crewPostingPayType.value === "flat";
  const labelText = crewPostingPayValueLabel.querySelector(".label-text");
  if (labelText) {
    labelText.textContent = isFlat ? "Rate (UEC / hour)" : "Pay Cut (%)";
  }
  crewPostingPayValue.placeholder = isFlat ? "5,000" : "15";
  
  if (isFlat) {
    formatCreditInput(crewPostingPayValue);
  } else {
    crewPostingPayValue.value = crewPostingPayValue.value.replace(/[^0-9]/g, "");
  }
}

function openMaterialRequestModal() {
  if (!canCreatePosting(authState.user)) {
    showAuthPrompt();
    return;
  }

  materialRequestForm.reset();
  materialRequestName.value = preferredDisplayName(authState.user);
  updateMaterialLocationOptions();
  materialLineItemsContainer.innerHTML = "";
  addMaterialLineItem();
  updateMaterialPaymentUI();
  materialRequestModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeMaterialRequestModal() {
  materialRequestModal.classList.add("is-hidden");
  if (
    ownerConfiguratorModal.classList.contains("is-hidden") &&
    removeShipModal.classList.contains("is-hidden") &&
    availabilityModal.classList.contains("is-hidden") &&
    crewPostingModal.classList.contains("is-hidden")
  ) {
    document.body.classList.remove("modal-open");
  }
}

function updateMaterialNameOptions() {
  setDatalistOptions(materialNameOptionsList, materialNameOptions);
}

function updateMaterialLocationOptions() {
  setDatalistOptions(
    materialLocationOptionsList,
    uniqueSorted(materialLocationOptions.map((location) => location.location)),
  );
}

function setDatalistOptions(datalist, options) {
  datalist.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}"></option>`)
    .join("");
}

function addMaterialLineItem() {
  const row = document.createElement("div");
  row.className = "material-line-item";
  row.innerHTML = `
    <label>
      Ore / Material
      <input name="material" list="material-name-options" required placeholder="Type or choose material" />
      <small class="material-price-hint">Select a material to see average sell price.</small>
    </label>
    <label>
      Qty (SCU)
      <input name="quantity" type="number" min="1" step="0.1" required placeholder="10" />
    </label>
    <label class="check material-any-quantity-label">
      <input class="material-any-quantity" type="checkbox" name="anyQuantity" />
      Any quantity
    </label>
    <label>
      Quality
      <input name="quality" type="text" placeholder="e.g. 735+" />
    </label>
    <button class="icon-button remove-line" type="button" aria-label="Remove material line">&times;</button>
  `;

  row.querySelector(".remove-line").addEventListener("click", () => {
    if (materialLineItemsContainer.children.length > 1) {
      row.remove();
    }
  });

  materialLineItemsContainer.appendChild(row);
  updateMaterialQuantityMode(row);
  updateMaterialPriceHint(row);
}

function updateMaterialPriceHints() {
  materialLineItemsContainer.querySelectorAll(".material-line-item").forEach(updateMaterialPriceHint);
}

function updateMaterialPriceHint(row) {
  if (!row) {
    return;
  }

  const material = row.querySelector("[name='material']").value;
  const quality = row.querySelector("[name='quality']").value;
  const hint = row.querySelector(".material-price-hint");
  const gamePrice = materialAverageSellPrice(material);
  const playerPrice = materialPlayerPostingAverage(material, quality);

  if (!material) {
    hint.textContent = "Select a material to see average sell price.";
    return;
  }

  hint.innerHTML = [
    gamePrice
      ? `Game avg sell: ${formatCredits(gamePrice.averageSellPrice)} UEC / SCU (${gamePrice.pricePoints.toLocaleString()} locations)`
      : "No current game sell average available.",
    playerPrice
      ? `Player avg: ${formatCredits(playerPrice.averagePrice)} UEC / SCU for ${playerPrice.bucketLabel} quality (${playerPrice.usedCount}/${playerPrice.totalCount} posts, outliers excluded)`
      : playerBenchmarkMissingLabel(material, quality),
  ].map(escapeHtml).join("<br>");
}

function playerBenchmarkMissingLabel(material, quality) {
  const bucket = materialQualityBucket(quality);
  return bucket === null
    ? "Enter quality to see matching player posting average."
    : `No player posting average yet for ${materialQualityBucketLabel(bucket)} quality.`;
}

function materialAverageSellPrice(materialName) {
  const exact = materialSellPriceByName.get(materialName);
  if (exact) {
    return exact;
  }

  const normalizedName = normalizeMaterialName(materialName);
  return Array.from(materialSellPriceByName.entries())
    .find(([name]) => normalizeMaterialName(name) === normalizedName)?.[1] || null;
}

function normalizeMaterialName(value) {
  return normalizeFilterValue(String(value || "").replace(/\s*\([^)]*\)\s*/g, " "));
}

function materialPlayerPostingAverage(materialName, quality) {
  const normalizedMaterial = normalizeMaterialName(materialName);
  const bucket = materialQualityBucket(quality);

  if (!normalizedMaterial || bucket === null) {
    return null;
  }

  const prices = materialRequests
    .flatMap((request) => materialPostingPricePoints(request, normalizedMaterial, bucket));
  const filteredPrices = filterMaterialPriceOutliers(prices);

  if (!filteredPrices.length) {
    return null;
  }

  const averagePrice = Math.round(filteredPrices.reduce((total, price) => total + price, 0) / filteredPrices.length);
  return {
    averagePrice,
    bucketLabel: materialQualityBucketLabel(bucket),
    totalCount: prices.length,
    usedCount: filteredPrices.length,
  };
}

function materialPostingPricePoints(request, normalizedMaterial, bucket) {
  const materials = request.materials || [{ material: request.material, quantity: request.quantity, quality: request.quality }];
  if (materials.length !== 1) {
    return [];
  }

  const item = materials[0];
  if (normalizeMaterialName(item.material) !== normalizedMaterial || materialQualityBucket(item.quality) !== bucket) {
    return [];
  }

  const price = materialRequestPricePerScu(request, item);
  return price > 0 ? [price] : [];
}

function materialRequestPricePerScu(request, item) {
  const price = parseCredits(request.price);

  if (!price) {
    return 0;
  }

  if (normalizeFilterValue(request.price).includes("scu")) {
    return price;
  }

  const quantity = parseMaterialQuantityValue(item);
  return quantity > 0 ? Math.round(price / quantity) : 0;
}

function parseMaterialQuantityValue(item) {
  if (item?.anyQuantity) {
    return 0;
  }

  return Number(String(item?.quantity || "").replace(/[^0-9.]/g, "")) || 0;
}

function materialQualityBucket(quality) {
  const match = String(quality || "").match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  return Math.floor(Number(match[0]) / 50) * 50;
}

function materialQualityBucketLabel(bucket) {
  return `${bucket}+`;
}

function filterMaterialPriceOutliers(prices) {
  if (prices.length < 4) {
    return prices;
  }

  const sortedPrices = [...prices].sort((first, second) => first - second);
  const q1 = percentile(sortedPrices, 0.25);
  const q3 = percentile(sortedPrices, 0.75);
  const iqr = q3 - q1;

  if (iqr === 0) {
    return sortedPrices;
  }

  const lowerBound = q1 - (iqr * 1.5);
  const upperBound = q3 + (iqr * 1.5);
  return sortedPrices.filter((price) => price >= lowerBound && price <= upperBound);
}

function percentile(sortedValues, percentileValue) {
  const index = (sortedValues.length - 1) * percentileValue;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  return sortedValues[lowerIndex] + ((sortedValues[upperIndex] - sortedValues[lowerIndex]) * (index - lowerIndex));
}

function updateMaterialQuantityMode(row) {
  if (!row) {
    return;
  }

  const anyQuantity = row.querySelector(".material-any-quantity").checked;
  const quantityInput = row.querySelector("[name='quantity']");
  quantityInput.disabled = anyQuantity;
  quantityInput.required = !anyQuantity;
  quantityInput.placeholder = anyQuantity ? "Any" : "10";
  if (anyQuantity) {
    quantityInput.value = "";
  }
}

function updateMaterialPaymentUI() {
  const isPerScu = materialPaymentType.value === "perscu";
  const labelText = materialPaymentValueLabel.querySelector(".label-text");
  if (labelText) {
    labelText.textContent = isPerScu ? "Payment / SCU (UEC)" : "Total Payment (UEC)";
  }
  materialPaymentValue.placeholder = isPerScu ? "1,500" : "50,000";
  formatCreditInput(materialPaymentValue);
}

async function saveAvailabilityChanges() {
  const targetShips = availabilityTargetShips(availabilityShipIndex);
  if (!targetShips.length) {
    closeAvailabilityModal();
    return;
  }

  const dates = uniqueSorted(
    Array.from(availabilityDraft.entries())
      .filter(([, status]) => status === "available")
      .map(([date]) => date)
      .filter((date) => !isPastAvailabilityKey(date)),
  );

  availabilitySave.disabled = true;
  availabilitySave.textContent = "Saving...";

  try {
    const savedListings = await Promise.all(
      targetShips.map((ship) => saveShipAvailability(ship, dates)),
    );
    savedListings.forEach(({ originalIndex, listing }) => {
      ships[originalIndex] = listing;
    });
    closeAvailabilityModal();
    renderFleet();
    renderCalendar();
    renderShipMarketplace();
    renderOwnerSchedule();
    renderCalendarFilterOptions();
    updateFilterSummary();
  } catch (error) {
    dataStatus.shipListings.error = error instanceof Error ? error.message : "Availability could not be saved";
    renderFleet();
  } finally {
    availabilitySave.disabled = false;
    availabilitySave.textContent = "Save availability";
  }
}

async function saveShipAvailability(ship, dates) {
  const originalIndex = ships.indexOf(ship);
  const updatedListing = { ...ship, dates };

  if (ship.isDemo) {
    return { originalIndex, listing: updatedListing };
  }

  const savedListing = await saveShipListing(updatedListing);
  return { originalIndex, listing: savedListing };
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
      const isPast = isPastAvailabilityDate(date);
      const status = isPast ? "unavailable" : getAvailabilityDateStatus(dateKey);
      const statusLabel = availabilityStatusLabel(status);
      const mutedClass = availabilityView === "month" && date.getMonth() !== visibleMonth ? " is-muted" : "";
      const todayClass = dateKey === todayKey ? " is-today" : "";
      const pastClass = isPast ? " is-past" : "";
      const disabledAttribute = isPast || status === "rented" ? " disabled" : "";
      return `
        <button class="availability-date ${status}${mutedClass}${todayClass}${pastClass}" type="button" data-availability-date="${dateKey}" aria-label="${escapeHtml(date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}: ${statusLabel}"${disabledAttribute}>
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
  const visibleDays = availabilityView === "month"
    ? days.filter((date) => date.getMonth() === availabilityCursor.getMonth())
    : days;
  return visibleDays.filter((date) => !isPastAvailabilityDate(date) && getAvailabilityDateStatus(dateToKey(date)) !== "rented");
}

function getAvailabilityDateStatus(dateKey) {
  if (isAvailabilityDateRented(dateKey)) {
    return "rented";
  }
  return availabilityDraft.get(dateKey) === "available" ? "available" : "unavailable";
}

function availabilityStatusLabel(status) {
  return {
    available: "Available",
    rented: "Rented",
    unavailable: "Unavailable",
  }[status] || "Unavailable";
}

function isAvailabilityDateRented(dateKey) {
  const targetShips = availabilityTargetShips(availabilityShipIndex);
  return targetShips.some((ship) =>
    bookings.some((booking) => booking.date === dateKey && booking.ship === ship.ship),
  );
}

function availabilityTargetShips(index = availabilityShipIndex) {
  if (index === "all") {
    return ships;
  }

  const ship = ships[Number(index)];
  return ship ? [ship] : [];
}

function sharedAvailabilityDates(targetShips) {
  if (!targetShips.length) {
    return [];
  }

  if (targetShips.length === 1) {
    return targetShips[0].dates || [];
  }

  const [firstShip, ...remainingShips] = targetShips;
  return (firstShip.dates || []).filter((date) =>
    remainingShips.every((ship) => (ship.dates || []).includes(date)),
  );
}

function isPastAvailabilityDate(date) {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

function isPastAvailabilityKey(dateKey) {
  return isPastAvailabilityDate(parseDateKey(dateKey));
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
  removeShipMessage.textContent = ship.isDemo
    ? `Remove the fake demo listing for ${ship.ship} from this browser?`
    : `Are you sure you want to remove ${ship.ship} from your fleet?`;
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
    const shipName = normalizeConfigShipName(vehicle?.name || ownerShipInput.value);
    const headCapacity = salvageHeadCounts.get(shipName) || 0;
    return {
      type: "salvage",
      headCapacity,
      headSlots: collectHeadSlotConfiguration("salvageHeads", headSlotNames(headCapacity)),
    };
  }

  if (configType === "mining") {
    const shipName = normalizeConfigShipName(vehicle?.name || ownerShipInput.value);
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

function equipmentSlotMarkup({ slot, inputName, options, heading }) {
  const slotLabel = headSlotLabel(slot);
  return `
    <div class="equipment-slot">
      <strong>${escapeHtml(heading || `${slotLabel} head`)}</strong>
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
  const name = normalizeConfigShipName(typeof vehicleOrName === "string" ? vehicleOrName : vehicleOrName?.name);
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
    const shipName = normalizeConfigShipName(typeof vehicle === "string" ? vehicle : vehicle?.name || ownerShipInput.value);
    const headCount = salvageHeadCounts.get(shipName) || 0;
    salvageConfigDescription.textContent = "";
    salvageHeadGrid.innerHTML = headSlotNames(headCount).map((slot) => equipmentSlotMarkup({
      slot,
      inputName: "salvageHeads",
      heading: `${headSlotLabel(slot)} Salvage Heads Available`,
      options: salvageHeadOptions.map((head) => ({ value: head, label: head })),
    })).join("");
  } else {
    salvageHeadGrid.innerHTML = "";
  }

  if (configType === "mining") {
    const shipName = normalizeConfigShipName(typeof vehicle === "string" ? vehicle : vehicle?.name || ownerShipInput.value);
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
    isConcept: Boolean(Number(vehicle.is_concept || 0)),
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
  const selectedShipMarketManufacturer = shipMarketManufacturerSelect.value;
  const selectedShipRole = shipRoleFilter.value;
  ownerShipOptions.innerHTML = [
    `<option value="">Select ship</option>`,
    ...filteredVehicles(ownerManufacturerSelect.value).map(
      (vehicle) => `<option value="${vehicle.id}">${escapeHtml(vehicle.name)}</option>`,
    ),
  ].join("");

  if (Array.from(ownerShipOptions.options).some((option) => option.value === selectedOwnerShip)) {
    ownerShipOptions.value = selectedOwnerShip;
  }
  if (Array.from(shipMarketManufacturerSelect.options).some((option) => option.value === selectedShipMarketManufacturer)) {
    shipMarketManufacturerSelect.value = selectedShipMarketManufacturer;
  }
  renderShipRoleOptions(selectedShipRole);
}

function renderShipRoleOptions(selectedRole = shipRoleFilter.value) {
  const roles = uniqueSorted([
    ...vehicleCatalog.map((vehicle) => vehicle.role),
    ...ships.map((ship) => ship.role),
  ]);

  shipRoleFilter.innerHTML = [`<option value="">Any role</option>`]
    .concat(roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`))
    .join("");

  if (roles.includes(selectedRole)) {
    shipRoleFilter.value = selectedRole;
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
  const manufacturers = uniqueSorted([
    ...vehicleCatalog.map((vehicle) => vehicle.company),
    ...ships.map((ship) => ship.manufacturer),
  ]);
  const options = [`<option value="">All manufacturers</option>`]
    .concat(manufacturers.map((manufacturer) => `<option value="${escapeHtml(manufacturer)}">${escapeHtml(manufacturer)}</option>`))
    .join("");

  ownerManufacturerSelect.innerHTML = options;
  shipMarketManufacturerSelect.innerHTML = options;
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
  const localPhoto = localShipImagePath(ship.vehicle);
  const fallbackPhoto = ship.vehicle?.photo || "";
  const photo = localPhoto || fallbackPhoto;
  if (!photo) {
    return `<div class="ship-image placeholder">FSX</div>`;
  }

  const fallbackAttr = localPhoto && fallbackPhoto ? ` data-fallback-src="${escapeHtml(fallbackPhoto)}"` : "";
  return `<img class="ship-image" src="${escapeHtml(photo)}" alt="${escapeHtml(ship.ship)}" loading="lazy"${fallbackAttr} onerror="handleShipImageError(this)" />`;
}

function localShipImagePath(vehicle) {
  if (vehicle?.image) {
    return encodeURI(vehicle.image);
  }

  if (vehicle?.slug) {
    return `/ships/${encodeURIComponent(vehicle.slug)}.webp`;
  }

  return "";
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

function syncManualRateInput(period) {
  const input = rateInputs[period];
  formatCreditInput(input);
  const manualRate = parseCredits(input.value);
  if (!manualRate) {
    updateRateCalculator();
    return;
  }

  rateOfferInputs[period].checked = true;
  const basePeriod = rateBasePeriodSelect.value;
  const baseRate = parseCredits(rateBaseInput.value);

  if (!baseRate || period === basePeriod) {
    rateBasePeriodSelect.value = period;
    rateBaseInput.value = formatCreditInputValue(manualRate);
    updateRateCalculator();
    return;
  }

  const convertedRate = convertPeriodRate(baseRate, basePeriod, period);
  if (convertedRate > 0) {
    const rawAdjustment = Math.round((manualRate / convertedRate - 1) * 100);
    const slider = rateAdjustmentInputs[period];
    const min = Number(slider.min || -100);
    const max = Number(slider.max || 100);
    slider.value = String(Math.min(max, Math.max(min, rawAdjustment)));
  }

  updateRateCalculator();
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

function normalizeConfigShipName(value) {
  return normalizeShipName(value)
    .replace(/\bbest in show edition\b/g, "")
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

function parseDateKey(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year, month - 1, day);
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

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
renderShipMarketplace();
renderCrewMarketplace();
renderMaterialRequests();
renderOwnerSchedule();
renderCalendarFilterOptions();
updateFilterSummary();
setActiveTab(panelFromPath(window.location.pathname));
showAuthErrorFromUrl();
loadVehicles();
loadHangarServices();
loadMaterialOptions();
loadSession();
loadRatingStats();
loadShipListings();
loadCrewListings();
loadMaterialRequests();
