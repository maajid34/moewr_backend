// const Attendance = require("../../modules/staff/attendanceModel");
// const Employee = require("../../modules/staff/employeeModel");
// const { today, isLate } = require("../../utils/time");

// // POST /api/attendance/scan  { fingerprintId }
// exports.scanFingerprint = async (req, res) => {
//   try {
//     const { fingerprintId } = req.body;

//     const employee = await Employee.findOne({ fingerprintId, isActive: true });
//     if (!employee) {
//       return res.status(404).json({ message: "Not Registered" });
//     }

//     const date = today();

//     let record = await Attendance.findOne({
//       employee: employee._id,
//       date,
//     });

//     if (!record) {
//       const late = isLate(9); // change cutoff as needed
//       record = await Attendance.create({
//         employee: employee._id,
//         date,
//         checkIn: new Date(),
//         status: late ? "Late" : "Present",
//       });
//     }

//     return res.json({
//       message: `Welcome ${employee.name}`,
//       status: record.status,
//       employee: {
//         id: employee._id,
//         name: employee.name,
//         employeeId: employee.employeeId,
//       },
//     });
//   } catch (e) {
//     return res.status(500).json({ error: e.message });
//   }
// };

// // GET /api/attendance/today
// exports.getToday = async (req, res) => {
//   const date = today();
//   const data = await Attendance.find({ date })
//     .populate("employee", "name employeeId department")
//     .sort({ createdAt: -1 });
//   res.json(data);
// };

// // GET /api/attendance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// exports.getSummary = async (req, res) => {
//   const { from, to } = req.query;
//   const data = await Attendance.find({
//     date: { $gte: from, $lte: to },
//   }).populate("employee", "name employeeId department");

//   res.json(data);
// };

const Attendance = require("../../modules/staff/attendanceModel");
const Employee = require("../../modules/staff/employeeModel");
const { today, isLate } = require("../../utils/time");

// POST /api/attendance/scan
exports.scanFingerprint = async (req, res) => {
  try {
    const { fingerprintId } = req.body;

    // 1. Find employee
    const employee = await Employee.findOne({
      fingerprintId,
      isActive: true,
    });

    if (!employee) {
      return res.status(404).json({ message: "Not Registered" });
    }

    const date = today(); // keep utility (cleaner)

    // 2. Check today's record
    let record = await Attendance.findOne({
      employee: employee._id,
      date,
    });

    // 3. FIRST SCAN → CHECK-IN
    if (!record) {
      const late = isLate(9); // 9 AM cutoff

      record = await Attendance.create({
        employee: employee._id,
        date,
        checkIn: new Date(),
        status: late ? "Late" : "Present",
      });

      return res.json({
        message: `Check-in ${employee.name}`,
        type: "checkin",
        status: record.status,
        employee: {
          id: employee._id,
          name: employee.name,
          employeeId: employee.employeeId,
        },
      });
    }

    // 4. SECOND SCAN → CHECK-OUT
    if (!record.checkOut) {
      record.checkOut = new Date();
      await record.save();

      return res.json({
        message: `Check-out ${employee.name}`,
        type: "checkout",
        employee: {
          id: employee._id,
          name: employee.name,
        },
      });
    }

    // 5. ALREADY DONE
    return res.json({
      message: "Already checked in and out today",
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// GET TODAY
exports.getToday = async (req, res) => {
  try {
    const date = today();

    const data = await Attendance.find({ date })
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET SUMMARY
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const data = await Attendance.find({
      date: { $gte: from, $lte: to },
    }).populate("employee", "name employeeId department");

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};