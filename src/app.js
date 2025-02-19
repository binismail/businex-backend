const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Middleware for CORS
app.use(cors());
app.options("*", cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(helmet());

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: `Pay4It Payroll API Documentation`,
      version: "1.0.1",
      description: `Pay4It Payroll API Documentation details on integration`,
    },
  },
  apis: [
    "./routes/auth/*.js",
    "./routes/company/*.js",
    "./routes/employees/*.js",
    "./routes/payroll/*.js",
    "./routes/wallet/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register models first (order matters)
require("./models/company.model");
require("./models/department.model");
require("./models/employees.model");
require("./models/payroll.model");
require("./models/deduction.model");
require("./models/extraEarning.model");
require("./models/transaction.model");

// Import routes
const Auth = require("./routes/auth/auth.route");
const Payroll = require("./routes/payroll/payroll.route");
const Employee = require("./routes/employees/employees.route");
const Team = require("./routes/company/team.route");
const Kyc = require(".//routes/company/kyc.route");
const Company = require("./routes/company/company.route");
const Bank = require("./routes/banks/banks.route");
const Department = require("./routes/departments/department.route");
const deductionRoutes = require("./routes/payroll/deduction.route");
const extraEarningRoutes = require("./routes/payroll/extraEarning.route");
const WalletRoute = require("./routes/wallet/wallet.route");
const WaitlistRoute = require("./routes/waitlist.route");
const WebhookRoutes = require("./routes/webhook.routes");

app.use("/api/v1/auth", Auth);
app.use("/api/v1/payroll", Payroll);
app.use("/api/v1/employee", Employee);
app.use("/api/v1/banks", Bank);
app.use("/api/v1/kyc", Kyc);
app.use("/api/v1/team", Team);
app.use("/api/v1/company", Company);
app.use("/api/v1/departments", Department);
app.use("/api/v1/deductions", deductionRoutes);
app.use("/api/v1/extra-earnings", extraEarningRoutes);
app.use("/api/v1/webhooks", WebhookRoutes);
app.use("/api/v1/waitlist", WaitlistRoute);
app.use("/api/v1/wallet", WalletRoute);

// Default route
app.get("/", (req, res) => {
  res.status(200).send("Pay 4 it server");
});

module.exports = app;
