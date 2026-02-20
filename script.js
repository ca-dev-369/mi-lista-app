let productos = [];
let total = 0;
let editando = null;

function agregarProducto() {
  const nombre = document.getElementById("producto").value.trim();
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const precio = parseFloat(document.getElementById("precio").value);
  const categoria = document.getElementById("categoria").value;

  if (!nombre || isNaN(precio) || isNaN(cantidad) || cantidad <= 0) {
    alert("Ingresa un producto, cantidad y precio válidos.");
    return;
  }

  const subtotal = precio * cantidad;
  const producto = { nombre, cantidad, precio, subtotal, categoria };

  if (editando !== null) {
    total -= productos[editando].subtotal;
    productos[editando] = producto;
    editando = null;
  } else {
    productos.push(producto);
  }

  total += subtotal;
  limpiarFormulario();
  actualizarLista();
}

function limpiarFormulario() {
  document.getElementById("producto").value = "";
  document.getElementById("cantidad").value = 1;
  document.getElementById("precio").value = "";
  document.getElementById("categoria").value = "Frutas";
}

function actualizarLista() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  productos.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.nombre} (${p.categoria}) - ${p.cantidad} x

{p.precio.toFixed(2)} = 

{p.subtotal.toFixed(2)}
      <span>
        <button onclick="editar(${i})">✏️</button>
        <button onclick="eliminar(${i})">🗑️</button>
      </span>
    `;
    lista.appendChild(li);
  });

  document.getElementById("total").textContent = `💰 Total: $${total.toFixed(2)}`;
}

function editar(i) {
  const p = productos[i];
  document.getElementById("producto").value = p.nombre;
  document.getElementById("cantidad").value = p.cantidad;
  document.getElementById("precio").value = p.precio;
  document.getElementById("categoria").value = p.categoria;
  total -= p.subtotal;
  editando = i;
  actualizarLista();
}

function eliminar(i) {
  total -= productos[i].subtotal;
  productos.splice(i, 1);
  actualizarLista();
}

function guardarLista() {
  const notas = document.getElementById("notas").value;
  const borrador = { productos, notas };
  localStorage.setItem("borrador", JSON.stringify(borrador));
  alert("💾 Lista guardada como borrador.");
}

function cargarBorrador() {
  const data = localStorage.getItem("borrador");
  if (data) {
    const borrador = JSON.parse(data);
    productos = borrador.productos || [];
    document.getElementById("notas").value = borrador.notas || "";
    total = productos.reduce((sum, p) => sum + p.subtotal, 0);
    actualizarLista();
  }
}

function finalizarCompra() {
  if (productos.length === 0) {
    alert("No hay productos.");
    return;
  }

  const fecha = new Date().toISOString().split("T")[0];
  const notas = document.getElementById("notas").value;

  let numeroTicket = parseInt(localStorage.getItem("ultimoTicket") || "0") + 1;
  localStorage.setItem("ultimoTicket", numeroTicket);

  const ticket = {
    numero: numeroTicket,
    fecha,
    total,
    productos,
    notas
  };

  const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
  tickets.push(ticket);
  localStorage.setItem("tickets", JSON.stringify(tickets));

  const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket_${String(numeroTicket).padStart(4, "0")}_${fecha}.json`;
  a.click();
  URL.revokeObjectURL(url);

  productos = [];
  total = 0;
  editando = null;
  document.getElementById("notas").value = "";
  localStorage.removeItem("borrador");
  actualizarLista();
  mostrarTickets();
  mostrarGrafica();
}

function mostrarTickets() {
  const contenedor = document.getElementById("tickets");
  const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

  if (tickets.length === 0) {
    contenedor.innerHTML = "<p>No hay tickets guardados.</p>";
    return;
  }

  contenedor.innerHTML = "<h2>📂 Tickets guardados:</h2><ul>";
  tickets.forEach((t, i) => {
    const encoded = encodeURIComponent(JSON.stringify(t));
    contenedor.innerHTML += `
      <li>
        ${t.fecha} - $${t.total.toFixed(2)}
        ${t.notas ? `<br><em>📝 ${t.notas}</em>` : ""}
        <div style="margin-top: 10px;">
          <button onclick="descargarTicket(${i})" style="width: 100%; margin-bottom: 8px;">📥 Descargar</button>
          <a href="visor.html?data=${encoded}" target="_blank" style="display: block; width: 100%;">
            <button style="width: 100%;">👁️ Ver recibo</button>
          </a>
        </div>
      </li>
    `;
  });
  contenedor.innerHTML += "</ul>";
}

function descargarTicket(index) {
  const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
  const ticket = tickets[index];
  const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket_${String(ticket.numero).padStart(4, "0")}_${ticket.fecha}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function mostrarGrafica() {
  const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

  const hoy = new Date();
  const ultimosTickets = tickets.filter(t => {
    const fecha = new Date(t.fecha);
    const diferencia = (hoy - fecha) / (1000 * 60 * 60 * 24);
    return diferencia <= 90;
  });

  const resumen = {};
  ultimosTickets.forEach(t => {
    resumen[t.fecha] = (resumen[t.fecha] || 0) + t.total;
  });

  const fechas = Object.keys(resumen).sort();
  const totales = fechas.map(f => resumen[f]);

  const ctx = document.getElementById("graficaCompras").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: fechas,
      datasets: [{
        label: "Total gastado",
        data: totales,
        backgroundColor: "#00ff88",
        borderColor: "#00ff88",
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "#00ff88" } }
      },
      scales: {
        x: { ticks: { color: "#00ff88" } },
        y: {
          beginAtZero: true,
          ticks: { color: "#00ff88" }
        }
      }
    }
  });
}

window.onload = () => {
  cargarBorrador();
  mostrarTickets();
  mostrarGrafica();
};