
// const Attendance = require("../../modules/staff/attendanceModel");
// const Employee = require("../../modules/staff/employeeModel");
// const { today, isLate } = require("../../utils/time");
// const ZKLib = require("node-zklib");
// const io = require("../../server").io; // or use req.app.get("io")


// // POST /api/attendance/scan
// exports.scanFingerprint = async (req, res) => {
//   try {
//     const { fingerprintId } = req.body;

//     // 1. Find employee
//     const employee = await Employee.findOne({
//       fingerprintId,
//       isActive: true,
//     });

//     if (!employee) {
//       return res.status(404).json({ message: "Not Registered" });
//     }

//     const date = today(); // keep utility (cleaner)

//     // 2. Check today's record
//     let record = await Attendance.findOne({
//       employee: employee._id,
//       date,
//     });

//     // 3. FIRST SCAN → CHECK-IN
//     if (!record) {
//       const late = isLate(9); // 9 AM cutoff

//       record = await Attendance.create({
//         employee: employee._id,
//         date,
//         checkIn: new Date(),
//         status: late ? "Late" : "Present",
//       });
 


//       return res.json({
//         message: `Check-in ${employee.name}`,
//         type: "checkin",
//         status: record.status,
//         employee: {
//           id: employee._id,
//           name: employee.name,
//           employeeId: employee.employeeId,
//         },
//       });
//     }

//     // 4. SECOND SCAN → CHECK-OUT
//     if (!record.checkOut) {
//       record.checkOut = new Date();
//       await record.save();

//       return res.json({
//         message: `Check-out ${employee.name}`,
//         type: "checkout",
//         employee: {
//           id: employee._id,
//           name: employee.name,
//         },
//       });
//     }

//     // 5. ALREADY DONE
//     return res.json({
//       message: "Already checked in and out today",
//     });

//   } catch (e) {
//     return res.status(500).json({ error: e.message });
//   }
// };

// // GET TODAY
// exports.getToday = async (req, res) => {
//   try {
//     const date = today();

//     const data = await Attendance.find({ date })
//       .populate("employee", "name employeeId department")
//       .sort({ createdAt: -1 });

//     res.json(data);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// // GET SUMMARY
// exports.getSummary = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     const data = await Attendance.find({
//       date: { $gte: from, $lte: to },
//     }).populate("employee", "name employeeId department");

//     res.json(data);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };


// const syncDevice = async () => {
//   const zk = new ZKLib("192.168.1.201", 4370, 10000, 4000);

//   await zk.createSocket();
//   const logs = await zk.getAttendances();

//   for (let log of logs.data) {
//     const employee = await Employee.findOne({
//       employeeId: log.deviceUserId,
//     });

//     if (!employee) continue;

//     const date = log.recordTime.toISOString().split("T")[0];

//     let record = await Attendance.findOne({
//       employee: employee._id,
//       date,
//     });

//     if (!record) {
//       await Attendance.create({
//         employee: employee._id,
//         date,
//         checkIn: log.recordTime,
//         status: "Present",
//       });
//         // 🔥 REALTIME EMIT
//       const io = app.get("io");
//       io.emit("attendance_update");
      
//     } else if (!record.checkOut) {
//       record.checkOut = log.recordTime;
//       await record.save();
//     }
//   }

//   await zk.disconnect();
// };

// exports.syncDevice = syncDevice;

// exports.syncZKTeco = async (req, res) => {
//   try {
//     await syncDevice();
//     res.json({ message: "Synced & Saved to DB ✅" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


const Attendance = require("../../modules/staff/attendanceModel");
const Employee = require("../../modules/staff/employeeModel");
const { today, isLate } = require("../../utils/time");
const ZKLib = require("node-zklib");

// haddii aad server.js ka export gareysay io
// const { io } = require("../../server");
// const { app } = require("../../server");

