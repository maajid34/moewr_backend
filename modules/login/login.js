



// // modules/login/login.js
// const mongoose = require("mongoose");
// const AutoIncrement = require("mongoose-sequence")(mongoose);

// const LoginSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },

//     // store as "email", allow alias "Email"
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//       index: true,
//       alias: "Email",
//     },

//     // store as "password", allow alias "Password"
//     password: {
//       type: String,
//       required: true,
//     //   select: false,       // don’t return by default
//     //   alias: "Password",
//     },

//     role: { type: String, enum: ["admin","water","energy","admin/hr"], default: "energy" },
//   },
//   { timestamps: true }
// );

// // auto-increment numeric id if you want it
// LoginSchema.plugin(AutoIncrement, { inc_field: "Cid" });

// module.exports = mongoose.model("Admin", LoginSchema);



// modules/login/login.js

const mongoose = require("mongoose");
const AutoIncrement =
  require("mongoose-sequence")(mongoose);

/*
|--------------------------------------------------------------------------
| ACCOUNT ROLES
|--------------------------------------------------------------------------
|
| admin
|   - Full administration
|
| water
|   - Water department / registry access
|
| energy
|   - Energy department access
|
| admin/hr
|   - Administration / HR access
|
| water_assessor
|   - Water assessment staff
|   - Limited access will be enforced at route level
|
*/

const ACCOUNT_ROLES = [
  "admin",
  "water",
  "energy",
  "admin/hr",
  "water_assessor",
];

const LoginSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | NAME
      |--------------------------------------------------------------------------
      */

      name: {
        type: String,
        required: true,
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | EMAIL
      |--------------------------------------------------------------------------
      */

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        alias: "Email",
      },

      /*
      |--------------------------------------------------------------------------
      | PASSWORD
      |--------------------------------------------------------------------------
      */

      password: {
        type: String,
        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | ROLE
      |--------------------------------------------------------------------------
      */

      role: {
        type: String,

        enum: ACCOUNT_ROLES,

        /*
         * Existing default retained so current
         * application behaviour does not change.
         */
        default: "energy",

        index: true,
      },
    },

    {
      timestamps: true,
    },
  );

/*
|--------------------------------------------------------------------------
| NUMERIC ID
|--------------------------------------------------------------------------
|
| Existing functionality retained.
|
*/

LoginSchema.plugin(
  AutoIncrement,
  {
    inc_field: "Cid",
  },
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

module.exports =
  mongoose.model(
    "Admin",
    LoginSchema,
  );