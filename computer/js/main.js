const maxwinds = 3;
const command = new commands();
const screen_state = new tscreen();
var current_dir;
const language = [lang_es, lang_en];
var lang = 0;
const history = [];
var position = 0;
var dir_stat = false;
waiting = true;
const terminal = document.getElementById("terminal");
const terminal_header = document.getElementById("terminal-header");
const stdout = document.getElementById("terminal-content");
const stdin = document.getElementById("stdin");
const prompt = document.getElementById("prompt").childNodes.item(1);
const font_size = getComputedStyle(prompt).lineHeight;
const window_container = document.getElementById("subwindows");
var win_width = terminal.offsetWidth - 20;
var win_height = terminal.offsetHeight - prompt.offsetHeight - terminal_header.offsetHeight;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function start() {
  openstorage();
  resize_term();
  sortfiles();
  stdout.style.bottom = parseInt(getComputedStyle(prompt).lineHeight.slice(0,-2)) + 5 + "px";
  stdout.innerHTML = "</br>";
  if (! warnmsg){
    stdout.innerHTML += screen_state.home;
  }
  stdout.innerHTML += screen_state.dirtree;
  for (i=0;i<maxwinds;i++) {
    let random = Math.random() * 20;
    open_windows[i] = new window_creator();
    let nwin = document.getElementById("window" + i);
    if (i != 0){
      let owin = document.getElementById("window" + (i - 1));
      console.log(getComputedStyle(owin).top)
      nwin.style.top = getComputedStyle(owin).top.slice(0,-2) * (i * 1.2 ) + random + "px";
      nwin.style.right = getComputedStyle(owin).right.slice(0,-2) * (i * 0.5) + random + "px";
    }
  }
};

function openstorage(){
  warnmsg = storage.getItem('warnmsg');
  lang = storage.getItem("lang");
};

function load_lang(){
  if (lang == 1){
    lang_line.style.marginLeft = "61%";
  }else{
    lang_line.style.marginLeft = "11%";
  }
}

function resize_term(){
  var win_width = terminal.offsetWidth - 20;
  stdin.style.width = win_width - prompt.offsetWidth - 10 + "px";
}

function sortfiles(){
  webpage_sections.forEach( file => {
      file.forEach( file2 => {
        if (file[1]){
          nfile = file[0] + "/" + file2;
        }else{
          nfile = file2;
        }
        switch (file2.split(".")[1]) {
          case "md":
          case "txt":
            tree_files.push(nfile);
          break;
          case "html":
          case "git":
            tree_html.push(nfile);
          break;
        }
      })
  })
};

function height_check(lines) {
  stdout.scrollTop = stdout.scrollHeight;
  if (font_size.slice(0,-2) * 1 + stdout.offsetHeight - 10 >= win_height){
    stdout.style.height = win_height - 5 + "px";
  }
};
function close_win(self) {
  open_windows[self.slice(-1)].close();
};

async function write_value(command) {
  stdin.value = "";
  for (let x=0; x<command.length; x++){
    await sleep(70);
    stdin.value += command[x];
  }
}

window.addEventListener('resize', function(event){
  console.log("resize")
  resize_term();
});

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
    command.send(stdin.value);
  }
  else if (pressedkey == "ArrowUp") {
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
