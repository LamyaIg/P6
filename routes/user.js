const express = require("express");
const router = express.Router();

const CtrlUser = require("../Controllers/user");

router.post("/signup", CtrlUser.signup);
router.post("/login", CtrlUser.login);

module.exports = router;