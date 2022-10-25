const lang_line = document.getElementById("lang-line");
const storage = window.localStorage;
const loader = document.getElementById("loader");
var lang = 0;
var night = true;

window.onload = async function(){
    let storage_lang = storage.getItem('lang');
    if (storage_lang){
      lang = storage_lang;
    }
    await load_lang();
    start();
    setTimeout(function(){
        loader.style.opacity = "0";
        setTimeout(function(){
            loader.style.display = "none";
        },200)
    },400) //ocultar la pgina mientras carga
}

function darkmode(){
    let cssfile =  document.head.getElementsByTagName("link")[0];
    let csshref = cssfile.href.split("/");
    csshref.pop();
    if (night){
        night = false;
        cssfile.href = csshref.join("/") + "/lightmode.css";
    }else{
        night = true;
        cssfile.href = csshref.join("/") + "/nightmode.css";
    }
}

function devices_click(event){
    var target = event.target;
    if (target.classList.contains("clickable")){
        let target_arr = target.id.split("_")
        let value = target_arr[1];
        let target_id = target_arr[0];
        switch (target_id) {
            case "lng":
                value = value.toLowerCase();
                switch (value){
                    case "es":
                        lang = 0;
                        storage.setItem("lang", 0);
                        break;
                    case "en":
                        lang = 1;
                        storage.setItem("lang", 1);
                        break;
                }
                load_lang();
            break;
            case "drk":
                if (document.title.split("-")[0] == "Device "){
                    darkmode();
                }
            break;
        }
    }
}

document.addEventListener("click", devices_click)