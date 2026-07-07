const leadData = {};

let activeZip = "30309";
let activeLeadIds = [];
let filteredLeads = [];
let detailSelectionCleared = false;
const productionLeadCache = {};
let recentSearches = JSON.parse(localStorage.getItem("lead-atlas-recent") || '["30309","78704","90210"]');
let savedSearches = JSON.parse(localStorage.getItem("lead-atlas-saved") || "[]");

const zipInput = document.querySelector("#zipInput");
const zipForm = document.querySelector("#zipForm");
const searchMessage = document.querySelector("#searchMessage");
const leadList = document.querySelector("#leadList");
const leadDetail = document.querySelector("#leadDetail");
const resultMeta = document.querySelector("#resultMeta");
const resultsTitle = document.querySelector("#resultsTitle");
const qualifiedCount = document.querySelector("#qualifiedCount");
const averageEquity = document.querySelector("#averageEquity");
const priorityCount = document.querySelector("#priorityCount");
const sortSelect = document.querySelector("#sortSelect");
const loadingState = document.querySelector("#loadingState");
const recentSearchesEl = document.querySelector("#recentSearches");

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function shortDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

function badgeClass(type) {
  return type.toLowerCase().replace(/\s+/g, "-");
}

function getLeadsForZip(zip) {
  return productionLeadCache[zip] || [];
}

function getSelectedTypes() {
  return [...document.querySelectorAll('.filter-group input[type="checkbox"]:checked')].map((input) => input.value);
}

function sortLeads(leads) {
  const sorted = [...leads];
  const sort = sortSelect.value;
  if (sort === "value-desc") sorted.sort((a, b) => b.value - a.value);
  if (sort === "equity-desc") sorted.sort((a, b) => b.equity - a.equity);
  if (sort === "sale-newest") sorted.sort((a, b) => new Date(b.lastSaleDate) - new Date(a.lastSaleDate));
  if (sort === "sale-oldest") sorted.sort((a, b) => new Date(a.lastSaleDate) - new Date(b.lastSaleDate));
  return sorted;
}

function getVisibleLeads() {
  const selectedTypes = getSelectedTypes();
  const leads = getLeadsForZip(activeZip);
  return sortLeads(leads.filter((lead) => lead.types.some((type) => selectedTypes.includes(type))));
}

function setSearchMessage(message, tone = "") {
  searchMessage.textContent = message;
  searchMessage.className = `search-message ${tone}`.trim();
}

function renderRecentSearches() {
  const savedSuffix = savedSearches.length ? ` · ${savedSearches.length} saved` : "";
  recentSearchesEl.innerHTML = recentSearches.map((zip) => {
    const count = getLeadsForZip(zip).length;
    return `
      <button class="recent-item" type="button" data-recent-zip="${zip}">
        <strong>${zip}</strong>
        <span>${count ? `${count} leads` : "Not loaded"}${zip === activeZip ? " · active" : ""}${savedSearches.includes(zip) ? savedSuffix : ""}</span>
      </button>
    `;
  }).join("");
}

function renderMetrics() {
  const leads = filteredLeads;
  const totalEquity = leads.reduce((sum, lead) => sum + lead.equity, 0);
  qualifiedCount.textContent = leads.length;
  averageEquity.textContent = leads.length ? currency(totalEquity / leads.length) : "$0";
  priorityCount.textContent = leads.filter((lead) => lead.priority === "High").length;
  resultMeta.textContent = `${leads.length} ${leads.length === 1 ? "lead" : "leads"}`;
  resultsTitle.textContent = leads.length ? `Results for ${activeZip}` : "No matching leads";
}

