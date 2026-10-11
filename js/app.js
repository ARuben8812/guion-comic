// ============================================
// Guion Comic — Fase 0
// Navegación básica entre vistas (SPA)
// ============================================

const titulos = {
  proyectos: "Proyectos",
  paginas: "Páginas",
  editor: "Editor",
  exportar: "Exportar"
};

// Pila de navegación para el botón "volver"
let historial = ["proyectos"];

const tituloVista = document.getElementById("titulo-vista");
const btnVolver = document.getElementById("btn-volver");
const btnAccion = document.getElementById("btn-accion");

/**
 * Muestra una vista por su nombre.
 * @param {string} nombre - proyectos | paginas | editor | exportar
 * @param {boolean} apilar - si true, se añade al historial
 */
function mostrarVista(nombre, apilar = true) {
  // Oculta todas las vistas
  document.querySelectorAll(".vista").forEach(v => v.classList.remove("activa"));

  // Muestra la solicitada
  const vista = document.getElementById("vista-" + nombre);
  if (!vista) return;
  vista.classList.add("activa");

  // Actualiza el título
  tituloVista.textContent = titulos[nombre] || nombre;

  // Gestiona el historial
  if (apilar) {
    historial.push(nombre);
  }

  // Muestra u oculta el botón volver
  btnVolver.hidden = historial.length <= 1;

  // Scroll arriba
  window.scrollTo(0, 0);
}

/**
 * Vuelve a la vista anterior en el historial.
 */
function volver() {
  if (historial.length <= 1) return;
  historial.pop();
  const anterior = historial[historial.length - 1];
  mostrarVista(anterior, false);
}

// --------------------------------------------
// Eventos
// --------------------------------------------

// Botón volver
btnVolver.addEventListener("click", volver);

// Elementos de lista: al pulsar, navegan a la vista indicada en data-vista
document.querySelectorAll(".item").forEach(item => {
  item.addEventListener("click", () => {
    const destino = item.dataset.vista;
    if (destino) mostrarVista(destino);
  });
});

// Botón de acción (por ahora sin lógica real, solo un aviso)
btnAccion.addEventListener("click", () => {
  const vistaActual = historial[historial.length - 1];
  alert("Acción pendiente de definir en la vista: " + vistaActual);
});

// Estado inicial
mostrarVista("proyectos", false);