// const jwt = require("jsonwebtoken")
require("dotenv").config()

// const verifyToken = (req, res, next) =>{
//     const token = req.headers["authorization"];
//     if(!token){
//         return res.status(401).json({message: "no token provided"})
//     }

//     try {
//         const decoded = jwt.verify(token.split(" ") [1], process.env.JWT_Secret)
        
//         req.user = decoded
//         next()

//     } catch (error) {
//             res.status(401).json({message: "invalid token"})
//     }
// }

// const isAdmin = (req, res, next) =>{
//     if(req.user.role !== "admin"){
//         return res.status(403).json({message: "Admin only"})
//     }
//     next()
// }

// module.exports ={verifyToken,isAdmin}

// middleware/auth.js
const jwt = require("jsonwebtoken");

function getBearerToken(req) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.split(" ")[1];
}

const verifyToken = (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: "no token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // <- ALL CAPS
    req.user = decoded; // e.g. { id, role, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: "invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

module.exports = { verifyToken, isAdmin };
