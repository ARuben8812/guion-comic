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

import {
  exportarProyecto,
  exportarBiblioteca,
  abrirImportacion
} from "./portabilidad.js";

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

const btnMenu = document.getElementById("btn-menu");
const menu = document.getElementById("menu-desplegable");
let menuFondo = null; // se crea dinámicamente
const btnActualizar = document.getElementById("btn-actualizar");
if (btnActualizar) {
  btnActualizar.addEventListener("click", aplicarVersionNueva);
}

// --------------------------------------------
// Navegación
// --------------------------------------------

export function mostrarVista(nombre, apilar = true) {
    cerrarMenu();
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
    btnAccion.hidden = false;
  } else if (nombre === "paginas") {
    await renderPaginas();
    const proyecto = getProyectoActivo();
    if (proyecto) {
      tituloVista.textContent = proyecto.titulo;
    }
    btnAccion.hidden = false;
  } else if (nombre === "editor") {
    btnAccion.hidden = true;
  } else if (nombre === "exportar") {
    btnAccion.hidden = true;
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
btnMenu.addEventListener("click", (e) => {
  e.stopPropagation();
  if (menu.hidden) {
    abrirMenu();
  } else {
    cerrarMenu();
  }
});

// Recargar proyectos cuando se importe algo
document.addEventListener("proyectos-cambiados", async () => {
  const vistaActual = historial[historial.length - 1];
  if (vistaActual === "proyectos") {
    await renderProyectos();
  }
});

import {
  activarModoSeleccion,
  desactivarModoSeleccion,
  estaEnModoSeleccion,
  getPaginasSeleccionadas
} from "./proyectos.js";

document.getElementById("btn-cancelar-seleccion").addEventListener("click", () => {
  desactivarModoSeleccion();
});

document.getElementById("btn-exportar-md").addEventListener("click", async () => {
  const ids = getPaginasSeleccionadas();
  if (ids.length === 0) return;
  const { exportarMarkdown } = await import("./exportar.js");
  await exportarMarkdown(ids);
});

document.getElementById("btn-exportar-pdf").addEventListener("click", async () => {
  const ids = getPaginasSeleccionadas();
  if (ids.length === 0) return;
  const { exportarPDF } = await import("./exportar.js");
  await exportarPDF(ids);
});

// --------------------------------------------
// Menú desplegable
// --------------------------------------------

function abrirMenu() {
  const vistaActual = historial[historial.length - 1];
  menu.innerHTML = "";

  // Crear capa de fondo para cerrar al pulsar fuera
  if (!menuFondo) {
    menuFondo = document.createElement("div");
    menuFondo.className = "menu-fondo";
    menuFondo.addEventListener("click", cerrarMenu);
    document.body.appendChild(menuFondo);
  }
  menuFondo.hidden = false;

  // Opciones según la vista
  if (vistaActual === "proyectos") {
    menu.appendChild(crearOpcion("Importar archivo", abrirImportacion));
    menu.appendChild(crearOpcion("Exportar biblioteca", exportarBiblioteca));
  } else if (vistaActual === "paginas") {
    const proyecto = getProyectoActivo();    
    if (proyecto) {
      menu.appendChild(crearOpcion("Seleccionar para exportar", activarModoSeleccion));
      menu.appendChild(crearOpcion("Exportar proyecto", () => exportarProyecto(proyecto.id)));
    } else {
      menu.appendChild(crearOpcion("Exportar proyecto", null, true));
    }
  } else {
    menu.appendChild(crearOpcion("Sin acciones disponibles", null, true));
  }

  menu.hidden = false;
}

function cerrarMenu() {
  menu.hidden = true;
  if (menuFondo) menuFondo.hidden = true;
}

function crearOpcion(texto, accion, deshabilitado = false) {
  const btn = document.createElement("button");
  btn.className = "menu-opcion" + (deshabilitado ? " deshabilitado" : "");
  btn.textContent = texto;
  if (!deshabilitado && accion) {
    btn.addEventListener("click", async () => {
      cerrarMenu();
      await accion();
    });
  }
  return btn;
}

// --------------------------------------------
// Service Worker (PWA)
// --------------------------------------------

let swRegistro = null;

async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    swRegistro = await navigator.serviceWorker.register("./service-worker.js");

    // Detectar si hay una versión nueva esperando
    swRegistro.addEventListener("updatefound", () => {
      const nuevoSW = swRegistro.installing;
      if (!nuevoSW) return;

      nuevoSW.addEventListener("statechange", () => {
        if (nuevoSW.state === "installed" && navigator.serviceWorker.controller) {
          mostrarAvisoVersionNueva();
        }
      });
    });

    // Comprobar actualizaciones al volver a la app
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        swRegistro.update();
      }
    });
  } catch (e) {
    console.warn("No se pudo registrar el Service Worker:", e);
  }
}

function mostrarAvisoVersionNueva() {
  const aviso = document.getElementById("aviso-version");
  if (!aviso) return;
  aviso.hidden = false;
}

async function aplicarVersionNueva() {
  if (!swRegistro || !swRegistro.waiting) {
    window.location.reload();
    return;
  }
  swRegistro.waiting.postMessage({ tipo: "SKIP_WAITING" });
  // Recargar cuando el nuevo SW tome el control
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}


// --------------------------------------------
// Estado inicial
// --------------------------------------------

registrarServiceWorker();
mostrarVista("proyectos", false);