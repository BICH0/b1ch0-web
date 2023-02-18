var value;
var wrong_command = 0;
var shell = "sh: "
class commands {
  send (cm_content){
    cm_content = cm_content.split(" ");
    const cm = cm_content.shift();
    const value = cm_content;
    this.handle(cm, value);
  }
  handle (cm,value) {
    stdin.value = "";
    function execute_function(){
      cm = cm.split("/");
      cm.shift();
      let lastfield = cm.pop();
      if (cm != ""){
        cm.push("/");
      }
      if (tree_html.includes(cm.join("") + lastfield)){
        switch (lastfield.slice(-4,)){
          case "html":
            command.run_window("iframe","html/" + lastfield.split(".")[0]+"_"+lang+".html");
          break;
          case ".git":
            command.run_window("iframe","git/" + lastfield.split(".")[0]+".html");
          break;
          case ".pdf":
            let a = document.createElement(a);
            document.body.appendChild(a);
            a.download = lastfield;
            a.href = "";
            a.click(); 
          break;
        }
      }
      else{
        command.return(shell + "error: " + language[lang][4]);
      }
    }
    if (cm.slice(0,1) == "." || cm.slice(0,1) == "/") {
      execute_function();
    }else{
      switch (cm) {
        case "disable":
          if (value == "start"){
            storage.setItem("warnmsg", true);
            this.return(language[lang][1]);
            break;
          }
          this.return(value + language[lang][3]);
          break;
        case "enable":
          if (value == "start"){
            storage.setItem("warnmsg", false);
            this.return(language[lang][2]);
          }
        break;
        case "date":
          if (value.length != 0){
            this.return("date: " + language[lang][13]);
            break;
          }
          this.return(date.toString().split("(")[0]);
        break;
        case "cat":
          value = value[0].split("/");
          if (value[0] == "." || value[0] == ""){
            value.shift();
          }
          value = value.join("/");
          if (tree_files.includes(value)){
            this.cat(value);
          }else{
            this.return("cat: " + value + language[lang][4]);
          }
        break;
        case "echo":
          this.return(value.toString().replaceAll('"',''));
        break;
        case "pwd":
          this.return("/");
        break;
        case "clear":
          if (value.length != 0){
            this.return("clear: " + language[lang][13]);
            break;
          }
          stdout.innerHTML = "<br>";
          stdout.style.height = "";
          this.return(screen_state.dirtree);
        break;
        case "tree":
          if (value.length != 0){
            this.return("tree: " + language[lang][13]);
            break;
          }
          this.return(screen_state.dirtree);
        break;
        case "ls":
          let ls_result, recursive, all, dirs, parents, parents2, exitfn;
          dirs = []; parents = []; parents2 = [];
          let format = ["","","",""];
          ls_result = recursive = all = "";
          function returndata(item, folder=false){
            let prefix ="";
            if (format[1] != ""){
              if (folder){
                prefix = format[0] + format[1] + document.getElementById(item).getAttribute("data-weight");
              }
              else{
                prefix = "-" + format[1] + document.getElementById(item).getAttribute("data-weight");
              }
            }
            command.return(prefix + format[3] + "<span class=\"clickable\" data-path=\"" + document.getElementById(item).getAttribute("data-path") + "\">" + item + "</span>");
          }
          value.forEach(arg=>{
            if (arg.slice(0,1) == "-"){
              arg.slice(1,).split("").forEach(param => {
                switch (param) {
                  case "l":
                    format = ["d","rw-r--r-- 1 ivan ivan    ", 1," may 25 06:30 "];    
                    break;
                  case "R":
                    recursive = true;
                    break;
                  case "a":
                    all = true;
                    break;
                  case "A":
                  break;
                  default:
                    this.return("ls: error: -" + param + language[lang][3]);
                    exitfn = 1;
                }
              })
            }else{
              let file = arg.split("/")[arg.split("/").length - 1];
              if (arg.slice(0,2) == ".."){
                this.return("ls: error:" + language[lang][8]);
              }
            }
          })
          function getall(){
            if (all){
              command.return(format[0]+format[1] + format[2] + format[3] + ".");
              command.return(format[0]+format[1] + format[2] + format[3] + "..");
            }
          }
          function dirsgobrr(){
            for (let x=0; x<dirs.length; x++){
              command.return("<br>" + parents[x] + "/" + dirs[x][0]);
              if (Array.isArray(dirs[x])){
                loopthru(dirs[x], parents[x]+ "/" + dirs[x][0]);
              }  
            }
          }
          function loopthru(foldern, parent="", value=1){
            if (format[1] != "" && parent != "."){
              command.return("total " + (foldern.length - 1) );
              getall();
            }
            for (let x = value; x<=foldern.length -1; x++){
              if (Array.isArray(foldern[x])){
                if (recursive){
                  if (value == 0){
                    dirs.push(foldern[x]);
                    parents.push(parent);
                  }else{
                    dirs.splice(1,0,foldern[x]);
                    parents.splice(1,0,parent);
                  }
                }
                returndata(foldern[x][0], true);
              }else{
                returndata(foldern[x]);
              }
            }
            if (value == 0){
              dirsgobrr(); 
            }
          }
          if (exitfn == null){
            if (recursive){
              command.return(".:");
            }
            if (format[1] != ""){
              command.return("total " + webpage_sections.length);
            }
            getall();
            loopthru(webpage_sections,".",0);
          }
        break;
        case "kill":
          if ((value >= 0 && value <= maxwinds)){
            let window_target = open_windows.find(win => win.name == "window" + value);
            if (window_target.occupied){
              if (window_target.maximized){
                window_target.maximized=false;
                document.getElementById("window" + value).classList.toggle("subwin-max");
              }
              window_target.close();
              this.return("Task " + value + " terminated.");
              break;
            }
          }
          this.return("kill: kill " + value + language[lang][5]);
        break;
        case "bg":
          value = "window" + value;
          let bg_target = open_windows.find(item => item.name == value);
          if (bg_target.occupied){
            if (bg_target.maximized){
              bg_target.maximized = false;
              document.getElementById(value).classList.toggle("subwin-max");
              break;
            }
          }
          this.return(language[lang][6],cm);
        break;
        case "fg":
          value = "window" + value;
          let fg_target = open_windows.find(item => item.name == value);
          if (fg_target.occupied){
            if (!fg_target.maximized){
              fg_target.maximized = true;
              document.getElementById(value).classList.toggle("subwin-max");
              break;
            }
          }
          this.return(language[lang][6],cm);
        break;
        case "lang":
          value = value[0].toLowerCase();
          switch (value){
            case "es":
            case "en":
              lang = value;
              storage.setItem("lang", lang);
              this.return(language[lang][7]);
            break;
          default:
            this.return(value + language[lang][3],cm);
          }
          load_lang();
        break;
        case "darkmode":
          if (value.length != 0){
            this.return(language[lang][13]);
            break;
          }
          darkmode();
        break;
        case "cd":
          console.log(value)
          if (value[0] == undefined){
            value[0] = ".";
          }
          this.return(value[0] + ":" + language[lang][8],cm);
        break;
        case "rm":
          if (value[1] == undefined){
            value[1] = ".";
          }
          this.return(value[1] + language[lang][9],cm);
        break;
        default:
          if (tree_html.includes(cm + value)){
            cm = "/" + cm;
            execute_function();
            return;
          }
          if (wrong_command >= 5){
            this.return(language[lang][12]);
            stdout.innerHTML += "<a href='../mobile/index.html'>Click Here!!</a>";
            wrong_command = 0;
          }
          else{
            wrong_command++;
            this.return(language[lang][11],cm);
          }
      }
    }
  }
  run_window (type, arg1) {
    let available;
    try{
      open_windows.forEach(cwind => {
        if ( ! cwind.occupied) {
          available = cwind;
          throw "break";
        }
      })
    }
    catch (error) {
      console.log(error);
    }
    if (available){
      available.open(type, arg1);
    }else{
     this.return(language[lang][10]);
    }
  }
  route (path){
    if (path.slice(0,1) == "/"){
      path = path.slice(1,);
    }
    else if (path.slice(0,2) == "./"){
      path = path.slice(2,);
    }
    return path;
  }
  cat (file) {
    let file_og = file.split("/").pop();
    file = file_og.split(".").shift() + "_" + lang + ".md";
    if (files[file] != undefined){
      stdout.innerHTML += files[file];
    }else{
      if (files[file_og] != undefined){
        stdout.innerHTML += files[file_og];
      }else{
        this.return(value + ": " + lang[langs][4],cm);
      }
    }
    height_check();
  }
  return (message,cm=false){
    if (cm != false){
      message = shell + cm + ": " + message;
    }
    stdout.innerHTML += "<p>" + message + "</p>";
    height_check(2);
  }
}
