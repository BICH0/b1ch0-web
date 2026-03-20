var wrong_command = 0;
var shell = "sh: ";
const aliases = new Map();

function _levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, (_, i) => Array.from({length: n + 1}, (_, j) => i ? (j ? 0 : i) : j));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}


class commands {
  send(cm_content) {
    cm_content = cm_content.trim();
    const first_word = cm_content.split(" ")[0];
    if (aliases.has(first_word)) {
      cm_content = aliases.get(first_word) + cm_content.slice(first_word.length);
    }
    const parts = cm_content.split(" ");
    const cm = parts.shift();
    const value = parts;
    this.handle(cm, value);
  }

  handle(cm, value) {
    stdin.value = "";

    function execute_function() {
      let path = cm.split("/");
      path.shift();
      let lastfield = path.pop();
      let prefix = path.join("/");

      const fullpath = (prefix ? prefix + "/" : "") + lastfield;

      if (tree_html.includes(fullpath)) {
        const ext = lastfield.slice(lastfield.lastIndexOf("."));
        switch (ext) {
          case ".html":
            command.run_window("iframe", "html/" + lastfield.split(".")[0] + "_" + lang + ".html");
            break;
          case ".git":
            if (github_repos[lastfield]) {
              command.run_window("github-repo", github_repos[lastfield]);
            } else {
              command.run_window("iframe", "git/" + lastfield.split(".")[0] + ".html");
            }
            break;
          case ".pdf": {
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.download = lastfield;
            a.href = lastfield;
            a.click();
            document.body.removeChild(a);
            break;
          }
        }
      } else {
        command.return(shell + "error: " + cmd_lang["no_file"][lang]);
      }
    }

    if (cm.slice(0, 1) === "." || cm.slice(0, 1) === "/") {
      execute_function();
      return;
    }

    switch (cm) {
      case "disable":
        if (value[0] == "start") {
          storage.setItem("warnmsg", true);
          this.return(cmd_lang["start_disabled"][lang]);
          break;
        }
        this.return(value + cmd_lang["invalid_arg"][lang]);
        break;

      case "enable":
        if (value[0] == "start") {
          storage.setItem("warnmsg", false);
          this.return(cmd_lang["start_enabled"][lang]);
        }
        break;

      case "date":
        if (value.length != 0) { this.return("date: " + cmd_lang["no_args"][lang]); break; }
        this.return(date.toString().split("(")[0]);
        break;

      case "cat":
        value = value[0].split("/");
        if (value[0] == "." || value[0] == "") value.shift();
        value = value.join("/");
        if (tree_files.includes(value)) {
          this.cat(value);
        } else {
          this.return("cat: " + value + ": " + cmd_lang["no_file"][lang]);
        }
        break;

      case "echo":
        this.return(value.join(" ").replaceAll('"', ''));
        break;

      case "pwd":
        this.return("/home/anon");
        break;

      case "clear":
        if (value.length != 0) { this.return("clear: " + cmd_lang["no_args"][lang]); break; }
        stdout.innerHTML = "<br>";
        this.return(screen_state.dirtree);
        break;

      case "tree":
        if (value.length != 0) { this.return("tree: " + cmd_lang["no_args"][lang]); break; }
        this.return(screen_state.dirtree);
        break;

      case "ls": {
        let recursive, all, exitfn;
        let dirs = [], parents = [];
        let format = ["", "", "", ""];
        recursive = all = "";

        function returndata(item, folder = false) {
          let prefix = "";
          if (format[1] != "") {
            prefix = (folder ? "d" : "-") + format[1] + document.getElementById(item).getAttribute("data-weight");
          }
          command.return(prefix + format[3] + "<span class=\"clickable\" data-path=\"" + document.getElementById(item).getAttribute("data-path") + "\">" + item + "</span>");
        }

        value.forEach(arg => {
          if (arg.slice(0, 1) == "-") {
            arg.slice(1).split("").forEach(param => {
              switch (param) {
                case "l": format = ["d", "rw-r--r-- 1 b1ch0 b1ch0  ", 1, "  "]; break;
                case "R": recursive = true; break;
                case "a": all = true; break;
                case "A": break;
                default:
                  this.return("ls: error: -" + param + cmd_lang["invalid_arg"][lang]);
                  exitfn = 1;
              }
            });
          }
        });

        function getall() {
          if (all) {
            command.return(format[0] + format[1] + format[2] + format[3] + ".");
            command.return(format[0] + format[1] + format[2] + format[3] + "..");
          }
        }
        function dirsgobrr() {
          for (let x = 0; x < dirs.length; x++) {
            command.return("<br>" + parents[x] + "/" + dirs[x][0]);
            if (Array.isArray(dirs[x])) loopthru(dirs[x], parents[x] + "/" + dirs[x][0]);
          }
        }
        function loopthru(foldern, parent = "", startVal = 1) {
          if (format[1] != "" && parent != ".") {
            command.return("total " + (foldern.length - 1));
            getall();
          }
          for (let x = startVal; x <= foldern.length - 1; x++) {
            if (Array.isArray(foldern[x])) {
              if (recursive) {
                if (startVal == 0) { dirs.push(foldern[x]); parents.push(parent); }
                else { dirs.splice(1, 0, foldern[x]); parents.splice(1, 0, parent); }
              }
              returndata(foldern[x][0], true);
            } else {
              returndata(foldern[x]);
            }
          }
          if (startVal == 0) dirsgobrr();
        }

        if (exitfn == null) {
          if (recursive) command.return(".:");
          if (format[1] != "") command.return("total " + webpage_sections.length);
          getall();
          loopthru(webpage_sections, ".", 0);
        }
        break;
      }

      case "kill": {
        const kval = parseInt(value[0]);
        if (!isNaN(kval) && kval >= 0 && kval < maxwinds) {
          let target = open_windows.find(w => w.name == "window" + kval);
          if (target && target.occupied) {
            if (target.maximized) {
              target.maximized = false;
              document.getElementById("window" + kval).classList.remove("subwin-max");
            }
            target.close();
            this.return("Task " + kval + " " + cmd_lang["kill_ok"][lang]);
            break;
          }
        }
        this.return("kill: kill " + value[0] + cmd_lang["no_process"][lang]);
        break;
      }

      case "bg": {
        const bval = "window" + parseInt(String(value[0]).replace(/^%/, ""));
        let bg_target = open_windows.find(w => w.name == bval);
        if (bg_target && bg_target.occupied && bg_target.maximized) {
          bg_target.maximized = false;
          const bel = document.getElementById(bval);
          bel.style.transition = "width .3s ease, height .3s ease";
          bel.classList.remove("subwin-max");
          setTimeout(() => { bel.style.transition = ""; }, 350);
          break;
        }
        this.return(cmd_lang["no_job"][lang], cm);
        break;
      }

      case "fg": {
        const fval = "window" + parseInt(String(value[0]).replace(/^%/, ""));
        let fg_target = open_windows.find(w => w.name == fval);
        if (fg_target && fg_target.occupied && !fg_target.maximized) {
          fg_target.maximized = true;
          const fel = document.getElementById(fval);
          fel.style.transition = "width .3s ease, height .3s ease";
          fel.classList.add("subwin-max");
          setTimeout(() => { fel.style.transition = ""; }, 350);
          break;
        }
        this.return(cmd_lang["no_job"][lang], cm);
        break;
      }

      case "jobs": {
        const running = open_windows.filter(w => w.occupied);
        if (running.length === 0) {
          this.return(cmd_lang["jobs_empty"][lang]);
          break;
        }
        running.forEach(w => {
          const id = w.name.slice(-1);
          const title = w.title.innerHTML || "—";
          const marker = w.maximized ? `[${id}] ` : `[${id}]+`;
          this.return(`${marker}&nbsp;&nbsp;${title}`);
        });
        break;
      }

      case "lang":
        value = value[0] ? value[0].toLowerCase() : "";
        switch (value) {
          case "es":
          case "en":
            lang = value;
            storage.setItem("lang", lang);
            this.return(cmd_lang["lang_changed"][lang]);
            break;
          default:
            this.return(value + cmd_lang["invalid_arg"][lang], cm);
        }
        load_lang();
        break;

      case "darkmode":
        if (value.length != 0) { this.return(cmd_lang["no_args"][lang]); break; }
        darkmode();
        break;

      case "cd":
        if (!value[0] || value[0] == "~") { this.return("/home/anon"); break; }
        this.return(value[0] + ":" + cmd_lang["perm_denied"][lang], cm);
        break;

      case "rm":
        this.return((value[1] || value[0] || ".") + cmd_lang["cannot_remove"][lang], cm);
        break;

      case "whoami":
        this.return(cmd_lang["whoami"][lang]);
        break;

      case "history":
        if (history.length === 0) {
          this.return(cmd_lang["history_empty"][lang]);
          break;
        }
        history.forEach((cmd, i) => this.return(`&nbsp;&nbsp;${i + 1}&nbsp;&nbsp;${cmd}`));
        break;

      case "man": {
        const topic = value[0];
        if (!topic) {
          this.return("man: " + cmd_lang["man_usage"][lang]);
          break;
        }
        if (man_pages[topic]) {
          this.return("<pre style='margin:4px 0;white-space:pre-wrap'>" + man_pages[topic][lang] + "</pre>");
        } else {
          this.return("man: " + topic + ": " + cmd_lang["man_notfound"][lang]);
        }
        break;
      }

      case "alias": {
        if (value.length === 0 || (value.length === 1 && value[0] === "")) {
          if (aliases.size === 0) {
            this.return(cmd_lang["alias_none"][lang]);
          } else {
            aliases.forEach((v, k) => this.return(`alias ${k}='${v}'`));
          }
          break;
        }
        const alias_str = value.join(" ");
        const eq_idx = alias_str.indexOf("=");
        if (eq_idx === -1) {
          const name = alias_str.trim();
          if (aliases.has(name)) {
            this.return(`alias ${name}='${aliases.get(name)}'`);
          } else {
            this.return(`alias: ${name}: ` + cmd_lang["alias_missing"][lang]);
          }
        } else {
          const alias_name = alias_str.slice(0, eq_idx).trim();
          const alias_val = alias_str.slice(eq_idx + 1).replace(/^['"]|['"]$/g, "").trim();
          if (alias_name) {
            aliases.set(alias_name, alias_val);
            this.return(`alias ${alias_name}='${alias_val}' ` + cmd_lang["alias_set"][lang]);
          }
        }
        break;
      }

      case "neofetch": {
        if (value.length != 0) { this.return("neofetch: " + cmd_lang["no_args"][lang]); break; }
        const uptime_s = Math.round((Date.now() - page_load_time) / 1000);
        const uptime_str = uptime_s < 60 ? uptime_s + "s" : Math.floor(uptime_s / 60) + "m " + (uptime_s % 60) + "s";
        const theme_str = night == "true" ? cmd_lang["neo_dark"][lang] : cmd_lang["neo_light"][lang];
        const res_str = window.screen.width + "x" + window.screen.height;
        const repos_str = Object.keys(github_repos).length;

        this.return(`<pre class="neofetch">  b1ch0@terminal
  ──────────────────────────────
  ${cmd_lang["neo_role"][lang]}:        ${cmd_lang["neo_job"][lang]}
  OS:         b1ch0-web v2.0
  Shell:      b1ch0sh 1.0
  ${cmd_lang["neo_uptime"][lang]} ${uptime_str}
  ${cmd_lang["neo_res"][lang]} ${res_str}
  Theme:      ${theme_str}
  Repos:      ${repos_str > 0 ? repos_str + " (GitHub API)" : cmd_lang["neo_norepos"][lang]}
  ${cmd_lang["neo_lang"][lang]} ${cmd_lang["neo_langname"][lang]}
  ${cmd_lang["neo_loc"][lang]} Madrid, España</pre>`);
        break;
      }

      case "sudo":
        this.return(cmd_lang["sudo"][lang]);
        break;

      case "vim":
        this.return(cmd_lang["vim"][lang]);
        break;

      case "nano":
      case "emacs":
        this.return(cm + cmd_lang["editor"][lang]);
        break;

      case "exit":
      case "logout":
        this.return(cmd_lang["exit"][lang]);
        break;

      case "hack":
        this.return(cmd_lang["hack"][lang]);
        break;

      case "uname":
        this.return("b1ch0sh 1.0 #1 SMP " + date.toString().split("(")[0] + " x86_64 GNU/JS");
        break;

      case "uptime": {
        const up_s = Math.round((Date.now() - page_load_time) / 1000);
        this.return(" " + new Date().toTimeString().slice(0, 8) + " up " + (up_s < 60 ? up_s + "s" : Math.floor(up_s / 60) + " min") + ",  1 user,  load average: 0.00, 0.00, 0.00");
        break;
      }

      case "color": {
        const _palette = ["#000000","#0000aa","#00aa00","#00aaaa","#aa0000","#aa00aa","#aa5500","#aaaaaa",
                          "#555555","#5555ff","#55ff55","#55ffff","#ff5555","#ff55ff","#ffff55","#ffffff"];
        const _colorVars = ["--background","--term","--text","--text2","--glow","--light-grey","--subheader","--border","--disabled-button"];
        const code = (value[0] || "").toUpperCase();
        if (!code) {
          _colorVars.forEach(v => document.documentElement.style.removeProperty(v));
          this.return(cmd_lang["color_reset"][lang]);
          break;
        }
        if (!/^[0-9A-F]{2}$/.test(code)) {
          this.return("color: " + code.toLowerCase() + cmd_lang["invalid_arg"][lang]);
          break;
        }
        const _bg = _palette[parseInt(code[0], 16)];
        const _fg = _palette[parseInt(code[1], 16)];
        if (_bg === _fg) {
          this.return("color: " + cmd_lang["color_same"][lang]);
          break;
        }
        const _p = (h, s) => parseInt(h.slice(s, s+2), 16);
        const _mix = (h1, h2, t) => [1,3,5].map(o =>
          Math.round(_p(h1,o)*(1-t)+_p(h2,o)*t).toString(16).padStart(2,'0')
        ).join('');
        const _r = parseInt(_fg.slice(1,3),16), _g = parseInt(_fg.slice(3,5),16), _b = parseInt(_fg.slice(5,7),16);
        const _header = '#' + _mix(_bg, _fg, 0.12);
        const _sub    = '#' + _mix(_bg, _fg, 0.06);
        const root = document.documentElement.style;
        root.setProperty("--background",  _bg);
        root.setProperty("--term",        _bg);
        root.setProperty("--text",        _fg);
        root.setProperty("--text2",       _fg);
        root.setProperty("--glow",        `rgba(${_r},${_g},${_b},0.5)`);
        root.setProperty("--light-grey",      _header);
        root.setProperty("--subheader",       _sub);
        root.setProperty("--border",          `rgba(${_r},${_g},${_b},0.2)`);
        root.setProperty("--disabled-button", '#' + _mix(_bg, _fg, 0.25));
        break;
      }

      case "base64": {
        const decode = value[0] === "-d";
        const text = (decode ? value.slice(1) : value).join(" ");
        if (!text) {
          this.return("base64: " + cmd_lang["base64_usage"][lang]);
          break;
        }
        try {
          if (decode) {
            const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
            this.return(new TextDecoder().decode(bytes));
          } else {
            const bytes = new TextEncoder().encode(text);
            this.return(btoa(String.fromCharCode(...bytes)));
          }
        } catch(e) {
          this.return("base64: " + cmd_lang["base64_err"][lang]);
        }
        break;
      }

      case "help":
        this.return(cmd_lang["help"][lang]);
        break;

      default:
        if (tree_html.includes(cm + value.join(""))) {
          cm = "/" + cm;
          execute_function();
          return;
        }
        if (wrong_command >= 5) {
          this.return(cmd_lang["simpler_ui"][lang]);
          wrong_command = 0;
        } else {
          wrong_command++;
          const _known = ["ls","cat","cd","tree","clear","pwd","echo","date","kill","fg","bg","jobs","lang","darkmode","color","neofetch","history","man","alias","enable","disable","whoami","rm","sudo","base64","uname","uptime","exit"];
          const _suggestion = _known.find(c => _levenshtein(cm, c) <= 2);
          let _msg = shell + cm + ": " + cmd_lang["cmd_not_found"][lang];
          if (_suggestion) _msg += ` — ${cmd_lang["suggestion"][lang]} <strong>${_suggestion}</strong>?`;
          this.return(_msg);
        }
    }
  }

  run_window(type, arg1) {
    let available;
    try {
      open_windows.forEach(cwind => {
        if (!cwind.occupied) {
          available = cwind;
          throw "break";
        }
      });
    } catch (e) {}

    if (available) {
      available.open(type, arg1);
    } else {
      this.return(cmd_lang["no_windows"][lang]);
    }
  }

  cat(file) {
    let file_og = file.split("/").pop();
    let file_lang = file_og.split(".").shift() + "_" + lang + ".md";
    if (files[file_lang] !== undefined) {
      stdout.innerHTML += files[file_lang];
    } else if (files[file_og] !== undefined) {
      stdout.innerHTML += files[file_og];
    } else {
      this.return(file_og + ": " + cmd_lang["no_file"][lang]);
    }
    height_check();
  }

  return(message, cm = false) {
    if (cm != false) {
      message = shell + cm + ": " + message;
    }
    stdout.innerHTML += "<p>" + message + "</p>";
    height_check(2);
  }
}
