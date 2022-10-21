const open_windows = [];

class window_creator {
  constructor () {
    this.name = "window" + open_windows.length;
    this.occupied = false;
    this.maximized = false;
    this.create();
    this.DOM = document.getElementById(this.name);
    this.container = this.DOM.childNodes[1];
    this.title = this.DOM.childNodes[0].childNodes[0];
  }
  create () {
    const new_win = document.createElement("div");
    new_win.id = this.name;
    new_win.classList = "subwin-invisible subwin-visible";
    new_win.innerHTML = "<div class=\"subheader\"><p></p><div class=\"sub-btncontainer\"><div class=\"circle subcircle\"></div><div id=\"max_" + this.name + "\" class=\"circle subcircle maxbtn clickable\"></div><div id=\"cls_" + this.name + "\"class=\"circle subcircle closebtn clickable\"></div></div></div><div class=\"container\"></div>"
    terminal.parentNode.appendChild(new_win);
  }
  open (type, arg1) {
    const win_element = document.createElement(type);
    this.DOM.classList.toggle("subwin-invisible");
    this.occupied = true;
    switch (type) {
      case "iframe":
        let csslink = document.createElement("link");
        win_element.src = arg1;
        this.title.innerHTML = arg1;
        this.container.appendChild(win_element)
        win_element.addEventListener("load", function(){
          csslink.href = "iframe.css";
          csslink.rel = "stylesheet";
          csslink.type = "text/css";
          win_element.contentWindow.document.head.appendChild(csslink);
        })
        break;
      default:

    }
    this.container.appendChild(win_element);
  }
  close () {
    this.DOM.classList.toggle("subwin-invisible");
    this.occupied = false;
    this.container.innerHTML = "";
  }
}
