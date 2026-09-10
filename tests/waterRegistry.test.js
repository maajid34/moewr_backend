// Isolated MongoDB replica set only. Never imports server.js or loads .env.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { MongoMemoryReplSet } = require("mongodb-memory-server-core");
const { Readable } = require("stream");
process.env.JWT_Secret = "isolated-water-registry-test-secret";
process.env.WATER_REGISTRY_BUCKET = "isolated-test-bucket";
require("dotenv").config = () => ({ parsed: {} });
const storage = require("../middleWare/aploadImage");
const objects = new Map();
storage.putImageToR2 = async (
  buffer,
  mime,
  key,
  bucket = "isolated-test-bucket",
) => {
  assert.equal(bucket, "isolated-test-bucket");
  objects.set(key, Buffer.from(buffer));
};
storage.deleteObjectFromR2 = async (key) => {
  objects.delete(key);
};
storage.getObjectFromR2 = async (key) => ({
  Body: Readable.from(objects.get(key) || Buffer.from("missing")),
});
const Admin = require("../modules/login/login");
const Region = require("../modules/waterPoint/regionModel");
const District = require("../modules/waterPoint/districtModel");
const WaterPoint = require("../modules/waterPoint/waterPointModel");
const Assessment = require("../modules/waterPoint/waterPointAssessmentModel");
require("../modules/waterPoint/counterModel");
const app = express();
app.use(
  "/api/water-registry",
  require("../Router/waterPoint/waterPointRoutes"),
);
app.use(express.json());
app.use(require("../Router/energy/projectEnergyRouter"));
app.use(require("../Router/water/waterRouter"));
const base = "/api/water-registry";
let repl, region, district, otherRegion, otherDistrict, point, well;
const users = {},
  tokens = {};
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const call = (method, url, role = "water") => {
  const r = request(app)[method](base + url);
  return role ? r.set("Authorization", "Bearer " + tokens[role]) : r;
};
const body = (patch = {}) => ({
  waterPointName: "Goobweyn Community Borehole",
  waterSourceType: "BOREHOLE",
  region: region._id,
  district: district._id,
  villageOrSite: "Goobweyn",
  location: { type: "Point", coordinates: [42, -0.3] },
  status: "FUNCTIONAL",
  implementation: {
    organizationType: "NGO",
    implementingOrganization: "ADRA",
    fundingPartner: "EU",
    contractorCompany: "Example Drilling",
    projectOrProgramName: "Test Program",
    yearConstructed: 2020,
    completionDate: "2020-01-01",
  },
  ...patch,
});
before(
  async () => {
    repl = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    const uri = repl.getUri();
    assert.match(uri, /127\.0\.0\.1/); // Never accepts a caller-supplied DB URI.
    await mongoose.connect(uri, { dbName: "water_registry_test" });
    for (const model of Object.values(mongoose.models)) await model.init();
    for (const role of ["admin", "water", "energy", "admin/hr"]) {
      const _id = new mongoose.Types.ObjectId();
      users[role] = _id;
      await Admin.collection.insertOne({
        _id,
        name: role,
        email: role + "@test.invalid",
        password: "not-a-login-password",
        role,
      });
      tokens[role] = jwt.sign(
        { id: String(_id), role },
        process.env.JWT_Secret,
        { expiresIn: "1h" },
      );
    }
    let r = await call("post", "/regions", "admin").send({
      name: "Lower Juba",
      code: "LJ",
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    region = r.body.data;
    r = await call("post", "/regions", "admin").send({ name: "Gedo" });
    assert.equal(r.status, 201);
    otherRegion = r.body.data;
    r = await call("post", "/districts", "admin").send({
      name: "Kismayo",
      region: region._id,
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    district = r.body.data;
    r = await call("post", "/districts", "admin").send({
      name: "Other District",
      region: otherRegion._id,
    });
    assert.equal(r.status, 201);
    otherDistrict = r.body.data;
  },
  { timeout: 300000 },
);
after(async () => {
  await mongoose.disconnect();
  if (repl) await repl.stop();
});

test("anonymous and invalid tokens rejected before writes and upload parsing", async () => {
  assert.equal(
    (await call("post", "/water-points", null).send(body())).status,
    401,
  );
  assert.equal(
    (
      await request(app)
        .get(base + "/gis")
        .set("Authorization", "Bearer forged")
    ).status,
    401,
  );
  assert.equal(
    (
      await call(
        "post",
        "/water-points/" + new mongoose.Types.ObjectId() + "/photos",
        null,
      ).attach("files", png, "x.png")
    ).status,
    401,
  );
});
test("role policy denies energy/HR and prevents water master-data management", async () => {
  for (const role of ["energy", "admin/hr"]) {
    assert.equal(
      (await call("post", "/water-points", role).send(body())).status,
      403,
    );
    assert.equal((await call("get", "/gis", role)).status, 403);
  }
  assert.equal(
    (await call("post", "/regions").send({ name: "Forbidden" })).status,
    403,
  );
});
test("current account role overrides stale JWT and deleted account is rejected", async () => {
  const id = new mongoose.Types.ObjectId();
  await Admin.collection.insertOne({
    _id: id,
    name: "stale",
    role: "energy",
    email: "stale@test.invalid",
  });
  const token = jwt.sign(
    { id: String(id), role: "admin" },
    process.env.JWT_Secret,
  );
  assert.equal(
    (
      await request(app)
        .get(base + "/regions")
        .set("Authorization", "Bearer " + token)
    ).status,
    403,
  );
  await Admin.collection.deleteOne({ _id: id });
  assert.equal(
    (
      await request(app)
        .get(base + "/regions")
        .set("Authorization", "Bearer " + token)
    ).status,
    401,
  );
});
test("master names normalized; optional unique codes and regional district uniqueness enforced", async () => {
  assert.equal(
    (await call("post", "/regions", "admin").send({ name: "  LOWER   juba " }))
      .status,
    409,
  );
  assert.equal(
    (
      await call("post", "/regions", "admin").send({
        name: "Another Name",
        code: "lj",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("post", "/districts", "admin").send({
        name: " kIsMaYo ",
        region: region._id,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("post", "/districts", "admin").send({
        name: "Kismayo",
        region: otherRegion._id,
      })
    ).status,
    201,
  );
  const r = await call("get", "/districts?region=" + region._id);
  assert.equal(r.status, 200);
  assert.equal(r.body.data.length, 1);
  assert.equal(
    (
      await call("put", "/districts/" + district._id, "admin").send({
        region: otherRegion._id,
      })
    ).status,
    400,
  );
});
test("wrong Region/District and inactive parents rejected", async () => {
  assert.equal(
    (
      await call("post", "/water-points").send(
        body({ district: otherDistrict._id }),
      )
    ).status,
    422,
  );
  const r = await call("post", "/regions", "admin").send({
    name: "Inactive",
    isActive: false,
  });
  assert.equal(
    (
      await call("post", "/districts", "admin").send({
        name: "Blocked",
        region: r.body.data._id,
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call("post", "/water-points").send(
        body({ region: String(new mongoose.Types.ObjectId()) }),
      )
    ).status,
    422,
  );
});
test("GeoJSON and enum request validation rejects invalid or coerced input", async () => {
  for (const coordinates of [
    [181, 0],
    [0, 91],
    [42],
    [42, 0, 1],
    ["42", 0],
    [null, 0],
  ])
    assert.equal(
      (
        await call("post", "/water-points").send(
          body({ location: { type: "Point", coordinates } }),
        )
      ).status,
      400,
    );
  assert.equal(
    (
      await call("post", "/water-points").send(
        body({ waterSourceType: "RIVER" }),
      )
    ).status,
    400,
  );
  assert.equal(
    (await call("post", "/water-points").send(body({ status: "GOOD" }))).status,
    400,
  );
  assert.equal(
    (
      await call("post", "/water-points").send(
        body({ createdBy: String(users.admin) }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call("post", "/water-points").send(
        body({ waterPointCode: "BH-000001" }),
      )
    ).status,
    400,
  );
});
test("dates, years, yield units and beneficiary numbers validated", async () => {
  for (const patch of [
    { implementation: { yearConstructed: new Date().getUTCFullYear() + 1 } },
    { implementation: { yearConstructed: 2020, completionDate: "2021-01-01" } },
    { implementation: { completionDate: "2020-02-30" } },
    { technical: { yieldValue: 2 } },
    { technical: { depthMeters: -1 } },
    { beneficiaries: { estimatedHouseholdsServed: -1 } },
    { beneficiaries: { estimatedPopulationServed: 1.5 } },
  ])
    assert.equal(
      (await call("post", "/water-points").send(body(patch))).status,
      400,
    );
});
test("water creates Borehole and admin creates Shallow Well with independent codes and actor refs", async () => {
  const initial = await Promise.all([
    call("post", "/water-points").send(body()),
    call("post", "/water-points").send(
      body({
        region: otherRegion._id,
        district: otherDistrict._id,
        villageOrSite: "Concurrency",
      }),
    ),
  ]);
  initial.forEach((r) => assert.equal(r.status, 201, JSON.stringify(r.body)));
  let r = initial[0];
  point = r.body.data;
  assert.match(point.waterPointCode, /^BH-\d{6,}$/);
  assert.equal(point.createdBy, String(users.water));
  r = await call("post", "/water-points", "admin").send(
    body({
      waterSourceType: "SHALLOW_WELL",
      status: "NON_FUNCTIONAL",
      waterPointName: "Test Well",
      location: { type: "Point", coordinates: [42.001, -0.3] },
    }),
  );
  assert.equal(r.status, 201);
  well = r.body.data;
  assert.match(well.waterPointCode, /^SW-\d{6,}$/);
});
test("codes remain unique during concurrent creates and unique index rejects duplicate", async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      call("post", "/water-points").send(
        body({
          villageOrSite: "Concurrency",
          region: i % 2 ? otherRegion._id : region._id,
          district: i % 2 ? otherDistrict._id : district._id,
        }),
      ),
    ),
  );
  results.forEach((r) => assert.equal(r.status, 201, JSON.stringify(r.body)));
  assert.equal(new Set(results.map((r) => r.body.data.waterPointCode)).size, 8);
  await assert.rejects(
    WaterPoint.collection.insertOne({
      ...body(),
      waterPointCode: point.waterPointCode,
    }),
    { code: 11000 },
  );
});
test("required geospatial and unique indexes exist in isolated MongoDB", async () => {
  const indexes = await WaterPoint.collection.indexes();
  assert.ok(indexes.some((i) => i.key.location === "2dsphere"));
  assert.ok(indexes.some((i) => i.key.waterPointCode === 1 && i.unique));
});
test("updates validate resulting hierarchy and preserve generated code, ownership and independent type", async () => {
  assert.equal(
    (
      await call("put", "/water-points/" + point._id).send({
        region: otherRegion._id,
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call("put", "/water-points/" + point._id).send({
        waterSourceType: "SHALLOW_WELL",
      })
    ).status,
    400,
  );
  const r = await call("put", "/water-points/" + point._id, "admin").send({
    notes: "Reviewed",
    technical: { yieldValue: 2, yieldUnit: "LITERS_PER_SECOND" },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.waterPointCode, point.waterPointCode);
  assert.equal(r.body.data.updatedBy, String(users.admin));
  assert.equal(r.body.data.createdBy, String(users.water));
});
test("combined filters/search/pagination are shared with database summaries", async () => {
  const q =
    "region=" +
    region._id +
    "&district=" +
    district._id +
    "&villageOrSite=Goobweyn&implementingOrganization=adra&contractorCompany=Example%20Drilling&fundingPartner=EU&organizationType=NGO&yearConstructed=2020";
  const list = await call("get", "/water-points?" + q);
  assert.equal(list.status, 200);
  assert.equal(list.body.meta.total, 2);
  const summary = await call("get", "/summary?" + q);
  assert.equal(summary.status, 200, JSON.stringify(summary.body));
  assert.equal(summary.body.data.totalWaterPoints, 2);
  assert.equal(summary.body.data.boreholes, 1);
  assert.equal(summary.body.data.shallowWells, 1);
  assert.equal(summary.body.data.statuses.FUNCTIONAL, 1);
  assert.equal(summary.body.data.statuses.NON_FUNCTIONAL, 1);
  for (const groupBy of [
    "region",
    "district",
    "villageOrSite",
    "waterSourceType",
    "status",
    "implementingOrganization",
    "contractorCompany",
    "fundingPartner",
    "yearConstructed",
  ]) {
    const r = await call("get", "/summary?" + q + "&groupBy=" + groupBy);
    assert.equal(r.status, 200);
    assert.equal(
      r.body.data.groups.reduce((n, g) => n + g.totalWaterPoints, 0),
      2,
    );
  }
  const filtered = await call(
    "get",
    "/water-points?" +
      q +
      "&waterSourceType=BOREHOLE&status=FUNCTIONAL&search=Community&limit=1",
  );
  assert.equal(filtered.body.meta.total, 1);
  assert.equal(
    (await call("get", "/water-points?search=.*")).body.meta.total,
    0,
  );
  assert.equal(
    (await call("get", "/summary?search=missing")).body.data.totalWaterPoints,
    0,
  );
});
test("query operators, unsupported sorting, unbounded paging, malformed IDs and radius rejected", async () => {
  for (const url of [
    "/water-points?region[$ne]=x",
    "/water-points?limit=1000",
    "/water-points?sort=password",
    "/water-points?isActive[$ne]=false",
    "/water-points?search=" + "x".repeat(101),
    "/water-points/not-an-id",
    "/nearby?lat=0&lng=42&radiusKm=101",
    "/nearby?lat=NaN&lng=42",
    "/nearby?lat=0&lng=181",
  ])
    assert.equal((await call("get", url)).status, 400, url);
});
test("GIS returns bounded markers and nearby uses actual MongoDB geospatial query", async () => {
  const r = await call("get", "/gis?villageOrSite=Goobweyn&limit=1");
  assert.equal(r.status, 200);
  assert.equal(r.body.data.length, 1);
  assert.equal(r.body.meta.total, 2);
  const marker = r.body.data[0];
  assert.ok(marker.region.name);
  assert.ok(marker.district.name);
  assert.equal(marker.photos, undefined);
  assert.equal(marker.notes, undefined);
  assert.equal(marker.implementation, undefined);
  const near = await call(
    "get",
    "/nearby?lat=-0.3&lng=42&radiusKm=1&villageOrSite=Goobweyn",
  );
  assert.equal(near.status, 200, JSON.stringify(near.body));
  assert.equal(near.body.data.length, 2);
  assert.ok(
    near.body.data[0].distanceMeters <= near.body.data[1].distanceMeters,
  );
  assert.equal(
    (await call("get", "/nearby?lat=20&lng=20&radiusKm=1")).body.data.length,
    0,
  );
});
test("assessment history is append-only and backdated assessments never overwrite current status", async () => {
  for (const [assessmentDate, status] of [
    ["2024-01-01", "FUNCTIONAL"],
    ["2025-01-01", "NON_FUNCTIONAL"],
    ["2023-01-01", "UNKNOWN"],
  ])
    assert.equal(
      (
        await call("post", "/water-points/" + point._id + "/assessments").send({
          assessmentDate,
          status,
          conditionNotes: "Historical",
        })
      ).status,
      201,
    );
  const history = await call(
    "get",
    "/water-points/" + point._id + "/assessments",
  );
  assert.equal(history.body.meta.total, 3);
  assert.equal(history.body.data[0].status, "NON_FUNCTIONAL");
  assert.equal(
    (await call("get", "/assessments/" + history.body.data[0]._id)).status,
    200,
  );
  assert.equal(
    (await call("delete", "/assessments/" + history.body.data[0]._id, "admin"))
      .status,
    404,
  );
  assert.equal(
    (await call("get", "/water-points/" + point._id)).body.data.status,
    "FUNCTIONAL",
  );
  assert.equal(
    (
      await call("post", "/water-points/" + point._id + "/assessments").send({
        assessmentDate: "2999-01-01",
        status: "FUNCTIONAL",
      })
    ).status,
    400,
  );
});
test("uploads validate signatures, reject client metadata, store key/actor and require auth to download", async () => {
  const url = "/water-points/" + point._id;
  assert.equal(
    (await call("put", url).send({ photos: [{ key: "forged" }] })).status,
    400,
  );
  assert.equal(
    (
      await call("post", url + "/photos").attach(
        "files",
        Buffer.from("not a PNG"),
        { filename: "fake.png", contentType: "image/png" },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call("post", url + "/photos").attach(
        "files",
        Buffer.alloc(5 * 1024 * 1024 + 1),
        { filename: "big.png", contentType: "image/png" },
      )
    ).status,
    413,
  );
  const r = await call("post", url + "/photos").attach("files", png, {
    filename: "photo.png",
    contentType: "image/png",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const f = r.body.data[0];
  assert.ok(f.key.startsWith("water-registry/"));
  assert.equal(f.uploadedBy, String(users.water));
  assert.ok(f.url.startsWith(base));
  assert.equal((await request(app).get(f.url)).status, 401);
  assert.equal(
    (
      await request(app)
        .get(f.url)
        .set("Authorization", "Bearer " + tokens.water)
    ).status,
    200,
  );
  const pdf = await call("post", url + "/documents").attach(
    "files",
    Buffer.from("%PDF-1.4\ntest"),
    { filename: "report.pdf", contentType: "application/pdf" },
  );
  assert.equal(pdf.status, 201);
});
test("upload storage failure returns safe error and compensates attempted key", async () => {
  const original = storage.putImageToR2;
  const before = objects.size;
  storage.putImageToR2 = async (buffer, mime, key) => {
    objects.set(key, buffer);
    throw new Error("SECRET STORAGE ERROR");
  };
  try {
    const r = await call(
      "post",
      "/water-points/" + point._id + "/photos",
    ).attach("files", png, { filename: "x.png", contentType: "image/png" });
    assert.equal(r.status, 500);
    assert.ok(!JSON.stringify(r.body).includes("SECRET"));
    assert.equal(objects.size, before);
  } finally {
    storage.putImageToR2 = original;
  }
});
test("file count cap and assessment photo attachment contract", async () => {
  let upload = call("post", "/water-points/" + point._id + "/photos");
  for (let i = 0; i < 5; i++)
    upload = upload.attach("files", png, {
      filename: i + ".png",
      contentType: "image/png",
    });
  assert.equal((await upload).status, 201);
  upload = call("post", "/water-points/" + point._id + "/photos");
  for (let i = 0; i < 6; i++)
    upload = upload.attach("files", png, {
      filename: i + ".png",
      contentType: "image/png",
    });
  assert.equal((await upload).status, 400);
  const history = await call(
    "get",
    "/water-points/" + point._id + "/assessments",
  );
  const r = await call(
    "post",
    "/assessments/" + history.body.data[0]._id + "/photos",
  ).attach("files", png, {
    filename: "assessment.png",
    contentType: "image/png",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(
    (
      await request(app)
        .get(r.body.data[0].url)
        .set("Authorization", "Bearer " + tokens.water)
    ).status,
    200,
  );
  assert.equal(await Assessment.countDocuments({ waterPoint: point._id }), 3);
});
test("oversized JSON, malformed JSON and unknown fields return safe module errors", async () => {
  let r = await call("post", "/water-points")
    .set("Content-Type", "application/json")
    .send("{");
  assert.equal(r.status, 400);
  assert.equal(r.body.success, false);
  r = await call("post", "/water-points").send({
    notes: "x".repeat(256 * 1024),
  });
  assert.equal(r.status, 413);
  assert.equal(r.body.success, false);
  r = await call("post", "/water-points").send({
    ...body(),
    $set: { status: "UNKNOWN" },
  });
  assert.equal(r.status, 400);
  r = await call(
    "post",
    "/water-points/" + new mongoose.Types.ObjectId() + "/assessments",
  ).send({ assessmentDate: "2020-01-01", status: "UNKNOWN" });
  assert.equal(r.status, 404);
});
test("deactivation and child creation serialize without leaving invalid active hierarchy", async () => {
  let r = await call("post", "/regions", "admin").send({ name: "Race Region" });
  const rg = r.body.data;
  r = await call("post", "/districts", "admin").send({
    name: "Race District",
    region: rg._id,
  });
  const dt = r.body.data;
  const [created, disabled] = await Promise.all([
    call("post", "/water-points").send(
      body({ region: rg._id, district: dt._id, villageOrSite: "Race" }),
    ),
    call("delete", "/districts/" + dt._id, "admin"),
  ]);
  assert.ok(
    (created.status === 201 && disabled.status === 409) ||
      (created.status === 422 && disabled.status === 200),
    JSON.stringify([created.body, disabled.body]),
  );
  const active = await WaterPoint.countDocuments({
    district: dt._id,
    isActive: true,
  });
  if (active) assert.equal((await District.findById(dt._id)).isActive, true);
});
test("referenced masters cannot be deactivated; archive retains assessment history", async () => {
  assert.equal(
    (await call("delete", "/regions/" + region._id, "admin")).status,
    409,
  );
  assert.equal(
    (await call("delete", "/districts/" + district._id, "admin")).status,
    409,
  );
  assert.equal(
    (await call("delete", "/water-points/" + point._id)).status,
    403,
  );
  assert.equal(
    (await call("delete", "/water-points/" + point._id, "admin")).status,
    200,
  );
  assert.equal(
    (await call("get", "/water-points?villageOrSite=Goobweyn")).body.meta.total,
    1,
  );
  assert.equal(
    (await call("get", "/water-points?isActive=false")).body.meta.total,
    1,
  );
  assert.equal(
    (await call("get", "/water-points/" + point._id + "/assessments")).body.meta
      .total,
    3,
  );
  assert.equal(
    (
      await call("put", "/water-points/" + point._id).send({
        status: "UNKNOWN",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("post", "/water-points/" + point._id + "/assessments").send({
        assessmentDate: "2024-01-01",
        status: "FUNCTIONAL",
      })
    ).status,
    409,
  );
});
test("legacy account routes cannot be used to elevate registry access", async () => {
  assert.equal(
    (
      await request(app).post("/createAdmin").send({
        name: "x",
        email: "x@test.invalid",
        password: "x",
        role: "admin",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request(app)
        .put("/users/" + users.water)
        .set("Authorization", "Bearer " + tokens.water)
        .send({ role: "admin" })
    ).status,
    403,
  );
  assert.equal(
    (await request(app).delete("/users/" + users.admin)).status,
    401,
  );
  assert.equal((await request(app).get("/users")).status, 401);
});
test("admin account management and existing login remain usable without exposing hashes", async () => {
  const created = await request(app)
    .post("/createAdmin")
    .set("Authorization", "Bearer " + tokens.admin)
    .send({
      name: "New water user",
      email: "new-water@test.invalid",
      password: "test-password-only",
      role: "water",
    });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.user.password, undefined);
  const id = created.body.user._id;
  const updated = await request(app)
    .put("/users/" + id)
    .set("Authorization", "Bearer " + tokens.admin)
    .send({
      name: "Updated water user",
      email: "new-water@test.invalid",
      role: "water",
      password: "changed-test-password",
    });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.user.password, undefined);
  const login = await request(app)
    .post("/customerLogin")
    .send({
      email: "new-water@test.invalid",
      password: "changed-test-password",
    });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal(login.body.user.password, undefined);
  assert.equal(
    (
      await request(app)
        .get(base + "/regions")
        .set("Authorization", "Bearer " + login.body.token)
    ).status,
    200,
  );
});

test("legacy Water Project create/read/update stays independent of WaterPoint", async () => {
  const Model = require("../modules/water/waterProject");
  assert.equal(Model.schema.path("region"), undefined);
  assert.equal(Model.schema.path("waterSourceType"), undefined);
  assert.notEqual(Model.collection.name, WaterPoint.collection.name);
  const count = await WaterPoint.countDocuments();
  const r = await request(app)
    .post("/createProjectWater/waterProject")
    .field("title", "Legacy independent project")
    .attach("coverImage", png, {
      filename: "cover.png",
      contentType: "image/png",
    });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body._id;
  assert.equal(
    (await request(app).get("/readProjectWaterSingal/waterProject/" + id))
      .status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .patch("/UpdateWaterProject/waterProject/" + id)
        .send({ overview: "Still a project" })
    ).status,
    200,
  );
  assert.equal(await WaterPoint.countDocuments(), count);
});
