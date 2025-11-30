



// modules/login/login.js
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const LoginSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // store as "email", allow alias "Email"
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      alias: "Email",
    },

    // store as "password", allow alias "Password"
    password: {
      type: String,
      required: true,
    //   select: false,       // don’t return by default
    //   alias: "Password",
    },

    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

// auto-increment numeric id if you want it
LoginSchema.plugin(AutoIncrement, { inc_field: "Cid" });

module.exports = mongoose.model("Admin", LoginSchema);

