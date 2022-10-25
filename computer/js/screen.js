const webpage_sections = [["aboutme","whoami.html",["knowledge", "programming.md", "services.md"]], ["projects", "readme.md", "terminal-greeter.git", "arch-autoinstaller.git"],  "contact.md"];
const tree_files = [];
const tree_html = [];
var dir;
class tscreen {
  get dirtree(){
    webpage_sections.forEach(function callback(element, index) {
      let prefix = "<p class=\"clickable\"";
      if (Array.isArray(element)){
          draw_tree(element[0], 0, index);
        analyze_folder(element);
      }
      else{
        draw_tree(element, 0, index, webpage_sections.length);
      }
      function analyze_folder(folder, predecesor=0, father="", end=0){
        predecesor++
        console.log(end)
        for (let x=1; x<folder.length; x++) {
          if (Array.isArray(folder[x])){
            draw_tree(folder[x][0], predecesor, x, folder.length, father+folder[0]+"/", 1)
            analyze_folder(folder[x], predecesor, father+folder[0]+"/", 1);
            end++
          }
          else{
            if (end > 0){
              console.log("end:" + end)
              draw_tree(folder[x], predecesor, x, folder.length, father+folder[0]+"/", end)
            }
            else{
              draw_tree(folder[x], predecesor, x, folder.length, father+folder[0]+"/")
            }
          }
        }
      }
      function draw_tree(file, level, index, length, datapath="", end=0){
        let level_id = "";
        // console.log(file + level + " | " + index + "<" + (length -1))
        console.log(file + " " + end)
        if (level != 0){
          level_id = "┃ ";
          if (end>0){
            for (let x = end; x<level; x++){
              level_id += "&nbsp;&nbsp;";
            }
            console.log(level_id)
          }
          else{
            for (let x = 1; x<level; x++){
              level_id += "┃ ";
            }
          }
        }
        else{
          for (let x = 1; x<level; x++){
            level_id += "&nbsp;&nbsp;";
          }
        }
        let info = "id=\"" + file + "\" data-path=\"" + datapath + file + "\">";
        let sufix = file + "</p></br>";
        // console.log(file + " " + index + "/" + length)
        switch (index){
          case 0:
            if (level == 0 && index == 0){
              dir = prefix + info + "┏" + sufix;
              break;
            }
          case (length - 1):
            // console.log(index + "/" + (length - 1) + " - " + file)
            dir += prefix + info + level_id + "┗" + sufix;
          break;
          default:
            dir += prefix + info + level_id + "┠" + sufix;
        }
      }
    });
    height_check((dir.match(/\n/g) || '').length + 1);
    return dir;
  }
  get home(){
    return language[lang][0];
  }
}
