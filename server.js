// require("dotenv").config()
// const express = require("express")
// const mongoose = require("mongoose")
// const cors = require("cors")
// const projectEnergyRouter = require("./Router/energy/projectEnergyRouter.js")
// const projectWaterRouter = require("./Router/water/waterRouter")
// const EventRouter = require("./Router/event/eventRouter")
// const AssessmentRouter = require("./Router/assessmentRouter/assessmentRouter.js")
// const uploadRoutes = require("./Router/uploadRouter/uploadRouter.js");
// const inventoryRoutes = require("./Router/wareHouseRouter/inventoryRoutes.js");
// const activityRoutes = require("./Router/activityRoute/activityRoutes.js");
// const assetRoutes = require("./Router/assetRoutes/assetRoutes.js");
// const sumaryRoutes = require("./Router/summaryRouter/summaryRouter.js");
// const attendanceRouter = require("./Router/staffRouter/attendanceRoutes.js");
// const employeRouter = require("./Router/staffRouter/employeeRoutes.js");
// const cron = require("node-cron");
// const http = require("http");
// const { Server } = require("socket.io");





// // // instead of app.listen
// // server.listen(process.env.port, () =>
// //   console.log("server is running")
// // );

// const app = express()
// app.use(express.json())
// // app.use(cors())

// const path = require("path");

// // health check
// app.get("/", (req, res) => {
//   res.send("OK");
// });

// app.get("/health", (req, res) => {
//   res.json({ status: "OK" });
// });

// app.get("/fast", (req, res) => {
//   res.send("FAST OK");
// });

// // app.use(cors({
// //   origin: [
// //     'https://moewr-frontend.vercel.app',
// //     'http://localhost:5173',
// //     'http://localhost:5174',
// //     'https://moewr-jubalandstate.so',
// //     'https://admin.moewr-jubalandstate.so',
// //   ],
// //   credentials: true,
// // }));



// //  mongoose.connect("mongodb://localhost:27017/Moewr_jubaland").then(() =>{
// //     console.log("success connection")
// // })


// app.use(cors({
//   origin: [
//     "https://moewr-frontend.vercel.app",
//     "http://localhost:5173",
//     "http://localhost:5174",
//     "https://moewr-jubalandstate.so",
//     "https://admin.moewr-jubalandstate.so",
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));



// // database connection
// // mongoose.connect(process.env.db_url).then(() => console.log("connection is succesfully"))
// mongoose.connect(process.env.db_url)
//   .then(() => console.log("connection is successfully"))
//   .catch((err) => {
//     console.error("MongoDB connection error:", err.message);
//   });


// // ROUTER HALKAAN UGU WACDAY
// // app.use(projectEnergyRouter)
// app.use(projectEnergyRouter);
// app.use(projectWaterRouter);
// app.use(EventRouter);
// app.use(AssessmentRouter);

// app.use(inventoryRoutes);
// app.use("/api/activities", activityRoutes);
// app.use("/api/assets", assetRoutes);
// app.use("/api/sumaryachievements", sumaryRoutes);
// // routes
// app.use("/api/employees", employeRouter);
// app.use("/api/attendance", attendanceRouter);

// // sida images loo soo aqristo

// // app.use("/allimages", express.static("document"))
// app.use("/upload", uploadRoutes);

// // app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// // ---------- SOCKET.IO ----------
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// app.set("io", io);


// // staff
// const { syncDevice } = require("./controller/staffCotroller/attendanceController.js");


// cron.schedule("*/1 * * * *", async () => {
//   console.log("⏱ Syncing device...");
//   await syncDevice(io);
// });
// process.on("uncaughtException", (err) => {
//   console.log("🔥 Uncaught Error:", err.message);
// });

// process.on("unhandledRejection", (err) => {
//   console.log("🔥 Promise Error:", err);
// });
// // instead of app.listen
// // server.listen(process.env.port, () =>
// //   console.log("server is running")
// // );
// // server.listen(process.env.PORT || 3000, () => {
// //   console.log("server is running on port", process.env.PORT);
// // });
// server.listen(process.env.PORT || 8080, "0.0.0.0", () => {
//   console.log("server is running on port", process.env.PORT);
// });




// // lates sarevr
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const http = require("http");
const { Server } = require("socket.io");

const projectEnergyRouter = require("./Router/energy/projectEnergyRouter.js");
const projectWaterRouter = require("./Router/water/waterRouter");
const EventRouter = require("./Router/event/eventRouter");
const AssessmentRouter = require("./Router/assessmentRouter/assessmentRouter.js");
const uploadRoutes = require("./Router/uploadRouter/uploadRouter.js");
const inventoryRoutes = require("./Router/wareHouseRouter/inventoryRoutes.js");
const activityRoutes = require("./Router/activityRoute/activityRoutes.js");
const assetRoutes = require("./Router/assetRoutes/assetRoutes.js");
const sumaryRoutes = require("./Router/summaryRouter/summaryRouter.js");
const attendanceRouter = require("./Router/staffRouter/attendanceRoutes.js");
const employeRouter = require("./Router/staffRouter/employeeRoutes.js");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://moewr-frontend.vercel.app",
  "https://moewr-jubalandstate.so",
  "https://www.moewr-jubalandstate.so",
  "https://admin.moewr-jubalandstate.so",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Registry owns its authentication and bounded parsers; preserve legacy mounts below.
app.use("/api/water-registry", require("./Router/waterPoint/waterPointRoutes"));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/fast", (req, res) => {
  res.send("FAST OK");
});

mongoose
  .connect(process.env.db_url)
  .then(() => console.log("MongoDB connection is successful"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// Fail fast for the four public homepage reads when MongoDB is unavailable.
app.get(['/readProjectEnergyStage', '/readStageProjectWater', '/api/sumaryachievements', '/readProjectEvent/Event'], require('./middleWare/requireDatabaseReady'));

app.use(projectEnergyRouter);
app.use(projectWaterRouter);
app.use(EventRouter);
app.use(AssessmentRouter);
app.use(inventoryRoutes);

app.use("/api/activities", activityRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/sumaryachievements", sumaryRoutes);
app.use("/api/employees", employeRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/upload", uploadRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

const {
  syncDevice,
} = require("./controller/staffCotroller/attendanceController.js");

// cron.schedule("*/1 * * * *", async () => {
//   try {
//     console.log("⏱ Syncing device...");
//     await syncDevice(io);
//   } catch (err) {
//     console.log("Sync error:", err.message);
//   }
// });

process.on("uncaughtException", (err) => {
  console.log("🔥 Uncaught Error:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.log("🔥 Promise Error:", err);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("server is running on port", PORT);
});
