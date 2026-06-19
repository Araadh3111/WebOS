const text = "Welcome to AraadhOS";
const target = document.querySelector(".typed");
let i = 0;
function type() {
    if (i < text.length) {
        target.textContent += text.charAt(i);
        i++;
        setTimeout(type, 90);
    }
}
setTimeout(type, 2200);

const frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
let fi = 0;
const spinner = document.querySelector(".spinner");
setInterval(() => {
    spinner.textContent = frames[fi];
    fi = (fi + 1) % frames.length;
}, 90);

const face = document.querySelector(".face");
setInterval(() => {
    face.textContent = "(-‿-)";
    setTimeout(() => face.textContent = "(◕‿◕)", 160);
}, 2600);

function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    // osSettings is defined later in the desktop section; before it exists we
    // safely default to 12-hour. Settings can flip osSettings.clock24 live.
    const use24 = window.osSettings && window.osSettings.clock24;
    if (use24) {
        document.getElementById("clock").textContent = `${String(h).padStart(2, "0")}:${m}`;
    } else {
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        document.getElementById("clock").textContent = `${h}:${m} ${ampm}`;
    }
}
updateClock();
setInterval(updateClock, 1000);

const landing = document.getElementById("landing");
const desktop = document.getElementById("desktop");
let entered = false;
function enterDesktop() {
    if (entered) return;
    entered = true;
    landing.classList.add("powering-off");
    setTimeout(() => {
        landing.style.display = "none";
        desktop.style.display = "flex";
        desktop.classList.add("powering-on");
    }, 500);
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enterDesktop();
});
document.querySelector(".enter-prompt").addEventListener("click", enterDesktop);

/* =========================================================================
   DESKTOP: WINDOW SYSTEM + APPS
   =========================================================================
   The whole desktop is driven by an "app registry" (APPS below). Each app
   knows its name, dock icon, and a render() function that fills a window's
   content. The window system itself (open/drag/focus/close) is generic and
   shared by every app — add an app to APPS and it "just works" in the dock,
   the terminal `open` command, and the menu bar.
   ========================================================================= */

const desktopBody = document.getElementById("desktop-body");
const dock = document.getElementById("dock");

// Tracks the currently open windows: appId -> window DOM element.
// We allow only one window per app; opening an already-open app just focuses it.
const openWindows = {};

// Rising counter used for z-index so the most recently focused window is on top.
let topZ = 100;

// Small cascade offset so two windows don't open exactly on top of each other.
let openOffset = 0;

/* =========================================================================
   PROFILE — your real content lives here. Edit this object; the About,
   Projects and Files apps render straight from it. No HTML editing needed.
   ========================================================================= */
const PROFILE = {
    name: "Araadh",
    tagline: "solo founder & builder · Chandigarh, India",
    // About Me app
    about: [
        "15, solo founder and builder from Chandigarh, India.",
        "I work across hardware and software — AI research tooling, EMG-controlled prosthetics, and assistive tech.",
        "Building toward space and engineering, one shipped project at a time.",
    ],
    skills: [
        "Python", "JavaScript", "Next.js", "FastAPI", "Supabase", "Three.js",
        "KiCad", "Fusion 360", "CadQuery", "MicroPython", "QMK",
        "RP2040 / RP2350", "ESP32", "EMG / sensors", "vector search",
    ],
    links: [
        { label: "GitHub", url: "https://github.com/Araadh3111" },
        { label: "Email", url: "mailto:araadh3111@gmail.com" },
    ],
    // Projects app (rendered terminal-style)
    projects: [
        {
            name: "researca",
            desc: "AI literature-review tool that turns a query into cited synthesis from real papers.",
            tech: ["FastAPI", "Next.js", "Supabase", "Gemini embeddings + HNSW", "Claude"],
            url: "https://github.com/Araadh3111/research-copilot",
        },
        {
            name: "unbound-bionics",
            desc: "EMG-controlled 3D-printed prosthetic hand (Bionix).",
            tech: ["Fusion 360", "KiCad", "RP2350", "MyoWare EMG", "MicroPython"],
            url: "",
        },
        {
            name: "luma",
            desc: "Custom mechanical macropad with OLED + encoder.",
            tech: ["KiCad", "CadQuery", "QMK"],
            url: "",
        },
        {
            name: "araadh-os",
            desc: "This browser-based OS-style desktop. Vanilla HTML/CSS/JS.",
            tech: ["HTML", "CSS", "JavaScript"],
            url: "https://github.com/Araadh3111/WebOS",
        },
    ],
    // Files app — lightweight-functional. Each file has a `kind` that decides
    // what happens when clicked (see renderFiles): readme opens a window,
    // link opens/downloads a file, open-projects opens the Projects app.
    files: [
        { type: "file", name: "README.txt", kind: "readme" },
        { type: "file", name: "resume.pdf", kind: "link", url: "resume.pdf" },
        { type: "folder", name: "Projects", kind: "open-projects" },
    ],
};

