// This handles hint/answer toggles in interview question section and clipboard copy.
console.log("KnightTrace frontend JS loaded");

// Opens or closes a hint/answer box; updates button icon and label to match state
function toggleBox(id, button, type) {
    const box = document.getElementById(id);
    if (!box) return;

    const isOpen = box.classList.toggle("hidden") === false;

    if (!button) return;

    button.classList.toggle("is-open", isOpen);

    const icon = button.querySelector("i");
    const label = button.querySelector("span");

    if (type === "answer") {
        if (icon) icon.className = isOpen ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
        if (label) label.textContent = isOpen ? "Hide Answer" : "Show Answer";
    }

    if (type === "hint") {
        if (icon) icon.className = isOpen ? "fa-solid fa-lightbulb" : "fa-regular fa-lightbulb";
        if (label) label.textContent = isOpen ? "Hide Hint" : "Hint";
    }
}

function copyText(id) {
    const box = document.getElementById(id);
    if (!box) return;

    navigator.clipboard.writeText(box.innerText);
}