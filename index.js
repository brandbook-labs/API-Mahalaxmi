require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const indexRoutes = require("./src/routes/index.route");
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Create uploads folder
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

connectDB(); // Connect with Mongoose
app.get("/", (req, res) => res.send({code: 200, msg: "Welcome to the Jivan"}))

app.use("/", indexRoutes)

app.listen(process.env.PORT, () => console.log(`Server started at http://localhost:${process.env.PORT}`));   