/* =========================================================================
   SETTINGS — a small persistent settings store.
   osSettings holds the live values; saveSettings() writes them to
   localStorage; applySettings() pushes them onto the page. Everything in the
   Settings app just edits osSettings then calls save + apply.
   ========================================================================= */

// The default desktop wallpaper — your image in /images. Swap the path here
// to change the default any new visitor sees.
const DEFAULT_WALLPAPER = {
    mode: "image",
    value: "images/wallpaper.png",
};

const SETTINGS_KEY = "araadhos-settings";

// Preset accent colors offered in the Settings app (ayu palette).
const ACCENTS = ["#E6B450", "#7FD962", "#59C2FF", "#D2A6FF", "#D95757"];

// Load saved settings, merged over sensible defaults.
function loadSettings() {
    const defaults = { accent: "#E6B450", clock24: false, scale: 100, wallpaper: DEFAULT_WALLPAPER };
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        return Object.assign(defaults, saved || {});
    } catch {
        return defaults;
    }
}

// The single source of truth for settings. Put it on window so the clock
// (defined earlier in the file) can read clock24 without import gymnastics.
const osSettings = loadSettings();
window.osSettings = osSettings;

// Persist current settings (wrapped: big wallpaper data URLs can exceed quota).
function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(osSettings));
    } catch (e) {
        console.warn("Could not save settings:", e);
    }
}

// Apply the wallpaper (either a CSS background string or an image data URL/path).
function applyWallpaper(wp) {
    if (wp.mode === "image") {
        desktopBody.style.background = "";
        desktopBody.style.backgroundImage = `url(${wp.value})`;
    } else {
        desktopBody.style.backgroundImage = "none";
        desktopBody.style.background = wp.value;
    }
}

// Push every setting onto the page. Called on startup and after any change.
function applySettings() {
    document.documentElement.style.setProperty("--accent", osSettings.accent);
    // zoom scales the whole desktop UI cheaply; 100 = normal.
    document.getElementById("desktop").style.zoom = osSettings.scale / 100;
    applyWallpaper(osSettings.wallpaper);
    updateClock(); // reflect 12/24h immediately
}

/* ---- The app registry. `render` receives the .window-content element. ---- */
const APPS = {
    terminal: { name: "Terminal",   icon: "🖥️", render: renderTerminal },
    about:    { name: "About Me",   icon: "👤", render: renderAbout },
    projects: { name: "Projects",   icon: "🚀", render: renderProjects },
    files:    { name: "Files",      icon: "🗂️", render: renderFiles },
    calc:     { name: "Calculator", icon: "🧮", render: renderCalculator },
    settings: { name: "Settings",   icon: "⚙️", render: renderSettings },
    // `hidden` apps don't get a dock tile; they're opened from other apps
    // (e.g. clicking README.txt in Files opens this viewer window).
    readme:   { name: "README.txt", icon: "📄", render: renderReadme, hidden: true },
};

