const express = require("express");
const Login = require("./login.controller");
const router = express.Router();

router.post("/login", Login);

module.exports = router;