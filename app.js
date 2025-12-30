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

window.showSection = (id) => {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// LOGIN CON IP
document.getElementById('btnLogin').onclick = async () => {
    const user = document.getElementById('user-input').value || "admiut";
    const resIp = await fetch('https://api.ipify.org?format=json');
    const { ip } = await resIp.json();

    await addDoc(collection(db, "historial"), { tipo: "LOGIN", usuario: user, ip: ip, fecha: new Date().toLocaleString() });
    document.getElementById('auth-status').innerText = `✅ ADMIN: ${user} (IP: ${ip})`;
    showSection('gestion-section');
};

// SELECCIONAR FILA
window.seleccionar = (id, codigo, nombre) => {
    idSeleccionado = id;
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
    event.currentTarget.classList.add('selected-row');
};

// BUSCADOR CON BOTÓN
document.getElementById('btnBuscar').onclick = () => {
    const term = document.getElementById('buscador').value.toLowerCase();
    const filt = productosLocal.filter(p => p.nombre.toLowerCase().includes(term) || p.codigo.includes(term));
    renderTable(filt);
};

// GUARDAR (SUMA SI EXISTE)
document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        alert("Stock incrementado");
    } else {
        await addDoc(collection(db, "productos"), {
            nombre: document.getElementById('g-nombre').value,
            codigo: cod, cantidad: cant,
            categoria: document.getElementById('g-categoria').value,
            estado: document.getElementById('g-estado').value
        });
        alert("Producto nuevo guardado");
    }
};

// BORRAR PRODUCTO
document.getElementById('btnEliminar').onclick = async () => {
    if(!idSeleccionado) return alert("Selecciona un producto primero");
    if(confirm("¿Eliminar producto?")) {
        await deleteDoc(doc(db, "productos", idSeleccionado));
        idSeleccionado = null;
    }
};

// SALIDAS (RESTA STOCK)
document.getElementById('btnRegistrarSalida').onclick = async () => {
    const cod = document.getElementById('s-codigo').value;
    const cant = Number(document.getElementById('s-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty && snap.docs[0].data().cantidad >= cant) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad - cant });
        await addDoc(collection(db, "salidas"), { codigo: cod, responsable: document.getElementById('s-responsable').value, cantidad: cant, fecha: new Date().toLocaleString() });
        alert("Salida registrada");
    } else { alert("Stock insuficiente o código inválido"); }
};

// DEVOLUCIONES (SUMA STOCK)
document.getElementById('btnRegistrarDevolucion').onclick = async () => {
    const cod = document.getElementById('d-codigo').value;
    const cant = Number(document.getElementById('d-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        const p = snap.docs[0];
        await updateDoc(doc(db, "productos", p.id), { cantidad: p.data().cantidad + cant });
        await addDoc(collection(db, "devoluciones"), { codigo: cod, nombre: p.data().nombre, cantidad: cant, motivo: document.getElementById('d-motivo').value, usuario: "admiut", fecha: new Date().toLocaleString() });
        alert("Stock devuelto");
    }
};

// ACTUALIZACIÓN EN TIEMPO REAL
function renderTable(data) {
    const tb = document.getElementById('tbody-productos'); tb.innerHTML = "";
    data.forEach(p => { 
        tb.innerHTML += `<tr onclick="seleccionar('${p.id}', '${p.codigo}', '${p.nombre}')"><td>${p.codigo}</td><td>${p.nombre}</td><td><b>${p.cantidad}</b></td><td>${p.estado}</td></tr>`; 
    });
}

onSnapshot(collection(db, "productos"), (s) => {
    productosLocal = s.docs.map(d => ({id: d.id, ...d.data()}));
    renderTable(productosLocal);
});

onSnapshot(collection(db, "salidas"), (s) => {
    const tb = document.getElementById('tbody-salidas'); tb.innerHTML = "";
    s.docs.forEach(d => { const v = d.data(); tb.innerHTML += `<tr><td>${v.codigo}</td><td>${v.responsable}</td><td>${v.cantidad}</td><td>${v.fecha}</td></tr>`; });
});

onSnapshot(collection(db, "devoluciones"), (s) => {
    const tb = document.getElementById('tbody-devoluciones'); tb.innerHTML = "";
    s.docs.forEach(d => { const v = d.data(); tb.innerHTML += `<tr><td>${v.codigo}</td><td>${v.nombre}</td><td>${v.cantidad}</td><td>${v.motivo}</td><td>${v.usuario}</td><td>${v.fecha}</td></tr>`; });
});