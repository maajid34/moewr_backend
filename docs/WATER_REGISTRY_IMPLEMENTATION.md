# 1. Files Added

Water Point Registry & GIS implementation — 9 September 2026.

```text
modules/waterPoint/
  regionModel.js
  districtModel.js
  waterPointModel.js
  waterPointAssessmentModel.js
  counterModel.js
  storageCleanupModel.js
  shared.js
controller/waterPoint/
  regionController.js
  districtController.js
  waterPointController.js
  assessmentController.js
  waterPointReportController.js
  fileController.js
  storageReferences.js
  common.js
  validation.js
  initialize.js
Router/waterPoint/waterPointRoutes.js
middleWare/authenticateAccount.js
scripts/registry-storage-cleanup.js
tests/waterRegistry.test.js
.env.example
docs/WATER_REGISTRY_IMPLEMENTATION.md
```

All paths above are relative to backend/. The workspace `audit/download-test-mongo.cjs` is an optional local Windows test-binary download helper, outside application source. It downloads only mongod.exe from the official MongoDB ZIP into ignored node_modules cache, checking extracted size and ZIP CRC where supported. It does not launch the application or connect to a database.

# 2. Files Modified

| File | Change / reason |
| --- | --- |
| `server.js` | Adds `/api/water-registry` before legacy body parsers, allowing authentication and the module's 256 KiB JSON limit to run first. Existing router mounts retained. |
| `middleWare/aploadImage.js` | Removes credential logging and import-time test upload; lazily shares one S3 client; adds explicit-bucket PUT, GET and DELETE helpers. Existing helper names/call signatures still work. |
| `Router/energy/projectEnergyRouter.js` | Protects `/createAdmin` and `/users` management routes with current-account authentication and admin role checks. Without this small security fix, anonymous callers could mint admins and bypass the registry's permissions. No Energy/Water project route changed. |
| `controller/login/loginCntrl.js` | Excludes password hashes from account create/update responses; enables update validators and returns 404 for missing updated users. Login request/token response unchanged. |
| `package.json`, `package-lock.json` | Adds Zod, isolated test tools and test/cleanup commands; updates Mongoose and Multer for applicable security advisories. |

Resolved relevant versions: mongoose 8.24.4, multer 2.3.0, zod 4.5.4; dev tools mongodb-memory-server-core 10.4.3 and supertest 7.2.2. No frontend dependency added. `mongodb-memory-server-core` avoids a database-binary postinstall download; tests download a disposable MongoDB binary on demand or use MONGOMS_SYSTEM_BINARY.

# 3. New Models

## Region

Model `Region`, collection `water_registry_regions`:

- Required name; NFKC-normalized, trimmed, repeated whitespace collapsed.
- Internal lowercase `nameKey` unique index prevents obvious case/spacing duplicates without forcing display names lowercase.
- Optional uppercase code, globally unique when a string is present; blank/null clears it.
- isActive defaults true; createdBy/updatedBy reference existing Admin; timestamps.
- Internal registryVersion coordinates concurrent parent deactivation and child creation. Names/codes remain reserved after deactivation.

## District

Model `District`, collection `water_registry_districts`:

- Required name and Region reference; same name normalization as Region.
- Unique `{region,nameKey}` allows the same district name in different regions.
- Optional code, globally unique when provided; isActive, actor references, timestamps.
- Region cannot be changed through District PUT. This avoids invalidating existing point relationships. No Village master model is created.

## WaterPoint

Model `WaterPoint`, collection `water_registry_points`. **There is no WaterProject reference.**

