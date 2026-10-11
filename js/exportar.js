// ============================================
// Guion Comic — Exportación a Markdown y PDF
// ============================================

import {
  obtenerProyecto
} from "./almacen.js";
import {
  getProyectoActivo
} from "./proyectos.js";

// --------------------------------------------
// Utilidades
// --------------------------------------------

function limpiarNombre(texto) {
  return texto
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function descargarTexto(texto, nombreArchivo, tipoMime) {
  const blob = new Blob([texto], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/**
 * Devuelve las páginas del proyecto activo según los ids dados,
 * manteniendo el orden original de la página.
 */
async function obtenerPaginasSeleccionadas(ids) {
  const proyecto = getProyectoActivo();
  if (!proyecto) throw new Error("No hay proyecto abierto.");

  const completo = await obtenerProyecto(proyecto.id);
  if (!completo) throw new Error("Proyecto no encontrado.");

  const setIds = new Set(ids);
  return completo.paginas.filter(p => setIds.has(p.id));
}

// --------------------------------------------
// Markdown
// --------------------------------------------

/**
 * Exporta las páginas indicadas a Markdown.
 */
export async function exportarMarkdown(ids) {
  const proyecto = getProyectoActivo();
  const paginas = await obtenerPaginasSeleccionadas(ids);

  if (paginas.length === 0) {
    alert("No hay páginas para exportar.");
    return;
  }

  const lineas = [];
  lineas.push(`# ${proyecto.titulo}`);
  lineas.push("");

  paginas.forEach((pagina, i) => {
    if (i > 0) lineas.push("---");
    lineas.push("");
    lineas.push(`## ${pagina.titulo}`);
    lineas.push("");

    pagina.viñetas.forEach((v, j) => {
      lineas.push(`### Viñeta ${j + 1}`);
      lineas.push("");

      if (v.plano && v.plano.trim()) {
        lineas.push(`- **Plano:** ${v.plano.trim()}`);
      }
      if (v.escenario && v.escenario.trim()) {
        lineas.push(`- **Escenario:** ${v.escenario.trim()}`);
      }
      if (v.accion && v.accion.trim()) {
        lineas.push(`- **Acción:** ${v.accion.trim()}`);
      }
      if (v.personajes && v.personajes.trim()) {
        lineas.push(`- **Personajes:** ${v.personajes.trim()}`);
      }
      if (v.dialogo && v.dialogo.trim()) {
        lineas.push(`- **Diálogo:** ${v.dialogo.trim()}`);
      }
      if (v.notas && v.notas.trim()) {
        lineas.push(`- **Notas:** ${v.notas.trim()}`);
      }

      lineas.push("");
    });
  });

  const contenido = lineas.join("\n");
  const nombre = `guion-${limpiarNombre(proyecto.titulo)}.md`;
  descargarTexto(contenido, nombre, "text/markdown;charset=utf-8");
}

// --------------------------------------------
// PDF (vía "imprimir como PDF" del navegador)
// --------------------------------------------

/**
 * Genera HTML formateado y abre el diálogo de impresión.
 * El usuario elige "Guardar como PDF" en el navegador.
 */
export async function exportarPDF(ids) {
  const proyecto = getProyectoActivo();
  const paginas = await obtenerPaginasSeleccionadas(ids);

  if (paginas.length === 0) {
    alert("No hay páginas para exportar.");
    return;
  }

  // Construir HTML temporal
  const contenedor = document.createElement("div");
  contenedor.id = "contenedor-impresion";

  const html = construirHTMLImpresion(proyecto, paginas);
  contenedor.innerHTML = html;

  document.body.appendChild(contenedor);
  document.body.classList.add("modo-impresion");

  // Dar un pequeño respiro al navegador para aplicar estilos
  await new Promise(r => setTimeout(r, 150));

  window.print();

  // Limpiar después de imprimir
  const limpiar = () => {
    document.body.classList.remove("modo-impresion");
    const c = document.getElementById("contenedor-impresion");
    if (c) c.remove();
    window.removeEventListener("afterprint", limpiar);
  };
  window.addEventListener("afterprint", limpiar);
}

/**
 * Construye el HTML que se imprimirá.
 */
function construirHTMLImpresion(proyecto, paginas) {
  const partes = [];
  partes.push(`<h1>${escaparHTML(proyecto.titulo)}</h1>`);

  paginas.forEach((pagina, i) => {
    if (i > 0) partes.push(`<div class="salto-pagina"></div>`);
    partes.push(`<h2>${escaparHTML(pagina.titulo)}</h2>`);

    pagina.viñetas.forEach((v, j) => {
      partes.push(`<div class="bloque-vineta">`);
      partes.push(`<h3>Viñeta ${j + 1}</h3>`);
      partes.push(`<ul>`);

      if (v.plano && v.plano.trim()) {
        partes.push(`<li><strong>Plano:</strong> ${escaparHTML(v.plano.trim())}</li>`);
      }
      if (v.escenario && v.escenario.trim()) {
        partes.push(`<li><strong>Escenario:</strong> ${escaparHTML(v.escenario.trim())}</li>`);
      }
      if (v.accion && v.accion.trim()) {
        partes.push(`<li><strong>Acción:</strong> ${escaparHTML(v.accion.trim())}</li>`);
      }
      if (v.personajes && v.personajes.trim()) {
        partes.push(`<li><strong>Personajes:</strong> ${escaparHTML(v.personajes.trim())}</li>`);
      }
      if (v.dialogo && v.dialogo.trim()) {
        partes.push(`<li><strong>Diálogo:</strong> ${escaparHTML(v.dialogo.trim())}</li>`);
      }
      if (v.notas && v.notas.trim()) {
        partes.push(`<li><strong>Notas:</strong> ${escaparHTML(v.notas.trim())}</li>`);
      }

      partes.push(`</ul>`);
      partes.push(`</div>`);
    });
  });

  return partes.join("\n");
}