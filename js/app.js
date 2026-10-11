// ============================================
// Guion Comic — Arranque y navegación
// ============================================

import {
  renderProyectos,
  renderPaginas,
  accionNuevoProyecto,
  accionNuevaPagina,
  getProyectoActivo
} from "./proyectos.js";

// --------------------------------------------
// Títulos de las vistas
// --------------------------------------------

const titulos = {
  proyectos: "Proyectos",
  paginas: "Páginas",
  editor: "Editor",
  exportar: "Exportar"
};

// --------------------------------------------
// Historial de navegación
// --------------------------------------------

let historial = ["proyectos"];

const tituloVista = document.getElementById("titulo-vista");
const btnVolver = document.getElementById("btn-volver");
const btnAccion = document.getElementById("btn-accion");

// --------------------------------------------
// Navegación
// --------------------------------------------

export function mostrarVista(nombre, apilar = true) {
  document.querySelectorAll(".vista").forEach(v => v.classList.remove("activa"));

  const vista = document.getElementById("vista-" + nombre);
  if (!vista) return;
  vista.classList.add("activa");

  tituloVista.textContent = titulos[nombre] || nombre;

  if (apilar) {
    historial.push(nombre);
  }

  btnVolver.hidden = historial.length <= 1;

  // Refrescar la vista al entrar
  refrescarVista(nombre);

  window.scrollTo(0, 0);
}

function volver() {
  if (historial.length <= 1) return;
  historial.pop();
  const anterior = historial[historial.length - 1];
  mostrarVista(anterior, false);
}

async function refrescarVista(nombre) {
  if (nombre === "proyectos") {
    await renderProyectos();
  } else if (nombre === "paginas") {
    await renderPaginas();
    // Ajustar el título con el nombre del proyecto
    const proyecto = getProyectoActivo();
    if (proyecto) {
      tituloVista.textContent = proyecto.titulo;
    }
  }
}

// --------------------------------------------
// Botón de acción contextual
// --------------------------------------------

async function accionContextual() {
  const vistaActual = historial[historial.length - 1];

  if (vistaActual === "proyectos") {
    await accionNuevoProyecto();
  } else if (vistaActual === "paginas") {
    await accionNuevaPagina();
  } else {
    // Editor y Exportar: pendientes de fases futuras
    alert("Acción pendiente de definir en la vista: " + vistaActual);
  }
}

// --------------------------------------------
// Eventos
// --------------------------------------------

btnVolver.addEventListener("click", volver);
btnAccion.addEventListener("click", accionContextual);

// Escuchar el evento "navegar" que dispara proyectos.js
document.addEventListener("navegar", (e) => {
  const destino = e.detail.vista;
  if (destino) mostrarVista(destino);
});

// --------------------------------------------
// Estado inicial
// --------------------------------------------

mostrarVista("proyectos", false);