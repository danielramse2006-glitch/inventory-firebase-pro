import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Credenciales de Firebase
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

// --- NAVEGACIÓN ---
window.showSection = (sectionId) => {
    document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
};

// --- LOGIN SIMULADO ---
document.getElementById('btnLogin').onclick = () => {
    const user = document.getElementById('user-input').value;
    if(user === "admin" || user === "A") {
        document.getElementById('auth-status').innerText = "✅ Autenticado: " + user;
        document.getElementById('auth-status').style.color = "green";
        showSection('gestion-section');
    } else {
        alert("Usuario no válido");
    }
};

// --- GESTIÓN DE PRODUCTOS ---
document.getElementById('btnGuardar').onclick = async () => {
    const data = {
        nombre: document.getElementById('g-nombre').value,
        codigo: document.getElementById('g-codigo').value,
        categoria: document.getElementById('g-categoria').value,
        cantidad: Number(document.getElementById('g-cantidad').value),
        estado: document.getElementById('g-estado').value,
        fecha: new Date().toLocaleString()
    };

    if(data.nombre && data.codigo) {
        await addDoc(collection(db, "productos"), data);
        alert("Producto registrado");
    }
};

// --- RENDERIZADO Y BUSCADOR ---
onSnapshot(collection(db, "productos"), (snapshot) => {
    productosLocal = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTable(productosLocal);
});

function renderTable(data) {
    const tbody = document.getElementById('tbody-productos');
    tbody.innerHTML = "";
    data.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.cantidad}</td>
                <td>${p.estado}</td>
                <td>${p.fecha}</td>
            </tr>`;
    });
}

document.getElementById('buscador').oninput = (e) => {
    const val = e.target.value.toLowerCase();
    const filtrados = productosLocal.filter(p => p.nombre.toLowerCase().includes(val) || p.codigo.includes(val));
    renderTable(filtrados);
};