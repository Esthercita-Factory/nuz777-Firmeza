import "./styles/app.css";

const sidebar = document.getElementById("sidebar");
let mainContent = document.getElementById("main-content");
const toggle = document.getElementById("sidebar-toggle");
const iconOpen = document.getElementById("toggle-icon-open");
const iconClose = document.getElementById("toggle-icon-close");

const sidebarStateKey = "firmeza-sidebar-open";

let currentOpen = false;

const applyOpen = (open) => {
    currentOpen = open;
    sidebar?.classList.toggle("-translate-x-full", !open);
    mainContent?.classList.toggle("lg:pl-72", open);
    if (toggle) {
        toggle.classList.toggle("left-72", open);
        toggle.classList.toggle("left-5", !open);
        toggle.setAttribute("aria-expanded", String(open));
        iconOpen?.classList.toggle("hidden", !open);
        iconClose?.classList.toggle("hidden", open);
    }
};

if (sidebar && mainContent && toggle) {
    [sidebar, mainContent, toggle].forEach((element) => {
        if (element) element.style.transition = "none";
    });

    applyOpen(localStorage.getItem(sidebarStateKey) === "true");

    requestAnimationFrame(() => {
        [sidebar, mainContent, toggle].forEach((element) => {
            if (element) element.style.transition = "";
        });
    });

    toggle.addEventListener("click", () => {
        applyOpen(!currentOpen);
        localStorage.setItem(sidebarStateKey, String(currentOpen));
    });
}

const parseNumber = (value) => {
    const normalized = String(value ?? "").trim().replace(",", ".");
    if (normalized === "" || normalized === "-" || normalized === "." || normalized === "-.") {
        return null;
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
};

if (window.jQuery && jQuery.validator) {
    const methods = jQuery.validator.methods;

    methods.number = (value) => value === "" || /^-?\d+([.,]\d+)?$/.test(String(value).trim());
    methods.digits = (value) => /^\d+$/.test(String(value).trim());
    methods.min = (value, element, param) => {
        if (value === "") return true;
        const number = parseNumber(value);
        return number !== null && number >= param;
    };
    methods.max = (value, element, param) => {
        if (value === "") return true;
        const number = parseNumber(value);
        return number !== null && number <= param;
    };
    methods.range = (value, element, params) => {
        if (value === "") return true;
        const number = parseNumber(value);
        return number !== null && number >= params[0] && number <= params[1];
    };
}

const numberInputPattern = /^[\d.]*$/;
const letterPattern = /^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ' -]+$/;

const onNumberBeforeInput = (event) => {
    if (event.data && !/[\d.]/.test(event.data)) {
        event.preventDefault();
    }
};

const onNumberPaste = (event) => {
    const text = (event.clipboardData || window.clipboardData).getData("text");
    if (!numberInputPattern.test(text)) {
        event.preventDefault();
    }
};

const onLetterBeforeInput = (event) => {
    if (event.data && !letterPattern.test(event.data)) {
        event.preventDefault();
    }
};

const onLetterPaste = (event) => {
    const text = (event.clipboardData || window.clipboardData).getData("text");
    if (!letterPattern.test(text)) {
        event.preventDefault();
    }
};

const initSanitizers = () => {
    document.querySelectorAll("input[type='number']").forEach((input) => {
        input.addEventListener("beforeinput", onNumberBeforeInput);
        input.addEventListener("paste", onNumberPaste);
    });

    document.querySelectorAll("input[data-val-regex]").forEach((input) => {
        input.addEventListener("beforeinput", onLetterBeforeInput);
        input.addEventListener("paste", onLetterPaste);
    });
};

const initForms = () => {
    if (window.jQuery && jQuery.validator && jQuery.validator.unobtrusive) {
        jQuery.validator.unobtrusive.parse("form");
    }
};

const loadContent = (url, pushState) => {
    fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const newContent = doc.getElementById("main-content");

            if (!newContent || (sidebar && !doc.getElementById("sidebar"))) {
                window.location.href = url;
                return;
            }

            mainContent.outerHTML = newContent.outerHTML;
            mainContent = document.getElementById("main-content");
            document.title = doc.title || document.title;
            applyOpen(currentOpen);
            initSanitizers();
            initForms();

            if (pushState) {
                window.history.pushState({ url }, "", url);
            }
            window.scrollTo({ top: 0, behavior: "instant" });
        })
        .catch(() => {
            window.location.href = url;
        });
};

document.querySelectorAll("#sidebar nav a").forEach((link) => {
    link.addEventListener("click", (event) => {
        const url = link.getAttribute("href");
        if (!url || url === window.location.pathname + window.location.search) {
            return;
        }
        event.preventDefault();
        loadContent(url, true);
    });
});

window.addEventListener("popstate", (event) => {
    if (event.state?.url) {
        loadContent(event.state.url, false);
    }
});

initSanitizers();
initForms();