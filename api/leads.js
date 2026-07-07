const { searchLeads } = require("./lead-service");

function sendJson(response, status, payload) {
  response.setHeader("Content-Type", "application/json");
  response.status(status).json(payload);
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const zip = request.method === "GET"
    ? request.query?.zip
    : request.body?.zip;

  try {
    const result = await searchLeads({ zip });
    sendJson(response, result.setupNeeded ? 503 : 200, result);
  } catch (error) {
    sendJson(response, 400, {
      error: error.message || "Lead search failed.",
      leads: []
    });
  }
};
