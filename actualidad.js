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
   3) CALENDARIO DE CARRERAS + PRÓXIMA CARRERA AUTOMÁTICA
   Aquí guardamos la fecha de cada Gran Premio (el domingo de
   carrera). El código detecta solo cuál es la próxima carrera
   comparando con la fecha de hoy, así ya no hay que cambiar
   nada a mano cada vez que pasa un GP.
========================================================= */
const races = [
  { round: 1,  name: "GP de Australia",          circuit: "Albert Park, Melbourne",                date: "2026-03-08T15:00:00" },
  { round: 2,  name: "GP de China",               circuit: "Shanghai International Circuit",        date: "2026-03-15T15:00:00" },
  { round: 3,  name: "GP de Japón",                circuit: "Suzuka Circuit",                         date: "2026-03-29T15:00:00" },
  { round: 4,  name: "GP de Miami",                circuit: "Miami International Autodrome",         date: "2026-05-03T15:00:00" },
  { round: 5,  name: "GP de Canadá",              circuit: "Circuit Gilles Villeneuve",              date: "2026-05-24T15:00:00" },
  { round: 6,  name: "GP de Mónaco",               circuit: "Circuit de Monaco",                      date: "2026-06-07T15:00:00" },
  { round: 7,  name: "GP de Barcelona-Catalunya",  circuit: "Circuit de Barcelona-Catalunya",         date: "2026-06-14T15:00:00" },
  { round: 8,  name: "GP de Austria",             circuit: "Red Bull Ring, Spielberg",               date: "2026-06-28T15:00:00" },
  { round: 9,  name: "GP de Gran Bretaña",         circuit: "Silverstone Circuit",                    date: "2026-07-05T15:00:00" },
  { round: 10, name: "GP de Bélgica",             circuit: "Circuito de Spa-Francorchamps",          date: "2026-07-19T15:00:00" },
  { round: 11, name: "GP de Hungría",             circuit: "Hungaroring, Budapest",                  date: "2026-07-26T15:00:00" },
  { round: 12, name: "GP de Países Bajos",        circuit: "Circuit Zandvoort",                      date: "2026-08-23T15:00:00" },
  { round: 13, name: "GP de Italia",               circuit: "Autodromo di Monza",                     date: "2026-09-06T15:00:00" },
  { round: 14, name: "GP de España",              circuit: "Circuito de Madring, Madrid",            date: "2026-09-13T15:00:00" },
  { round: 15, name: "GP de Azerbaiyán",          circuit: "Baku City Circuit",                      date: "2026-09-27T15:00:00" },
  { round: 16, name: "GP de Singapur",            circuit: "Marina Bay Street Circuit",              date: "2026-10-11T20:00:00" },
  { round: 17, name: "GP de Estados Unidos",      circuit: "Circuit of The Americas, Austin",        date: "2026-10-25T15:00:00" },
  { round: 18, name: "GP de México",              circuit: "Autódromo Hermanos Rodríguez",           date: "2026-11-01T15:00:00" },
  { round: 19, name: "GP de Brasil",              circuit: "Autódromo José Carlos Pace, Interlagos", date: "2026-11-08T15:00:00" },
  { round: 20, name: "GP de Las Vegas",           circuit: "Las Vegas Strip Circuit",                date: "2026-11-21T22:00:00" },
  { round: 21, name: "GP de Catar",               circuit: "Losail International Circuit",           date: "2026-11-29T15:00:00" },
  { round: 22, name: "GP de Abu Dabi",            circuit: "Yas Marina Circuit",                      date: "2026-12-06T15:00:00" },
];

const now = new Date();
const nextRace = races.find((r) => new Date(r.date).getTime() > now.getTime());

// Actualiza el "Ronda X de 22" del encabezado según la carrera actual
const heroEyebrowEl = document.querySelector(".actual-hero__eyebrow");
const totalRaces = races.length;

if (heroEyebrowEl) {
  const currentRound = nextRace ? nextRace.round : totalRaces;
  heroEyebrowEl.textContent = `Temporada 2026 · Ronda ${currentRound} de ${totalRaces}`;
}

const nextRaceNameEl = document.querySelector(".next-race__name");
const nextRaceCircuitEl = document.querySelector(".next-race__circuit");

let nextRaceDate;

if (nextRace) {
  nextRaceDate = new Date(nextRace.date).getTime();
  nextRaceNameEl.textContent = nextRace.name;
  nextRaceCircuitEl.textContent = nextRace.circuit;
} else {
  // Si ya se corrieron las 22 carreras, no hay próxima fecha
  nextRaceNameEl.textContent = "Temporada finalizada";
  nextRaceCircuitEl.textContent = "Vuelve pronto para la 2027";
}

