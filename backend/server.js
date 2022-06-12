const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { errorHandler } = require("./middlewares/error");
require("dotenv").config();
require("express-async-errors");
require("./db");
const userRoutes = require("./routes/userRoutes");
const { handleNotFound } = require("./utils/error");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(errorHandler);

app.use("/api/user", userRoutes);
app.use("/*", handleNotFound);

app.listen("8000", () => {
  console.log(`Server is listening on port ${8000}`);
});
