// ============================================
// Guion Comic — Portabilidad (.gcomic)
// Exportar e importar proyectos y biblioteca
// ============================================

import {
  listarProyectos,
  obtenerProyecto,
  crearProyecto,
  guardarProyecto
} from "./almacen.js";

const VERSION_FORMATO = 1;
const EXTENSION = ".gcomic";

// --------------------------------------------
// Utilidades
// --------------------------------------------

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function ahora() {
  return new Date().toISOString();
}

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

function fechaParaArchivo() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Descarga un objeto como archivo .gcomic.
 */
function descargarArchivo(datos, nombreArchivo) {
  const json = JSON.stringify(datos, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --------------------------------------------
// Exportar
// --------------------------------------------

/**
 * Exporta un proyecto individual.
 */
export async function exportarProyecto(proyectoId) {
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) {
    alert("Proyecto no encontrado.");
    return;
  }

  const datos = {
    version: VERSION_FORMATO,
    tipo: "proyecto",
    proyecto
  };

  const nombre = `proyecto-${limpiarNombre(proyecto.titulo)}${EXTENSION}`;
  descargarArchivo(datos, nombre);
}

/**
 * Exporta toda la biblioteca (respaldo completo).
 */
export async function exportarBiblioteca() {
  const proyectos = await listarProyectos();

  if (proyectos.length === 0) {
    alert("No hay proyectos para exportar.");
    return;
  }

  const datos = {
    version: VERSION_FORMATO,
    tipo: "biblioteca",
    exportado: ahora(),
    proyectos
  };

  const nombre = `biblioteca-guion-comic-${fechaParaArchivo()}${EXTENSION}`;
  descargarArchivo(datos, nombre);
}

// --------------------------------------------
// Importar
// --------------------------------------------

/**
 * Abre el selector de archivos y procesa el elegido.
 */
export function abrirImportacion() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = EXTENSION + ",application/json";

  input.addEventListener("change", async () => {
    const archivo = input.files[0];
    if (!archivo) return;
    try {
      await importarArchivo(archivo);
    } catch (e) {
      console.error(e);
      alert("No se pudo importar el archivo: " + e.message);
    }
  });

  input.click();
}

/**
 * Importa un archivo .gcomic ya seleccionado.
 */
async function importarArchivo(archivo) {
  const texto = await archivo.text();

  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error("El archivo no es un .gcomic válido.");
  }

  if (!datos || typeof datos !== "object" || !datos.version) {
    throw new Error("El archivo no tiene el formato esperado.");
  }

  if (datos.version > VERSION_FORMATO) {
    throw new Error("El archivo fue creado con una versión más reciente de la app.");
  }

  if (datos.tipo === "proyecto") {
    const resultado = await integrarProyecto(datos.proyecto);
    alert(resumen([resultado]));
  } else if (datos.tipo === "biblioteca" && Array.isArray(datos.proyectos)) {
    const resultados = [];
    for (const p of datos.proyectos) {
      resultados.push(await integrarProyecto(p));
    }
    alert(resumen(resultados));
  } else {
    throw new Error("Tipo de archivo no reconocido.");
  }

  // Avisar a la app de que recargue la lista de proyectos
  document.dispatchEvent(new CustomEvent("proyectos-cambiados"));
}

/**
 * Integra un proyecto importado. Pregunta si hay conflicto de id.
 * Devuelve "añadido", "reemplazado", "duplicado" o "cancelado".
 */
async function integrarProyecto(proyecto) {
  if (!proyecto || !proyecto.id || !proyecto.titulo) {
    return "cancelado";
  }

  const existente = await obtenerProyecto(proyecto.id);

  if (!existente) {
    // No existe: añadir tal cual
    await guardarProyecto(proyecto);
    return "añadido";
  }

  // Conflicto: preguntar
  const opcion = confirm(
    `Ya existe un proyecto con el id de "${proyecto.titulo}".\n\n` +
    `Aceptar = Reemplazar el existente\n` +
    `Cancelar = Se preguntará si duplicar`
  );

  if (opcion) {
    await guardarProyecto(proyecto);
    return "reemplazado";
  }

  const duplicar = confirm("¿Quieres duplicar el proyecto importado con un id nuevo?");
  if (!duplicar) return "cancelado";

  const copia = JSON.parse(JSON.stringify(proyecto));
  copia.id = generarId();
  copia.titulo = copia.titulo + " (copia)";
  copia.creado = ahora();
  copia.modificado = ahora();
  await guardarProyecto(copia);
  return "duplicado";
}

/**
 * Genera un resumen legible de la importación.
 */
function resumen(resultados) {
  const cuenta = {
    añadido: 0,
    reemplazado: 0,
    duplicado: 0,
    cancelado: 0
  };
  resultados.forEach(r => {
    if (cuenta[r] !== undefined) cuenta[r]++;
  });

  const partes = [];
  if (cuenta.añadido) partes.push(`${cuenta.añadido} añadido(s)`);
  if (cuenta.reemplazado) partes.push(`${cuenta.reemplazado} reemplazado(s)`);
  if (cuenta.duplicado) partes.push(`${cuenta.duplicado} duplicado(s)`);
  if (cuenta.cancelado) partes.push(`${cuenta.cancelado} cancelado(s)`);

  return partes.length > 0 ? "Importación completada: " + partes.join(", ") : "No se importó nada.";
}