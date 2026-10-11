// ============================================
// Guion Comic — Capa de almacenamiento
// IndexedDB: proyectos, páginas y viñetas
// ============================================

const NOMBRE_DB = "guion-comic";
const VERSION_DB = 1;
const ALMACEN_PROYECTOS = "proyectos";

let db = null;

/**
 * Abre (o crea) la base de datos.
 * Devuelve una promesa que se resuelve con la conexión.
 */
function abrirDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const peticion = indexedDB.open(NOMBRE_DB, VERSION_DB);

    peticion.onupgradeneeded = (evento) => {
      const base = evento.target.result;

      // Almacén de proyectos: cada proyecto contiene sus páginas dentro.
      if (!base.objectStoreNames.contains(ALMACEN_PROYECTOS)) {
        base.createObjectStore(ALMACEN_PROYECTOS, { keyPath: "id" });
      }
    };

    peticion.onsuccess = (evento) => {
      db = evento.target.result;
      resolve(db);
    };

    peticion.onerror = (evento) => {
      reject(evento.target.error);
    };
  });
}

/**
 * Ejecuta una operación sobre el almacén de proyectos.
 * @param {string} modo - "readonly" o "readwrite"
 * @param {function} operacion - recibe el objectStore y devuelve una petición
 */
async function ejecutar(modo, operacion) {
  const base = await abrirDB();
  return new Promise((resolve, reject) => {
    const transaccion = base.transaction(ALMACEN_PROYECTOS, modo);
    const almacen = transaccion.objectStore(ALMACEN_PROYECTOS);
    const peticion = operacion(almacen);

    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

// --------------------------------------------
// Utilidades
// --------------------------------------------

/**
 * Genera un id único sencillo.
 */
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Devuelve la fecha actual en ISO.
 */
function ahora() {
  return new Date().toISOString();
}

// --------------------------------------------
// API pública
// --------------------------------------------

/**
 * Devuelve todos los proyectos guardados.
 */
export async function listarProyectos() {
  return ejecutar("readonly", (almacen) => almacen.getAll());
}

/**
 * Devuelve un proyecto por su id.
 */
export async function obtenerProyecto(id) {
  return ejecutar("readonly", (almacen) => almacen.get(id));
}

/**
 * Crea un nuevo proyecto con el título dado.
 * Devuelve el proyecto creado.
 */
export async function crearProyecto(titulo) {
  const proyecto = {
    id: generarId(),
    titulo: titulo.trim() || "Sin título",
    creado: ahora(),
    modificado: ahora(),
    paginas: []
  };
  await ejecutar("readwrite", (almacen) => almacen.add(proyecto));
  return proyecto;
}

/**
 * Guarda (actualiza) un proyecto completo.
 */
export async function guardarProyecto(proyecto) {
  proyecto.modificado = ahora();
  await ejecutar("readwrite", (almacen) => almacen.put(proyecto));
  return proyecto;
}

/**
 * Elimina un proyecto por su id.
 */
export async function eliminarProyecto(id) {
  return ejecutar("readwrite", (almacen) => almacen.delete(id));
}

/**
 * Crea una página dentro de un proyecto.
 * @param {string} proyectoId
 * @param {string} titulo
 * @param {number} numVinietas
 */
export async function crearPagina(proyectoId, titulo, numVinietas) {
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) throw new Error("Proyecto no encontrado");

  const viñetas = [];
  for (let i = 0; i < numVinietas; i++) {
    viñetas.push({
      id: generarId(),
      numero: i + 1,
      plano: "",
      escenario: "",
      accion: "",
      personajes: "",
      dialogo: "",
      notas: ""
    });
  }

  const pagina = {
    id: generarId(),
    titulo: titulo.trim() || "Sin título",
    numVinietas,
    viñetas,
    creado: ahora(),
    modificado: ahora()
  };

  proyecto.paginas.push(pagina);
  await guardarProyecto(proyecto);
  return pagina;
}

/**
 * Guarda (actualiza) una página dentro de un proyecto.
 */
export async function guardarPagina(proyectoId, pagina) {
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) throw new Error("Proyecto no encontrado");

  const indice = proyecto.paginas.findIndex(p => p.id === pagina.id);
  if (indice === -1) throw new Error("Página no encontrada");

  pagina.modificado = ahora();
  proyecto.paginas[indice] = pagina;
  await guardarProyecto(proyecto);
  return pagina;
}

/**
 * Elimina una página de un proyecto.
 */
export async function eliminarPagina(proyectoId, paginaId) {
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) throw new Error("Proyecto no encontrado");

  proyecto.paginas = proyecto.paginas.filter(p => p.id !== paginaId);
  await guardarProyecto(proyecto);
  return proyecto;
}