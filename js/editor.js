// ============================================
// Guion Comic — Editor de página
// ============================================

import {
  guardarPagina,
  obtenerProyecto
} from "./almacen.js";

// --------------------------------------------
// Estado
// --------------------------------------------

let paginaActiva = null;
let proyectoActivoId = null;
let temporizadorGuardado = null;

const indicador = () => document.getElementById("indicador-guardado");
const contenedor = () => document.getElementById("editor-contenido");

// --------------------------------------------
// Definición de campos y tooltips
// --------------------------------------------
const COLORES = [
  { clave: "",         nombre: "Sin color" },
  { clave: "rojo",     nombre: "Rojo" },
  { clave: "azul",     nombre: "Azul" },
  { clave: "amarillo", nombre: "Amarillo" },
  { clave: "verde",    nombre: "Verde" },
  { clave: "naranja",  nombre: "Naranja" },
  { clave: "violeta",  nombre: "Violeta" }
];

const CAMPOS = [
  {
    clave: "plano",
    etiqueta: "Plano / encuadre",
    tooltip: "Cómo se ve la escena: general (todo el lugar), medio (de cintura arriba), primer plano (solo la cara), detalle (un objeto).",
    tipo: "input",
    placeholder: "Ej: plano medio"
  },
  {
    clave: "escenario",
    etiqueta: "Escenario",
    tooltip: "Dónde ocurre la viñeta: lugar, momento del día, ambiente. Ayuda a imaginar el fondo.",
    tipo: "input",
    placeholder: "Ej: azotea al atardecer"
  },
  {
    clave: "accion",
    etiqueta: "Acción",
    tooltip: "Qué está pasando en la viñeta. Describe lo que hacen los personajes o lo que cambia respecto a la viñeta anterior.",
    tipo: "textarea",
    placeholder: "Ej: A salta desde la azotea hacia el edificio de al lado"
  },
  {
    clave: "personajes",
    etiqueta: "Personajes",
    tooltip: "Quiénes aparecen en la viñeta. Sepáralos por comas si hay varios.",
    tipo: "input",
    placeholder: "Ej: A, B"
  },
  {
    clave: "dialogo",
    etiqueta: "Diálogo",
    tooltip: "Lo que dicen los personajes o los textos que aparecen (cartelas, sonidos). Si no hay, déjalo vacío.",
    tipo: "textarea",
    placeholder: "Ej: A: \"¡No me esperes!\""
  },
  {
    clave: "notas",
    etiqueta: "Notas",
    tooltip: "Cualquier idea suelta para ti: referencias visuales, dudas, cosas a revisar. Es opcional.",
    tipo: "textarea",
    placeholder: "Opcional"
  }
];

// --------------------------------------------
// Abrir página en el editor
// --------------------------------------------

export async function abrirEditor(proyectoId, paginaId) {
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) {
    alert("Proyecto no encontrado.");
    return;
  }

  const pagina = proyecto.paginas.find(p => p.id === paginaId);
  if (!pagina) {
    alert("Página no encontrada.");
    return;
  }

  proyectoActivoId = proyectoId;
  paginaActiva = JSON.parse(JSON.stringify(pagina)); // copia para editar

  renderEditor();
}

// --------------------------------------------
// Render del editor completo
// --------------------------------------------

function renderEditor() {
  const c = contenedor();
  c.innerHTML = "";

  // Cabecera: título editable + metadatos
  const cabecera = document.createElement("div");
  cabecera.className = "editor-cabecera";

  const titulo = document.createElement("input");
  titulo.type = "text";
  titulo.className = "editor-titulo";
  titulo.value = paginaActiva.titulo;
  titulo.addEventListener("input", () => {
    paginaActiva.titulo = titulo.value;
    programarGuardado();
  });

  const meta = document.createElement("div");
  meta.className = "editor-meta";
  meta.textContent = textoVinietas(paginaActiva.numVinietas);

  cabecera.appendChild(titulo);
  cabecera.appendChild(meta);
  c.appendChild(cabecera);

    // Avisos de página
   actualizarAvisosPagina();

  // Lista de viñetas
  const lista = document.createElement("div");
  lista.className = "vinietas";

  paginaActiva.viñetas.forEach((vineta, indice) => {
    lista.appendChild(renderVineta(vineta, indice));
  });

  c.appendChild(lista);

  // Pie: añadir viñeta / quitar última
  const pie = document.createElement("div");
  pie.className = "editor-pie";

  const btnAnadir = document.createElement("button");
  btnAnadir.className = "btn-secundario";
  btnAnadir.textContent = "+ Añadir viñeta";
  btnAnadir.addEventListener("click", anadirVineta);

//   const btnQuitar = document.createElement("button");
//   btnQuitar.className = "btn-secundario";
//   btnQuitar.textContent = "− Quitar última";
//   btnQuitar.disabled = paginaActiva.viñetas.length <= 1;
//   btnQuitar.addEventListener("click", quitarUltimaVineta);

//   pie.appendChild(btnAnadir);
//   pie.appendChild(btnQuitar);
//   c.appendChild(pie);

 pie.appendChild(btnAnadir);
  c.appendChild(pie);
}

