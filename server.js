const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Enable CORS so Socket.IO works on Render
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Track users ---
const users = {};

io.on("connection", (socket) => {
  console.log("a user connected");

  let username = "Anonymous";

  // User sets their name
  socket.on("setUsername", (name) => {
    username = name.trim() || "Anonymous";
    users[socket.id] = username;

    io.emit("chatMessage", { user: "Server", text: `${username} joined the chat` });
    io.emit("userList", Object.values(users));
  });

  // Handle chat messages
  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", { user: username, text: msg });
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", { user: username, isTyping });
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("chatMessage", { user: "Server", text: `${username} left the chat` });
    io.emit("userList", Object.values(users));
  });
});

// Render gives you the port in process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
