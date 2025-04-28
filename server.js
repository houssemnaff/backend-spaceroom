// In server.js
const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io"); // Import Server from socket.io
const connectDB = require("./config/db");
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Create io instance using Server constructor
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Import socket controller and pass io instance
const socketController = require("./controllers/socketController");

socketController(io); // Pass io to the controller

// Middleware setup
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`Requête reçue : ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Routes
app.use("/auth0", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/course", require("./routes/courseRoutes"));
app.use("/courseassignment", require("./routes/assignments"));
app.use("/courssubmission", require("./routes/submissions"));
//app.use("/quiz", require("./routes/quizrouters"));
app.use("/quizch", require("./routes/quizrouterchapitre"));


app.use("/meetings", require("./routes/meetingrouters"));
app.use("/notification", require("./routes/notificationrouter"));


// Routes
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT ;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));