// --------------------------------------------
// Render de una viñeta
// --------------------------------------------

function renderVineta(vineta, indice) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "vineta";
  tarjeta.dataset.color = vineta.color || "";

  const avisos = evaluarVineta(vineta);
  if (avisos.length > 0) {
    tarjeta.classList.add("con-aviso");
  }

  // Cabecera de la viñeta
  const cab = document.createElement("div");
  cab.className = "vineta-cabecera";

  const etiqueta = document.createElement("span");
  etiqueta.textContent = `Viñeta ${indice + 1}`;

  const derecha = document.createElement("div");
  derecha.style.display = "flex";
  derecha.style.alignItems = "center";
  derecha.style.gap = "10px";

  // Icono de aviso (si procede)
  if (avisos.length > 0) {
    const btnAviso = document.createElement("button");
    btnAviso.className = "vineta-aviso-icono";
    btnAviso.textContent = "⚠";
    btnAviso.title = "Ver sugerencias";
    btnAviso.addEventListener("click", () => togglePanelAviso(tarjeta, vineta));
    derecha.appendChild(btnAviso);
  }

  // Selector de color
  const selector = document.createElement("div");
  selector.className = "selector-color";

  COLORES.forEach(c => {
    const punto = document.createElement("button");
    punto.className = "punto-color";
    punto.dataset.color = c.clave;
    punto.title = c.nombre;
    if ((vineta.color || "") === c.clave) {
      punto.classList.add("activo");
    }
    punto.addEventListener("click", () => {
      vineta.color = c.clave;
      tarjeta.dataset.color = c.clave;
      selector.querySelectorAll(".punto-color").forEach(p => {
        p.classList.toggle("activo", p.dataset.color === c.clave);
      });
      programarGuardado(true);
    });
    selector.appendChild(punto);
  });

  // Botones de acción
  const acciones = document.createElement("div");
  acciones.className = "vineta-acciones";

  const btnSubir = document.createElement("button");
  btnSubir.className = "btn-mini";
  btnSubir.textContent = "↑";
  btnSubir.disabled = indice === 0;
  btnSubir.title = "Mover arriba";
  btnSubir.addEventListener("click", () => moverVineta(indice, -1));

  const btnBajar = document.createElement("button");
  btnBajar.className = "btn-mini";
  btnBajar.textContent = "↓";
  btnBajar.disabled = indice === paginaActiva.viñetas.length - 1;
  btnBajar.title = "Mover abajo";
  btnBajar.addEventListener("click", () => moverVineta(indice, 1));

  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn-mini";
  btnEliminar.textContent = "×";
  btnEliminar.title = "Eliminar viñeta";
  btnEliminar.addEventListener("click", () => eliminarVineta(indice));

  acciones.appendChild(btnSubir);
  acciones.appendChild(btnBajar);
  acciones.appendChild(btnEliminar);

  derecha.appendChild(selector);
  derecha.appendChild(acciones);

  cab.appendChild(etiqueta);
  cab.appendChild(derecha);
  tarjeta.appendChild(cab);

  // Campos
  CAMPOS.forEach(campo => {
    tarjeta.appendChild(renderCampo(vineta, campo));
  });

  return tarjeta;
}

// --------------------------------------------
// Render de un campo individual
// --------------------------------------------

