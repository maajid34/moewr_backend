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
app.use("/api/achievements", sumaryRoutes);

// sida images loo soo aqristo

// app.use("/allimages", express.static("document"))
app.use("/upload", uploadRoutes);

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  app.listen(3000, () => console.log("server is running"))
app.listen(process.env.port, () => console.log(`server is running`))


// lates sarevr