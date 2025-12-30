import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtIagFFJBFRjvg5usXTm575YqOeeDE1G0",
    authDomain: "mi-inventario-51f82.firebaseapp.com",
    projectId: "mi-inventario-51f82",
    storageBucket: "mi-inventario-51f82.firebasestorage.app",
    messagingSenderId: "79417755416",
    appId: "1:79417755416:web:e1bbab46cda2bdbb5da56d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let productosLocal = [];
let idSeleccionado = null;
let currentUser = "";

window.showSection = (id) => {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// --- SEGURIDAD: IP Y UBICACIÓN ---
async function getSecurityData() {
    let data = { ip: "0.0.0.0", loc: "Sin permiso" };
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        data.ip = json.ip;
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                p => { data.loc = `${p.coords.latitude},${p.coords.longitude}`; resolve(data); },
                () => resolve(data)
            );
        });
    } catch { return data; }
}

async function registrarLog(tipo, detalle) {
    const info = await getSecurityData();
    await addDoc(collection(db, "historial"), {
        tipo, usuario: currentUser, detalle, ip: info.ip, loc: info.loc, fecha: new Date().toLocaleString()
    });
}

// --- LOGIN CON ROLES ---
document.getElementById('btnLogin').onclick = async () => {
    const u = document.getElementById('user-input').value;
    const p = document.getElementById('pass-input').value;

    if (u === "admiut" && p === "#Reyn0sa#") {
        currentUser = u;
        document.getElementById('nav-historial').style.display = "block";
    } else if (u === "usuariout" && p === "12131415") {
        currentUser = u;
        document.getElementById('nav-historial').style.display = "none";
    } else { return alert("Acceso Incorrecto"); }

    await registrarLog("LOGIN", "Entrada al sistema");
    document.getElementById('auth-status').innerText = `✅ USUARIO: ${currentUser.toUpperCase()}`;
    showSection('gestion-section');
};

// --- GESTIÓN (GUARDAR/SUMAR) ---
document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const nom = document.getElementById('g-nombre').value;
    if(!cod || !nom) return alert("Faltan datos");

    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await registrarLog("STOCK", `Sumó ${cant} a ${nom}`);
    } else {
        await addDoc(collection(db, "productos"), { nombre: nom, codigo: cod, cantidad: cant, categoria: document.getElementById('g-categoria').value, estado: document.getElementById('g-estado').value });
        await registrarLog("CREAR", `Producto nuevo: ${nom}`);
    }
};

// --- ELIMINAR ---
document.getElementById('btnEliminar').onclick = async () => {
    if(!idSeleccionado) return alert("Selecciona una fila en la tabla");
    if(confirm("¿Eliminar permanentemente?")) {
        await deleteDoc(doc(db, "productos", idSeleccionado));
        await registrarLog("BORRAR", `ID: ${idSeleccionado}`);
        idSeleccionado = null;
    }
};

// --- BUSCADOR ---
document.getElementById('btnBuscar').onclick = () => {
    const term = document.getElementById('buscador').value.toLowerCase();
    const filt = productosLocal.filter(p => p.nombre.toLowerCase().includes(term) || p.codigo.includes(term));
    renderTable(filt);
};

// --- SALIDAS ---
document.getElementById('btnRegistrarSalida').onclick = async () => {
    const cod = document.getElementById('s-codigo').value;
    const cant = Number(document.getElementById('s-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty && snap.docs[0].data().cantidad >= cant) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad - cant });
        await addDoc(collection(db, "salidas"), { codigo: cod, responsable: document.getElementById('s-responsable').value, cantidad: cant, fecha: new Date().toLocaleString() });
        await registrarLog("SALIDA", `${cant} unidades de ${cod}`);
        alert("Salida realizada");
    } else { alert("Stock insuficiente"); }
};

// --- DEVOLUCIONES ---
document.getElementById('btnRegistrarDevolucion').onclick = async () => {
    const cod = document.getElementById('d-codigo').value;
    const cant = Number(document.getElementById('d-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        const p = snap.docs[0];
        await updateDoc(doc(db, "productos", p.id), { cantidad: p.data().cantidad + cant });
        await addDoc(collection(db, "devoluciones"), { codigo: cod, nombre: p.data().nombre, cantidad: cant, motivo: document.getElementById('d-motivo').value, usuario: currentUser, fecha: new Date().toLocaleString() });
        await registrarLog("DEVOLUCION", `${cant} unidades de ${cod}`);
        alert("Devolución procesada");
    }
};

// --- SINCRONIZACIÓN TIEMPO REAL ---
function renderTable(data) {
    const tb = document.getElementById('tbody-productos'); tb.innerHTML = "";
    data.forEach(p => {
        tb.innerHTML += `<tr onclick="idSeleccionado='${p.id}'; document.querySelectorAll('tr').forEach(r=>r.classList.remove('selected-row')); event.currentTarget.classList.add('selected-row');">
            <td>${p.codigo}</td><td>${p.nombre}</td><td><b>${p.cantidad}</b></td><td>${p.estado}</td></tr>`;
    });
}

onSnapshot(collection(db, "productos"), s => {
    productosLocal = s.docs.map(d => ({id: d.id, ...d.data()}));
    renderTable(productosLocal);
});

onSnapshot(collection(db, "salidas"), s => {
    const tb = document.getElementById('tbody-salidas'); tb.innerHTML = "";
    s.docs.forEach(d => { const v = d.data(); tb.innerHTML += `<tr><td>${v.codigo}</td><td>${v.responsable}</td><td>${v.cantidad}</td><td>${v.fecha}</td></tr>`; });
});

onSnapshot(collection(db, "devoluciones"), s => {
    const tb = document.getElementById('tbody-devoluciones'); tb.innerHTML = "";
    s.docs.forEach(d => { const v = d.data(); tb.innerHTML += `<tr><td>${v.codigo}</td><td>${v.nombre}</td><td>${v.cantidad}</td><td>${v.motivo}</td><td>${v.usuario}</td><td>${v.fecha}</td></tr>`; });
});

onSnapshot(collection(db, "historial"), s => {
    const tb = document.getElementById('tbody-historial'); tb.innerHTML = "";
    s.docs.forEach(d => {
        const v = d.data();
        const mapLink = v.loc !== "Sin permiso" ? `<a href="https://www.google.com/maps?q=${v.loc}" target="_blank">📍 Ver Mapa</a>` : "N/A";
        tb.innerHTML += `<tr><td>${v.tipo}</td><td>${v.usuario}</td><td>${v.detalle}</td><td>${v.ip}<br>${mapLink}</td><td>${v.fecha}</td></tr>`;
    });
});