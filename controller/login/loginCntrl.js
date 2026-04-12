



// module.exports ={createAdmin ,AminLogin}

const customerModel = require("../../modules/login/login");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

// // ✅ Create a new account (user or admin)
// const createAdmin = async (req, res) => {
//   try {
//     const name = String(req.body.name ?? req.body.Name ?? "").trim();
//     const email = String(req.body.email ?? req.body.Email ?? "").trim().toLowerCase();
//     const password = String(req.body.password ?? req.body.Password ?? "");
//     const role = req.body.role === "admin" ? "admin" : "user"; // default = user

//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password are required" });
//     }

//     const exist = await customerModel.findOne({ email });
//     if (exist) {
//       return res.status(409).json({ message: "Email already exists" });
//     }

//     const hash = await bcryptjs.hash(password, 10);

//     const user = await customerModel.create({
//       name: name || "User",
//       email,
//       password: hash,
//       role,
//     });

//     res.status(201).json({
//       message: "Account created successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("REGISTER ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    const allowedRoles = ["admin", "energy", "water"];
    const role = allowedRoles.includes(req.body.role)
      ? req.body.role
      : "energy";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const exist = await customerModel.findOne({ email });
    if (exist) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcryptjs.hash(password, 10);

    const user = await customerModel.create({
      name: name || "User",
      email,
      password: hash,
      role,
    });

    res.status(201).json({
      message: "Account created",
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};






const AminLogin = async (req, res) => {
  try {
    const email = String(req.body.email ?? req.body.Email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? req.body.Password ?? "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password are required" });
    }

    const user = await customerModel.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid Email or Password" });

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid Email or Password" });

    // ⭐ FIXED — Check for secret
    const secret = process.env.JWT_Secret;
    if (!secret) {
      console.error("❌ JWT_SECRET missing!");
      return res.status(500).json({ message: "Server config error" });
    }

    // ⭐ Create Token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await customerModel.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    await customerModel.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};


const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    let updateData = { name, email, role };

    // ✅ ONLY update password if user typed new one
    if (password && password.trim() !== "") {
      const hash = await bcryptjs.hash(password, 10);
      updateData.password = hash;
    }

    const user = await customerModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: "User updated", user });

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

module.exports = { createAdmin, AminLogin,getUsers,deleteUser,updateUser };
