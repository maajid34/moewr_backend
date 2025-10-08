const InventoryItem = require("../../modules/wareHouse/InventoryItem");

// Create
exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    console.error("createItem:", err);
    res.status(400).json({ message: err.message || "Failed to create item" });
  }
};

// Read all (with optional sort and search)
exports.getItems = async (req, res) => {
  try {
    const { q, sort = "sn" } = req.query;
    const filter = q
      ? { item: { $regex: q, $options: "i" } }
      : {};
    const items = await InventoryItem.find(filter).sort({ [sort]: 1 });
    res.json(items);
  } catch (err) {
    console.error("getItems:", err);
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// Read one
exports.getItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("getItem:", err);
    res.status(500).json({ message: "Failed to fetch item" });
  }
};

// Update
exports.updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("updateItem:", err);
    res.status(400).json({ message: err.message || "Failed to update item" });
  }
};

// Delete
exports.deleteItem = async (req, res) => {
  try {
    const del = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteItem:", err);
    res.status(500).json({ message: "Failed to delete item" });
  }
};
