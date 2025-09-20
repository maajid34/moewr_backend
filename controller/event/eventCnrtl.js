// controllers/eventController.js
const Event = require("../../modules/EventModule/eventModule"); // adjust the path if needed

// Create
const createEvent = async (req, res) => {
  try {
    const files = req.files || {};
    const coverFile = files.coverImage?.[0] || req.file; // supports single('coverImage') too
    const objectiveFile = files.objectiveImage?.[0];

    const payload = {
      title: (req.body.title || "").trim(),
      ministry: req.body.ministry,
      description: req.body.description,
      moreDescription: req.body.moreDescription,
      coverImage: coverFile ? (coverFile.filename || coverFile.path) : undefined,
      objectiveImage: objectiveFile ? (objectiveFile.filename || objectiveFile.path) : undefined,
    };

    // Schema requires coverImage
    if (!payload.coverImage) {
      return res.status(400).json({ message: "coverImage is required" });
    }

    const doc = new Event(payload);
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("createEvent error:", err);
    // Handle duplicate title nicely (unique: true)
    if (err.code === 11000 && err.keyPattern?.title) {
      return res.status(409).json({ message: "Title must be unique" });
    }
    res.status(500).json({ message: "Failed to create event" });
  }
};

// Read all (optional basic pagination & sorting)
const readEvents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Event.countDocuments(),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    console.error("readEvents error:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// Read single by ID
const readEventById = async (req, res) => {
  try {
    const doc = await Event.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Event not found" });
    res.json(doc);
  } catch (err) {
    console.error("readEventById error:", err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
};

// Update
const updateEvent = async (req, res) => {
  try {
    const files = req.files || {};
    const coverFile = files.coverImage?.[0] || req.file;
    const objectiveFile = files.objectiveImage?.[0];

    const update = {
      ...(req.body.title !== undefined && { title: (req.body.title || "").trim() }),
      ...(req.body.ministry !== undefined && { ministry: req.body.ministry }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.moreDescription !== undefined && { moreDescription: req.body.moreDescription }),
    };

    if (coverFile) update.coverImage = coverFile.filename || coverFile.path;
    if (objectiveFile) update.objectiveImage = objectiveFile.filename || objectiveFile.path;

    const doc = await Event.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!doc) return res.status(404).json({ message: "Event not found" });
    res.json(doc);
  } catch (err) {
    console.error("updateEvent error:", err);
    if (err.code === 11000 && err.keyPattern?.title) {
      return res.status(409).json({ message: "Title must be unique" });
    }
    res.status(500).json({ message: "Failed to update event" });
  }
};

// Delete
const deleteEvent = async (req, res) => {
  try {
    const doc = await Event.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};



module.exports = {
  createEvent,
  readEvents,
  readEventById,
  updateEvent,
  deleteEvent,
};
