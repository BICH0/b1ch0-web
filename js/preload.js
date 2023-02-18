const lang_line = document.getElementById("lang-line");
const storage = window.localStorage;
const loader = document.getElementById("loader");
const drk_btn = document.getElementById("drk_btn");
var age;
var lang = "es";
var night = "true";
var date = new Date;
var cc = document.getElementById("year");

window.onload = async function(){
    age = new Date(Date.now() - (new Date(2002,06,14)));
    age = Math.abs(age.getUTCFullYear() - 1970);
    cc.innerText = date.getFullYear();
    let storage_lang = storage.getItem('lang');
    if (storage_lang){
      lang = storage_lang;
    }
    let dark_storage = storage.getItem('dark');
    if (dark_storage){
      night = dark_storage;
      darkmode("load");
    }
    await load_lang();
    await start();
    setTimeout(function(){
        loader.style.opacity = "0";
        setTimeout(function(){
            loader.style.display = "none";
        },200)
    },585) //ocultar la pgina mientras carga
}

function mask_transition(array1,array2,start=0,offset=start){
    for (let x=start;x<array1.length - offset;x++){
        array1[x].classList.add("lang-pre");
        setTimeout(function(){
            array1[x].innerHTML = array2[x - offset];
            array1[x].classList.remove("lang-pre");
        },400+(x*50))
    }
    return 400+((array1.length - offset) * 50);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function darkmode(mode="change"){
    let cssfile = document.head.getElementsByTagName("link")[0];
    let csshref = cssfile.href.split("/");
    let drk_path = drk_btn.src.split("/");
    drk_path.pop();
    csshref.pop();
    if (mode == "change"){
        if(night == "true"){
            night = "false";
        }else{
            night = "true";
        }
        storage.setItem("dark",night);
    }
    if (night == "true"){
        cssfile.href = csshref.join("/") + "/lightmode.css";
        drk_btn.src = drk_path.join("/") + "/bulb.png";
        drk_btn.classList.add("drk_btn");
    }else{
        cssfile.href = csshref.join("/") + "/nightmode.css";
        drk_btn.src = drk_path.join("/") + "/bulb2.png";
        drk_btn.classList.remove("drk_btn");
    }
}

function devices_click(event){
    var target = event.target;
    if (target.classList.contains("clickable")){
        let target_arr = target.id.split("_");
        let value = target_arr[1];
        let target_id = target_arr[0];
        switch (target_id) {
            case "lng":
                value = value.toLowerCase();
                switch (value){
                    case "es":
                        lang = "es";
                        storage.setItem("lang", "es");
                        break;
                    case "en":
                        lang = "en";
                        storage.setItem("lang", "en");
                        break;
                }
                load_lang();
            break;
            case "drk":
                // if (document.title.split("-")[0] == "Device "){
                //     darkmode();
                // }
                darkmode();
            break;
        }
    }
}

document.addEventListener("click", devices_click)