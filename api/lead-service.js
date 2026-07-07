const DEFAULT_MARKETS = {
  "19958": { city: "Lewes", state: "DE" },
  "30309": { city: "Atlanta", state: "GA" },
  "78704": { city: "Austin", state: "TX" },
  "90210": { city: "Beverly Hills", state: "CA" },
  "10013": { city: "New York", state: "NY" }
};

function assertZip(zip) {
  if (!/^\d{5}$/.test(String(zip || ""))) {
    throw new Error("Please enter a valid 5-digit ZIP code.");
  }
}

function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function textValue(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function qualifyLead(record, equity, loanBalance, lastSaleDate) {
  const suppliedTypes = record.lead_type || record.leadType || record.types;
  if (Array.isArray(suppliedTypes) && suppliedTypes.length) return suppliedTypes;

  const types = [];
  const saleYear = Number(String(lastSaleDate || "").slice(0, 4));
  const currentYear = new Date().getFullYear();
  if (loanBalance > 0 && (equity > 150000 || currentYear - saleYear >= 3)) types.push("Refinance");
  if (!loanBalance || currentYear - saleYear <= 2) types.push("New Mortgage");
  if (equity > 250000) types.push("General");
  return types.length ? [...new Set(types)] : ["General"];
}

function normalizeProviderRecord(record, zip) {
  const value = numberValue(record.estimated_property_value, record.estimatedValue, record.value);
  const loanBalance = numberValue(record.outstanding_loan_amount, record.loanBalance, record.currentLoanBalance);
  const equity = numberValue(record.estimated_equity, record.equity, value - loanBalance);
  const lastSaleDate = textValue(record.last_sale_date, record.lastSaleDate, record.saleDate) || "2024-01-01";
  const city = textValue(record.city, record.property_city) || DEFAULT_MARKETS[zip]?.city || "";
  const state = textValue(record.state, record.property_state) || DEFAULT_MARKETS[zip]?.state || "";
  const sourceUrls = record.source_urls || record.sourceUrls || record.sources || [];

  return {
    id: textValue(record.id, record.external_id, record.parcel_id) || `${zip}-${Math.random().toString(36).slice(2)}`,
    address: textValue(record.property_address, record.address, record.streetAddress),
    city,
    state,
    zip,
    homeowner: textValue(record.homeowner_name, record.ownerName, record.homeowner) || "Owner not listed",
    value,
    lastSaleDate,
    lastSalePrice: numberValue(record.last_sale_price, record.lastSalePrice),
    loanBalance,
    equity,
    types: qualifyLead(record, equity, loanBalance, lastSaleDate),
    reason: textValue(record.reason_for_lead, record.reason) || "Qualified by production provider mortgage and property signals.",
    priority: equity > 300000 ? "High" : "Medium",
    property: {
      type: textValue(record.property_type, record.propertyType) || "Property",
      yearBuilt: numberValue(record.year_built, record.yearBuilt),
      sqft: numberValue(record.square_feet, record.sqft, record.livingArea),
      lot: textValue(record.lot_size, record.lotSize) || "Not recorded"
    },
    mortgage: {
      lender: textValue(record.lender_name, record.lenderName, record.lender) || "Not recorded",
      rate: textValue(record.interest_rate, record.interestRate, record.rate) || "Not recorded",
      loanType: textValue(record.loan_type, record.loanType) || "Not recorded",
      maturity: textValue(record.maturity_date, record.maturityDate) || "Not recorded"
    },
    taxes: Array.isArray(record.taxes) ? record.taxes : [],
    sources: Array.isArray(sourceUrls) ? sourceUrls : []
  };
}

function zipSeed(zip) {
  return zip.split("").reduce((sum, digit, index) => sum + Number(digit) * (index + 3), 0);
}

function demoLeadsForZip(zip) {
  const seed = zipSeed(zip);
  const market = DEFAULT_MARKETS[zip] || { city: "Local Market", state: "US" };
  return ["Harbor View", "Maple Ridge", "Cedar Hollow"].map((street, index) => {
    const value = 385000 + seed * 2700 + index * 146000;
    const loanBalance = index === 1 ? 0 : Math.round(value * (0.48 + index * 0.08));
    return normalizeProviderRecord({
      id: `${zip}-demo-${index + 1}`,
      property_address: `${120 + seed + index * 47} ${street} ${index === 2 ? "Ct" : "Dr"}`,
      city: market.city,
      state: market.state,
      homeowner_name: ["Taylor Morgan", "Jamie Ellis", "Riley Carter"][index],
      estimated_property_value: value,
      last_sale_date: `${2021 + index}-0${index + 3}-${12 + index}`,
      last_sale_price: Math.round(value * (0.72 + index * 0.04)),
      outstanding_loan_amount: loanBalance,
      property_type: ["Single family", "Townhome", "Condo"][index],
      year_built: 1958 + (seed % 45) + index * 5,
      square_feet: 1420 + seed * 7 + index * 430,
      lot_size: index === 2 ? "Condo" : `${(0.12 + index * 0.05).toFixed(2)} acres`,
      lender_name: loanBalance ? "Sample County Lending" : "Not recorded",
      interest_rate: loanBalance ? `${(5.72 + index * 0.31).toFixed(2)}%` : "N/A",
      loan_type: loanBalance ? "30-year fixed" : "N/A",
      maturity_date: loanBalance ? `${2051 + index}-06-01` : "N/A",
      source_urls: ["Prototype assessor feed", "Recorder index sample", "Listing activity sample"]
    }, zip);
  });
}

async function fetchProviderLeads(zip, env, fetchImpl) {
  const url = new URL(env.LEAD_DATA_PROVIDER_URL);
  url.searchParams.set("zip", zip);
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${env.LEAD_DATA_PROVIDER_KEY}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Lead data provider returned ${response.status}.`);
  }
  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : payload.leads || payload.properties || payload.records || [];
  return records.map((record) => normalizeProviderRecord(record, zip));
}

async function searchLeads({ zip, env = process.env, fetchImpl = fetch }) {
  assertZip(zip);

  if (env.LEAD_DATA_PROVIDER_URL && env.LEAD_DATA_PROVIDER_KEY) {
    const leads = await fetchProviderLeads(zip, env, fetchImpl);
    return {
      zip,
      demoMode: false,
      setupNeeded: false,
      message: `Found ${leads.length} production leads for ${zip}.`,
      leads
    };
  }

  if (env.LEAD_ATLAS_DEMO_MODE === "true") {
    const leads = demoLeadsForZip(zip);
    return {
      zip,
      demoMode: true,
      setupNeeded: false,
      message: `Found ${leads.length} demo leads for ${zip}.`,
      leads
    };
  }

  return {
    zip,
    demoMode: false,
    setupNeeded: true,
    message: "Production lead search needs a compliant data provider. Configure LEAD_DATA_PROVIDER_URL and LEAD_DATA_PROVIDER_KEY, or set LEAD_ATLAS_DEMO_MODE=true for internal review only.",
    leads: []
  };
}

module.exports = {
  demoLeadsForZip,
  normalizeProviderRecord,
  searchLeads
};
