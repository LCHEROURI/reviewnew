const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeProviderRecord,
  searchLeads
} = require("../api/lead-service");

test("production search rejects invalid ZIP codes", async () => {
  await assert.rejects(
    () => searchLeads({ zip: "abc12", env: {} }),
    /valid 5-digit ZIP/
  );
});

test("production search does not invent leads when no provider is configured", async () => {
  const result = await searchLeads({ zip: "19958", env: {} });

  assert.equal(result.setupNeeded, true);
  assert.equal(result.leads.length, 0);
  assert.match(result.message, /data provider/i);
});

test("demo mode can return deterministic review leads", async () => {
  const result = await searchLeads({
    zip: "19958",
    env: { LEAD_ATLAS_DEMO_MODE: "true" }
  });

  assert.equal(result.demoMode, true);
  assert.equal(result.leads.length, 3);
  assert.equal(result.leads[0].zip, "19958");
});

test("demo mode keeps property years plausible", async () => {
  const result = await searchLeads({
    zip: "19958",
    env: { LEAD_ATLAS_DEMO_MODE: "true" }
  });

  for (const lead of result.leads) {
    assert.ok(lead.property.yearBuilt >= 1950);
    assert.ok(lead.property.yearBuilt <= new Date().getFullYear());
  }
});

test("provider records normalize into mortgage lead fields", () => {
  const lead = normalizeProviderRecord({
    id: "external-1",
    property_address: "10 Market St",
    city: "Lewes",
    state: "DE",
    homeowner_name: "Alex Owner",
    estimated_property_value: 640000,
    last_sale_date: "2021-06-18",
    last_sale_price: 415000,
    outstanding_loan_amount: 330000,
    property_type: "Single family",
    year_built: 1998,
    square_feet: 2120,
    lot_size: "0.22 acres",
    lender_name: "Coastal Bank",
    interest_rate: "6.18%",
    source_urls: ["https://example.test/source"]
  }, "19958");

  assert.equal(lead.address, "10 Market St");
  assert.equal(lead.homeowner, "Alex Owner");
  assert.equal(lead.equity, 310000);
  assert.deepEqual(lead.types, ["Refinance", "General"]);
  assert.equal(lead.property.sqft, 2120);
  assert.equal(lead.sources[0], "https://example.test/source");
});
