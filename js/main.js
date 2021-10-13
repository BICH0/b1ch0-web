var textToWrite = 'Web del B1CH0';
var i = 0;
const ELEMENT = document.body;
var progress = 0;
const CODINGCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabbcdefghijklmnopqrstuvwxyz1234567890~!@#$%^&*()_-+={[}]|;:.>,</?¿'
var darkv = 1;
let subtitulos = ["sistemas_h", "servicios_h", "programacion_h"]
const darkimg = document.querySelector('#dark-img');
const darkdiv = document.querySelector('.div');
const header = document.querySelector('.header');
const goup = document.getElementById('goup');
const footer = document.querySelector('.footer');
const globald = document.querySelector('.global');
const homed = document.querySelector('#homediv');
const home = document.querySelector('#home');
const panel = document.querySelectorAll('.panel');
const image = document.querySelectorAll('.image');
const menu = document.getElementById('menu');
const header_content = document.querySelector('.header-content');
const headercont = document.querySelector('.headercont');
const header_divs = document.querySelector('.header-divs');
const cover = document.querySelector('.cover');
const coverhid = document.querySelector('.coverhid');
var hom1 = 0;
var men1 = 0;
var app = document.querySelector('#home');
var typewriter = new Typewriter(app, {});
var still = true;

//title
function animate() {
  setTimeout(function(){
    i++;
    var currentText = textToWrite.substr(0, i);
    currentText += getRandomChars(textToWrite.length - i);
    document.title = currentText;
    progress = i/textToWrite.length;
    if(progress < 1) {
      animate()
    }
  }, 200);
}

function getRandomChars(howMany) {
  var result = '';
  for(var i=0; i<howMany; i++) {
    if(i % 5 == 0) {
      result += ' '
    } else {
      result += CODINGCHARS.charAt(Math.floor(Math.random() * CODINGCHARS.length));
    }
  }
  return result
}
function handleVisibilityChange() {
  if (document.hidden) {
    document.title = textToWrite;
  }
  else
  {
    animate();
    i = 0;
  }
}
handleVisibilityChange();
document.addEventListener("visibilitychange", handleVisibilityChange, true);
//end of title
//switch
function dark(){
  ELEMENT.classList.toggle("dark-mode");
  darkdiv.classList.toggle('dark-div');
  header.classList.toggle('dark-header');
  footer.classList.toggle('dark-footer');
  globald.classList.toggle('dark-global');
  panel.forEach( (item) => item.classList.toggle('dark-panel') );
  image.forEach( (item) => item.classList.toggle('dark-panel') );
  if (darkv == 1)
  {
    ++darkv;
    darkimg.src='images/light.png';
  }
  else
  {
    --darkv;
    darkimg.src='images/dark.png';
  }
}
//end of switch
//goup
window.onscroll = function() {
    console.log("Hola");
    var pageOffset = document.documentElement.scrollTop || document.body.scrollTop,
        btn = document.getElementById('goup');
    if (btn) btn.style.visibility = pageOffset > 450 ? 'visible' : 'hidden';
};
//end of goup
function start(){
  typewriter.typeString('Ivan Martinez')
    .start();
}
function exit(){
  still = false;
}
function timer(){
    still = true;
    setTimeout(function(){
      if ( still === true ){
        homes();
        still = false;
      }
      else {

      }
    },5000)
  }
function homes(){
  var home_element = window.getComputedStyle(home);
  var width1 = home_element.width.replace(/px/,"");
  if (hom1 == '0'){
    new_width = parseInt(width1) - 200 + "px";
    typewriter
      .deleteChars(13)
      .typeString('B1CH0')
      .start();
    ++hom1;
    home.style.color = 'red';
    home.style.width = new_width;
  }
  else{
    new_width = parseInt(width1) + 200 + "px";
    typewriter
      .deleteChars(5)
      .typeString('Ivan Martinez')
      .start();
    --hom1;
    home.style.color = 'white';
    home.style.width = new_width;
  }
}
//end of home
function conocimientos_enter(item) {
  document.getElementById(item).style.letterSpacing = "2px";
}
function conocimientos_leave(item) {
  document.getElementById(item).style.letterSpacing = null;
}
function events(x, y) {
  if ( x.checked){
    document.getElementById(y).style.cssText = `
    visibility: visible;
    opacity: 1;
    height: auto;`;
  }
  else{
    document.getElementById(y).style.cssText = `
    visibility: hidden;
    opacity: 0;
    height: 0;`;
  }
}
function image_resize(x) {
  x.style.cssText = "transform: scale(1.3); box-shadow: none; z-index: 9;";
}
function image_resizeoff(x) {
  x.style.cssText = '""';
}
function menu_open(x) {
  if ( window.innerWidth < 825 ) {
    if ( x != "header" ){
      console.log(men1)
      if ( men1 == 0 ) {
        document.body.style.overflow = 'hidden';
        menu.style.cssText = 'transform: rotate(180deg); left: 30vw;';
        header_content.classList.toggle('headercont');
         cover.classList.toggle('coverhid');
        ++men1
      }
      else {
        document.body.style.overflow = '';
        menu.style.cssText = "";
        header_content.classList.toggle('headercont');
        cover.classList.toggle('coverhid');
        --men1
      }
    }
  }
}
function menu_over() {
  menu.style.transform = "scale(1.2) rotate(30deg)";
}
function menu_out() {
  if ( window.innerWidth > 825 ){
    menu.style.transform = "";
  }
}
start();
