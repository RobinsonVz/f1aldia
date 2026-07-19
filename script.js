/* =========================================================
   1) MENÚ MÓVIL
   Al hacer clic en el botón hamburguesa, mostramos u
   ocultamos los enlaces de navegación.
========================================================= */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", isOpen);
});

// Si el visitante toca un enlace del menú móvil, lo cerramos
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

/* =========================================================
   2) SECUENCIA DE LUCES DE LARGADA
   Las 5 luces se encienden una por una (como en una salida
   real de F1) y luego se apagan todas juntas: "lights out
   and away we go".
========================================================= */
function runStartLights() {
  const lights = document.querySelectorAll("#startLights .light");

  lights.forEach((light, index) => {
    setTimeout(() => {
      light.classList.add("is-on");
    }, index * 500); // cada luz se enciende medio segundo después de la anterior
  });

  // Cuando las 5 están encendidas, esperamos un instante y las apagamos todas
  const totalOnTime = lights.length * 500 + 700;
  setTimeout(() => {
    lights.forEach((light) => light.classList.remove("is-on"));
  }, totalOnTime);
}

// Ejecutamos la secuencia apenas carga la página
window.addEventListener("DOMContentLoaded", runStartLights);

/* =========================================================
   3) ANIMACIÓN AL HACER SCROLL (línea de tiempo)
   Usamos IntersectionObserver para detectar cuándo cada
   elemento de la línea de tiempo entra en la pantalla y
   así añadirle la clase que dispara la transición CSS.
========================================================= */
const timelineItems = document.querySelectorAll(".timeline__item");

const timelineObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        timelineObserver.unobserve(entry.target); // ya no hace falta seguir observándolo
      }
    });
  },
  { threshold: 0.2 }
);

timelineItems.forEach((item) => timelineObserver.observe(item));

/* =========================================================
   4) CONTADOR DE ESTADÍSTICAS (tablero de tiempos)
   Cada número empieza en 0 y "cuenta" hasta su valor final
   (definido en el atributo data-count) cuando la tarjeta
   del piloto aparece en pantalla.
========================================================= */
const statEls = document.querySelectorAll(".stat");

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1200; // milisegundos que dura la animación
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target; // aseguramos el valor exacto al terminar
    }
  }

  requestAnimationFrame(tick);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

statEls.forEach((stat) => statsObserver.observe(stat));

/* =========================================================
   5) MÚSICA DE FONDO
   Los navegadores no permiten reproducir audio con sonido
   de forma automática, así que el usuario debe darle clic
   al botón flotante para iniciar (o pausar) la música.
========================================================= */
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");

musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.volume = 0.2; // volumen moderado, no debe tapar la voz de la página
    bgMusic
      .play()
      .catch(() => {
        // Si el navegador bloquea la reproducción (por ejemplo, si falta el archivo mp3)
        console.warn("No se pudo reproducir el audio. ¿Copiaste el archivo a /audio/tema.mp3?");
      });
    musicToggle.setAttribute("aria-pressed", "true");
  } else {
    bgMusic.pause();
    musicToggle.setAttribute("aria-pressed", "false");
  }
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