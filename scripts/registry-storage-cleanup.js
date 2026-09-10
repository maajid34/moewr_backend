// Explicit operational task; no scheduled/import-time storage calls.
require("dotenv").config();
const mongoose = require("mongoose");
const Cleanup = require("../modules/waterPoint/storageCleanupModel");
const { deleteObjectFromR2 } = require("../middleWare/aploadImage");
const isReferenced = require("../controller/waterPoint/storageReferences");
async function main() {
  if (!process.argv.includes("--execute"))
    throw new Error("Use --execute to retry queued registry cleanup deletions");
  if (!process.env.db_url) throw new Error("db_url is required");
  await mongoose.connect(process.env.db_url);
  const entries = await Cleanup.find().sort({ createdAt: 1 }).limit(100);
  let completed = 0;
  for (const entry of entries) {
    try {
      if (!(await isReferenced(entry.key, entry.bucket)))
        await deleteObjectFromR2(entry.key, entry.bucket);
      await entry.deleteOne();
      completed++;
    } catch {
      console.error("Cleanup retry failed", { id: String(entry._id) });
    }
  }
  console.log({ attempted: entries.length, completed });
}
main()
  .catch(() => {
    console.error("Registry cleanup could not complete");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
