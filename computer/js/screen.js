var webpage_sections;
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
        predecesor++;
        for (let x=1; x<folder.length; x++) {
          if (Array.isArray(folder[x])){
            draw_tree(folder[x][0], predecesor, x, folder.length, father+folder[0]+"/", 1);
            analyze_folder(folder[x], predecesor, father+folder[0]+"/", 1);
            end++
          }
          else{
            if (end > 0){
              draw_tree(folder[x], predecesor, x, folder.length, father+folder[0]+"/", end);
            }
            else{
              draw_tree(folder[x], predecesor, x, folder.length, father+folder[0]+"/");
            }
          }
        }
      }
      function draw_tree(file, level, index, length, datapath="", end=0){
        let level_id = "";
        if (level != 0){
          level_id = "┃ ";
          if (end>0){
            for (let x = end; x<level; x++){
              level_id += "&nbsp;&nbsp;";
            }
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
        let info = "id=\"" + file + "\" data-weight=\"" + Math.trunc((Math.random()*1000)+1) + "\"data-path=\"" + datapath + file + "\">";
        let sufix = file + "</p><br>";
        switch (index){
          case 0:
            if (level == 0 && index == 0){
              dir = prefix + info + "┏" + sufix;
              break;
            }
          break;
          case (length - 1):
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
