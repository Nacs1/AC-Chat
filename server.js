const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public"
app.use(express.static("public"));

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

// PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