// Marca automáticamente qué carreras ya pasaron (is-done) y cuál es la próxima (is-next)
const calendarItems = document.querySelectorAll(".calendar-list li");
calendarItems.forEach((li, index) => {
  const race = races[index];
  li.classList.remove("is-done", "is-next");

  if (nextRace && race.round === nextRace.round) {
    li.classList.add("is-next");
  } else if (new Date(race.date).getTime() < now.getTime()) {
    li.classList.add("is-done");
  }
});

const cdDays = document.getElementById("cd-days");
const cdHours = document.getElementById("cd-hours");
const cdMin = document.getElementById("cd-min");
const cdSec = document.getElementById("cd-sec");

function updateCountdown() {
  if (!nextRaceDate) return;

  const nowTime = new Date().getTime();
  const diff = nextRaceDate - nowTime;

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
  card.addEventListener("mouseenter", () => {
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

/* =========================================================
   6) CLASIFICACIÓN AUTOMÁTICA (Pilotos y Constructores)
   Consultamos la API pública Jolpica-F1 (sucesora de Ergast)
   para traer la clasificación real y actualizada del
   campeonato 2026. Si la API falla, se quedan las tablas
   que ya tenías escritas como respaldo.
========================================================= */
async function cargarClasificacion() {
  const temporada = 2026;

  try {
    // Pedimos ambas clasificaciones al mismo tiempo
    const [resPilotos, resConstructores] = await Promise.all([
      fetch(`https://api.jolpi.ca/ergast/f1/${temporada}/driverstandings/?format=json`),
      fetch(`https://api.jolpi.ca/ergast/f1/${temporada}/constructorstandings/?format=json`),
    ]);

    const dataPilotos = await resPilotos.json();
    const dataConstructores = await resConstructores.json();

    const listaPilotos =
      dataPilotos.MRData.StandingsTable.StandingsLists[0]?.DriverStandings;
    const listaConstructores =
      dataConstructores.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings;

    // --- Tabla de Pilotos ---
    if (listaPilotos && listaPilotos.length > 0) {
      const tbodyPilotos = document.querySelector('.standings-table[data-panel="pilotos"] tbody');
      tbodyPilotos.innerHTML = listaPilotos
        .map((piloto) => {
          const nombre = `${piloto.Driver.givenName} ${piloto.Driver.familyName}`;
          const equipo = piloto.Constructors[0]?.name ?? "—";
          return `<tr><td>${piloto.position}</td><td>${nombre}</td><td>${equipo}</td><td>${piloto.points}</td></tr>`;
        })
        .join("");
    }

    // --- Tabla de Constructores ---
    if (listaConstructores && listaConstructores.length > 0) {
      const tbodyConstructores = document.querySelector('.standings-table[data-panel="constructores"] tbody');
      tbodyConstructores.innerHTML = listaConstructores
        .map((equipo) => {
          return `<tr><td>${equipo.position}</td><td>${equipo.Constructor.name}</td><td>${equipo.points}</td></tr>`;
        })
        .join("");
    }

    // --- Actualiza el texto "Después del GP de X · Ronda Y/22" ---
    const infoRonda = dataPilotos.MRData.StandingsTable.StandingsLists[0];
    const clasifEyebrowEl = document.querySelector("#actual-clasificacion .section__eyebrow");

    if (infoRonda && clasifEyebrowEl) {
      const ultimaRonda = races.find((r) => r.round === Number(infoRonda.round));
      const nombreCarrera = ultimaRonda ? ultimaRonda.name : `Ronda ${infoRonda.round}`;
      clasifEyebrowEl.textContent = `Después del ${nombreCarrera} · Ronda ${infoRonda.round}/22`;
    }

  } catch (error) {
    // Si algo falla (sin internet, API caída, etc.) dejamos las tablas
    // que ya estaban escritas en el HTML y solo avisamos en consola.
    console.warn("No se pudo actualizar la clasificación en vivo:", error);
  }
}

cargarClasificacion();

/* =========================================================
   MÚSICA DE FONDO
========================================================= */
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");

musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.volume = 0.2;
    bgMusic
      .play()
      .catch(() => {
        console.warn("No se pudo reproducir el audio. ¿Copiaste el archivo a /audio/tema.mp3?");
      });
    musicToggle.setAttribute("aria-pressed", "true");
  } else {
    bgMusic.pause();
    musicToggle.setAttribute("aria-pressed", "false");
  }
});