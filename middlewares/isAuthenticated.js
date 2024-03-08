const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    const findUserWithToken = await User.findOne({
      token: token,
    }).select("account");

    if (findUserWithToken) {
      req.user = findUserWithToken;
      next();
    } else {
      return res.status(401).json("Unauthorized");
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
