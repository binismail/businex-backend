const permissionsByRole = {
  admin: [
    "manage-users",
    "manage-reviews",
    "manage-operations",
    "view-dashboard",
  ],
  reviewer: ["manage-reviews", "view-dashboard"],
  operations: ["manage-operations", "view-dashboard"],
};

module.exports = permissionsByRole;
