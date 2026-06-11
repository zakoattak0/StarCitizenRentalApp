const ships = [
  {
    owner: "Voss-Actual",
    ship: "C2 Hercules Starlifter",
    role: "Cargo",
    rate: 18000,
    dates: ["2026-06-14", "2026-06-15", "2026-06-18", "2026-06-22"],
    options: ["Cargo pods", "Crew included", "Insurance verified"],
  },
  {
    owner: "ArcMiner",
    ship: "MOLE Carbon Edition",
    role: "Industrial",
    rate: 22000,
    dates: ["2026-06-13", "2026-06-14", "2026-06-21"],
    options: ["Mining lasers", "Upgraded quantum drive", "Insurance verified"],
  },
  {
    owner: "NineTailsNope",
    ship: "Aegis Redeemer",
    role: "Combat",
    rate: 26000,
    dates: ["2026-06-16", "2026-06-17", "2026-06-20"],
    options: ["Crew included", "Insurance verified"],
  },
  {
    owner: "Wayfinder_June",
    ship: "Carrack Expedition",
    role: "Exploration",
    rate: 30000,
    dates: ["2026-06-19", "2026-06-20", "2026-06-23"],
    options: ["Medical bay", "Crew included", "Upgraded quantum drive"],
  },
  {
    owner: "PortTressler_Taxi",
    ship: "Origin 600i Touring",
    role: "Touring",
    rate: 12000,
    dates: ["2026-06-14", "2026-06-24", "2026-06-25"],
    options: ["Crew included", "Insurance verified"],
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
  const dates = String(data.get("dates"))
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);

  ships.unshift({
    owner: data.get("owner"),
    ship: data.get("ship"),
    role: data.get("role"),
    rate: Number(data.get("rate")),
    dates,
    options,
  });

  ownerForm.reset();
  ownerForm.querySelector("[name='rate']").value = 15000;
  renderFleet();
  renderCalendar();
  renderRentalResults();
});

rentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderRentalResults();
});

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
          <div class="card-top">
            <h2>${escapeHtml(ship.ship)}</h2>
            <span class="tag">${escapeHtml(ship.role)}</span>
          </div>
          <ul class="meta-list">
            <li>Owner: ${escapeHtml(ship.owner)}</li>
            <li>Rate: ${ship.rate.toLocaleString()} UEC / hour</li>
            <li>Dates: ${ship.dates.map(formatShortDate).join(", ")}</li>
          </ul>
          <div class="option-line">
            ${ship.options.map((option) => `<span class="chip">${escapeHtml(option)}</span>`).join("")}
          </div>
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
              <div class="card-top">
                <h2>${escapeHtml(ship.ship)}</h2>
                <span class="tag">${ship.rate.toLocaleString()} UEC/hr</span>
              </div>
              <ul class="meta-list">
                <li>Owner: ${escapeHtml(ship.owner)}</li>
                <li>Role: ${escapeHtml(ship.role)}</li>
                <li>Available: ${ship.dates.map(formatShortDate).join(", ")}</li>
              </ul>
              <div class="option-line">
                ${ship.options.map((option) => `<span class="chip">${escapeHtml(option)}</span>`).join("")}
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">No ships match that request yet. Try a wider budget or another date.</div>`;
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