| Field | Contract |
| --- | --- |
| waterPointCode | Generated, required, unique, immutable; BH-/SW- plus at least six digits |
| waterSourceType | Required, immutable: BOREHOLE or SHALLOW_WELL |
| waterPointName | Optional trimmed text, max 200 |
| region, district | Required ObjectId references, validated together |
| villageOrSite | Required trimmed free text, 1–200 characters; not a master-table ID |
| location | Required GeoJSON Point, exactly [longitude, latitude] |
| status | Required controlled operational status |
| implementation | Optional structured details below |
| technical | Optional structured measurements below |
| beneficiaries | Optional non-negative integer estimates and managementType text |
| photos, documents | Server-managed attachment metadata arrays; max 20 photos and 10 documents |
| notes | Optional trimmed text, max 5,000 |
| createdBy, updatedBy | Backend-authenticated Admin references, never client supplied |
| isActive | Defaults true; false after archive |
| archivedAt, archivedBy | Server-generated archive metadata |
| createdAt, updatedAt | Mongoose timestamps; not construction dates |

Operational status enum:

```text
FUNCTIONAL, NON_FUNCTIONAL, PARTIALLY_FUNCTIONAL,
UNDER_MAINTENANCE, ABANDONED, UNKNOWN
```

implementation fields: organizationType, implementingOrganization, fundingPartner, contractorCompany, projectOrProgramName, yearConstructed, completionDate. Organization/funder/contractor/program are optional text, not references to existing projects or an Organization table. organizationType enum: GOVERNMENT, NGO, UN_AGENCY, PRIVATE_COMPANY, COMMUNITY, DONOR_PARTNER, OTHER, UNKNOWN. Year is optional, integer 1800 through the current UTC year. Completion date accepts a real ISO date or timestamp, must not be future, and must match yearConstructed's year when both are supplied. No inference from createdAt.

technical fields: optional non-negative depthMeters/yieldValue, yieldUnit, waterQuality, pumpType, powerSource. A yieldValue requires a yieldUnit. Enums:

```text
yieldUnit: M3_PER_HOUR, LITERS_PER_SECOND, LITERS_PER_MINUTE, UNKNOWN
waterQuality: FRESH, BRACKISH, SALINE, UNKNOWN
pumpType: HAND_PUMP, SUBMERSIBLE, SURFACE_PUMP, OTHER, NONE, UNKNOWN
powerSource: SOLAR, GRID, DIESEL, MANUAL, HYBRID, NONE, UNKNOWN
```

beneficiaries: estimatedPopulationServed, estimatedHouseholdsServed (safe non-negative integers), optional managementType text. Historical incomplete data is allowed; only location/type/status/site are required business inputs.

## WaterPointAssessment

Model `WaterPointAssessment`, collection `water_registry_assessments`. Required WaterPoint ObjectId, assessmentDate and status. Optional waterQuality, yieldValue/yieldUnit, conditionNotes, maintenanceRequired (default false), photos, assessedByName; backend-created createdBy and timestamps. Date cannot be future; yield requires units.

Observations are append-only through the API: no observation edit/delete endpoint. Photos can be appended to an existing assessment, with upload actor/time metadata. Adding an assessment **does not synchronize WaterPoint.status**. Current operational status is managed explicitly through WaterPoint PUT; a late/backdated assessment never silently overwrites it. Archived point history remains readable.

Internal supporting models:

- `WaterPointCounter` / `water_registry_counters`: atomic `$inc` counters by BH/SW. Not countDocuments or array length. Point creation and increment share a transaction; concurrent first-counter upsert conflict is retried. MongoDB unique code index is the final safeguard. Codes are never reassigned when a point is archived.
- `WaterPointStorageCleanup` / `water_registry_storage_cleanup`: pending compensation deletions after failed file attachments; no routine deletion of historical attachments.

# 4. New APIs

All paths below use prefix **`/api/water-registry`**. Every endpoint is internal/authenticated. There are **26 explicit routes**.

