const lang_line = document.getElementById("lang-line");
const storage = window.localStorage;
const loader = document.getElementById("loader");
var lang = 0;

window.onload = async function(){
    lang = storage.getItem("lang");
    await load_lang();
    console.log("lang")
    start();
    console.log("start")
    setTimeout(function(){
        loader.style.opacity = "0";
        setTimeout(function(){
            loader.style.display = "none";
        },200)
    },400) //ocultar la pgina mientras carga
}

function darkmode(){
    let dark_items = Array.prototype.slice.call(document.querySelectorAll("body,p:not(#terminal *),a,h1,#lang-line"));
        dark_items.forEach(element => {
            element.classList.toggle("nightmode");
        })
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