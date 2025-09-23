const socket = io();

// DOM
const authScreen = document.getElementById("auth-screen");
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

// Avatar colors
const colors = ["#e57373","#f06292","#ba68c8","#64b5f6","#4db6ac","#81c784","#ffd54f","#ffb74d","#a1887f","#90a4ae"];
function getAvatarColor(name) {
  let hash=0; for (let i=0;i<name.length;i++) hash=name.charCodeAt(i)+((hash<<5)-hash);
  return colors[Math.abs(hash)%colors.length];
}
function createAvatar(name, small=false) {
  const div=document.createElement("div");
  div.className="avatar";
  div.style.background=getAvatarColor(name);
  div.textContent=name.charAt(0).toUpperCase();
  if(small){div.style.width="28px";div.style.height="28px";div.style.fontSize="13px";}
  return div;
}

let username=null;

// Auto-login from localStorage
window.addEventListener("load",()=>{
  const saved=JSON.parse(localStorage.getItem("account"));
  if(saved){
    socket.emit("login",saved,(res)=>{
      if(res.success){username=res.username;showChat();}
      else localStorage.removeItem("account");
    });
  }
});

function showChat(){
  authScreen.style.display="none";
  chatContainer.style.display="flex";
  input.focus();
}

// Register
registerBtn.addEventListener("click",()=>{
  const name=authUsername.value.trim();
  const pass=authPassword.value;
  socket.emit("register",{name,password:pass},(res)=>{
    if(!res.success) authError.textContent=res.message;
    else{
      localStorage.setItem("account",JSON.stringify({name,password:pass}));
      socket.emit("login",{name,password:pass},(res2)=>{
        if(res2.success){username=res2.username;showChat();}
      });
    }
  });
});

// Login
loginBtn.addEventListener("click",()=>{
  const name=authUsername.value.trim();
  const pass=authPassword.value;
  socket.emit("login",{name,password:pass},(res)=>{
    if(!res.success) authError.textContent=res.message;
    else{
      localStorage.setItem("account",JSON.stringify({name,password:pass}));
      username=res.username;
      showChat();
    }
  });
});

// Messages
function addMessage({user,text}){
  const item=document.createElement("div");
  if(user==="Server"){item.className="message server";item.textContent=text;}
  else{
    item.className="message";
    const avatar=createAvatar(user);
    const content=document.createElement("div");content.className="message-content";
    const header=document.createElement("div");header.className="username";header.textContent=user;
    const textEl=document.createElement("div");textEl.className="text";textEl.textContent=text;
    content.appendChild(header);content.appendChild(textEl);
    item.appendChild(avatar);item.appendChild(content);
  }
  chat.appendChild(item);chat.scrollTop=chat.scrollHeight;
}

form.addEventListener("submit",(e)=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text) return;
  socket.emit("chatMessage",text);
  input.value="";
});

socket.on("chatMessage",addMessage);

socket.on("userList",(users)=>{
  userList.innerHTML="";
  users.forEach((u)=>{
    const el=document.createElement("div");el.className="user";
    el.appendChild(createAvatar(u,true));
    const span=document.createElement("span");span.textContent=u;
    el.appendChild(span);userList.appendChild(el);
  });
});
