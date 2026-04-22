require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const projectEnergyRouter = require("./Router/energy/projectEnergyRouter.js")
const projectWaterRouter = require("./Router/water/waterRouter")
const EventRouter = require("./Router/event/eventRouter")
const AssessmentRouter = require("./Router/assessmentRouter/assessmentRouter.js")
const uploadRoutes = require("./Router/uploadRouter/uploadRouter.js");
const inventoryRoutes = require("./Router/wareHouseRouter/inventoryRoutes.js");
const activityRoutes = require("./Router/activityRoute/activityRoutes.js");
const assetRoutes = require("./Router/assetRoutes/assetRoutes.js");
const sumaryRoutes = require("./Router/summaryRouter/summaryRouter.js");
const attendanceRouter = require("./Router/staffRouter/attendanceRoutes.js");
const employeRouter = require("./Router/staffRouter/employeeRoutes.js");
const cron = require("node-cron");
const http = require("http");
const { Server } = require("socket.io");





// // instead of app.listen
// server.listen(process.env.port, () =>
//   console.log("server is running")
// );

const app = express()
app.use(express.json())
// app.use(cors())

const path = require("path");




app.use(cors({
  origin: [
    'https://moewr-frontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://moewr-jubalandstate.so',
    'https://admin.moewr-jubalandstate.so',
  ],
  credentials: true,
}));



//  mongoose.connect("mongodb://localhost:27017/Moewr_jubaland").then(() =>{
//     console.log("success connection")
// })


mongoose.connect(process.env.db_url).then(() => console.log("connection is succesfully"))


// ROUTER HALKAAN UGU WACDAY
// app.use(projectEnergyRouter)
app.use(projectEnergyRouter);
app.use(projectWaterRouter);
app.use(EventRouter);
app.use(AssessmentRouter);

app.use(inventoryRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/sumaryachievements", sumaryRoutes);
// routes
app.use("/api/employees", employeRouter);
app.use("/api/attendance", attendanceRouter);

// sida images loo soo aqristo

// app.use("/allimages", express.static("document"))
app.use("/upload", uploadRoutes);

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ---------- SOCKET.IO ----------
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);


// staff
const { syncDevice } = require("./controller/staffCotroller/attendanceController.js");

// cron.schedule("*/1 * * * *", async () => {
//   console.log("⏱ Syncing device...");
//   await syncDevice();
// });

cron.schedule("*/10 * * * *", async () => {
  console.log("⏱ Syncing device...");
  await syncDevice(io);
});
process.on("uncaughtException", (err) => {
  console.log("🔥 Uncaught Error:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.log("🔥 Promise Error:", err);
});
// instead of app.listen
server.listen(process.env.port, () =>
  console.log("server is running")
);

//  app.listen(3000, () => console.log("server is running"))
// app.listen(process.env.port, () => console.log(`server is running`))


// lates sarevr