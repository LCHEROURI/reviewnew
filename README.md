# Lead Atlas

Lead Atlas is a mortgage lead generation dashboard with a production backend boundary. It lets a loan consultant search by ZIP code, review qualified refinance and purchase opportunities, filter by lead type, sort results, inspect property and mortgage details, save searches, and export the current lead set to CSV.

## Files

- `index.html` - application shell and accessible dashboard structure
- `styles.css` - minimalist responsive interface styling
- `app.js` - ZIP validation, backend lead search, filtering, sorting, details, saved searches, and CSV export
- `api/leads.js` - production lead-search API route
- `api/lead-service.js` - provider integration, lead normalization, qualification logic, and optional demo mode
- `test/lead-service.test.js` - backend behavior tests

## Production Data

Production search requires a compliant lead-data provider. Configure:

- `LEAD_DATA_PROVIDER_URL` - endpoint that accepts a `zip` query parameter and returns property or lead records
- `LEAD_DATA_PROVIDER_KEY` - bearer token for that provider

The API accepts provider payloads shaped as an array or as `{ leads: [...] }`, `{ properties: [...] }`, or `{ records: [...] }`, then normalizes records into the app's lead format.

For internal UI review only, set:

- `LEAD_ATLAS_DEMO_MODE=true`

Demo mode returns deterministic generated leads and is intentionally marked in the backend response. Do not use demo mode for real production lead outreach.

## Notes

Run tests with:

```bash
node --test test/lead-service.test.js
```

A full production deployment should also add Supabase Auth, Row Level Security, provider-specific compliance review, audit logging, and a background job pipeline for longer-running aggregation.
