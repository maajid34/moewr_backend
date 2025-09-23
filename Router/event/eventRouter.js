const express = require("express");
const projectEventCntrl = require("../../controller/event/eventCnrtl");
// const uploadImage = require("../../middleWare/aploadImage");
const {
  uploadBuffer

} = require("../../middleWare/aploadImage");
// const AdminLogin = require("../../controller/login/loginCntrl");
const { verifyToken, isAdmin } = require("../../middleWare/Auth");

const router = express.Router();

router.post(
  "/createProjectEvent/Event",
  uploadBuffer.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "objectiveImage", maxCount: 1 },
  ]),
  projectEventCntrl.createEvent
);

router.get("/readProjectEvent/Event", projectEventCntrl.readEvents);
router.get("/readProjectEventSingal/Event/:id",projectEventCntrl.readEventById);

// 
// PATCH – update an existing event
// router.put("/UpdateEvent/events/:id", 
//   // verifyToken, isAdmin, 
//   projectEventCntrl.updateEvent);

router.patch(
  "/UpdateEvent/events/:id",
  uploadBuffer.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "objectiveImage", maxCount: 1 },
  ]),
  projectEventCntrl.updateEvent
);

// DELETE – remove an event by id
router.delete("/DeleteEvent/events/:id", 
  // verifyToken, isAdmin, 
  projectEventCntrl.deleteEvent);



module.exports = router;


// all backend done all tested
