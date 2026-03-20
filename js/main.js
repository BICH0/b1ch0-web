const maxwinds = 3;
const command = new commands();
const screen_state = new tscreen();
const page_load_time = Date.now();
var files;
var man_pages;
var cmd_lang;
var github_repos = {};
const history = [];
var position = 0;
var waiting = true;
var warnmsg = false;
const terminal = document.getElementById("terminal");
const terminal_header = document.getElementById("terminal-header");
const terminal_scroll = document.getElementById("terminal-scroll");
const stdout = document.getElementById("terminal-content");
const stdin = document.getElementById("stdin");
const prompt_el = document.getElementById("prompt");

function start() {
  openstorage();
  resize_term();
  darkmode("load");

  const dataPromise = fetch('data.json').then(r => r.json());
  const githubPromise = fetch('https://api.github.com/users/BiCH0/repos?sort=stars&per_page=30')
    .then(r => {
      if (!r.ok) throw new Error('GitHub API unavailable');
      return r.json();
    })
    .catch(() => []);

  Promise.all([dataPromise, githubPromise]).then(([data, repos]) => {
    webpage_sections = Array.from(data["route"]);
    files = data["files"];
    man_pages = data["man_pages"];
    cmd_lang = data["cmd"];

    if (Array.isArray(repos) && repos.length > 0) {
      const projectsFolder = webpage_sections.find(s => Array.isArray(s) && s[0] === "projects");
      if (projectsFolder) {
        repos
          .filter(r => !r.fork)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 5)
          .forEach(repo => {
            const entry = repo.name + ".git";
            projectsFolder.push(entry);
            github_repos[entry] = repo;
          });
      }
    }

    sortfiles();
    ready(repos.length);
  });
}

async function ready(repo_count = 0) {
  stdout.innerHTML = "<br>";
  prompt_el.style.visibility = "hidden";
  await sleep(1500);

  const es = lang === "es";
  const narrow = window.innerWidth <= 768;
  const svcline = (name) => narrow
    ? `<span class="boot-ok">[  svc  ]</span> ${name}: OK`
    : `<span class="boot-ok">[  svc  ]</span> ${name} ${".".repeat(Math.max(2, 36 - name.length))} OK`;

  const github_status = repo_count > 0
    ? `<span class="boot-ok">[  net  ]</span> api.github.com: ${repo_count} repos ${es ? "cargados" : "loaded"}`
    : `<span class="boot-ok">[ WARN  ]</span> api.github.com: ${es ? "sin conexión — modo offline" : "no connection — offline mode"}`;

  const bootlines = [
    [50,  `<span class="boot-ok">[ BIOS  ]</span> b1ch0-UEFI v2.3 — Secure Boot: enabled`],
    [35,  `<span class="boot-ok">[  mem  ]</span> Memory: 8192 MB OK`],
    [30,  `<span class="boot-ok">[  cpu  ]</span> b1ch0-core × 8 @ 3.6 GHz — amd64`],
    [60,  `<span class="boot-ok">[  fs   ]</span> Checking filesystems... OK`],
    [40,  `<span class="boot-ok">[  fs   ]</span> Mounting /proc /sys /dev... OK`],
    [80,  `<span class="boot-ok">[  net  ]</span> eth0: link up — 1000Mbps full-duplex`],
    [45,  svcline("sshd.service")],
    [35,  svcline("syslog.service")],
    [35,  svcline("cron.service")],
    [50,  `<span class="boot-ok">[  sec  ]</span> Firewall: 42 rules loaded`],
    [40,  `<span class="boot-ok">[  sec  ]</span> IDS signatures: updated`],
    [40,  `<span class="boot-ok">[  sec  ]</span> SELinux: enforcing`],
    [120, `<span class="boot-ok">[  boot ]</span> b1ch0-terminal v2.0 — initializing...`],
    [180, github_status],
    [60,  ``],
  ];

  for (const [delay, line] of bootlines) {
    await sleep(delay);
    stdout.innerHTML += `<p>${line}</p>`;
    terminal_scroll.scrollTop = terminal_scroll.scrollHeight;
  }

  await sleep(1000);
  stdout.innerHTML = "";
  prompt_el.style.visibility = "visible";

  if (warnmsg == "false") {
    stdout.innerHTML += screen_state.home;
  }
  stdout.innerHTML += screen_state.dirtree;
  stdout.innerHTML += `<p>${cmd_lang["env_ready"][lang]}</p>`;


  for (let i = 0; i < maxwinds; i++) {
    let random = Math.random() * 16;
    open_windows[i] = new window_creator();
    let nwin = document.getElementById("window" + i);
    if (i != 0) {
      let owin = document.getElementById("window" + (i - 1));
      nwin.style.top = parseFloat(getComputedStyle(owin).top) * (i * 1.2) + random + "px";
      nwin.style.right = parseFloat(getComputedStyle(owin).right) * (i * 0.5) + random + "px";
    }
  }
}

