const socket = io();

const joinScreen = document.getElementById("join-screen");
const joinForm = document.getElementById("join-form");
const usernameInput = document.getElementById("username");
const chatContainer = document.getElementById("chat-container");

const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const userList = document.getElementById("user-list");

let username = null;

// Colors for avatars
const colors = [
  "#e57373", "#f06292", "#ba68c8", "#64b5f6", "#4db6ac",
  "#81c784", "#ffd54f", "#ffb74d", "#a1887f", "#90a4ae"
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function createAvatar(name, small = false) {
  const div = document.createElement("div");
  div.className = "avatar";
  div.style.background = getAvatarColor(name);
  div.textContent = name.charAt(0).toUpperCase();
  if (small) {
    div.style.width = "28px";
    div.style.height = "28px";
    div.style.fontSize = "13px";
  }
  return div;
}

// --- Time formatting ---
function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Track last message for stacking logic
let lastUser = null;
let lastTime = null;

// Handle join form
joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = usernameInput.value.trim() || "Anonymous";
  socket.emit("setUsername", username);

  joinScreen.style.display = "none";
  chatContainer.style.display = "flex";
});

// Add message with stacking
function addMessage({ user, text }) {
  if (user === "Server") {
    const item = document.createElement("div");
    item.className = "message server";
    item.textContent = text;
    chat.appendChild(item);
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  let newBlock = false;

  if (
    user !== lastUser ||                // Different user
    !lastTime ||                        // No last time
    now - lastTime > fiveMinutes        // More than 5 min passed
  ) {
    newBlock = true;
  }

  if (newBlock) {
    // New block with avatar + username + time
    const item = document.createElement("div");
    item.className = "message";

    const avatar = createAvatar(user);
    const content = document.createElement("div");
    content.className = "message-content";

    const header = document.createElement("div");
    header.className = "username";
    header.textContent = `${user} `;
    const timeEl = document.createElement("span");
    timeEl.style.color = "#b9bbbe";
    timeEl.style.fontSize = "12px";
    timeEl.textContent = formatTime(now);
    header.appendChild(timeEl);

    const textEl = document.createElement("div");
    textEl.className = "text";
    textEl.textContent = text;

    content.appendChild(header);
    content.appendChild(textEl);

    item.appendChild(avatar);
    item.appendChild(content);

    chat.appendChild(item);
  } else {
    // Stack under same user (no avatar/name)
    const lastMsg = chat.lastElementChild.querySelector(".message-content");
    const textEl = document.createElement("div");
    textEl.className = "text";
    textEl.textContent = text;
    lastMsg.appendChild(textEl);
  }

  lastUser = user;
  lastTime = now;

  chat.scrollTop = chat.scrollHeight;
}

socket.on("chatMessage", (msg) => {
  addMessage(msg);
});

// Update user list
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

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
});