| Method | Path | Purpose | Role |
| --- | --- | --- | --- |
| POST | /regions | Create Region | admin |
| GET | /regions | Bounded Region dropdown/list | admin, water |
| GET | /regions/:id | Region details | admin, water |
| PUT | /regions/:id | Update/reactivate/deactivate Region | admin |
| DELETE | /regions/:id | Deactivate only; no hard delete | admin |
| POST | /districts | Create District | admin |
| GET | /districts | List/filter by region | admin, water |
| GET | /districts/:id | District details | admin, water |
| PUT | /districts/:id | Update name/code/active state; cannot reparent | admin |
| DELETE | /districts/:id | Deactivate only | admin |
| POST | /water-points | Register physical infrastructure | admin, water |
| GET | /water-points | Filtered/paginated list | admin, water |
| GET | /water-points/:id | Details, including attachment metadata | admin, water |
| PUT | /water-points/:id | Validated edit | admin, water |
| DELETE | /water-points/:id | Archive, preserve history | admin |
| GET | /gis | Lightweight paginated map markers | admin, water |
| GET | /nearby | Bounded geospatial nearest points | admin, water |
| GET | /summary | Counts and grouped reports | admin, water |
| POST | /water-points/:id/assessments | Append assessment | admin, water |
| GET | /water-points/:id/assessments | Paginated chronological history | admin, water |
| GET | /assessments/:assessmentId | Single assessment | admin, water |
| POST | /water-points/:id/photos | Append image attachments | admin, water |
| POST | /water-points/:id/documents | Append PDFs | admin, water |
| POST | /assessments/:assessmentId/photos | Append assessment evidence | admin, water |
| GET | /water-points/:id/files/:fileId | Authenticated file download | admin, water |
| GET | /assessments/:assessmentId/files/:fileId | Authenticated assessment photo download | admin, water |

WaterPoint DELETE is idempotent in data effect but returns 409 if already archived. No WaterPoint restore endpoint in this phase. Edits, new assessments and uploads to archived points are rejected; authenticated details/history/downloads remain available. Region/District deactivation with active dependants returns 409; old references are retained.

# 5. Authentication / Authorization Rules

Send `Authorization: Bearer <token>` using the existing `/customerLogin` response. New `authenticateAccount` verifies HS256 JWT with existing JWT_Secret, then reads the current Admin identity/role. Deleted account -> 401; role changes take effect immediately even for an old JWT. Missing/malformed/expired signature -> 401. Missing server secret -> safe 500.

| Role | Registry read/GIS/report | Point create/update | Assessment create | Point archive | Region/District management |
| --- | --- | --- | --- | --- | --- |
| admin | Yes | Yes | Yes | Yes | Yes |
| water | Yes | Yes | Yes | No | No |
| energy | No | No | No | No | No |
| admin/hr | No | No | No | No | No |
| Anonymous | No | No | No | No | No |

The optional cross-department viewing policy was resolved conservatively: **no energy/HR access in this phase**. Water users cannot manage accounts. Existing account-management requests now require an admin Bearer token; an existing trusted admin account must be available. No public first-admin/bootstrap route was added. Account deletion/role-change invalidates new-registry access immediately; password-change token revocation remains a separate legacy issue.

New-module JSON is strict: unknown keys, client-supplied actors/codes/archive state/file arrays, query operators, malformed IDs, enums, dates, numbers and unapproved sort fields are rejected. Input validation precedes database queries. No req.query object is passed directly to MongoDB. Backend permissions do not depend on UI routing.

# 6. Database Indexes

| Model | Declared indexes |
| --- | --- |
| Region | nameKey unique; code unique partial for strings |
| District | region + nameKey unique; code unique partial for strings |
| WaterPoint | waterPointCode unique; location 2dsphere; district; waterSourceType; status; region+district+waterSourceType; region+district+status; implementation.yearConstructed; implementation.implementingOrganization; implementation.contractorCompany; isActive+createdAt+_id |
| Assessment | waterPoint+assessmentDate descending+_id descending |
| Counter | MongoDB _id unique |
| Cleanup | MongoDB _id unique |