// =============================
// 📌 MANUAL SCAN (API)
// =============================
exports.scanFingerprint = async (req, res) => {
  try {
    const { fingerprintId } = req.body;

    let employee = await Employee.findOne({
      fingerprintId,
      isActive: true,
    });

    // 🔥 AUTO CREATE haddii uusan jirin
    if (!employee) {
      employee = await Employee.create({
        name: `User ${fingerprintId}`,
        employeeId: fingerprintId,
        fingerprintId,
        department: "Unknown",
      });

      console.log("🆕 Auto employee created");
    }

    const date = today();

    let record = await Attendance.findOne({
      employee: employee._id,
      date,
    });

    // ✅ CHECK-IN
    if (!record) {
      const late = isLate(9);

      record = await Attendance.create({
        employee: employee._id,
        date,
        checkIn: new Date(),
        status: late ? "Late" : "Present",
      });

      // 🔥 REALTIME
      io.emit("attendance_update");

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

    // ✅ CHECK-OUT
    if (!record.checkOut) {
      record.checkOut = new Date();
      await record.save();

      io.emit("attendance_update");

      return res.json({
        message: `Check-out ${employee.name}`,
        type: "checkout",
        employee: {
          id: employee._id,
          name: employee.name,
        },
      });
    }

    return res.json({
      message: "Already checked in and out today",
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// =============================
// 📌 GET TODAY
// =============================
// exports.getToday = async (req, res) => {
//   try {
//     const date = today();

//     const data = await Attendance.find({ date })
//       .populate("employee", "name employeeId department")
//       .sort({ createdAt: -1 });

//     res.json(data);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
exports.getToday = async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];

    const data = await Attendance.find({ date })
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// =============================
// 📌 GET SUMMARY
// =============================
// exports.getSummary = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     const data = await Attendance.find({
//       date: { $gte: from, $lte: to },
//     }).populate("employee", "name employeeId department");

//     res.json(data);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // 🔥 all employees
    let employees = await Employee.find();

    if (department) {
      employees = employees.filter(e => e.department === department);
    }

    // 🔥 attendance in range
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate("employee");

    // 🔥 group by date
    const summary = {};

    attendance.forEach((a) => {
      if (!summary[a.date]) {
        summary[a.date] = {
          date: a.date,
          present: 0,
          late: 0,
          employees: [],
        };
      }

      summary[a.date].present++;

      if (a.status === "Late") {
        summary[a.date].late++;
      }

      summary[a.date].employees.push(a.employee._id.toString());
    });

    // 🔥 ADD ABSENT
    Object.keys(summary).forEach((date) => {
      const presentIds = summary[date].employees;

      const absent = employees.length - presentIds.length;

      summary[date].absent = absent;
    });

    res.json(Object.values(summary));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================
// 🔥 DEVICE SYNC (IMPORTANT FIX)
// =============================

// let lastProcessedTime = null;



// const syncDevice = async (io) => {
//   const zk = new ZKLib("192.168.1.201", 4370, 10000, 4000);

//   try {
//     await zk.createSocket();
//     console.log("✅ Device Connected");

//     // =============================
//     // 🔥 GET USERS
//     // =============================
//     const users = await zk.getUsers();
//     const userMap = {};

//     if (users && users.data) {
//       console.log("👤 USERS:", users.data);

//       users.data.forEach((u) => {
//         const id = String(u.userId).trim();
//         userMap[id] = u.name?.trim() || `User ${id}`;
//       });
//     }

//     // =============================
//     // 🔥 GET LOGS
//     // =============================
//     const logs = await zk.getAttendances();

//     if (!logs || !logs.data || logs.data.length === 0) {
//       console.log("⚠️ No logs received");
//       return;
//     }

//     // =============================
//     // 🔁 PROCESS ONLY NEW LOGS
//     // =============================
//     for (let log of logs.data) {
//       const id = String(log.deviceUserId).trim();
//       const logTime = new Date(log.recordTime);

//       // 🔥 SKIP OLD LOGS
//       if (lastProcessedTime && logTime <= lastProcessedTime) {
//         continue;
//       }

//       console.log("🔥 NEW LOG:", id);

//       const realName = userMap[id] || `User ${id}`;
//       const date = logTime.toISOString().split("T")[0];

//       // =============================
//       // 🔥 CREATE / UPDATE EMPLOYEE
//       // =============================
//       let employee = await Employee.findOneAndUpdate(
//         { fingerprintId: id },
//         {
//           name: realName,
//           employeeId: id,
//           fingerprintId: id,
//         },
//         { new: true, upsert: true }
//       );

//       // =============================
//       // 🔍 CHECK RECORD
//       // =============================
//       let record = await Attendance.findOne({
//         employee: employee._id,
//         date,
//       });

//       // =============================
//       // ✅ CHECK-IN
//       // =============================
//       if (!record) {
//         await Attendance.create({
//           employee: employee._id,
//           date,
//           checkIn: logTime,
//           status: isLate(9) ? "Late" : "Present",
//         });

//         console.log(`✅ CHECK-IN: ${realName}`);
//       }

//       // =============================
//       // 🚪 CHECK-OUT
//       // =============================
//       else if (!record.checkOut) {
//         record.checkOut = logTime;
//         await record.save();

//         console.log(`🚪 CHECK-OUT: ${realName}`);
//       }

//       // =============================
//       // 🔥 UPDATE LAST TIME
//       // =============================
//       lastProcessedTime = logTime;

//       // =============================
//       // 🔥 REALTIME UPDATE
//       // =============================
//       if (io) io.emit("attendance_update");
//     }

//     await zk.disconnect();
//     console.log("🔌 Device Disconnected");

//   } catch (err) {
//     console.log("❌ ZK ERROR:", err.message);
//   }
// };
let lastProcessedTime = null;

const syncDevice = async (io) => {
  const zk = new ZKLib("192.168.1.201", 4370, 10000, 4000);

  try {
    await zk.createSocket();
    console.log("✅ Device Connected");

    // =============================
    // 🔥 GET USERS
    // =============================
    const users = await zk.getUsers();
    const userMap = {};

    if (users && users.data) {
      console.log("👤 USERS:", users.data);

      users.data.forEach((u) => {
        const id = String(u.userId).trim();
        userMap[id] = u.name?.trim() || `User ${id}`;
      });
    }

    // =============================
    // 🔥 GET LOGS
    // =============================
    const logs = await zk.getAttendances();

    if (!logs || !logs.data || logs.data.length === 0) {
      console.log("⚠️ No logs received");
      return;
    }

    // =============================
    // 🔥 SORT LOGS (VERY IMPORTANT)
    // =============================
    const sortedLogs = logs.data.sort(
      (a, b) => new Date(a.recordTime) - new Date(b.recordTime)
    );

    // =============================
    // 🔁 PROCESS LOGS
    // =============================
    for (let log of sortedLogs) {
      const id = String(log.deviceUserId).trim();
      const logTime = new Date(log.recordTime);

      // 🔥 SKIP OLD LOGS
      if (lastProcessedTime && logTime <= lastProcessedTime) {
        continue;
      }

      console.log("🔥 NEW LOG:", id);

      const realName = userMap[id] || `User ${id}`;

      // 🔥 FIX TIMEZONE (Somalia +3)
      const date = new Date(logTime.getTime() + 3 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // =============================
      // 🔥 CREATE / UPDATE EMPLOYEE
      // =============================
      let employee = await Employee.findOneAndUpdate(
        { fingerprintId: id },
        {
          name: realName,
          employeeId: id,
          fingerprintId: id,
        },
        { new: true, upsert: true }
      );

      // =============================
      // 🔍 CHECK RECORD
      // =============================
      let record = await Attendance.findOne({
        employee: employee._id,
        date,
      });

      // =============================
      // ✅ CHECK-IN
      // =============================
      if (!record) {
        await Attendance.create({
          employee: employee._id,
          date,
          checkIn: logTime,
          status: isLate(9) ? "Late" : "Present",
        });

        console.log(`✅ CHECK-IN: ${realName}`);

        if (io) io.emit("attendance_update");
      }

      // =============================
      // 🚪 CHECK-OUT (FIXED)
      // =============================
      else if (!record.checkOut) {
        const diff = logTime - new Date(record.checkIn);

        // ❗ ignore duplicate scans (less than 5 minutes)
        if (diff < 300000) {
          console.log(`⛔ IGNORE DUPLICATE: ${realName}`);
          continue;
        }

        record.checkOut = logTime;
        await record.save();

        console.log(`🚪 CHECK-OUT: ${realName}`);

        if (io) io.emit("attendance_update");
      }

      // =============================
      // 🔥 UPDATE LAST TIME
      // =============================
      lastProcessedTime = logTime;
    }

    await zk.disconnect();
    console.log("🔌 Device Disconnected");

  } catch (err) {
    console.log("❌ ZK ERROR:", err.message);
  }
};





exports.syncDevice = syncDevice;

// =============================
// 📌 API TRIGGER SYNC
// =============================
exports.syncZKTeco = async (req, res) => {
  try {
    await syncDevice();
    res.json({ message: "Synced & Saved to DB ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controller
exports.getReport = async (req, res) => {
  try {
    const { startDate, endDate, department, name } = req.query;

    let filter = {};

    // 📅 DATE RANGE
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    let query = Attendance.find(filter).populate("employee");

    let data = await query;

    // 🔍 FILTER NAME + DEPARTMENT
    data = data.filter((item) => {
      const emp = item.employee;

      return (
        (name ? emp?.name?.toLowerCase().includes(name.toLowerCase()) : true) &&
        (department ? emp?.department === department : true)
      );
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// absent

exports.getAbsentToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 🔥 All employees
    const employees = await Employee.find();

    // 🔥 Today's attendance
    const attendance = await Attendance.find({ date: today });

    const presentIds = attendance.map(a => a.employee.toString());

    // 🔥 Absent
    const absent = employees.filter(e =>
      !presentIds.includes(e._id.toString())
    );

    res.json(absent);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================
// 🔥 RECEIVE FROM LOCAL DEVICE (IMPORTANT)
// =============================
// exports.syncFromDevice = async (req, res) => {
//   try {
//     const { users, logs } = req.body;

//     if (!logs || logs.length === 0) {
//       return res.json({ message: "No logs received" });
//     }

//     console.log("📥 Received logs from local device");

//     // 🔥 CREATE USER MAP
//     const userMap = {};

//     if (users && users.length > 0) {
//       users.forEach((u) => {
//         const id = String(u.userId).trim();
//         userMap[id] = u.name?.trim() || `User ${id}`;
//       });
//     }

//     // 🔥 SORT LOGS
//     const sortedLogs = logs.sort(
//       (a, b) => new Date(a.recordTime) - new Date(b.recordTime)
//     );

//     for (let log of sortedLogs) {
//       const id = String(log.deviceUserId).trim();
//       const logTime = new Date(log.recordTime);

//       const realName = userMap[id] || `User ${id}`;

//       // 🔥 FIX TIMEZONE
//       const date = new Date(logTime.getTime() + 3 * 60 * 60 * 1000)
//         .toISOString()
//         .split("T")[0];

//       let employee = await Employee.findOneAndUpdate(
//         { fingerprintId: id },
//         {
//           name: realName,
//           employeeId: id,
//           fingerprintId: id,
//         },
//         { new: true, upsert: true }
//       );

//       let record = await Attendance.findOne({
//         employee: employee._id,
//         date,
//       });

//       // ✅ CHECK-IN
//       if (!record) {
//         await Attendance.create({
//           employee: employee._id,
//           date,
//           checkIn: logTime,
//           status: isLate(9) ? "Late" : "Present",
//         });

//         console.log(`✅ CHECK-IN: ${realName}`);
//       }

//       // 🚪 CHECK-OUT (SAFE)
//       else if (!record.checkOut) {
//         const diff = logTime - new Date(record.checkIn);

//         if (diff < 300000) {
//           continue;
//         }

//         record.checkOut = logTime;
//         await record.save();

//         console.log(`🚪 CHECK-OUT: ${realName}`);
//       }
//     }

//     res.json({ message: "Synced successfully ✅" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
exports.syncFromDevice = async (req, res) => {
  try {
    const { users = [], logs = [] } = req.body;

    if (logs.length === 0) {
      return res.json({ message: "No logs received" });
    }

    console.log("📥 Received logs:", logs.length);

    // =============================
    // 🔥 USER MAP
    // =============================
    const userMap = {};
    users.forEach((u) => {
      const id = String(u.userId).trim();
      userMap[id] = u.name?.trim() || `User ${id}`;
    });

    // =============================
    // 🔥 SORT LOGS (IMPORTANT)
    // =============================
    const sortedLogs = logs.sort(
      (a, b) => new Date(a.recordTime) - new Date(b.recordTime)
    );

    // =============================
    // 🔁 PROCESS LOGS
    // =============================
    for (const log of sortedLogs) {
      const id = String(log.deviceUserId).trim();
      const logTime = new Date(log.recordTime);

      // 🔥 FIX SOMALIA TIME (+3)
      const date = new Date(logTime.getTime() + 3 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const realName = userMap[id] || `User ${id}`;

      // =============================
      // 🔥 UPSERT EMPLOYEE
      // =============================
      const employee = await Employee.findOneAndUpdate(
        { fingerprintId: id },
        {
          name: realName,
          employeeId: id,
          fingerprintId: id,
        },
        { new: true, upsert: true }
      );

      // =============================
      // 🔍 FIND ATTENDANCE
      // =============================
      let record = await Attendance.findOne({
        employee: employee._id,
        date,
      });

      // =============================
      // ✅ CHECK-IN
      // =============================
      if (!record) {
        await Attendance.create({
          employee: employee._id,
          date,
          checkIn: logTime,
          status: isLate(9) ? "Late" : "Present",
        });

        console.log(`✅ CHECK-IN: ${realName}`);
        continue;
      }

      // =============================
      // 🚪 CHECK-OUT (SAFE)
      // =============================
      if (!record.checkOut) {
        const diff = logTime - new Date(record.checkIn);

        // ❗ ignore duplicate scan (<5min)
        if (diff < 300000) {
          console.log(`⛔ IGNORE DUPLICATE: ${realName}`);
          continue;
        }

        record.checkOut = logTime;
        await record.save();

        console.log(`🚪 CHECK-OUT: ${realName}`);
      }
    }

    console.log("✅ Sync completed");

    res.json({ message: "Synced successfully ✅" });

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};