function openstorage() {
  let storage_warn = storage.getItem('warnmsg');
  if (storage_warn) {
    warnmsg = storage_warn;
  }
  try {
    const saved = storage.getItem('history');
    if (saved) JSON.parse(saved).forEach(c => history.push(c));
  } catch(e) {}
  position = history.length;
}


function resize_term() {
  if (window.innerWidth > 768) {
    terminal.style.height = "";
    terminal.style.marginTop = "";
  }
}

function sortfiles() {
  function analyze_folder(folder, predecesor = "") {
    for (let x = 0; x < folder.length; x++) {
      if (Array.isArray(folder[x])) {
        analyze_folder(folder[x], folder[0] + "/");
      } else {
        if (x != 0) {
          organizer(predecesor + folder[0] + "/" + folder[x]);
        }
      }
    }
  }
  function organizer(file) {
    switch (file.split(".")[1]) {
      case "md":
      case "txt":
        tree_files.push(file);
        break;
      case "html":
      case "git":
        tree_html.push(file);
        break;
    }
  }
  webpage_sections.forEach(file => {
    if (Array.isArray(file)) {
      analyze_folder(file);
    } else {
      organizer(file);
    }
  });
}

function height_check() {
  requestAnimationFrame(() => {
    terminal_scroll.scrollTop = terminal_scroll.scrollHeight;
  });
}

function close_win(self) {
  open_windows[self.slice(-1)].close();
}

async function write_value(cmd) {
  stdin.value = "";
  for (let x = 0; x < cmd.length; x++) {
    await sleep(22);
    stdin.value += cmd[x];
  }
}

/* ─── Drag: mouse + touch ─── */
function window_drag(event) {
  const target = event.target.closest(".subwin-visible");
  if (!target || target.classList.contains("subwin-max")) return;

  event.preventDefault();
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  function getCoords(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  const c = getCoords(event);
  pos3 = c.x; pos4 = c.y;

  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('touchend', dragEnd);
  document.addEventListener('touchmove', dragMoveTouch, { passive: false });

  function dragEnd() {
    if (target.offsetTop < 0) target.style.top = "0px";
    else if (target.offsetTop + target.offsetHeight - 40 > window.innerHeight)
      target.style.top = (window.innerHeight - target.offsetHeight) + "px";
    if (target.offsetLeft + target.offsetWidth - 40 < 0) target.style.left = "0px";
    else if (target.offsetLeft + 40 > window.innerWidth)
      target.style.left = (window.innerWidth - target.offsetWidth) + "px";
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchend', dragEnd);
    document.removeEventListener('touchmove', dragMoveTouch);
  }
  function dragMove(e) {
    e.preventDefault();
    const c = getCoords(e);
    pos1 = pos3 - c.x; pos2 = pos4 - c.y;
    pos3 = c.x; pos4 = c.y;
    target.style.top = (target.offsetTop - pos2) + "px";
    target.style.left = (target.offsetLeft - pos1) + "px";
  }
  function dragMoveTouch(e) {
    e.preventDefault();
    dragMove(e);
  }
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    if (window.innerWidth > 768) return;
    if (open_windows.some(w => w.occupied)) return;
    const vh = window.visualViewport.height;
    const termTop = terminal.getBoundingClientRect().top;
    const newH = vh - termTop - 6;
    if (newH > 100) {
      terminal.style.height = newH + "px";
      terminal_scroll.scrollTop = terminal_scroll.scrollHeight;
    }
  });
}

