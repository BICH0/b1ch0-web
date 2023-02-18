const maxwinds = 3;
const command = new commands();
const screen_state = new tscreen();
var current_dir;
var language;
var files;
const history = [];
var position = 0;
var dir_stat = false;
var waiting = true;
var warnmsg = false;
const terminal = document.getElementById("terminal");
const terminal_header = document.getElementById("terminal-header");
const stdout = document.getElementById("terminal-content");
const stdin = document.getElementById("stdin");
const prompt = document.getElementById("prompt").childNodes.item(1);
const font_size = getComputedStyle(prompt).lineHeight;
const window_container = document.getElementById("subwindows");
var win_width = terminal.offsetWidth - 20;
var win_height = terminal.offsetHeight - prompt.offsetHeight - terminal_header.offsetHeight;

function start() {
  openstorage();
  resize_term();
  darkmode("load");
  fetch('https://ivan.confugiradores.es/data.json').then(response => response.json()).then(json => JSON.stringify(json)).then(json => JSON.parse(json)).then(result => {
    webpage_sections = Array.from(result["route"]);
    console.log(result["lang"])
    language = result["lang"];
    files = result["files"];
    sortfiles();
    ready();
  });
};

function ready(){
  stdout.style.bottom = parseInt(getComputedStyle(prompt).lineHeight.slice(0,-2)) + 5 + "px";
  stdout.innerHTML = "<br>";
  if (warnmsg == "false"){
    stdout.innerHTML += screen_state.home;
  }
  stdout.innerHTML += screen_state.dirtree;
  for (i=0;i<maxwinds;i++) {
    let random = Math.random() * 20;
    open_windows[i] = new window_creator();
    let nwin = document.getElementById("window" + i);
    if (i != 0){
      let owin = document.getElementById("window" + (i - 1));
      nwin.style.top = getComputedStyle(owin).top.slice(0,-2) * (i * 1.2 ) + random + "px";
      nwin.style.right = getComputedStyle(owin).right.slice(0,-2) * (i * 0.5) + random + "px";
    }
  }
}

function openstorage(){
  let storage_warn = storage.getItem('warnmsg');
  if (storage_warn){
    warnmsg = storage_warn;
  }
};

function load_lang(){
  if (lang == "en"){
    lang_line.style.marginLeft = "56%";
  }else{
    lang_line.style.marginLeft = "11%";
  }
}

function resize_term(){
  var win_width = terminal.offsetWidth - 20;
  stdin.style.width = win_width - prompt.offsetWidth - 10 + "px";
}

function sortfiles(){
  function analyze_folder(folder,predecesor=""){
    for (let x=0; x<folder.length; x++) {
      if (Array.isArray(folder[x])){
        analyze_folder(folder[x],folder[0] + "/");
      }
      else{
        if (x != 0){
          organizer(predecesor + folder[0] + "/" + folder[x]);
        }
      }
    }
  }
  function organizer(file){
    switch (file.split(".")[1]) {
      case "md":
      case "txt":
        tree_files.push(file);
      break;
      case "html":
      case "git":
        tree_html.push(file);
      break;
    }
  }
  webpage_sections.forEach( file => {
    if (Array.isArray(file)){
      analyze_folder(file);
    }
    else{
      organizer(file);
    }
  })
};

function height_check(lines=1) {
  if (font_size.slice(0,-2) * lines + stdout.offsetHeight - 10 >= win_height){
    stdout.style.height = win_height - 8 + "px";
  }
  stdout.scrollTop = stdout.scrollHeight;
};
function close_win(self) {
  open_windows[self.slice(-1)].close();
};

async function write_value(command) {
  stdin.value = "";
  for (let x=0; x<command.length; x++){
    await sleep(30);
    stdin.value += command[x];
  }
}

function window_drag(event){
  let target = event.target.parentNode;
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  target.onmousedown = dragDown;
  function dragDown(event){
    event = event || window.event;
    event.preventDefault();
    pos3 = event.clientX;
    pos4 = event.clientY;
    document.onmouseup = dragEnd;
    document.onmousemove = dragMove;
    document.onmouse = dragEnd;
  }
  function dragEnd(event){
    if (target.offsetTop < 0){
      target.style.top = "0";
    }else if ((target.offsetTop + target.offsetHeight) - 200 > window.innerHeight){
      target.style.top =  window.innerHeight - target.offsetHeight + "px";
    }

    if (target.offsetLeft < -200){
      target.style.left =  "0";
    }
    else if ((target.offsetLeft + target.offsetWidth) - 200 > window.innerWidth){
      target.style.left =  window.innerWidth - target.offsetWidth + "px";
    }
    document.onmouseup = "";
    document.onmousemove = "";
  }
  function dragMove(event){
    event = event || window.event;
    event.preventDefault();
    pos1 = pos3 - event.clientX;
    pos2 = pos4 - event.clientY;
    pos3 = event.clientX;
    pos4 = event.clientY;
    target.style.top = (target.offsetTop - pos2) + "px";
    target.style.left = (target.offsetLeft - pos1) + "px";
  };
  console.log(pos1 + "   " + pos2)

}

document.removeEventListener("click", devices_click);
window.addEventListener('click', async function(event){
  var target = event.target;
  if (target.classList.contains("clickable") && waiting){
    waiting = false;
    let target_arr = target.id.split("_")
    let value = target_arr[1];
    let target_id = target_arr[0];
    let input_command;
    switch (target_id){
      case "cls":
        input_command = "kill " + value.slice(6,);
      break;
      case "max":
        console.log(target.closest(".subwin-visible"))
        if (target.closest(".subwin-visible").classList.contains("subwin-max")){
          input_command = "bg " + value.slice(6,);
        }
        else{
          input_command = "fg " + value.slice(6,);
        }
      break;
      case "lng":
        input_command = "lang " + value;
      break;
      case "drk":
        input_command = "darkmode";
      break;
      default:
        if (tree_html.includes(target.dataset.path)){
          input_command = "./" + target.getAttribute("data-path");
        }else if (tree_files.includes(target.dataset.path)){
          input_command = "cat ./" + target.getAttribute("data-path");
        }else{
          input_command = "cd " + target.getAttribute("data-path");
        }
    }
    await write_value(input_command);
    await sleep(220);
    window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Enter'}));
    waiting = true;
  }
});

window.addEventListener('keydown', function(event){
  stdin.focus();
  const pressedkey = event.key
  if (pressedkey == "Enter") {
    history.push(stdin.value);
    position = history.length;
    command.return("anon@ivan-webpage:~$ " + stdin.value);
    if (stdin.value != "") {
      command.send(stdin.value);
    }
  }
  else if (pressedkey == "ArrowUp") {
    event.preventDefault();
    if (position - 1 >= 0){
      position = position - 1;
      stdin.value=history[position];
    };
  }
  else if (pressedkey == "ArrowDown") {
    if (position + 1 < history.length){
      position = position + 1
      stdin.value=history[position];
    }
    else if (position + 1 == history.length){
      position = position + 1;
      stdin.value="";
    }
  };
});
