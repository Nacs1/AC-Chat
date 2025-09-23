const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store accounts + online users
const accounts = {}; // { username: password }
const users = {};    // { socket.id: username }

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");

  let username = null;

  // --- Registration ---
  socket.on("register", ({ name, password }, callback) => {
    if (accounts[name]) {
      return callback({ success: false, message: "Username already taken" });
    }
    if (!password || password.length < 8) {
      return callback({ success: false, message: "Password must be at least 8 characters" });
    }

    accounts[name] = password;
    console.log(`✅ Registered: ${name}`);
    callback({ success: true });
  });

  // --- Login ---
  socket.on("login", ({ name, password }, callback) => {
    if (!accounts[name]) {
      return callback({ success: false, message: "No such user" });
    }
    if (accounts[name] !== password) {
      return callback({ success: false, message: "Invalid password" });
    }

    username = name;
    users[socket.id] = username;

    io.emit("chatMessage", { user: "Server", text: `${username} joined the chat` });
    io.emit("userList", Object.values(users));

    callback({ success: true, username });
  });

  // --- Chat messages ---
  socket.on("chatMessage", (msg) => {
    if (username) {
      io.emit("chatMessage", { user: username, text: msg });
    }
  });

  // --- Typing ---
  socket.on("typing", (isTyping) => {
    if (username) {
      socket.broadcast.emit("typing", { user: username, isTyping });
    }
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    if (username) {
      delete users[socket.id];
      io.emit("chatMessage", { user: "Server", text: `${username} left the chat` });
      io.emit("userList", Object.values(users));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
