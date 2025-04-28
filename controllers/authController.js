const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { default: axios } = require("axios");


// Inscription
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role="user";
    const userExists = await User.findOne({ email });

    if (userExists) return res.status(400).json({ message: "L'utilisateur existe déjà" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });

    await newUser.save();
    const user = await User.findOne({ email });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ user: user,token:token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Connexion
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer les utilisateurs (admin uniquement)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Récupérer les utilisateurs (admin uniquement)
const getUser = async (req, res) => {
  try {
    const user = await User.findOne(req.user.email);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Google Registration
const googleRegister = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google token
    const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

    const { email, name, picture, sub } = googleResponse.data; // sub = Google ID

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        googleId: sub,
        name,
        email,
        imageurl: picture,
        role: "user", // Default role
      });

      await user.save();
    }

    // Generate a JWT token
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid Google token" });
  }
};


const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google token
    const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

    const { email, name, picture, sub } = googleResponse.data; // sub = Google ID

    // Check if the user already exists
    const user = await User.findOne({ email });

    if (!user) {
      // If the user doesn't exist, return an error
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    // Generate a JWT token
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Return the token and user data
    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid Google token" });
  }
};


module.exports = { registerUser, loginUser, getUsers, googleLogin, googleRegister };
