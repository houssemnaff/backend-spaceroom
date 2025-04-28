const express = require("express");
const { registerUser, loginUser, getUsers, googleLogin, googleRegister } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/google-login", googleLogin);
router.post("/google-register", googleRegister);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", protect, adminOnly, getUsers);

module.exports = router;
