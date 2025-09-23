const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

// Accounts and users
const accounts={}; // {username:password}
const users={};    // {socket.id:username}

io.on("connection",(socket)=>{
  let username=null;

  socket.on("register",({name,password},cb)=>{
    if(accounts[name]) return cb({success:false,message:"Username already taken"});
    if(!password||password.length<8) return cb({success:false,message:"Password must be at least 8 characters"});
    accounts[name]=password;
    cb({success:true});
  });

  socket.on("login",({name,password},cb)=>{
    if(!accounts[name]) return cb({success:false,message:"No such user"});
    if(accounts[name]!==password) return cb({success:false,message:"Invalid password"});
    username=name;
    users[socket.id]=username;
    io.emit("chatMessage",{user:"Server",text:`${username} joined the chat`});
    io.emit("userList",Object.values(users));
    cb({success:true,username});
  });

  socket.on("chatMessage",(msg)=>{
    if(username) io.emit("chatMessage",{user:username,text:msg});
  });

  socket.on("disconnect",()=>{
    if(username){
      delete users[socket.id];
      io.emit("chatMessage",{user:"Server",text:`${username} left the chat`});
      io.emit("userList",Object.values(users));
    }
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`✅ Server running on port ${PORT}`));
