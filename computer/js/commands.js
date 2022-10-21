var value;
var wrong_command = 0;
var lang_es=["<p>&gt;&gt;Bienvenido, esta pagina web esta hecha emulando un terminal, si no eres familiar con este entorno puedes hacer click en los distintos directorios.<br/>Si quieres ocultar este mensaje usa &quot;disable start&quot;.</p>","Mensaje de inicio desactivado","Mensaje de inicio activado","no es un argumento valido.",": No existe el fichero o el directorio","failed: No existe el proceso","no current job","Idioma cambiado a ES","no se puede acceder al directorio", "no se puede eliminar el directorio o archivo","No hay ventanas disponibles.","Orden no encontrada",
"¿Quizas quieres una interfaz mas sencilla?"]
var lang_en=["<p>&gt;&gt;Welcome, this webpage is made in a shell-like format, if you are not familiar with this enviorment you can click where you want to go.<br/>If you want to hide this message use &quot;disable start&quot;.</p>","Start message disabled","Start message enabled","is not a valid argument.",": No such file or directory.","failed: Process doesn't exist","no current job","Language changed to EN","Permission denied","cannot be removed: Permission denied","No windows available.","Command not found.","Maybe you want a more friendly ui?"]

class commands {
  send (cm_content){
    cm_content = cm_content.split(" ");
    const cm = cm_content[0];
    const value = cm_content[1];
    this.handle(cm, value);
  }
  handle (cm,value) {
    stdin.value = "";
    if (cm.slice(0,1) == "." || cm.slice(0,1) == "/") {
      cm = cm.split("/");
      cm.shift();
      let lastfield = cm.pop();
      if (cm != ""){
        cm.push("/");
      }
      if (tree_html.includes(cm.join("") + lastfield)){
        switch (lastfield.slice(-4,)){
          case "html":
            this.run_window("iframe","html/" + lastfield);
          break;
          case ".git":
            this.run_window("iframe","git/" + lastfield.split(".")[0] + ".html");
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
        this.return("bash" + language[lang][4])
      }
    }else{
      switch (cm) {
        case "disable":
          if (value == "start"){
            storage.setItem("warnmsg", true);
            this.return(language[lang][1]);
            break;
          }
          this.return("disable: " + value + language[lang][3])
        case "enable":
          if (value == "start"){
            storage.setItem("warnmsg", false);
            this.return(language[lang][2]);
          }
        break;
        case "cat":
          value = value.split("/");
          value.shift();
          value = value.join("/");
          if (tree_files.includes(value)){
            this.cat(value);
          }else{
            this.return("cat: " + value + language[lang][4])
          }
        break;
        case "clear":
          stdout.innerHTML = "</br>";
          stdout.style.height = "";
        break;
        case "tree":
          this.return(screen_state.dirtree);
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
              this.return(value + " terminated.");
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
          this.return("bg: " + language[lang][6])
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
          this.return("fg: " + language[lang][6])
        break;
        case "lang":
          value = value.toLowerCase();
          switch (value){
            case "es":
              lang = 0;
              storage.setItem("lang", 0);
              this.return(language[lang][7]);
            break;
            case "en":
              lang = 1;
              storage.setItem("lang", 1);
              this.return(language[lang][7]);
            break;
          default:
            this.return("lang: " + value + language[lang][3]);
          }
          load_lang();
        break;
        case "darkmode":
          darkmode();
        break;
        case "cd":
          this.return("cd: " + language[lang][8]);
        break;
        case "rm":
          this.return("rm: " + language[lang][9]);
        break;
        default:
          if (wrong_command >= 5){
            this.return(language[lang][12])
            stdout.innerHTML += "<a href='../mobile/index.html'>Click Here!!</a>";
            wrong_command = 0;
          }
          else{
            wrong_command++
            this.return("sh: " + language[lang][11]);
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
    file = this.route(file);
      if(1 == 1){
        stdout.innerHTML += "<p><span>[<img height='1 em' src='../resources/svg/mail.svg' alt='mail'>] Mail:</span>ivan@confugiradores.es</p>";
      }
      else{
        this.return("cat: " + file + language[lang][6]);
      }
  }
  return (message){
    stdout.innerHTML += "<p>" + message + "</p>";
    height_check();
  }
}