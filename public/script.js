const socket = io();

// --- DOM ---
const authScreen = document.getElementById("auth-screen");
const authForm = document.getElementById("auth-form");
const authUsername = document.getElementById("auth-username");
const authPassword = document.getElementById("auth-password");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const authError = document.getElementById("auth-error");

const chatContainer = document.getElementById("chat-container");
const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const userList = document.getElementById("user-list");

let username = null;

// --- Local storage auto-login ---
window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("account"));
  if (saved) {
    socket.emit("login", saved, (res) => {
      if (res.success) {
        username = res.username;
        showChat();
      } else {
        localStorage.removeItem("account");
      }
    });
  }
});

// --- Show chat after login ---
function showChat() {
  authScreen.style.display = "none";
  chatContainer.style.display = "flex";
  input.focus();
}

// --- Register ---
registerBtn.addEventListener("click", () => {
  const name = authUsername.value.trim();
  const pass = authPassword.value;

  socket.emit("register", { name, password: pass }, (res) => {
    if (!res.success) {
      authError.textContent = res.message;
    } else {
      localStorage.setItem("account", JSON.stringify({ name, password: pass }));
      socket.emit("login", { name, password: pass }, (res2) => {
        if (res2.success) {
          username = res2.username;
          showChat();
        }
      });
    }
  });
});

// --- Login ---
loginBtn.addEventListener("click", () => {
  const name = authUsername.value.trim();
  const pass = authPassword.value;

  socket.emit("login", { name, password: pass }, (res) => {
    if (!res.success) {
      authError.textContent = res.message;
    } else {
      localStorage.setItem("account", JSON.stringify({ name, password: pass }));
      username = res.username;
      showChat();
    }
  });
});

// --- Messages ---
function addMessage({ user, text }) {
  const item = document.createElement("div");
  item.className = "message";
  item.textContent = `${user}: ${text}`;
  chat.appendChild(item);
  chat.scrollTop = chat.scrollHeight;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("chatMessage", text);
  input.value = "";
});

socket.on("chatMessage", addMessage);

// --- Online users ---
socket.on("userList", (users) => {
  userList.innerHTML = "";
  users.forEach((u) => {
    const div = document.createElement("div");
    div.textContent = u;
    userList.appendChild(div);
  });
});
