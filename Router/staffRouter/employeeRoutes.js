const router = require("express").Router();
const {
  createEmployee,
  getEmployees,
} = require("../../controller/staffCotroller/employeeController");

router.post("/", createEmployee);
router.get("/", getEmployees);

module.exports = router;