function renderLeadList() {
  if (!filteredLeads.length) {
    leadList.innerHTML = `<div class="empty-results">No provider-backed leads are loaded yet. Configure the production API provider, or enable backend demo mode for internal review only.</div>`;
    activeLeadIds = [];
    leadDetail.innerHTML = `<div class="detail-empty"><p>Select a lead to review property, mortgage, tax, and source details.</p></div>`;
    return;
  }

  const visibleLeadIds = new Set(filteredLeads.map((lead) => lead.id));
  activeLeadIds = activeLeadIds.filter((id) => visibleLeadIds.has(id));

  if (!activeLeadIds.length && !detailSelectionCleared) {
    activeLeadIds = [filteredLeads[0].id];
  }

  leadList.innerHTML = filteredLeads.map((lead) => `
    <article class="lead-card ${activeLeadIds.includes(lead.id) ? "active" : ""}">
      <div class="lead-card-header">
        <div>
          <h4>${lead.address}</h4>
          <p>${lead.city}, ${lead.state} ${lead.zip} · ${lead.homeowner}</p>
        </div>
        <div class="badge-row">${lead.types.map((type) => `<span class="badge ${badgeClass(type)}">${type}</span>`).join("")}</div>
      </div>
      <div class="lead-stats">
        <div><span>Value</span><strong>${currency(lead.value)}</strong></div>
        <div><span>Last Sale</span><strong>${shortDate(lead.lastSaleDate)}</strong></div>
        <div><span>Loan</span><strong>${lead.loanBalance ? currency(lead.loanBalance) : "None"}</strong></div>
        <div><span>Equity</span><strong>${currency(lead.equity)}</strong></div>
      </div>
      <p class="reason-line">${lead.reason}</p>
      <button class="lead-action" type="button" data-lead-id="${lead.id}">${activeLeadIds.includes(lead.id) ? "Already Open" : "Open Side by Side"}</button>
    </article>
  `).join("");
}

