const ZKLib = require("node-zklib");

const zk = new ZKLib("192.168.1.201", 4370, 10000, 4000);

async function connectDevice() {
  try {
    await zk.createSocket();

    console.log("✅ Connected to device");

    // 🔹 GET USERS
    const users = await zk.getUsers();
    console.log("👥 Users:", users.data);

    // 🔹 GET ATTENDANCE LOGS
    const attendance = await zk.getAttendances();
    console.log("📊 Attendance:", attendance.data);

    // disconnect
    await zk.disconnect();

  } catch (err) {
    console.error("❌ Error:", err);
  }
}

connectDevice();