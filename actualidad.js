/* =========================================================
   1) MENÚ MÓVIL (igual que en script.js del index)
========================================================= */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", isOpen);
});

/* =========================================================
   2) PESTAÑAS DE CLASIFICACIÓN (Pilotos / Constructores)
========================================================= */
const tabButtons = document.querySelectorAll(".tab-btn");
const tables = document.querySelectorAll(".standings-table");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;

    tabButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    tables.forEach((table) => {
      table.classList.toggle("is-hidden", table.dataset.panel !== target);
    });
  });
});

/* =========================================================
   3) CUENTA REGRESIVA A LA PRÓXIMA CARRERA
   Cambia esta fecha cada vez que pase una carrera, para
   apuntar siempre al próximo Gran Premio del calendario.
========================================================= */
const nextRaceDate = new Date("2026-07-19T15:00:00+02:00").getTime(); // GP de Bélgica

const cdDays = document.getElementById("cd-days");
const cdHours = document.getElementById("cd-hours");
const cdMin = document.getElementById("cd-min");
const cdSec = document.getElementById("cd-sec");

function updateCountdown() {
  const now = new Date().getTime();
  const diff = nextRaceDate - now;

  if (diff <= 0) {
    cdDays.textContent = "00";
    cdHours.textContent = "00";
    cdMin.textContent = "00";
    cdSec.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  cdDays.textContent = String(days).padStart(2, "0");
  cdHours.textContent = String(hours).padStart(2, "0");
  cdMin.textContent = String(minutes).padStart(2, "0");
  cdSec.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* =========================================================
   4) ANIMACIÓN AL HACER SCROLL (tarjetas de pilotos/circuitos)
========================================================= */
const revealItems = document.querySelectorAll(".actual-driver, .circuit-card, .actual-team, .news-card");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => {
  item.style.opacity = "0";
  item.style.transform = "translateY(16px)";
  item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  revealObserver.observe(item);
});

/* =========================================================
   BOTÓN "VOLVER ARRIBA"
   Aparece solo cuando el usuario ha bajado un poco en la
   página, y al hacer clic sube suavemente hasta el inicio.
========================================================= */
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    backToTop.classList.add("is-visible");
  } else {
    backToTop.classList.remove("is-visible");
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* =========================================================
   5) MODAL DE DATOS DE ESCUDERÍA
   Al hacer clic en una tarjeta se muestra un modal con sus
   datos clave. Al mover el cursor fuera de la tarjeta, el
   modal se cierra para poder elegir otra escudería.
========================================================= */
const teamCards = document.querySelectorAll(".actual-team");
const teamModalOverlay = document.getElementById("teamModalOverlay");
const teamModal = document.getElementById("teamModal");
const teamModalName = document.getElementById("teamModalName");
const teamModalStats = document.getElementById("teamModalStats");

teamCards.forEach((card) => {
  card.addEventListener("click", () => {
    const name = card.querySelector("h3").textContent;
    const color = getComputedStyle(card).getPropertyValue("--team-color").trim();
    const founded = card.dataset.founded;
    const base = card.dataset.base;
    const wins = parseInt(card.dataset.wins, 10);
    const poles = parseInt(card.dataset.poles, 10);
    const best = card.dataset.best;

    teamModal.style.setProperty("--team-color", color);
    teamModalName.textContent = name;

    let statsHTML = `
      <li><span>Fundación</span><span>${founded}</span></li>
      <li><span>Sede</span><span>${base}</span></li>
    `;

    if (wins > 0 || poles > 0) {
      statsHTML += `
        <li><span>Victorias</span><span>${wins}</span></li>
        <li><span>Poles</span><span>${poles}</span></li>
      `;
    } else if (best) {
      statsHTML += `
        <li class="team-modal__best"><span>Mejor resultado</span><span>${best}</span></li>
      `;
    }

    teamModalStats.innerHTML = statsHTML;
    teamModalOverlay.classList.add("is-visible");
  });

  // Al mover el cursor fuera de la tarjeta, cerramos el modal
  card.addEventListener("mouseleave", () => {
    teamModalOverlay.classList.remove("is-visible");
  });
});