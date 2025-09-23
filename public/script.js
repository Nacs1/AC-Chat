const socket = io();

// --- DOM ---
const joinScreen = document.getElementById("join-screen");
const joinForm = document.getElementById("join-form");
const usernameInput = document.getElementById("username");
const chatContainer = document.getElementById("chat-container");
const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const userList = document.getElementById("user-list");

// --- Avatar colors + helpers ---
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

function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// --- Message stacking state ---
let lastUser = null;
let lastTime = null;

function addMessage({ user, text }) {
  // Server-style messages
  if (user === "Server") {
    const item = document.createElement("div");
    item.className = "message server";
    item.textContent = text;
    chat.appendChild(item);

    lastUser = null;
    lastTime = null;
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;
  const needNewBlock =
    user !== lastUser || !lastTime || now - lastTime > fiveMinutes;

  if (needNewBlock) {
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
    // append to last block
    let lastMsgElement = null;
    for (let i = chat.children.length - 1; i >= 0; i--) {
      const el = chat.children[i];
      if (el.classList && el.classList.contains("message") && !el.classList.contains("server")) {
        lastMsgElement = el;
        break;
      }
    }

    if (lastMsgElement) {
      const lastMsgContent = lastMsgElement.querySelector(".message-content");
      const textEl = document.createElement("div");
      textEl.className = "text";
      textEl.textContent = text;
      lastMsgContent.appendChild(textEl);
    }
  }

  lastUser = user;
  lastTime = now;
  chat.scrollTop = chat.scrollHeight;
}

// --- Typing indicator ---
const typingIndicator = document.createElement("div");
typingIndicator.style.fontStyle = "italic";
typingIndicator.style.color = "#b9bbbe";
typingIndicator.style.fontSize = "14px";
chat.parentElement.insertBefore(typingIndicator, form);

let typing = false;
let typingTimeout = null;
let typingUsers = new Set();

function sendTyping(status) {
  socket.emit("typing", status);
}

function updateTypingIndicator() {
  const others = Array.from(typingUsers);
  if (others.length === 0) {
    typingIndicator.textContent = "";
  } else if (others.length === 1) {
    typingIndicator.textContent = `${others[0]} is typing...`;
  } else {
    const names = others.slice(0, 2).join(" and ");
    typingIndicator.textContent = `${names} are typing...`;
  }
}

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

// --- Notifications ---
let unreadCount = 0;
const originalTitle = document.title;
const notifySound = new Audio("/notify.mp3");

// Reset when tab is focused
window.addEventListener("focus", () => {
  unreadCount = 0;
  document.title = originalTitle;
});

// --- Socket events ---
let username = null;

socket.on("chatMessage", (msg) => {
  addMessage(msg);

  // Only notify if not our own or server msg
  if (msg.user !== username && msg.user !== "Server") {
    // Play sound
    notifySound.play().catch(() => {});
  }

  // Update title if tab is inactive
  if (document.hidden && msg.user !== username && msg.user !== "Server") {
    unreadCount++;
    if (unreadCount > 9) {
      document.title = "(9+) " + originalTitle;
    } else {
      document.title = `(${unreadCount}) ${originalTitle}`;
    }
  }
});

// Online users list
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

// Typing from others
socket.on("typing", ({ user, isTyping }) => {
  if (!user) return;
  if (user === (username || "")) return;

  if (isTyping) typingUsers.add(user);
  else typingUsers.delete(user);
  updateTypingIndicator();
});

// --- Join form ---
joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = usernameInput.value.trim() || "Anonymous";
  socket.emit("setUsername", username);

  joinScreen.style.display = "none";
  chatContainer.style.display = "flex";
  input.focus();
});

// --- Send message ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  socket.emit("chatMessage", text);

  if (typing) {
    typing = false;
    sendTyping(false);
  }

  input.value = "";
});
