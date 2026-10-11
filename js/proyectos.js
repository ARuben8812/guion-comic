// ============================================
// Guion Comic — Lógica de proyectos y páginas
// ============================================

import {
  listarProyectos,
  obtenerProyecto,
  crearProyecto,
  eliminarProyecto,
  crearPagina,
  eliminarPagina
} from "./almacen.js";

import { abrirEditor } from "./editor.js";

// --------------------------------------------
// Estado compartido
// --------------------------------------------

// Proyecto abierto actualmente (cuando estamos en vista Páginas)
let proyectoActivo = null;

export function getProyectoActivo() {
  return proyectoActivo;
}

export function setProyectoActivo(proyecto) {
  proyectoActivo = proyecto;
}

// --------------------------------------------
// Render: vista Proyectos
// --------------------------------------------

export async function renderProyectos() {
  const contenedor = document.getElementById("vista-proyectos");
  const proyectos = await listarProyectos();

  if (proyectos.length === 0) {
    contenedor.innerHTML = `
      <p class="placeholder">No hay proyectos todavía. Pulsa + para crear uno.</p>
    `;
    return;
  }

  // Ordenar por modificado descendente
  proyectos.sort((a, b) => b.modificado.localeCompare(a.modificado));

  const lista = document.createElement("ul");
  lista.className = "lista";

  proyectos.forEach(proyecto => {
    const item = document.createElement("li");
    item.className = "item";
    item.dataset.id = proyecto.id;

    const numPaginas = proyecto.paginas.length;
    const texto = numPaginas === 1 ? "1 página" : `${numPaginas} páginas`;

    item.innerHTML = `
      <span class="item-titulo">${escapar(proyecto.titulo)}</span>
      <span class="item-sub">${texto}</span>
    `;

    item.addEventListener("click", () => abrirProyecto(proyecto.id));
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      menuContextualProyecto(proyecto);
    });

    lista.appendChild(item);
  });

  contenedor.innerHTML = "";
  contenedor.appendChild(lista);
}

// --------------------------------------------
// Render: vista Páginas
// --------------------------------------------

export async function renderPaginas() {
  const contenedor = document.getElementById("vista-paginas");

  if (!proyectoActivo) {
    contenedor.innerHTML = `<p class="placeholder">No hay proyecto abierto.</p>`;
    return;
  }

  // Recargar desde la base por si cambió
  proyectoActivo = await obtenerProyecto(proyectoActivo.id);
  if (!proyectoActivo) {
    contenedor.innerHTML = `<p class="placeholder">Proyecto no encontrado.</p>`;
    return;
  }

  if (proyectoActivo.paginas.length === 0) {
    contenedor.innerHTML = `
      <p class="placeholder">Este proyecto no tiene páginas. Pulsa + para crear una.</p>
    `;
    return;
  }

  const lista = document.createElement("ul");
  lista.className = "lista";

  proyectoActivo.paginas.forEach(pagina => {
    const item = document.createElement("li");
    item.className = "item";
    item.dataset.id = pagina.id;

    const numV = pagina.numVinietas;
    const texto = numV === 1 ? "1 viñeta" : `${numV} viñetas`;

    item.innerHTML = `
      <span class="item-titulo">${escapar(pagina.titulo)}</span>
      <span class="item-sub">${texto}</span>
    `;

    item.addEventListener("click", () => abrirPagina(pagina.id));
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      menuContextualPagina(pagina);
    });

    lista.appendChild(item);
  });

  contenedor.innerHTML = "";
  contenedor.appendChild(lista);
}

// --------------------------------------------
// Acciones: crear
// --------------------------------------------

export async function accionNuevoProyecto() {
  const titulo = prompt("Título del proyecto:");
  if (titulo === null) return; // cancelado
  await crearProyecto(titulo);
  await renderProyectos();
}

export async function accionNuevaPagina() {
  if (!proyectoActivo) return;

  const titulo = prompt("Título de la página (puede ser un número):");
  if (titulo === null) return;

  const numTexto = prompt("¿Cuántas viñetas tendrá la página?", "6");
  if (numTexto === null) return;

  const num = parseInt(numTexto, 10);
  if (isNaN(num) || num < 1 || num > 30) {
    alert("Introduce un número entre 1 y 30.");
    return;
  }

  await crearPagina(proyectoActivo.id, titulo, num);
  await renderPaginas();
}

// --------------------------------------------
// Acciones: abrir
// --------------------------------------------

async function abrirProyecto(id) {
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) return;
  proyectoActivo = proyecto;
  // La navegación la gestiona app.js llamando a mostrarVista("paginas")
  document.dispatchEvent(new CustomEvent("navegar", { detail: { vista: "paginas" } }));
}

async function abrirPagina(id) {
  if (!proyectoActivo) return;
  await abrirEditor(proyectoActivo.id, id);
  document.dispatchEvent(new CustomEvent("navegar", { detail: { vista: "editor" } }));
}

// --------------------------------------------
// Acciones: eliminar (mediante menú contextual)
// --------------------------------------------

function menuContextualProyecto(proyecto) {
  const confirmar = confirm(
    `¿Eliminar el proyecto "${proyecto.titulo}"?\n\nSe borrarán también todas sus páginas.`
  );
  if (!confirmar) return;

  eliminarProyecto(proyecto.id).then(() => renderProyectos());
}

function menuContextualPagina(pagina) {
  const confirmar = confirm(`¿Eliminar la página "${pagina.titulo}"?`);
  if (!confirmar) return;

  eliminarPagina(proyectoActivo.id, pagina.id).then(() => renderPaginas());
}

// --------------------------------------------
// Utilidad: escapar HTML
// --------------------------------------------

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}