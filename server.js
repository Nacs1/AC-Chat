const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const users = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  let username = "Anonymous";

  socket.on("setUsername", (name) => {
    username = name.trim() || "Anonymous";
    users[socket.id] = username;

    io.emit("chatMessage", {
      user: "Server",
      text: `${username} joined the chat`,
    });

    io.emit("userList", Object.values(users));
  });

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", {
      user: username,
      text: msg,
    });
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", {
      user: username,
      isTyping,
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];

    io.emit("chatMessage", {
      user: "Server",
      text: `${username} left the chat`,
    });

    io.emit("userList", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
