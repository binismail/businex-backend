const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Middleware to check user and their permissions
const checkUser = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({
          message: "You are not logged in! Please log in to get access.",
        });
      }

      // Verify access token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }

      // Find the user
      const currentUser = await User.findById(decoded.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User no longer exists." });
      }

      // Check for required permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every((permission) =>
          currentUser.permissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            message:
              "You do not have the necessary permissions to access this resource.",
          });
        }
      }

      // Attach the user to the request object
      req.user = currentUser;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Access token expired. Please refresh your token.",
        });
      }
      res
        .status(500)
        .json({ message: "Error verifying token.", error: error.message });
    }
  };
};

module.exports = { checkUser };
