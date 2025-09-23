const socket = io();

// --- DOM ---
const joinScreen = document.getElementById("join-screen");
const joinForm = document.getElementById("join-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const chatContainer = document.getElementById("chat-container");
const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const userList = document.getElementById("user-list");

// Avatar colors
const colors = [
  "#e57373","#f06292","#ba68c8","#64b5f6","#4db6ac",
  "#81c784","#ffd54f","#ffb74d","#a1887f","#90a4ae"
];

function getAvatarColor(name){
  let hash=0;
  for(let i=0;i<name.length;i++){
    hash=name.charCodeAt(i)+((hash<<5)-hash);
  }
  return colors[Math.abs(hash)%colors.length];
}

function createAvatar(name,small=false){
  const div=document.createElement("div");
  div.className="avatar";
  div.style.background=getAvatarColor(name);
  div.textContent=name.charAt(0).toUpperCase();
  if(small){
    div.style.width="28px";
    div.style.height="28px";
    div.style.fontSize="13px";
  }
  return div;
}

function formatTime(date){
  let h=date.getHours();
  const m=date.getMinutes().toString().padStart(2,"0");
  const ampm=h>=12?"PM":"AM";
  h=h%12||12;
  return `${h}:${m} ${ampm}`;
}

// --- Message stacking state ---
let lastUser=null;
let lastTime=null;

function addMessage({user,text}){
  if(user==="Server"){
    const item=document.createElement("div");
    item.className="message server";
    item.textContent=text;
    chat.appendChild(item);
    lastUser=null;
    lastTime=null;
    chat.scrollTop=chat.scrollHeight;
    return;
  }

  const now=new Date();
  const fiveMinutes=5*60*1000;
  const needNewBlock=(user!==lastUser || !lastTime || now-lastTime>fiveMinutes);

  if(needNewBlock){
    const item=document.createElement("div");
    item.className="message";

    const avatar=createAvatar(user);
    const content=document.createElement("div");
    content.className="message-content";

    const header=document.createElement("div");
    header.className="username";
    header.textContent=user+" ";

    const timeEl=document.createElement("span");
    timeEl.style.color="#b9bbbe";
    timeEl.style.fontSize="12px";
    timeEl.textContent=formatTime(now);
    header.appendChild(timeEl);

    const textEl=document.createElement("div");
    textEl.className="text";
    textEl.textContent=text;

    content.appendChild(header);
    content.appendChild(textEl);

    item.appendChild(avatar);
    item.appendChild(content);
    chat.appendChild(item);
  }else{
    let lastMsgElement=null;
    for(let i=chat.children.length-1;i>=0;i--){
      const el=chat.children[i];
      if(el.classList && el.classList.contains("message") && !el.classList.contains("server")){
        lastMsgElement=el;
        break;
      }
    }
    if(lastMsgElement){
      const content=lastMsgElement.querySelector(".message-content");
      const textEl=document.createElement("div");
      textEl.className="text";
      textEl.textContent=text;
      content.appendChild(textEl);
    }
  }

  lastUser=user;
  lastTime=now;
  chat.scrollTop=chat.scrollHeight;
}

// === Register/Login ===
let username=null;

joinForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  const name=usernameInput.value.trim();
  const pass=passwordInput.value;

  socket.emit("login",{name,password:pass},(res)=>{
    if(res.success){
      username=res.username;
      joinScreen.style.display="none";
      chatContainer.style.display="flex";
      input.focus();
    }else{
      alert(res.message);
    }
  });
});

// --- Notifications ---
let unreadCount=0;
const originalTitle=document.title;
const notifySound=new Audio("/notify.mp3");

window.addEventListener("focus",()=>{
  unreadCount=0;
  document.title=originalTitle;
});

// --- Messages ---
socket.on("chatMessage",(msg)=>{
  addMessage(msg);

  // Notification if not own message & not server
  if(msg.user!==username && msg.user!=="Server"){
    if(document.hidden){
      notifySound.play().catch(()=>{});
      unreadCount++;
      if(unreadCount>9){
        document.title="(9+) "+originalTitle;
      }else{
        document.title=`(${unreadCount}) ${originalTitle}`;
      }
    }
  }
});

form.addEventListener("submit",(e)=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text) return;
  socket.emit("chatMessage",text);
  input.value="";
});

// --- Online users ---
socket.on("userList",(users)=>{
  userList.innerHTML="";
  users.forEach((u)=>{
    const userEl=document.createElement("div");
    userEl.className="user";
    const avatar=createAvatar(u,true);
    const name=document.createElement("span");
    name.textContent=u;
    userEl.appendChild(avatar);
    userEl.appendChild(name);
    userList.appendChild(userEl);
  });
});
