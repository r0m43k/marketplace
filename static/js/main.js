document.querySelectorAll(".js-add-cart").forEach(form => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Adding...";

    try {
      const resp = await fetch(form.action, {
        method: "POST",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        const counter = document.querySelector(".nav-cart .count");
        if (counter) counter.textContent = data.count;
        btn.textContent = "In Cart ✓";
        btn.classList.add("in-cart");
      }
    } catch {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});

const starBtns = document.querySelectorAll(".star-btn");
const ratingInput = document.querySelector("#rating-input");

if (starBtns.length && ratingInput) {
  starBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.val);
      ratingInput.value = val;
      starBtns.forEach(b => {
        b.classList.toggle("active", parseInt(b.dataset.val) <= val);
      });
    });
    btn.addEventListener("mouseenter", () => {
      const val = parseInt(btn.dataset.val);
      starBtns.forEach(b => {
        b.classList.toggle("hover", parseInt(b.dataset.val) <= val);
      });
    });
    btn.addEventListener("mouseleave", () => {
      starBtns.forEach(b => b.classList.remove("hover"));
    });
  });
}

const sortSelect = document.querySelector(".sort-select");
if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("sort", sortSelect.value);
    window.location.href = url.toString();
  });
}

function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, val] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}

document.querySelectorAll("img[data-fallback]").forEach(img => {
  img.addEventListener("error", () => {
    img.parentElement.innerHTML =
      `<div class="product-img-placeholder">${img.dataset.fallback}</div>`;
  });
});