/* ------------------------------------------------------------------ */
/* Window system core                                                  */
/* ------------------------------------------------------------------ */

// Bring a window to the front by giving it the highest z-index, and mark it
// (and only it) as ".focused" for the subtle glow.
function focusWindow(win) {
    topZ += 1;
    win.style.zIndex = topZ;
    document.querySelectorAll(".window.focused").forEach((w) => w.classList.remove("focused"));
    win.classList.add("focused");
}

// Animate a window out, then remove it and clear its dock indicator.
function closeWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.classList.add("closing");
    // Wait for the close animation to finish before removing from the DOM.
    win.addEventListener("animationend", () => win.remove(), { once: true });
    delete openWindows[appId];
    updateDockIndicators();
}

// Make a window draggable by its title bar. We track the pointer's offset from
// the window's top-left corner so the window follows the cursor smoothly.
function makeDraggable(win, handle) {
    let offsetX = 0;   // pointer-to-window-left gap, in pixels
    let offsetY = 0;   // pointer-to-window-top gap, in pixels

    function onMouseMove(e) {
        // Convert the pointer position into desktop-local coordinates, then
        // subtract the grab offset to get the window's new top-left.
        const bounds = desktopBody.getBoundingClientRect();
        let left = e.clientX - bounds.left - offsetX;
        let top = e.clientY - bounds.top - offsetY;

        // Keep the window roughly inside the desktop surface.
        left = Math.max(0, Math.min(left, bounds.width - 60));
        top = Math.max(0, Math.min(top, bounds.height - 30));

        win.style.left = left + "px";
        win.style.top = top + "px";
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    handle.addEventListener("mousedown", (e) => {
        // Don't start a drag when clicking the traffic-light dots.
        if (e.target.classList.contains("wdot")) return;
        // Record how far into the window the user grabbed.
        const winRect = win.getBoundingClientRect();
        offsetX = e.clientX - winRect.left;
        offsetY = e.clientY - winRect.top;
        focusWindow(win);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
}

// Open an app: if it's already open, just focus it; otherwise build a window.
function openApp(appId) {
    const app = APPS[appId];
    if (!app) return;

    // Single-instance: re-focus an already-open app instead of duplicating.
    if (openWindows[appId]) {
        focusWindow(openWindows[appId]);
        return;
    }

    // Build the window shell.
    const win = document.createElement("div");
    win.className = "window";
    win.dataset.app = appId;
    win.innerHTML = `
        <div class="window-titlebar">
            <div class="window-dots">
                <span class="wdot red"></span>
                <span class="wdot yellow"></span>
                <span class="wdot green"></span>
            </div>
            <span class="window-title">${app.icon} ${app.name}</span>
        </div>
        <div class="window-content"></div>
    `;

    // Cascade the position so stacked windows are visible.
    win.style.left = (60 + openOffset) + "px";
    win.style.top = (40 + openOffset) + "px";
    openOffset = (openOffset + 28) % 140;

    desktopBody.appendChild(win);
    openWindows[appId] = win;

    // Wire the close (red) dot and click-to-focus.
    win.querySelector(".wdot.red").addEventListener("click", () => closeWindow(appId));
    win.addEventListener("mousedown", () => focusWindow(win));

    // Enable dragging via the title bar.
    makeDraggable(win, win.querySelector(".window-titlebar"));

    // Let the app fill its content.
    app.render(win.querySelector(".window-content"));

    focusWindow(win);
    updateDockIndicators();
}

/* ------------------------------------------------------------------ */
/* Dock — built from the registry, with hover labels + open indicators */
/* ------------------------------------------------------------------ */

function buildDock() {
    Object.keys(APPS).forEach((appId) => {
        const app = APPS[appId];
        if (app.hidden) return; // hidden apps (e.g. README viewer) get no tile
        const item = document.createElement("div");
        item.className = "dock-item";
        item.dataset.app = appId;
        item.innerHTML = `
            <span class="dock-icon">${app.icon}</span>
            <span class="dock-label">${app.name}</span>
            <span class="dock-indicator"></span>
        `;
        item.addEventListener("click", () => {
            // Replay the little bounce animation each click.
            item.classList.remove("bounce");
            void item.offsetWidth; // force reflow so the animation restarts
            item.classList.add("bounce");
            openApp(appId);
        });
        dock.appendChild(item);
    });
}

// Toggle the ".is-open" dot on each dock tile based on what's open.
function updateDockIndicators() {
    document.querySelectorAll(".dock-item").forEach((item) => {
        item.classList.toggle("is-open", !!openWindows[item.dataset.app]);
    });
}

// Wire the menu-bar buttons (Settings, Terminal) to open their apps.
document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => openApp(btn.dataset.app));
});