window.addEventListener('resize', resize_term);

window.addEventListener('click', async function (event) {
  var target = event.target;
  if (target.classList.contains("clickable") && waiting) {
    waiting = false;
    let target_arr = target.id.split("_");
    let value = target_arr[1];
    let target_id = target_arr[0];
    let input_command;
    switch (target_id) {
      case "cls":
        input_command = "kill " + value.slice(6);
        break;
      case "max":
        if (target.closest(".subwin-visible").classList.contains("subwin-max")) {
          input_command = "bg " + value.slice(6);
        } else {
          input_command = "fg " + value.slice(6);
        }
        break;
      case "lng":
        input_command = "lang " + value;
        break;
      case "cmd":
        input_command = value;
        break;
      case "drk":
        input_command = "darkmode";
        break;
      default:
        if (tree_html.includes(target.dataset.path)) {
          input_command = "./" + target.getAttribute("data-path");
        } else if (tree_files.includes(target.dataset.path)) {
          input_command = "cat ./" + target.getAttribute("data-path");
        } else {
          input_command = "cd " + target.getAttribute("data-path");
        }
    }
    await write_value(input_command);
    await sleep(200);
    window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Enter' }));
    waiting = true;
  }
});

window.addEventListener('keydown', function (event) {
  if (document.activeElement.tagName === "IFRAME") return;
  stdin.focus();
  const pressedkey = event.key;
  if (pressedkey == "Enter") {
    let val = stdin.value;
    if (val.trim() === "!!") {
      val = history.length > 0 ? history[history.length - 1] : "";
    }
    history.push(val);
    storage.setItem('history', JSON.stringify(history.slice(-200)));
    position = history.length;
    command.return("anon@bich0:~$ " + val);
    if (val != "") {
      command.send(val);
    }
    stdin.value = "";
  } else if (pressedkey == "ArrowUp") {
    event.preventDefault();
    if (position - 1 >= 0) {
      position--;
      stdin.value = history[position];
    }
  } else if (pressedkey == "ArrowDown") {
    if (position + 1 < history.length) {
      position++;
      stdin.value = history[position];
    } else if (position + 1 == history.length) {
      position++;
      stdin.value = "";
    }
  } else if (pressedkey == "Tab") {
    event.preventDefault();
    autocomplete();
  } else if (pressedkey == "c" && event.ctrlKey) {
    event.preventDefault();
    command.return("anon@bich0:~$ " + stdin.value + "^C");
    stdin.value = "";
    position = history.length;
  } else if (pressedkey == "l" && event.ctrlKey) {
    event.preventDefault();
    command.send("clear");
  }
});

/* ─── Tab autocomplete ─── */
function autocomplete() {
  const val = stdin.value.trim();
  if (!val) return;
  const parts = val.split(" ");
  const last = parts[parts.length - 1];
  if (parts.length === 1) {
    const cmds = ["ls","cat","cd","tree","clear","pwd","echo","date","kill","fg","bg","jobs","lang","darkmode","color","neofetch","history","man","alias","enable","disable","whoami","rm","sudo","base64","uname","uptime","exit"];
    const match = cmds.find(c => c.startsWith(last));
    if (match) stdin.value = match;
  } else if (parts[0] === "cd") {
    const dirs = webpage_sections.filter(s => Array.isArray(s)).map(s => s[0]);
    const match = dirs.find(d => d.startsWith(last));
    if (match) stdin.value = "cd " + match;
  } else {
    const allPaths = [...tree_files, ...tree_html];
    const match = allPaths.find(p => p.includes(last));
    if (match) {
      parts[parts.length - 1] = "./" + match;
      stdin.value = parts.join(" ");
    }
  }
}
