const $ = (id) => document.getElementById(id);
const STORAGE = "focusflow-v1";
const defaults = {focus:25,short:5,long:15,cycle:4,auto:false};
let state = loadState();
let mode = "focus", running = false, endAt = null, remaining = state.settings.focus*60, ticker = null;
let deferredInstall = null;
const circumference = 2*Math.PI*116;

function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function loadState(){
  try {const s=JSON.parse(localStorage.getItem(STORAGE)||"{}");return {settings:{...defaults,...s.settings},tasks:Array.isArray(s.tasks)?s.tasks:[],sessions:Array.isArray(s.sessions)?s.sessions:[]};}
  catch{return {settings:{...defaults},tasks:[],sessions:[]};}
}
function persist(){localStorage.setItem(STORAGE,JSON.stringify(state));}
function duration(m=mode){return state.settings[m]*60;}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2200);}
function renderTimer(){
  const total=duration(), left=running?Math.max(0,Math.ceil((endAt-Date.now())/1000)):remaining;
  $("time").textContent=fmt(left);
  $("timerStatus").textContent=running?"SESSION IN PROGRESS":left===0?"SESSION COMPLETE":"READY TO "+(mode==="focus"?"FOCUS":"REST");
  $("startBtn").textContent=running?"Pause":left===0?"Start again":mode==="focus"?"Start focus":"Start break";
  $("progressRing").style.strokeDashoffset=String(circumference*(1-Math.max(0,Math.min(1,left/total))));
  $("sessionCount").textContent=state.sessions.filter(s=>s.day===todayKey()).length;
}
function stopTicker(){if(ticker){clearInterval(ticker);ticker=null;}}
function tick(){
  if(!running)return;
  remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
  if(remaining<=0){completeSession();return;}
  renderTimer();
}
function start(){
  if(remaining<=0)remaining=duration();
  running=true;endAt=Date.now()+remaining*1000;
  stopTicker();ticker=setInterval(tick,250);renderTimer();
}
function pause(){
  remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));running=false;endAt=null;stopTicker();renderTimer();
}
function reset(){pause();remaining=duration();renderTimer();}
function switchMode(next){
  pause();mode=next;remaining=duration();document.querySelectorAll(".mode").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));renderTimer();
}
function completeSession(){
  running=false;endAt=null;stopTicker();remaining=0;
  if(mode==="focus"){
    state.sessions.push({day:todayKey(),minutes:state.settings.focus,at:Date.now()});
    persist();renderStats();
    const todayCount=state.sessions.filter(s=>s.day===todayKey()).length;
    toast("Focus session complete. Take a moment to reset.");
    notify("Focus session complete","Well done. Time for a break.");
    const next=todayCount%state.settings.cycle===0?"long":"short";
    switchMode(next);
  }else{
    toast("Break complete. Ready for another focus session?");
    notify("Break complete","Your next focus session is ready.");
    switchMode("focus");
  }
  renderTimer();
  if(state.settings.auto)start();
}
function notify(title,body){
  if("Notification"in window&&Notification.permission==="granted"){
    try{new Notification(title,{body,icon:"icon.svg"});}catch{}
  }
}
$("startBtn").addEventListener("click",()=>{
  if(running){pause();return;}
  if("Notification"in window&&Notification.permission==="default")Notification.requestPermission().catch(()=>{});
  start();
});
$("resetBtn").addEventListener("click",reset);
document.querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>switchMode(b.dataset.mode)));

function renderTasks(){
  const list=$("taskList");list.innerHTML="";
  state.tasks.forEach(task=>{
    const li=document.createElement("li");li.className="task-item"+(task.done?" done":"");
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=task.done;cb.setAttribute("aria-label","Mark task complete");
    cb.addEventListener("change",()=>{task.done=cb.checked;persist();renderTasks();});
    const span=document.createElement("span");span.textContent=task.text;
    const del=document.createElement("button");del.className="delete-task";del.textContent="×";del.setAttribute("aria-label","Delete task");
    del.addEventListener("click",()=>{state.tasks=state.tasks.filter(t=>t.id!==task.id);persist();renderTasks();});
    li.append(cb,span,del);list.append(li);
  });
  $("taskCount").textContent=state.tasks.filter(t=>!t.done).length;
  $("emptyTasks").hidden=state.tasks.length>0;
}
$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();const text=$("taskInput").value.trim();if(!text)return;
  state.tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),text,done:false});
  $("taskInput").value="";persist();renderTasks();
});
function renderStats(){
  const today=todayKey(), days=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;days.push({key,mins:state.sessions.filter(s=>s.day===key).reduce((a,s)=>a+s.minutes,0)});}
  const mins=days[6].mins;$("focusMinutes").innerHTML=`${mins}<span> min</span>`;
  const max=Math.max(25,...days.map(d=>d.mins));const bars=$("weekBars");bars.innerHTML="";
  days.forEach((d,i)=>{const col=document.createElement("div");col.className="bar-column";const val=document.createElement("span");val.className="bar-value";val.textContent=d.mins||"";const bar=document.createElement("div");bar.className="bar"+(i===6?" today":"");bar.style.height=`${Math.max(3,d.mins/max*66)}px`;bar.title=`${d.key}: ${d.mins} focus minutes`;col.append(val,bar);bars.append(col);});
  $("sessionCount").textContent=state.sessions.filter(s=>s.day===today).length;
}
function loadSettingsUI(){
  $("focusSetting").value=state.settings.focus;$("shortSetting").value=state.settings.short;$("longSetting").value=state.settings.long;$("cycleSetting").value=state.settings.cycle;$("autoStartSetting").checked=state.settings.auto;
}
$("saveSettings").addEventListener("click",()=>{
  const read=(id,min,max,fallback)=>{const n=Number($(id).value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;};
  state.settings={focus:read("focusSetting",1,120,25),short:read("shortSetting",1,30,5),long:read("longSetting",1,60,15),cycle:read("cycleSetting",2,8,4),auto:$("autoStartSetting").checked};
  persist();reset();toast("Timer preferences saved.");
});
window.addEventListener("visibilitychange",()=>{if(!document.hidden&&running)tick();});
window.addEventListener("pageshow",()=>{if(running)tick();});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
loadSettingsUI();renderTasks();renderStats();renderTimer();