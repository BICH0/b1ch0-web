const open_windows = [];

class window_creator {
  constructor() {
    this.name = "window" + open_windows.length;
    this.occupied = false;
    this.maximized = false;
    this.create();
    this.DOM = document.getElementById(this.name);
    this.container = this.DOM.childNodes[1];
    this.title = this.DOM.childNodes[0].childNodes[0];
  }

  create() {
    const new_win = document.createElement("div");
    new_win.id = this.name;
    new_win.classList = "subwin-invisible subwin-visible";
    new_win.innerHTML =
      "<div class=\"subheader\" onmousedown=\"window_drag(event)\">" +
        "<p></p>" +
        "<div class=\"sub-btncontainer\">" +
          "<div class=\"circle subcircle\"></div>" +
          "<div id=\"max_" + this.name + "\" class=\"circle subcircle maxbtn clickable\"></div>" +
          "<div id=\"cls_" + this.name + "\" class=\"circle subcircle closebtn clickable\"></div>" +
        "</div>" +
      "</div>" +
      "<div class=\"container\"></div>";
    terminal.parentNode.appendChild(new_win);
  }

  async open(type, arg1) {
    this.DOM.classList.remove("subwin-invisible");
    this.DOM.style.height = "24px";
    this.DOM.style.overflow = "hidden";
    this.container.style.opacity = "0";
    this.occupied = true;

    if (window.innerWidth <= 768) {
      terminal.style.transition = "none";
      terminal.style.marginTop = "24px";
      terminal.style.height = "calc(100dvh - 24px)";
      requestAnimationFrame(() => { terminal.style.transition = ""; });
    }

    if (type === "iframe") {
      const iframe = document.createElement("iframe");
      iframe.src = arg1;
      this.title.innerHTML = arg1;
      this.container.appendChild(iframe);
      iframe.addEventListener("load", function () {
        const csslink = document.createElement("link");
        csslink.href = new URL("git/iframe.css", window.location.href).href;
        csslink.rel = "stylesheet";
        csslink.type = "text/css";
        iframe.contentWindow.document.head.appendChild(csslink);
      });

    } else if (type === "github-repo") {
      const repo = arg1;
      const div = document.createElement("div");
      div.classList.add("repo-display");
      div.innerHTML = this._buildRepoHTML(repo);
      this.title.innerHTML = repo.full_name;
      this.container.appendChild(div);
    }

    this.title.classList.add("subwin-blink");
    await sleep(560);
    this.title.classList.remove("subwin-blink");
    await sleep(60);

    const isMobile = window.innerWidth <= 768;
    const targetH = isMobile ? "40dvh" : "60vh";
    this.DOM.style.transition = "height .3s ease";
    this.DOM.style.height = targetH;
    if (isMobile) {
      terminal.style.marginTop = "40dvh";
      terminal.style.height = "60dvh";
      requestAnimationFrame(() => { terminal_scroll.scrollTop = terminal_scroll.scrollHeight; });
    }
    await sleep(320);
    this.DOM.style.overflow = "";
    this.DOM.style.transition = "";
    this.DOM.style.height = "";

    this.container.style.transition = "opacity .2s";
    this.container.style.opacity = "1";
    await sleep(220);
    this.container.style.transition = "";
  }

  async close() {
    if (this.maximized) {
      this.DOM.classList.remove("subwin-max");
      this.maximized = false;
    }

    this.container.style.transition = "opacity .15s";
    this.container.style.opacity = "0";
    await sleep(170);
    this.container.style.transition = "";

    const isMobileClose = window.innerWidth <= 768;
    const willExpand = isMobileClose && open_windows.every(w => w === this || !w.occupied);
    this.DOM.style.overflow = "hidden";
    this.DOM.style.transition = "height .3s ease";
    this.DOM.style.height = "24px";
    if (willExpand) {
      terminal.style.marginTop = "24px";
      terminal.style.height = "calc(100dvh - 24px)";
    }
    await sleep(320);
    this.DOM.style.transition = "";

    this.title.classList.add("subwin-blink");
    await sleep(560);
    this.title.classList.remove("subwin-blink");
    await sleep(60);

    this.DOM.classList.add("subwin-invisible");
    this.container.style.opacity = "0";
    await sleep(200);
    this.DOM.style.height = "";
    this.DOM.style.overflow = "";
    this.container.innerHTML = "";
    this.occupied = false;
    this.maximized = false;

    if (willExpand) {
      terminal.style.transition = "none";
      terminal.style.marginTop = "";
      terminal.style.height = "";
      requestAnimationFrame(() => { terminal.style.transition = ""; });
    }
  }

  _buildRepoHTML(repo) {
    const is_es = (typeof lang !== "undefined" && lang === "es");
    const desc = repo.description
      ? repo.description
      : (is_es ? "Sin descripción disponible." : "No description available.");
    const language_label = repo.language || (is_es ? "Desconocido" : "Unknown");
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const updated = new Date(repo.updated_at).toLocaleDateString(is_es ? "es-ES" : "en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
    const topics = Array.isArray(repo.topics) && repo.topics.length
      ? repo.topics.map(t => `<span class="topic">${t}</span>`).join("")
      : "";

    return `
      <h2>${repo.name}</h2>
      <p>${desc}</p>
      <div class="repo-meta">
        <span>&#9733; ${stars}</span>
        <span>&#128194; ${language_label}</span>
        <span>&#128256; ${forks} forks</span>
        <span>&#128336; ${is_es ? "actualizado" : "updated"} ${updated}</span>
      </div>
      ${topics ? `<div class="repo-topics">${topics}</div>` : ""}
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
        ${is_es ? "Ver en GitHub &rarr;" : "View on GitHub &rarr;"}
      </a>
    `;
  }
}