Region queries can use the compound indexes' region prefix; a redundant single-region index was not added. Names use normalized keys rather than case-sensitive display-name uniqueness. Indexes were actually built and checked in the isolated test database, including 2dsphere and unique waterPointCode. Production indexes were not modified during development/tests. Registry initialization waits for new-model `init()` before serving requests; production should retain index creation permissions/default autoIndex or provision these indexes explicitly before release.

# 7. GIS / GeoJSON Implementation

`location.type` must be Point; coordinates must be exactly two finite JSON numbers in **[longitude, latitude]** order. Longitude -180..180, latitude -90..90. The server does not guess/reverse coordinates or restrict them to an assumed country boundary.

`GET /gis` uses the shared filters and a lightweight projection: ID/code/name/type/status/region/district/site/location. No technical details, notes, files or history in marker records. Default 200 markers/page, maximum 500. Pages are explicit; frontend must not assume the first page is the entire registry.

`GET /nearby?lat=-0.3&lng=42&radiusKm=10&limit=50` uses MongoDB `$geoNear` on the 2dsphere index, returns distanceMeters and nearest-first markers. Radius 0.001..100 km, default 10; limit 1..100. Same domain filters are available; nearby has no page/sort parameter because it is a bounded nearest-result endpoint. The geospatial query was exercised against a real temporary MongoDB instance, not only mocked.

# 8. Region-District Validation

Every WaterPoint create/update verifies active Region, active District, and District.region equals the selected Region. Update validates the resulting pair even if only one location field is submitted. Invalid hierarchy returns 422 with a clear message. Empty/invalid ObjectIds return 400.

MongoDB transactions plus internal writes to the parent records serialize point creation/location changes against concurrent deactivation. Region deactivation checks active District/WaterPoint references; District deactivation checks active WaterPoint references. A race test verifies either child creation succeeds and deactivation conflicts, or deactivation succeeds and child creation is rejected—never an active child under an inactive District. This uses modest parent write contention intentionally for integrity.

**Deployment requirement: MongoDB replica set or a compatible sharded deployment/Atlas.** Standalone mongod does not support these transactions; affected writes return a safe 503. No unsafe non-transactional fallback exists. Replica-set deployment was verified only in the isolated test environment, not against the user's production hosting.

# 9. Reporting / Aggregation APIs

One shared filter builder powers lists, maps, nearby and summaries:

```text
region, district, villageOrSite, waterSourceType, status,
organizationType, implementingOrganization, fundingPartner,
contractorCompany, yearConstructed, search, isActive
```

String domain filters are literal case-insensitive exact matches; free search is escaped literal substring matching across code, point name, village/site, implementer, funder, contractor and program name. Maximum search length 100. IDs/enums/years are exact. Unknown parameters are rejected. Default isActive=true; authorized users can request archived records with isActive=false.

`GET /summary` accepts those filters plus `groupBy`, page and limit. groupBy values: region (default), district, villageOrSite, waterSourceType, status, implementingOrganization, contractorCompany, fundingPartner, yearConstructed.

MongoDB `$match` + `$facet`/`$group` calculates totalWaterPoints, boreholes, shallowWells, all status counts and paginated groups. For filtered data produced through these APIs, **totalWaterPoints = boreholes + shallowWells**. No fixed dashboard counts. Each group contains totalWaterPoints/boreholes/shallowWells; a region/district group's display name is resolved separately. Unspecified optional grouping fields use key/name null. Status counts and grand totals refer to the entire filtered scope, not only the returned group page. Summary meta.total means **number of groups**, unlike point-list meta.total, which is matching points.

Grouping uses stored labels (case-sensitive); filters/search are case-insensitive. Village and organization spellings can still differ because these are intentionally flexible text. No merging of nearby physical wells or automatic duplicate rejection was added. Nearby queries can support advisory duplicate review later.

# 10. Storage Changes