buildDock();

// Apply saved settings (accent, scale, wallpaper, clock format) on startup.
applySettings();

/* ------------------------------------------------------------------ */
/* APP: Terminal — a small working command interpreter                 */
/* ------------------------------------------------------------------ */

function renderTerminal(content) {
    content.innerHTML = `
        <div class="term">
            <div class="term-output"></div>
            <div class="term-inputline">
                <span class="term-prompt">araadh@os ~ %</span>
                <input class="term-input" autocomplete="off" spellcheck="false" />
            </div>
        </div>
    `;

    const output = content.querySelector(".term-output");
    const input = content.querySelector(".term-input");

    // Print a line to the terminal output. `cls` lets us color responses.
    function print(text, cls) {
        const line = document.createElement("p");
        line.className = "term-line" + (cls ? " " + cls : "");
        line.textContent = text;
        output.appendChild(line);
        // Keep the newest output scrolled into view.
        content.scrollTop = content.scrollHeight;
    }

    // The command table. Each command is a function that may print output.
    const commands = {
        help() {
            print("available commands:", "accent-blue");
            print("  help            show this list");
            print("  about           a quick intro");
            print("  open <app>      open an app (terminal, about, projects, files, settings)");
            print("  ls              list available apps");
            print("  whoami          who you're logged in as");
            print("  date            current date & time");
            print("  echo <text>     print text back");
            print("  clear           clear the screen");
        },
        about() {
            print("AraadhOS — a personal web desktop built in vanilla JS.", "accent-green");
            print("Type 'help' to see what you can do.");
        },
        ls() {
            // Only list apps that have a dock tile (skip hidden helpers).
            print(Object.keys(APPS).filter((id) => !APPS[id].hidden).join("   "), "accent-purple");
        },
        whoami() { print("araadh"); },
        date() { print(new Date().toString()); },
        clear() { output.innerHTML = ""; },
        open(args) {
            const appId = args[0];
            if (!appId) { print("usage: open <app>", "accent-blue"); return; }
            if (!APPS[appId]) { print(`no such app: ${appId}`, "accent-purple"); return; }
            openApp(appId);
            print(`opening ${APPS[appId].name}...`, "accent-green");
        },
        echo(args) { print(args.join(" ")); },
    };

    // Parse and run a typed command line.
    function run(raw) {
        const trimmed = raw.trim();
        // Echo the command back with the prompt, like a real shell.
        print(`araadh@os ~ % ${trimmed}`, "term-prompt");
        if (!trimmed) return;
        const [cmd, ...args] = trimmed.split(/\s+/);
        if (commands[cmd]) {
            commands[cmd](args);
        } else {
            print(`command not found: ${cmd} (try 'help')`, "accent-purple");
        }
    }

    // Run a command on Enter, then clear the input.
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            run(input.value);
            input.value = "";
        }
    });

    // Clicking anywhere in the window refocuses the input.
    content.addEventListener("mousedown", () => setTimeout(() => input.focus(), 0));

    // Greeting.
    print("AraadhOS terminal — type 'help' to get started.", "accent-green");
    setTimeout(() => input.focus(), 50);
}

