const webpage_sections = [["home.html"], ["whoami.html"], ["projects", "readme.md", "terminal-greeter.git", "arch-autoinstaller.git"], ["contact.html"], ["contact.md"]];
const tree_files = [];
const tree_html = [];
var dir;
class tscreen {
  get dirtree(){
    webpage_sections.forEach(function callback(element, index) {
      let prefix = "<p class=\"clickable\"";
      let info = "id=\"" + element[0] + "\" data-path=\"" + element[0] + "\">";
      let sufix = element[0] + "</p></br>";
      if (index == 0) {
        dir = prefix + info + "┏" + sufix;
      }
      else if (index == webpage_sections.length - 1 && element.length == 1){
        dir += prefix + info + "┗" + sufix;
      }
      else{
        dir += prefix + info + "┠" + sufix;
      }
      if (element[1] != null){
        element.forEach(function callback(element2, index2){
          let info = "id=\"" + element2 + "\" data-path=\"" + element[0] + "/"  + element2 + "\">";
          let sufix = element2 + "</p></br>"
          if (index2 != 0 ){
            if (index2 == element.length - 1){
              dir += prefix + info + "┃┗" + sufix;
            }
            else{
              dir += prefix + info + "┃┠" + sufix;
            }
          }
        }
        )
        if (index == webpage_sections.length - 1){
          dir += prefix + ">┗</p>";
        };
      };
    });
    height_check((dir.match(/\n/g) || '').length + 1);
    return dir;
  }
  get home(){
    return language[lang][0];
  }
}