The registry reuses the image helper's lazy shared S3 client; it does not create another client. Existing image helper calls retain their legacy default bucket and URL behavior. New registry uploads explicitly require **WATER_REGISTRY_BUCKET**, which must be provisioned as a **private bucket** accessible by the same credentials. There is deliberately no fallback to the old public image bucket, and registry URLs point to authenticated download routes. Actual bucket policy/connectivity was not changed or tested against production.

Metadata: `_id`, key, bucket, url (authenticated relative API path), fileName, mimeType, size, uploadedAt, uploadedBy. The client cannot submit metadata/keys or overwrite file arrays through CRUD. Server-generated UUID keys use a registry-specific prefix; filenames do not control storage paths. Code persists keys for cleanup rather than relying on public URLs.

Upload contract: multipart field **files**, max **5 files/request**, **5 MiB/file**. Photos accept JPEG/PNG/WebP, documents PDF. Both declared MIME and file magic bytes are checked. No SVG/HTML/Office upload path in this module. No more than 20 point photos, 10 point documents or 20 photos per assessment. Total file payload is at most 25 MiB/request. Field/part limits bound extra multipart data; four simultaneous uploads per backend process are allowed, otherwise 429 with Retry-After. Known excessive Content-Length is rejected early. Auth/role/ID validation occurs before parsing.

Downloads use attachment disposition, `nosniff`, and `private, no-store`. Future frontend should fetch with Authorization and create an object URL for preview, rather than placing an authenticated endpoint directly in an img src without headers.

If attachment storage/database operations fail, attempted object keys are compensated. Before removal, stored references are checked to avoid deleting a successfully committed attachment after an uncertain transaction result. Failed compensation is queued in WaterPointStorageCleanup; if database persistence itself is unavailable, a sanitized key-only cleanup message is logged for follow-up. An explicit operator command retries at most 100 queued entries:

```text
npm run registry:cleanup -- --execute
```

That operational command performs real deletions of unreferenced queued objects using configured services; it was **not run** during this task. It rechecks references before deletion. No background scheduler or destructive migration was added. Signature checks are not malware scanning or full media decoding. Bucket access controls and operational cleanup scheduling remain deployment responsibilities.

# 11. Tests Added

`tests/waterRegistry.test.js` runs through HTTP using Supertest, real signed JWTs/current account lookups, real Mongoose models and an ephemeral single-node MongoDB replica set. S3 operations are deterministic in-memory stubs. No server.js import, no .env loading, no supplied db_url, no fingerprint/device import execution. Test database URI is generated locally and checked for loopback.

Coverage includes anonymous/invalid JWT rejection, energy/HR denial, water/admin success, master management policy, stale role/deleted account handling, normalized uniqueness, region/district membership/active state, invalid GeoJSON, controlled enums, prohibited metadata, construction date/year rules, units/non-negative numbers, concurrent first-code generation, duplicate unique index, actual geo index, safe updates, combined filters and every summary grouping, query-operator rejection, real nearby distance behavior, historical assessments, file type/size/count/download protections, cleanup compensation, JSON limits, parent-deactivation race, archive/history retention, account-escalation closure, successful admin account creation/password update/login without password-hash exposure, and legacy Water Project behavior.

# 12. Test Results

**24/24 tests passed**, with 0 failures, cancellations or skipped tests (14.08 seconds). The saved TAP output is in `../../audit/water-registry-tests.tap`. No production service was used. JavaScript syntax validation passed for all 63 backend JavaScript files; the new router has 26 explicit routes, and `git diff --check` passed. Frontend Git status is clean, and the legacy Water Project model/controller/router have no changes.

Commands from backend/:

```text
npm ci --ignore-scripts
npm test
```