function renderCampo(vineta, campo) {
  const div = document.createElement("div");
  div.className = "campo";

  const etiqueta = document.createElement("label");
  etiqueta.className = "campo-etiqueta";

  const texto = document.createElement("span");
  texto.textContent = campo.etiqueta;

  const tooltip = document.createElement("span");
  tooltip.className = "campo-tooltip";
  tooltip.textContent = "?";
  tooltip.setAttribute("data-tooltip", campo.tooltip);
  tooltip.setAttribute("tabindex", "0");

  etiqueta.appendChild(texto);
  etiqueta.appendChild(tooltip);

  let input;
  if (campo.tipo === "textarea") {
    input = document.createElement("textarea");
    input.rows = 2;
  } else {
    input = document.createElement("input");
    input.type = "text";
  }
  input.placeholder = campo.placeholder || "";
  input.value = vineta[campo.clave] || "";

   input.addEventListener("input", () => {
    vineta[campo.clave] = input.value;
    programarGuardado();

    // Refrescar aviso de la viñeta contenedora
    const tarjeta = input.closest(".vineta");
    if (tarjeta) refrescarAvisoVineta(vineta, tarjeta);
  });
      // Si es la última viñeta, reevaluar aviso de página
    const indiceUltima = paginaActiva.viñetas.length - 1;
    const indiceActual = paginaActiva.viñetas.indexOf(vineta);
    if (indiceActual === indiceUltima) {
      actualizarAvisosPagina();
    }

  div.appendChild(etiqueta);
  div.appendChild(input);
  return div;
}

function actualizarAvisosPagina() {
  const c = contenedor();
  let panel = c.querySelector(".aviso-pagina");

  const avisos = evaluarPagina();

  if (avisos.length === 0) {
    if (panel) panel.remove();
    return;
  }

  if (!panel) {
    panel = document.createElement("div");
    panel.className = "vineta-aviso-panel aviso-pagina";
    panel.style.marginBottom = "16px";
    c.insertBefore(panel, c.querySelector(".vinietas"));
  }

  panel.innerHTML = "";
  const ul = document.createElement("ul");
  avisos.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  });
  panel.appendChild(ul);
}

// --------------------------------------------
// Acciones sobre viñetas
// --------------------------------------------

function anadirVineta() {
  const nueva = {
    id: generarId(),
    numero: paginaActiva.viñetas.length + 1,
    plano: "",
    escenario: "",
    accion: "",
    personajes: "",
    dialogo: "",
    notas: ""
  };
  paginaActiva.viñetas.push(nueva);
  paginaActiva.numVinietas = paginaActiva.viñetas.length;
  renumerarVinietas();
  renderEditor();
  programarGuardado(true);
}

// function quitarUltimaVineta() {
//   if (paginaActiva.viñetas.length <= 1) return;
//   paginaActiva.viñetas.pop();
//   paginaActiva.numVinietas = paginaActiva.viñetas.length;
//   renumerarVinietas();
//   renderEditor();
//   programarGuardado(true);
// }

function eliminarVineta(indice) {
  if (paginaActiva.viñetas.length <= 1) {
    alert("Una página debe tener al menos una viñeta.");
    return;
  }
  if (!confirm(`¿Eliminar la viñeta ${indice + 1}?`)) return;

  paginaActiva.viñetas.splice(indice, 1);
  paginaActiva.numVinietas = paginaActiva.viñetas.length;
  renumerarVinietas();
  renderEditor();
  programarGuardado(true);
}

function moverVineta(indice, delta) {
  const nuevo = indice + delta;
  if (nuevo < 0 || nuevo >= paginaActiva.viñetas.length) return;

  const temp = paginaActiva.viñetas[indice];
  paginaActiva.viñetas[indice] = paginaActiva.viñetas[nuevo];
  paginaActiva.viñetas[nuevo] = temp;

  renumerarVinietas();
  renderEditor();
  programarGuardado(true);
}

function renumerarVinietas() {
  paginaActiva.viñetas.forEach((v, i) => {
    v.numero = i + 1;
  });
}

// --------------------------------------------
// Guardado automático
// --------------------------------------------

function programarGuardado(inmediato = false) {
  mostrarIndicador("Guardando…");

  if (temporizadorGuardado) clearTimeout(temporizadorGuardado);

  const espera = inmediato ? 0 : 800; // 800 ms tras dejar de escribir
  temporizadorGuardado = setTimeout(ejecutarGuardado, espera);
}

async function ejecutarGuardado() {
  if (!paginaActiva || !proyectoActivoId) return;

  try {
    await guardarPagina(proyectoActivoId, paginaActiva);
    mostrarIndicador("Guardado", true);
  } catch (e) {
    console.error(e);
    mostrarIndicador("Error al guardar");
  }
}

