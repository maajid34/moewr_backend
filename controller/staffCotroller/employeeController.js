const Employee = require("../../modules/staff/employeeModel");

exports.createEmployee = async (req, res) => {
  try {
    const emp = await Employee.create(req.body);
    res.status(201).json(emp);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getEmployees = async (req, res) => {
  const list = await Employee.find().sort({ createdAt: -1 });
  res.json(list);
};