/* ------------------------------------------------------------------ */
/* APP: Settings — wallpaper upload + default swatches                 */
/* ------------------------------------------------------------------ */

function renderSettings(content) {
    // Default gradient wallpapers. Swap these for your own image URLs later.
    const swatches = [
        "radial-gradient(ellipse at 50% 40%, #11151E 0%, #0B0E14 55%, #070910 100%)",
        "linear-gradient(135deg, #1a1426, #0B0E14)",
        "linear-gradient(135deg, #0e2018, #0B0E14)",
        "linear-gradient(135deg, #1e1810, #0B0E14)",
        "linear-gradient(135deg, #101a26, #0B0E14)",
    ];

    content.innerHTML = `
        <h2 class="app-heading">Settings</h2>

        <div class="settings-section">
            <div class="settings-label">Wallpaper — upload your own</div>
            <label class="upload-btn">
                choose image…
                <input type="file" accept="image/*" class="wallpaper-upload" />
            </label>
        </div>

        <div class="settings-section">
            <div class="settings-label">Default wallpapers</div>
            <div class="wallpaper-swatches"></div>
        </div>

        <div class="settings-section">
            <div class="settings-label">Accent color</div>
            <div class="accent-chips"></div>
        </div>

        <div class="settings-section">
            <div class="setting-row">
                <span>24-hour clock</span>
                <div class="toggle ${osSettings.clock24 ? "on" : ""}" data-toggle="clock"></div>
            </div>
            <div class="setting-row">
                <span>UI scale</span>
                <span>
                    <input type="range" min="80" max="130" step="5" value="${osSettings.scale}" class="scale-slider" />
                    <span class="setting-value">${osSettings.scale}%</span>
                </span>
            </div>
            <div class="setting-row">
                <span class="muted">Reset everything to defaults</span>
                <button class="ghost-btn reset-btn">Reset</button>
            </div>
        </div>
    `;

    // --- Wallpaper swatches: clicking one sets + saves it as the background.
    const swatchRow = content.querySelector(".wallpaper-swatches");
    swatches.forEach((bg) => {
        const s = document.createElement("div");
        s.className = "swatch";
        s.style.background = bg;
        // Mark the swatch active if it matches the current css wallpaper.
        if (osSettings.wallpaper.mode === "css" && osSettings.wallpaper.value === bg) {
            s.classList.add("active");
        }
        s.addEventListener("click", () => {
            osSettings.wallpaper = { mode: "css", value: bg };
            applyWallpaper(osSettings.wallpaper);
            saveSettings();
            // Refresh active highlight.
            swatchRow.querySelectorAll(".swatch").forEach((el) => el.classList.remove("active"));
            s.classList.add("active");
        });
        swatchRow.appendChild(s);
    });

    // --- Uploaded image: read as data URL, set as wallpaper, persist.
    content.querySelector(".wallpaper-upload").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            osSettings.wallpaper = { mode: "image", value: reader.result };
            applyWallpaper(osSettings.wallpaper);
            saveSettings();
            swatchRow.querySelectorAll(".swatch").forEach((el) => el.classList.remove("active"));
        };
        reader.readAsDataURL(file);
    });

    // --- Accent color chips.
    const chipRow = content.querySelector(".accent-chips");
    ACCENTS.forEach((color) => {
        const chip = document.createElement("div");
        chip.className = "accent-chip" + (osSettings.accent === color ? " active" : "");
        chip.style.backgroundColor = color;
        chip.addEventListener("click", () => {
            osSettings.accent = color;
            applySettings();
            saveSettings();
            chipRow.querySelectorAll(".accent-chip").forEach((el) => el.classList.remove("active"));
            chip.classList.add("active");
        });
        chipRow.appendChild(chip);
    });

    // --- 24-hour clock toggle.
    const clockToggle = content.querySelector('[data-toggle="clock"]');
    clockToggle.addEventListener("click", () => {
        osSettings.clock24 = !osSettings.clock24;
        clockToggle.classList.toggle("on", osSettings.clock24);
        applySettings();   // refreshes the clock immediately
        saveSettings();
    });

    // --- UI scale slider.
    const slider = content.querySelector(".scale-slider");
    const scaleValue = content.querySelector(".setting-value");
    slider.addEventListener("input", () => {
        osSettings.scale = Number(slider.value);
        scaleValue.textContent = osSettings.scale + "%";
        applySettings();
        saveSettings();
    });

    // --- Reset to defaults: clear storage and re-apply.
    content.querySelector(".reset-btn").addEventListener("click", () => {
        Object.assign(osSettings, { accent: "#E6B450", clock24: false, scale: 100, wallpaper: DEFAULT_WALLPAPER });
        applySettings();
        saveSettings();
        closeWindow("settings");
        openApp("settings"); // reopen so all controls reflect the reset
    });
}

