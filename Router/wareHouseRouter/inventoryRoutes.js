const express = require("express");
const ctrl = require("../../controller/wareHouseCntrl/inventoryController");
const router = express.Router();

// /api/inventory
router.post("/insert/inventory", ctrl.createItem);
router.get("/read/inventory", ctrl.getItems);
router.get("/readSingal/inventory/:id", ctrl.getItem);
router.put("/update/inventory/:id", ctrl.updateItem);
router.delete("/delete/inventory/:id", ctrl.deleteItem);

module.exports = router;
