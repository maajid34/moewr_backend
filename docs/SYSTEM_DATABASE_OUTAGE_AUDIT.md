# System-wide database outage audit — 2026-09-11

## Result

The outage affects shared MongoDB access, not only Energy Projects. Local code repairs are complete; production recovery is NOT verified. No deployment, production data changes, or database migrations were performed.

## Evidence

Direct public API probes saved in `../audit/system-api-live.json` (relative to backend directory):

| Endpoint | Live response | Approximate time |
| --- | --- | --- |
| `/health` | 200 despite database unavailability | 1.9 seconds |
| `/readProjectEnergy/EnergyProject` | 500, Failed to fetch projects | 11.8 seconds |
| `/readProjectWater/waterProject` | 500, Failed to fetch projects | 11.9 seconds |
| `/api/sumaryachievements` | 503, Database temporarily unavailable | 1.8 seconds |
| `/readProjectEvent/Event?page=1&limit=50` | 503, Database temporarily unavailable | 1.8 seconds |

The existing 503 middleware checks the shared Mongoose connection. Earlier summary errors explicitly reported `achievements.find()` buffering timing out after 10,000ms. The 500 requests are consistent with queries waiting on that unavailable connection. Axios reports the API failure; it does not establish why MongoDB could not connect.

A read-only native MongoDB client using this workspace's configured `db_url` connected and passed ping. Collection counts: energyprojects 7, waterprojects 18, achievements 10, events 4, documentfiles 21, inventoryitems 25, assets 1, activities 0. Evidence: `../audit/system-database-local.json`. These results establish that the locally configured database contains data. The hosting URI has not been compared and must not be assumed identical. An empty activities collection can legitimately produce an empty page.

## Defects and repairs

1. Initial MongoDB connection failure previously logged once and left the HTTP server serving database routes indefinitely. Connection initialization now retries after failures; after a successful connection the MongoDB driver manages reconnection.
2. dotenv previously depended on the launch working directory. It now explicitly loads backend/.env, while existing process environment variables retain precedence.
3. Configuration validates the URI inside each guarded connection attempt. Legacy `db_url` remains preferred, followed by `MONGODB_URI`, `MONGO_URI`, `MONGO_URL`. No connection string or credentials were added to tracked files.
4. Readiness previously protected only four homepage URLs. A shared middleware now covers every downstream database route and every HTTP method, including projects, events, assessments/publications, inventory, activities, assets, employees, attendance, registry and uploads. Disconnected requests return 503 immediately rather than buffering for ten seconds. This response is an outage signal, not a substitute for restored data.
5. `/health` now returns 503 until the connection is ready, then 200. `/` and `/fast` remain liveness endpoints; static uploads and CORS preflight remain available independently of MongoDB.
6. `npm run db:check` performs a read-only connect/ping from the environment where it runs and reports a safe diagnostic category without printing credentials.

## Validation

- Existing full backend suite plus initial new tests: 32/32 passed using the isolated MongoDB test binary.
- After adding cross-module GET/POST/PATCH/DELETE outage and recovery coverage, the focused suite passed 9/9 (including the eight previously tested cases).
- Server syntax check passed.
- `npm run db:check` passed against the locally configured database.
- No frontend changes were needed for these shared backend repairs. Production rendering and authenticated production reads have not been verified.

## Complete production recovery

Deploy this backend revision to the existing API service. Ensure the service has the intended database URI in its environment; avoid conflicting aliases because `db_url` wins. Run `npm run db:check` in that service's backend directory, then restart the API service after any environment correction.

If the diagnostic fails, use its category and hosting logs to correct the actual cause: authentication credentials/database permissions, DNS/SRV resolution, network access/firewall/Atlas access list, or database availability. Do not copy credentials into logs or public reports. Local connectivity cannot verify hosting network access. The exact hosting-side trigger remains unconfirmed without its configuration/logs.

Configure readiness checks to use `/health`; use `/` for liveness if a hosting restart policy would otherwise repeatedly kill the process during reconnection. Confirm `/health` returns 200 with `database: connected`, then verify successful reads and visible records for Energy, Water, Events, Summary, publications and authenticated modules. Do not report the production outage resolved until those checks pass.

## Follow-up: Nginx 502 after VPS restart

Fresh direct requests with the frontend Origin header to `/health` and `/readProjectEnergyStage` both returned HTTP 502 with an Nginx 1.24.0 (Ubuntu) HTML error page and no Access-Control-Allow-Origin. This is a proxy/upstream failure; adding frontend CORS workarounds cannot restore an unavailable upstream.

Review found a regression in the preceding repair: calling `databaseUri()` at module scope throws before HTTP startup when the URI is missing or invalid. This can cause PM2 restart loops and Nginx 502. It is a confirmed code defect, but VPS logs are still needed to establish whether it caused this particular live outage. Moved URI resolution into the guarded retry attempt; invalid configuration now logs the safe category MISSING_OR_INVALID_URI and keeps HTTP health/CORS responses available with database readiness 503. Correct VPS database configuration is still required to serve data.

Focused tests passed 10/10, including missing-URI startup protection, retry recovery and all-module readiness gating. Syntax and diff checks passed. The follow-up fix remains local until committed, pushed and deployed.

Required VPS evidence (run in `~/moewr_backend`):

```bash
pm2 logs server --lines 40 --nostream
npm run db:check
```

If logs instead show a port or upstream mismatch, inspect the API site's Nginx proxy_pass target and the backend listener before changing either. Do not restart unrelated PM2 applications. No VPS shell access is available in this session; production recovery remains unverified.