/* ------------------------------------------------------------------ */
/* APPS: About / Projects / Files — all rendered from the PROFILE data */
/* ------------------------------------------------------------------ */

function renderAbout(content) {
    // Build the bio paragraphs and skill/link chips straight from PROFILE.
    const bio = PROFILE.about.map((p) => `<p>${p}</p>`).join("");
    const skills = PROFILE.skills.map((s) => `<span class="accent-blue">${s}</span>`).join("  ·  ");
    const links = PROFILE.links
        .map((l) => `<a href="${l.url}" target="_blank" class="accent-green">${l.label}</a>`)
        .join("   ");

    content.innerHTML = `
        <h2 class="app-heading">About Me</h2>
        <p class="muted">${PROFILE.tagline}</p>
        ${bio}
        <p style="margin-top:14px;"><span class="muted">skills:</span> ${skills}</p>
        <p><span class="muted">links:</span> ${links}</p>
    `;
}

function renderProjects(content) {
    // Terminal-style: an `ls` line listing the projects, then a `cat` block
    // for each one — keeps the OS vibe consistent with the real terminal app.
    const names = PROFILE.projects.map((p) => p.name).join("   ");

    const blocks = PROFILE.projects
        .map((p) => {
            const tech = p.tech.join(", ");
            const link = p.url
                ? `\n<a href="${p.url}" target="_blank" class="accent-blue">${p.url}</a>`
                : "";
            return (
`<p class="term-line term-prompt">araadh@os ~/projects % cat ${p.name}</p>` +
`<p class="term-line accent-green"># ${p.name}</p>` +
`<p class="term-line">${p.desc}</p>` +
`<p class="term-line muted">tech: ${tech}</p>` +
(link ? `<p class="term-line">${link}</p>` : "") +
`<p class="term-line">&nbsp;</p>`
            );
        })
        .join("");

    content.innerHTML = `
        <div class="term term-output" style="width:480px;">
            <p class="term-line term-prompt">araadh@os ~/projects % ls</p>
            <p class="term-line accent-purple">${names}</p>
            <p class="term-line">&nbsp;</p>
            ${blocks}
        </div>
    `;
}

function renderFiles(content) {
    content.innerHTML = `
        <h2 class="app-heading">Files</h2>
        <p class="muted" style="margin-bottom:10px;">double-click to open</p>
        <div class="file-grid"></div>
    `;

    const grid = content.querySelector(".file-grid");

    // Each PROFILE.files entry becomes a clickable icon. Its `kind` decides
    // what opening it does — this keeps the files genuinely functional.
    PROFILE.files.forEach((entry) => {
        const isFolder = entry.type === "folder";
        const tile = document.createElement("div");
        tile.className = "file-tile";
        tile.innerHTML = `
            <span class="file-icon">${isFolder ? "📁" : "📄"}</span>
            <span class="file-name">${entry.name}</span>
        `;
        // Open on double-click (like a real desktop) or single tap for ease.
        tile.addEventListener("dblclick", () => openFile(entry));
        grid.appendChild(tile);
    });
}

