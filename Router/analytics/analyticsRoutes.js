const express = require("express");

const {
  authenticateAccount,
  allowRoles,
} = require(
  "../../middleWare/authenticateAccount",
);

const analytics =
  require(
    "../../controller/analytics/analyticsController",
  );

const router = express.Router();

/* =========================================================
   PUBLIC ANALYTICS

   Browser sends only:
   {
     path,
     visitorId
   }

   No authentication required.
   ========================================================= */

router.post(
  "/public/analytics/view",

  express.json({
    limit: "16kb",
  }),

  analytics.recordView,
);

/* =========================================================
   ADMIN ANALYTICS

   Protected.
   ========================================================= */

router.get(
  "/admin/analytics",

  authenticateAccount,

  allowRoles("admin"),

  analytics.dashboard,
);

module.exports = router;