function renderLeadDetailCard(lead) {
  return `
    <article class="detail-card">
      <div class="detail-card-header">
        <div>
          <div class="section-title">Lead Detail</div>
          <h3>${lead.address}</h3>
        </div>
        <button class="detail-close" type="button" data-close-lead-id="${lead.id}" aria-label="Close ${lead.address} detail">Close</button>
      </div>
      <p class="detail-subtitle">${lead.city}, ${lead.state} ${lead.zip} · ${lead.homeowner}</p>
      <div class="badge-row">${lead.types.map((type) => `<span class="badge ${badgeClass(type)}">${type}</span>`).join("")}</div>

      <section class="detail-section">
        <div class="section-title">Property Facts</div>
        <div class="detail-grid">
          <div class="detail-stat"><span>Type</span><strong>${lead.property.type}</strong></div>
          <div class="detail-stat"><span>Built</span><strong>${lead.property.yearBuilt}</strong></div>
          <div class="detail-stat"><span>Square Feet</span><strong>${lead.property.sqft.toLocaleString()}</strong></div>
          <div class="detail-stat"><span>Lot</span><strong>${lead.property.lot}</strong></div>
        </div>
      </section>

      <section class="detail-section">
        <div class="section-title">Mortgage Details</div>
        <div class="detail-grid">
          <div class="detail-stat"><span>Lender</span><strong>${lead.mortgage.lender}</strong></div>
          <div class="detail-stat"><span>Rate</span><strong>${lead.mortgage.rate}</strong></div>
          <div class="detail-stat"><span>Loan Type</span><strong>${lead.mortgage.loanType}</strong></div>
          <div class="detail-stat"><span>Maturity</span><strong>${lead.mortgage.maturity}</strong></div>
        </div>
      </section>

      <section class="detail-section">
        <div class="section-title">Tax Assessment History</div>
        <div class="history-list">
          ${lead.taxes.map((tax) => `
            <div class="history-row">
              <strong>${tax.year}</strong>
              <span>Assessed ${currency(tax.assessed)}</span>
              <span>${currency(tax.taxes)}</span>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="detail-section">
        <div class="section-title">Original Sources</div>
        <div class="source-list">
          ${lead.sources.map((source) => `<a class="source-link" href="#" aria-label="${source} source link"><span>${source}</span><span aria-hidden="true">Open</span></a>`).join("")}
        </div>
      </section>
    </article>
  `;
}

function renderDetail() {
  const openLeads = activeLeadIds
    .map((id) => filteredLeads.find((item) => item.id === id))
    .filter(Boolean);

  if (!openLeads.length) {
    leadDetail.innerHTML = `<div class="detail-empty"><p>Select up to two leads to keep their details open side by side.</p></div>`;
    return;
  }

  leadDetail.innerHTML = `<div class="detail-stack">${openLeads.map(renderLeadDetailCard).join("")}</div>`;
}

function openLeadDetail(leadId) {
  if (activeLeadIds.includes(leadId)) return;
  detailSelectionCleared = false;
  activeLeadIds = [...activeLeadIds, leadId].slice(-2);
}

function renderDashboard() {
  filteredLeads = getVisibleLeads();
  renderMetrics();
  renderLeadList();
  renderDetail();
  renderRecentSearches();
}

function addRecent(zip) {
  recentSearches = [zip, ...recentSearches.filter((item) => item !== zip)].slice(0, 6);
  localStorage.setItem("lead-atlas-recent", JSON.stringify(recentSearches));
}

async function fetchLeadSearch(zip) {
  const response = await fetch(`/api/leads?zip=${encodeURIComponent(zip)}`);
  const payload = await response.json().catch(() => ({}));
  if (response.status === 404) {
    throw new Error("Production API is not running. Start this with Vercel dev or deploy it with the required lead-data provider environment variables.");
  }
  if (!response.ok && !payload.setupNeeded) {
    throw new Error(payload.error || "Lead search failed.");
  }
  return payload;
}

function performSearch(zip) {
  activeZip = zip;
  activeLeadIds = [];
  detailSelectionCleared = false;
  zipInput.value = zip;
  addRecent(zip);
  loadingState.hidden = false;
  leadList.setAttribute("aria-busy", "true");

  window.setTimeout(async () => {
    loadingState.hidden = true;
    leadList.removeAttribute("aria-busy");
    try {
      const result = await fetchLeadSearch(zip);
      productionLeadCache[zip] = result.leads || [];
      setSearchMessage(result.message || `Found ${productionLeadCache[zip].length} leads for ${zip}.`, result.setupNeeded ? "error" : "success");
      renderDashboard();
    } catch (error) {
      productionLeadCache[zip] = [];
      const message = error.message.includes("Unexpected token") || error.message.includes("Failed to fetch")
        ? "Production API is not running. Start this with Vercel dev or deploy it with the required lead-data provider environment variables."
        : error.message;
      setSearchMessage(message, "error");
      renderDashboard();
    }
  }, 420);
}

function exportCsv() {
  const rows = [
    ["Property Address", "City", "State", "ZIP", "Homeowner", "Estimated Value", "Last Sale Date", "Last Sale Price", "Outstanding Loan", "Estimated Equity", "Lead Type", "Reason"],
    ...filteredLeads.map((lead) => [
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      lead.homeowner,
      lead.value,
      lead.lastSaleDate,
      lead.lastSalePrice,
      lead.loanBalance,
      lead.equity,
      lead.types.join(" | "),
      lead.reason
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lead-atlas-${activeZip}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

zipForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const zip = zipInput.value.trim();
  if (!/^\d{5}$/.test(zip)) {
    setSearchMessage("Please enter a valid 5-digit ZIP code.", "error");
    zipInput.focus();
    return;
  }
  performSearch(zip);
});

document.querySelectorAll('.filter-group input[type="checkbox"]').forEach((input) => {
  input.addEventListener("change", renderDashboard);
});

sortSelect.addEventListener("change", renderDashboard);

leadList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lead-id]");
  if (!button) return;
  openLeadDetail(button.dataset.leadId);
  renderLeadList();
  renderDetail();
});

leadDetail.addEventListener("click", (event) => {
  const button = event.target.closest("[data-close-lead-id]");
  if (!button) return;
  activeLeadIds = activeLeadIds.filter((id) => id !== button.dataset.closeLeadId);
  detailSelectionCleared = activeLeadIds.length === 0;
  renderLeadList();
  renderDetail();
});

recentSearchesEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-recent-zip]");
  if (button) performSearch(button.dataset.recentZip);
});

document.querySelector("#saveSearchBtn").addEventListener("click", () => {
  savedSearches = [activeZip, ...savedSearches.filter((zip) => zip !== activeZip)].slice(0, 8);
  localStorage.setItem("lead-atlas-saved", JSON.stringify(savedSearches));
  setSearchMessage(`Saved ${activeZip} to your search list.`, "success");
  renderRecentSearches();
});

document.querySelector("#exportBtn").addEventListener("click", exportCsv);

zipInput.value = activeZip;
renderDashboard();
setSearchMessage("Production mode is ready. Search requires the backend API and a compliant lead-data provider.", "");