// Decide what happens when a file/folder is opened, based on its `kind`.
function openFile(entry) {
    switch (entry.kind) {
        case "readme":
            openApp("readme");            // opens the README viewer window
            break;
        case "link":
            window.open(entry.url, "_blank"); // open/download the file
            break;
        case "open-projects":
            openApp("projects");          // folder jumps to the Projects app
            break;
        default:
            openApp("readme");
    }
}

// README.txt viewer — shows the About text as a readable plain-text file.
function renderReadme(content) {
    const body = PROFILE.about.join("\n\n");
    content.innerHTML = `
        <div class="term" style="width:440px;">
            <p class="term-line muted"># README.txt</p>
            <p class="term-line">&nbsp;</p>
            <div class="term-output" style="white-space:pre-wrap;">${body}</div>
        </div>
    `;
}

/* ------------------------------------------------------------------ */
/* APP: Calculator — a small, pretty, working calculator               */
/* ------------------------------------------------------------------ */

function renderCalculator(content) {
    // Button layout. "op" = operator (gold), "eq" = equals (filled gold),
    // "fn" = function key (AC, ±, %), plain = number/decimal.
    const buttons = [
        { label: "AC", type: "fn" }, { label: "±", type: "fn" }, { label: "%", type: "fn" }, { label: "÷", type: "op" },
        { label: "7" }, { label: "8" }, { label: "9" }, { label: "×", type: "op" },
        { label: "4" }, { label: "5" }, { label: "6" }, { label: "−", type: "op" },
        { label: "1" }, { label: "2" }, { label: "3" }, { label: "+", type: "op" },
        { label: "0", wide: true }, { label: "." }, { label: "=", type: "eq" },
    ];

    content.innerHTML = `
        <div class="calc">
            <div class="calc-display">0</div>
            <div class="calc-grid"></div>
        </div>
    `;

    const display = content.querySelector(".calc-display");
    const gridEl = content.querySelector(".calc-grid");

    // `expr` is the running expression string we display and evaluate.
    let expr = "";

    function refresh() {
        display.textContent = expr === "" ? "0" : expr;
    }

    // Safely evaluate the expression. We map the pretty operator symbols back
    // to JS operators and ONLY allow digits / operators / dot / parentheses,
    // so there's nothing dangerous to evaluate.
    function compute() {
        const js = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
        if (!/^[-+*/.()\d\s]+$/.test(js)) return;
        try {
            const result = Function(`"use strict"; return (${js})`)();
            expr = (result === undefined || Number.isNaN(result)) ? "" : String(result);
        } catch {
            expr = "";
            display.textContent = "error";
            return;
        }
        refresh();
    }

    // Handle a key press (from a click or the physical keyboard).
    function press(label) {
        if (label === "AC") { expr = ""; }
        else if (label === "=") { compute(); return; }
        else if (label === "±") {
            // Flip the sign of the whole current expression.
            expr = expr.startsWith("-") ? expr.slice(1) : "-" + expr;
        }
        else { expr += label; }
        refresh();
    }

    // Build the button grid.
    buttons.forEach((b) => {
        const btn = document.createElement("button");
        btn.className = "calc-btn"
            + (b.type === "op" ? " op" : "")
            + (b.type === "eq" ? " eq" : "")
            + (b.type === "fn" ? " fn" : "")
            + (b.wide ? " wide" : "");
        btn.textContent = b.label;
        btn.addEventListener("click", () => press(b.label));
        gridEl.appendChild(btn);
    });

    refresh();
}