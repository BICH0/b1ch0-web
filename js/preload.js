const lang_line = document.getElementById("lang-line");
const storage = window.localStorage;
const loader = document.getElementById("loader");
const drk_btn = document.getElementById("drk_btn");
var lang = "es";
var night = "true";
var date = new Date;
var cc = document.getElementById("year");

window.onload = async function(){
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
    load_lang();
    await start();
    setTimeout(function(){
        loader.style.opacity = "0";
        setTimeout(function(){
            loader.style.display = "none";
        },200)
    },585)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function darkmode(mode="change"){
    if (mode === "change") {
        ["--background","--term","--text","--text2","--glow","--light-grey","--subheader","--border","--disabled-button"].forEach(v => document.documentElement.style.removeProperty(v));
    }
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
        storage.setItem("dark", night);
    }
    if (night == "true"){
        cssfile.href = csshref.join("/") + "/nightmode.css";
        drk_btn.src = drk_path.join("/") + "/night.png";
        drk_btn.classList.remove("drk_btn");
    }else{
        cssfile.href = csshref.join("/") + "/lightmode.css";
        drk_btn.src = drk_path.join("/") + "/light.png";
        drk_btn.classList.add("drk_btn");
    }
}

function load_lang() {
    if (lang == "en") {
        lang_line.style.marginLeft = "56%";
    } else {
        lang_line.style.marginLeft = "11%";
    }
}
