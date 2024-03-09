"use client"

import { useRef, useState, useEffect } from "react";
import { Dialog, ThemeProvider } from "@material-tailwind/react";
import toast, { Toaster } from "react-hot-toast";
import constants from "./constants";

let dummyObj: any = {};
let theme = {
  dialog: {
    defaultProps: {
      dismiss: {
        outsidePress:false,
        escapeKey:false
      }
    },
    styles: {
      base: {
        container: {
          bg: "bg-[#00000044]"
        }
      }
    }
  }
}

export default function Home() {
  let [showUserMenu,setShowUserMenu] = useState(false)
  let [showAuthDialog,setShowAuthDialog] = useState(false);
  let [showAuthScnType,setShowAuthScnType] = useState("state");
  let [username,setUsername] = useState("");
  let [password,setPassword] = useState("");
  let [showPass,setShowPass] = useState(false);
  let [confirmPassword,setConfirmPassword] = useState("");
  let [showConfirmPass,setShowConfirmPass] = useState(false);
  let [msgList,setMsgList] = useState<any[]>([]);
  let [userMsg,setUserMsg] = useState("");
  let keyDowns = useRef(dummyObj);

  useEffect(() => {
    setTimeout(getMessages);
  },[]);

  let scrollToChatBottom = () => {
    document.querySelector('.chatbox')!.scrollTop = document.querySelector('.chatbox')!.scrollHeight;
  }

  useEffect(() => {
    scrollToChatBottom();
  },[msgList]);

  let handleAuthDialog = () => {
    if(showAuthDialog) {}
    else {
      setShowAuthScnType("register");
    }
    setShowAuthDialog(!showAuthDialog);
  }

  let register = async() => {
    toast.dismiss();
    if(!/^[A-Za-z0-9]{8,}$/.test(username) || !/^[A-Za-z0-9]{8,}$/.test(password) || password!=confirmPassword) {
      toast.error("Username and passwords can only have alphanumeric characters, and more than 8 characters. Passwords should be same.",{
        className: 'custom-toast-style',
        position: "bottom-center"
      });
      return;
    }
    fetch(`${constants.baseUrl}/register`,{
      method: "POST",
      body: JSON.stringify({username,password}),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(async(res) => {
      if(!res.ok)
        throw Error((await res.json()).message);
      return res.json();
    }).then(res => {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setShowAuthScnType("login");
      toast.success(res.message);
    }).catch(err => {
      toast.error(err.message);
    });
  }

  let login = async() => {
    toast.dismiss();
    if(!username || !password) {
      toast.error("Username and passwords cannot be empty.",{
        className: 'custom-toast-style',
        position: "bottom-center"
      });
      return;
    }
    fetch(`${constants.baseUrl}/login`,{
      method: "POST",
      body: JSON.stringify({username,password}),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(async(res) => {
      if(!res.ok)
        throw Error((await res.json()).message);
      return res.json();
    })
    .then((res:any) => {
      window.localStorage.setItem("username",username);
      toast.success(res.message);
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      window.localStorage.setItem("token",res.token);
      window.location.reload();
    })
    .catch(err => {
      toast.error(err.message);
    });
  }

  let getMessages = async() => {
    let token = window.localStorage.getItem("token");
    if(token) {
      let resp = await fetch(`${constants.baseUrl}/get-messages`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token
        }
      });
      resp.json().then(res => {
        setUsername(window.localStorage.getItem("username") || "(no username)");
        setMsgList(res.data);
      });
    }
    else {
      setUsername("");
      window.localStorage.removeItem("username");
      window.localStorage.removeItem("token");
      setShowAuthDialog(true);
    }
  }

  let getUserMessage = (ev:any) => {
    setUserMsg(ev.target.value)
  }

  let checkKeyDownPress = (ev:any) => {
    keyDowns.current[ev.code] = true;
    if(ev.code == "Enter") {
      if(keyDowns.current['ShiftLeft'] || keyDowns.current['ShiftRight'])
        console.log("shift+enter detected")
      else
        postMessage();
      ev.preventDefault();
    }
  };

  let checkKeyUpPress = (ev:any) => {
    delete keyDowns.current[ev.code];
  };

  let postMessage = async() => {
    if(!userMsg) return;
    let tmp = [...msgList];
    tmp.push({
      sender: "user",
      receiver: "chatbot",
      message: userMsg,
      createdAt: Date.now()
    },{
      botMsgLoading: true,
    });
    setUserMsg("");
    setMsgList(tmp);
    let resp = await fetch(`${constants.baseUrl}/post-message`,{
      method: "POST",
      body: JSON.stringify({message:userMsg}),
      headers: ({
        "Content-Type": "application/json",
        "x-api-key": window.localStorage.getItem("token") || ""
      })
    });
    resp.json().then(res => {
      getMessages();
    });
  }

  let logout = () => {
    setShowUserMenu(false);
    setUsername("");
    window.localStorage.removeItem("username");
    window.localStorage.removeItem("token");
    window.location.reload();
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 main-page text-white justify-between">
      <ThemeProvider value={theme}>
        <Dialog open={showAuthDialog} handler={handleAuthDialog} placeholder={undefined}>
          <div id="auth-dialog-container">
            <div className="dialog-content">
              <div className="header">{showAuthScnType=="register" ? "Register" : "Login"}</div>
              <div className="body">
                <div><input className="w-full" value={username} placeholder="Username" onChange={e => setUsername(e.target.value)} spellCheck={"false"} /></div>
                <div className="password-input-container">
                  <input className="w-full" type={showPass ? "text" : "password"} value={password} placeholder="Password" onChange={e => setPassword(e.target.value)} spellCheck={"false"} />
                  <div>
                    <svg className={"h-6 text-gray-700 "+(showPass ? "block" : "hidden")} fill="none" onClick={() =>  setShowPass(!showPass)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                      <path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z">
                      </path>
                    </svg>
                    <svg className={"h-6 text-gray-700 "+(!showPass ? "block" : "hidden")} fill="none" onClick={() =>  setShowPass(!showPass)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                      <path fill="currentColor" d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z">
                      </path>
                    </svg>
                  </div>
                </div>
                {showAuthScnType=="register"
                  ? <div className="password-input-container">
                      <input className="w-full" type={showConfirmPass ? "text" : "password"} value={confirmPassword} placeholder="Confirm Password" onChange={e => setConfirmPassword(e.target.value)} spellCheck={"false"} />
                      <div>
                        <svg className={"h-6 text-gray-700 "+(showConfirmPass ? "block" : "hidden")} fill="none" onClick={() =>  setShowConfirmPass(!showConfirmPass)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                          <path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z">
                          </path>
                        </svg>
                        <svg className={"h-6 text-gray-700 "+(!showConfirmPass ? "block" : "hidden")} fill="none" onClick={() =>  setShowConfirmPass(!showConfirmPass)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                          <path fill="currentColor" d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z">
                          </path>
                        </svg>
                      </div>
                    </div>
                  : <></>
                }
              </div>
              <div className="footer">
                <div className="underline decoration-[#42275a] text-[#42275a]" onClick={() => setShowAuthScnType(showAuthScnType=="register" ? "login" : "register")}>{showAuthScnType=="register" ? "Already have an account?" : "Don't have an account?"}</div>
                <div className="px-2 py-1 bg-[#42275a] text-white font-extralight rounded-xl" onClick={() => showAuthScnType=="register" ? register() : login()}>{showAuthScnType=="register" ? "Register" : "Login"}</div>
              </div>
            </div>
          </div>
        </Dialog>
        <div>
          <div className="flex items-end">
            <div className="message-button" onClick={() => setShowUserMenu(!showUserMenu)}>
              <svg className="h-6 w-6 text-indigo-500" data-dropdown-toggle="user-menu" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div id="user-menu" className={"z-10 font-normal bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600" + (showUserMenu ? "" : " hidden")}>
              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownLargeButton">
                <li>
                  <a className="block px-4 py-2 cursor-default hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{username}</a>
                </li>
                <li>
                  <a onClick={logout} className="block px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Logout</a>
                </li>
              </ul>
            </div>
          </div>
          <h1 className="text-3xl">Welcome to our chat bot, Sunny!</h1>
          <div className="mt-4 font-extralight text-sm">Post your queries here, and let Sunny take care of the rest <span>&#128516;</span></div>
        </div>
        <div className="w-full">
          <div className="chatbox py-3 px-1 flex flex-col">
            {msgList.map((obj:any) => obj.botMsgLoading ?
              <div key={"botResponseLoading"} className='h-fit flex space-x-2 justify-center items-center bg-transparent light:invert chatmsg chatbot'>
                <div className='h-3 w-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                <div className='h-3 w-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                <div className='h-3 w-3 bg-white rounded-full animate-bounce'></div>
              </div>
            : <div key={obj.createdAt} className={"chatmsg "+(obj.sender=="chatbot" ? "by-chatbot" : "by-user")}>{obj.message}</div>)}
          </div>
          <div className="input-container">
            <input id="input-field" value={userMsg} onChange={e => getUserMessage(e)} spellCheck="false" onKeyDownCapture={e => checkKeyDownPress(e)} onKeyUpCapture={e => checkKeyUpPress(e)} />
            <div className="message-button" onClick={postMessage}>
              <svg className="h-7 w-7 text-[#734b6d] text-sm" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" />  <line x1="8" y1="9" x2="16" y2="9" />  <line x1="8" y1="13" x2="14" y2="13" /></svg>
            </div>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </main>
  );
}
