const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected");

  // Save username for this socket
  let username = "Anonymous";

  // When user sets their name
  socket.on("setUsername", (name) => {
    username = name.trim() || "Anonymous";
    io.emit("chatMessage", { user: "Server", text: `${username} joined the chat` });
  });

  // Handle chat messages
  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", { user: username, text: msg });
  });

  // When disconnecting
  socket.on("disconnect", () => {
    io.emit("chatMessage", { user: "Server", text: `${username} left the chat` });
  });
});

// IMPORTANT: Use Render’s port or fallback to 3000 locally
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