On first use, mongodb-memory-server-core may download the official platform MongoDB binary. If an approved local binary is already available, PowerShell example:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:\path\to\mongod.exe'
npm test
```

For this workspace's executed tests, the binary was official MongoDB 7.0.24, extracted into ignored node_modules cache. Tests start their own loopback instance with a disposable data directory, rather than connecting to a running database. Final tests are also available as `npm run test:water-registry`.

# 13. Existing Modules Verification

Water/Energy project models, all other legacy models, Water router/controller, HR/attendance, inventory/assets, events/documents/activities/achievements logic and frontend source were not edited. The additive server mount does not rename or remove existing routes. The only existing route-policy change is privileged account management, necessary to prevent registry privilege escalation. Existing account screens now must send an admin Bearer token for those requests.

Shared library patch updates, the image helper's removal of secret/test side effects and guarded user-management code are the bounded shared changes. The existing backend has known defects outside this task, so unchanged source is not a claim that every old feature has been repaired. Production smoke testing and old fingerprint/R2 connectivity were intentionally not performed.

# 14. Water Project Verification

**Water Projects were not merged with Water Points.** `modules/water/waterProject.js`, `controller/water/waterCntrlProject.js` and `Router/water/waterRouter.js` remain unchanged. WaterPoint uses its own collection, model, controller directory and `/api/water-registry` namespace. `projectOrProgramName` is descriptive text only, never an automatic WaterProject link.

The integration test exercises existing Water Project creation with mocked storage, single read and update against the isolated database. It asserts that waterProject has neither region nor waterSourceType fields and that creating/updating a legacy project leaves WaterPoint count unchanged. The pre-existing dedicated Water photo bug was not rewritten; that is distinct from preserving working create/read/update behavior.

# 15. Remaining Backend Issues

- Production release/configuration was not performed. A replica-set database, existing trusted admin and appropriately private registry bucket/credentials are prerequisites.
- Legacy public mutations outside user management, old attendance calculations/sync behavior, inventory invariants, original document/image cleanup paths, frontend token-storage inconsistencies and generic server health/readiness issues remain from the audit. They do not expose a new registry route directly, but remain whole-system risks.
- Password-change revocation/rate-limited login and last-admin provisioning/retention policies remain broader account-system work. Registry auth uses current identity/role; account management is now admin-only.
- Dependency scan after targeted Mongoose/Multer updates still reports **11 entries: 6 high, 4 moderate, 1 low**. Remaining packages were not broadly upgraded outside scope; investigate legacy Socket.IO/XML/parser/xlsx dependencies separately. No claim that the whole application is security-complete.
- Private bucket policy, real S3 read/write permissions and proxy-level request limits require deployment verification. New upload/download/error behavior was tested with storage stubs, not real R2.
- No restore endpoint, observation editing/deletion, geographic seed import, authoritative boundaries, offline sync, bulk import, point duplicate warnings or organization master model in this phase. Nearby coordinates are valid worldwide, not verified against jurisdiction boundaries.
- Transactions introduce parent-write contention; load-test expected import/report volumes before large rollout. Reports have bounded output and time limits; substring searches may scan data.
- No frontend implementation/deployment, existing-data migration or production data modification was performed.

# 16. Frontend Integration Contract

## Base, auth, envelopes and errors

Base path: `/api/water-registry`. All requests require Bearer token. JSON writes use Content-Type application/json, max 256 KiB; uploads multipart. Success:

```json
{"success":true,"message":"Success","data":{},"meta":{"page":1,"limit":50,"total":1,"pages":1}}
```

meta is present for lists/reports, omitted on normal writes/details. Error:

```json
{"success":false,"message":"Invalid request","errors":[{"field":"location.coordinates.0","message":"Too big: expected number to be <=180"}]}
```

400 malformed input; 401 missing/invalid account/token; 403 denied role; 404 missing record/endpoint; 409 duplicate/archive/reference/concurrent conflict; 422 invalid location hierarchy; 413 excessive body/file size; 429 upload capacity; 503 unavailable database/transaction/private-storage configuration; 500 unexpected safe error. Validation library wording may vary; rely on status + field and displayed message, not an exact message string for program logic. Stacks/internal driver/storage messages are not returned.

## Dropdowns

```text
GET /regions?isActive=true&page=1&limit=100
GET /districts?region=<selectedRegionId>&isActive=true&page=1&limit=100
```

Both return data arrays with `_id`, name, optional code, isActive and actor/timestamps. District region is populated with name/code/isActive. Request subsequent pages using meta.pages. Changing Region in the future frontend must clear the selected District until a valid district is chosen. Village/site is a text field.

Admin setup examples: POST /regions with `{ "name":"Lower Juba","code":"LJ" }`, then POST /districts with `{ "name":"Kismayo","region":"<returnedRegionId>" }`. These are examples only; no Regions were seeded into production.

## Create Water Point

POST `/water-points`. Replace the example ObjectIds with actual dropdown IDs; coordinates/organizations below are illustrative, not seeded records.

```json
{
  "waterPointName": "Goobweyn Community Borehole",
  "waterSourceType": "BOREHOLE",
  "region": "000000000000000000000001",
  "district": "000000000000000000000002",
  "villageOrSite": "Goobweyn",
  "location": {"type":"Point","coordinates":[42.0,-0.3]},
  "status": "FUNCTIONAL",
  "implementation": {
    "organizationType":"NGO",
    "implementingOrganization":"ADRA",
    "fundingPartner":"EU",
    "contractorCompany":"Example Drilling",
    "projectOrProgramName":"Example Program",
    "yearConstructed":2020,
    "completionDate":"2020-01-01"
  },
  "technical": {"depthMeters":100,"yieldValue":2,"yieldUnit":"LITERS_PER_SECOND","waterQuality":"FRESH","pumpType":"SUBMERSIBLE","powerSource":"SOLAR"},
  "beneficiaries": {"estimatedPopulationServed":1000,"estimatedHouseholdsServed":150,"managementType":"Community"},
  "notes":"Optional field notes"
}
```

201 response data is the saved WaterPoint with `_id`, generated waterPointCode, actor references, timestamps and empty attachment arrays. Region/district in create/update responses are IDs; detail/list/map reads populate them. Do not send waterPointCode, createdBy, updatedBy, isActive, archive fields, photos or documents; these are server-owned.

## Update Water Point

PUT `/water-points/:id` accepts a non-empty **partial top-level update**. Omitted top-level fields remain unchanged. A provided implementation/technical/beneficiaries object **replaces that embedded object**; send all values to retain within it. Empty `{}` clears that optional embedded object. Optional text can be cleared with empty string. Do not send null, immutable waterSourceType or generated code.

```json
{
  "status":"UNDER_MAINTENANCE",
  "notes":"Pump maintenance scheduled",
  "technical":{"depthMeters":100,"yieldValue":2,"yieldUnit":"LITERS_PER_SECOND","waterQuality":"FRESH","pumpType":"SUBMERSIBLE","powerSource":"SOLAR"}
}
```

200 response returns updated WaterPoint. Changing Region/District requires a valid resulting pair, normally both IDs in the same request. Archive is admin-only DELETE; it does not destroy documents, files or assessments.

## Water Point list response

Example request:

```text
GET /water-points?region=<id>&district=<id>&waterSourceType=BOREHOLE&status=FUNCTIONAL&implementingOrganization=ADRA&yearConstructed=2020&page=1&limit=50&sort=-createdAt
```

sort: createdAt, waterPointCode, waterPointName, yearConstructed, each optionally prefixed with `-`. Default -createdAt; deterministic _id tie-break. Page 1..10000; limit 1..100 (default 50). URL-encode query values. List excludes photos/documents/notes; request detail for those.

```json
{
  "success":true,
  "message":"Water points",
  "data":[{
    "_id":"000000000000000000000003",
    "waterPointCode":"BH-000001",
    "waterPointName":"Goobweyn Community Borehole",
    "waterSourceType":"BOREHOLE",
    "status":"FUNCTIONAL",
    "region":{"_id":"000000000000000000000001","name":"Lower Juba","isActive":true},
    "district":{"_id":"000000000000000000000002","name":"Kismayo","region":"000000000000000000000001","isActive":true},
    "villageOrSite":"Goobweyn",
    "location":{"type":"Point","coordinates":[42,-0.3]},
    "isActive":true
  }],
  "meta":{"page":1,"limit":50,"total":1,"pages":1}
}
```

Example abbreviated for readability; full list records also contain optional technical/implementation/beneficiary/actor/timestamp data.

## GIS markers response

GET `/gis` uses the same important filters. Envelope is the same as list, message `GIS markers`, data contains **only** `_id`, waterPointCode, waterPointName if present, waterSourceType, status, populated region/district, villageOrSite, location. No counts hard-coded. meta defaults limit 200/max 500. Nearby response uses the same marker fields plus distanceMeters, with meta `{limit:50,radiusKm:10}` and no total/pagination claim.

## Summary response

GET `/summary?region=<id>&district=<id>&groupBy=waterSourceType`:

```json
{
  "success":true,
  "message":"Registry summary",
  "data":{
    "scope":{"region":"000000000000000000000001","district":"000000000000000000000002","isActive":true},
    "totalWaterPoints":2,
    "boreholes":1,
    "shallowWells":1,
    "statuses":{"FUNCTIONAL":1,"NON_FUNCTIONAL":1,"PARTIALLY_FUNCTIONAL":0,"UNDER_MAINTENANCE":0,"ABANDONED":0,"UNKNOWN":0},
    "groupBy":"waterSourceType",
    "groups":[
      {"key":"BOREHOLE","name":"BOREHOLE","totalWaterPoints":1,"boreholes":1,"shallowWells":0},
      {"key":"SHALLOW_WELL","name":"SHALLOW_WELL","totalWaterPoints":1,"boreholes":0,"shallowWells":1}
    ]
  },
  "meta":{"page":1,"limit":50,"total":2,"pages":1}
}
```

Counts above are illustrative fixture values. Live counts always come from matching DB records. scope returns filter inputs/IDs, not invented geography names. Empty scope results return zeros, empty groups and meta.pages 0.

## Assessment history

POST `/water-points/:id/assessments`:

```json
{
  "assessmentDate":"2025-06-01",
  "status":"NON_FUNCTIONAL",
  "waterQuality":"UNKNOWN",
  "conditionNotes":"Pump requires repair",
  "maintenanceRequired":true,
  "assessedByName":"Field Officer"
}
```

201 returns the saved assessment. GET `/water-points/:id/assessments?page=1&limit=50` returns:

```json
{
  "success":true,
  "message":"Assessment history",
  "data":[{
    "_id":"000000000000000000000004",
    "waterPoint":"000000000000000000000003",
    "assessmentDate":"2025-06-01T00:00:00.000Z",
    "status":"NON_FUNCTIONAL",
    "conditionNotes":"Pump requires repair",
    "maintenanceRequired":true,
    "photos":[],
    "createdBy":"000000000000000000000005"
  }],
  "meta":{"page":1,"limit":50,"total":1,"pages":1}
}
```

Sorted assessmentDate descending then _id descending. Historical data is not removed on current status edits or archive. If users want current status changed after an assessment, the future UI must explicitly perform an authorized WaterPoint PUT; there is no implicit latest-assessment synchronization.

## Files and deployment setup

POST multipart files after the parent exists; repeat `files` for each attachment. Response data is an array of server-generated metadata. No client key/url metadata registration endpoint. Fetch metadata.url with the same Authorization header to download/preview.

Configure existing db_url, JWT_Secret and S3 credentials; private WATER_REGISTRY_BUCKET only when uploads are needed. Keep the existing project's S3_BUCKET/public-base configuration separate. Mongoose transaction support and index creation must be verified in the deployment. Tests and API documentation are ready for the next frontend phase; no UI was built.
