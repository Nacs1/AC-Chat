const socket = io();

const joinScreen = document.getElementById("join-screen");
const joinForm = document.getElementById("join-form");
const usernameInput = document.getElementById("username");
const chatContainer = document.getElementById("chat-container");

const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const userList = document.getElementById("user-list");

// Typing indicator element
const typingIndicator = document.createElement("div");
typingIndicator.style.fontStyle = "italic";
typingIndicator.style.color = "#b9bbbe";
typingIndicator.style.fontSize = "14px";
chat.parentElement.appendChild(typingIndicator);

let username = null;
let typing = false;
let typingTimeout;

function sendTyping(status) {
  socket.emit("typing", status);
}

// Detect typing
input.addEventListener("input", () => {
  if (!typing) {
    typing = true;
    sendTyping(true);
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typing = false;
    sendTyping(false);
  }, 1500);
});

// --- Handle typing from others ---
socket.on("typing", ({ user, isTyping }) => {
  if (isTyping) {
    typingIndicator.textContent = `${user} is typing...`;
  } else {
    typingIndicator.textContent = "";
  }
});

// --- User list update ---
socket.on("userList", (users) => {
  userList.innerHTML = "";
  users.forEach((u) => {
    const userEl = document.createElement("div");
    userEl.className = "user";
    const avatar = createAvatar(u, true);
    const name = document.createElement("span");
    name.textContent = u;
    userEl.appendChild(avatar);
    userEl.appendChild(name);
    userList.appendChild(userEl);
  });
});