function mostrarIndicador(texto, ocultarDespues = false) {
  const ind = indicador();
  ind.textContent = texto;
  ind.hidden = false;
  ind.classList.remove("oculto");
  ind.classList.add("visible");

  if (ocultarDespues) {
    setTimeout(() => {
      ind.classList.remove("visible");
      ind.classList.add("oculto");
    }, 1200);
  }
}

// --------------------------------------------
// Alertas poka-yoke (sugerencias suaves)
// --------------------------------------------

const LIMITE_DIALOGO = 220;  // caracteres
const LIMITE_ACCION = 240;   // caracteres

/**
 * Evalúa una viñeta y devuelve un array de sugerencias.
 * Cada sugerencia es un string explicando qué revisar.
 */
function evaluarVineta(vineta) {
  const avisos = [];

  if (!vineta.plano || !vineta.plano.trim()) {
    avisos.push("Falta indicar el plano o encuadre.");
  }

  if (!vineta.escenario || !vineta.escenario.trim()) {
    avisos.push("Falta describir el escenario.");
  }

  if (vineta.accion && vineta.accion.length > LIMITE_ACCION) {
    avisos.push(`La acción tiene mucho texto (${vineta.accion.length} caracteres). Quizá convenga dividirla en varias viñetas.`);
  }

  if (vineta.dialogo && vineta.dialogo.length > LIMITE_DIALOGO) {
    avisos.push(`El diálogo tiene mucho texto (${vineta.dialogo.length} caracteres). Una viñeta suele admitir menos.`);
  }

  return avisos;
}

/**
 * Evalúa la página completa (reglas que afectan a la página, no a una viñeta).
 */
function evaluarPagina() {
  const avisos = [];
  const viñetas = paginaActiva.viñetas;

  if (viñetas.length > 1) {
    const ultima = viñetas[viñetas.length - 1];
    const sinCierre = (!ultima.accion || !ultima.accion.trim()) &&
                      (!ultima.dialogo || !ultima.dialogo.trim());
    if (sinCierre) {
      avisos.push("La última viñeta no tiene acción ni diálogo. ¿Falta un cierre para la página?");
    }
  }

  return avisos;


}

/**
 * Refresca visualmente el estado de aviso de una viñeta concreta,
 * sin redibujar toda la tarjeta. Se llama al escribir en un campo.
 */
function refrescarAvisoVineta(vineta, tarjeta) {
  const avisos = evaluarVineta(vineta);

  // Actualizar clase con-aviso
  tarjeta.classList.toggle("con-aviso", avisos.length > 0);

  // Eliminar panel abierto si ya no hay avisos
  const panelAbierto = tarjeta.querySelector(".vineta-aviso-panel");
  if (avisos.length === 0 && panelAbierto) {
    panelAbierto.remove();
  }

  // Actualizar o añadir el icono de aviso
  const derecha = tarjeta.querySelector(".vineta-cabecera > div:last-child");
  if (!derecha) return;

  let btnAviso = derecha.querySelector(".vineta-aviso-icono");

  if (avisos.length > 0 && !btnAviso) {
    // Crear el icono si no existe
    btnAviso = document.createElement("button");
    btnAviso.className = "vineta-aviso-icono";
    btnAviso.textContent = "⚠";
    btnAviso.title = "Ver sugerencias";
    btnAviso.addEventListener("click", () => togglePanelAviso(tarjeta, vineta));
    derecha.insertBefore(btnAviso, derecha.firstChild);
  } else if (avisos.length === 0 && btnAviso) {
    // Quitar el icono si ya no hay avisos
    btnAviso.remove();
  }
}

/**
 * Abre o cierra el panel de avisos de una viñeta.
 */
function togglePanelAviso(tarjeta, vineta) {
  const existente = tarjeta.querySelector(".vineta-aviso-panel");
  if (existente) {
    existente.remove();
    return;
  }

  const avisos = evaluarVineta(vineta);
  if (avisos.length === 0) return;

  const panel = document.createElement("div");
  panel.className = "vineta-aviso-panel";
  const ul = document.createElement("ul");
  avisos.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  });
  panel.appendChild(ul);
  tarjeta.appendChild(panel);
}

// --------------------------------------------
// Utilidades
// --------------------------------------------

function textoVinietas(n) {
  return n === 1 ? "1 viñeta" : `${n} viñetas`;
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}