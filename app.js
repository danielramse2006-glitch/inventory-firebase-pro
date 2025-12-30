import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// NAVEGACIÓN
window.showSection = (id) => {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// LOGIN
document.getElementById('btnLogin').onclick = () => {
    if(document.getElementById('user-input').value.toUpperCase() === "A") {
        document.getElementById('auth-status').innerText = "✅ ESTADO: AUTENTICADO COMO ADMIN";
        document.getElementById('auth-status').style.color = "green";
        showSection('gestion-section');
    } else { alert("Usuario incorrecto"); }
};

// BUSCADOR AUTOMÁTICO
document.getElementById('buscador').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = productosLocal.filter(p => 
        p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
    );
    renderTable(filtrados);
};

// GUARDAR (SUMA SI EL CÓDIGO EXISTE)
document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const nom = document.getElementById('g-nombre').value;

    if(!cod || !nom) return alert("Llena los campos");

    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const docRef = doc(db, "productos", snap.docs[0].id);
        await updateDoc(docRef, { cantidad: snap.docs[0].data().cantidad + cant });
        alert("Stock actualizado");
    } else {
        await addDoc(collection(db, "productos"), {
            nombre: nom, codigo: cod, cantidad: cant,
            categoria: document.getElementById('g-categoria').value,
            estado: document.getElementById('g-estado').value
        });
        alert("Nuevo producto creado");
    }
};

// SALIDAS (RESTA STOCK)
document.getElementById('btnRegistrarSalida').onclick = async () => {
    const cod = document.getElementById('s-codigo').value;
    const cant = Number(document.getElementById('s-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if (!snap.empty && snap.docs[0].data().cantidad >= cant) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad - cant });
        await addDoc(collection(db, "salidas"), { codigo: cod, cantidad: cant, responsable: document.getElementById('s-responsable').value, fecha: new Date().toLocaleString() });
        alert("Salida registrada");
    } else { alert("Error: Stock insuficiente o código inexistente"); }
};

// DEVOLUCIONES (SUMA STOCK)
document.getElementById('btnRegistrarDevolucion').onclick = async () => {
    const cod = document.getElementById('d-codigo').value;
    const cant = Number(document.getElementById('d-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if (!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await addDoc(collection(db, "devoluciones"), { codigo: cod, cantidad: cant, motivo: document.getElementById('d-motivo').value, fecha: new Date().toLocaleString() });
        alert("Devolución registrada");
    } else { alert("Error: Código no existe"); }
};

// TABLAS EN TIEMPO REAL
function renderTable(data) {
    const tb = document.getElementById('tbody-productos'); tb.innerHTML = "";
    data.forEach(p => { tb.innerHTML += `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td><b>${p.cantidad}</b></td><td>${p.categoria}</td><td>${p.estado}</td></tr>`; });
}

onSnapshot(collection(db, "productos"), (s) => {
    productosLocal = s.docs.map(d => ({id: d.id, ...d.data()}));
    renderTable(productosLocal);
});

onSnapshot(collection(db, "salidas"), (s) => {
    const tb = document.getElementById('tbody-salidas'); tb.innerHTML = "";
    s.docs.forEach(d => { const p = d.data(); tb.innerHTML += `<tr><td>${p.codigo}</td><td>${p.responsable}</td><td>${p.cantidad}</td><td>${p.fecha}</td></tr>`; });
});

onSnapshot(collection(db, "devoluciones"), (s) => {
    const tb = document.getElementById('tbody-devoluciones'); tb.innerHTML = "";
    s.docs.forEach(d => { const p = d.data(); tb.innerHTML += `<tr><td>${p.codigo}</td><td>${p.motivo}</td><td>${p.cantidad}</td><td>${p.fecha}</td></tr>`; });
});