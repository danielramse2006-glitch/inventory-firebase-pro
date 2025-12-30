import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tu configuración de Firebase
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

// --- 1. GUARDAR / ACTUALIZAR PRODUCTO (SUMA SI EXISTE) ---
document.getElementById('btnGuardar').onclick = async () => {
    const nombre = document.getElementById('g-nombre').value;
    const codigo = document.getElementById('g-codigo').value;
    const cantidadNueva = Number(document.getElementById('g-cantidad').value);

    if(!nombre || !codigo || !cantidadNueva) return alert("Llena los campos");

    // Buscar si el código ya existe
    const q = query(collection(db, "productos"), where("codigo", "==", codigo));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // SI EXISTE: Sumar cantidad
        const productoDoc = querySnapshot.docs[0];
        const stockActual = productoDoc.data().cantidad;
        await updateDoc(doc(db, "productos", productoDoc.id), {
            cantidad: stockActual + cantidadNueva
        });
        alert("Código existente: Se sumó la cantidad al stock.");
    } else {
        // NO EXISTE: Crear nuevo
        await addDoc(collection(db, "productos"), {
            nombre, codigo, 
            categoria: document.getElementById('g-categoria').value,
            cantidad: cantidadNueva,
            estado: document.getElementById('g-estado').value,
            fecha: new Date().toLocaleString()
        });
        alert("Producto nuevo registrado");
    }
};

// --- 2. REGISTRAR SALIDA (RESTA DEL STOCK) ---
document.getElementById('btnRegistrarSalida').onclick = async () => {
    const codigo = document.getElementById('s-codigo').value;
    const cantSalida = Number(document.getElementById('s-cantidad').value);
    const resp = document.getElementById('s-responsable').value;

    const q = query(collection(db, "productos"), where("codigo", "==", codigo));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return alert("El código no existe en el inventario");

    const productoDoc = querySnapshot.docs[0];
    const stockActual = productoDoc.data().cantidad;

    if (stockActual >= cantSalida) {
        // Restar del inventario
        await updateDoc(doc(db, "productos", productoDoc.id), {
            cantidad: stockActual - cantSalida
        });
        // Guardar registro de salida
        await addDoc(collection(db, "salidas"), {
            codigo, responsable: resp, cantidad: cantSalida, fecha: new Date().toLocaleString()
        });
        alert("Salida registrada y stock actualizado");
    } else {
        alert("Stock insuficiente. Solo hay: " + stockActual);
    }
};

// --- 3. MOSTRAR DATOS EN TIEMPO REAL ---
onSnapshot(collection(db, "productos"), (snapshot) => {
    productosLocal = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTable(productosLocal);
});

function renderTable(data) {
    const tbody = document.getElementById('tbody-productos');
    tbody.innerHTML = "";
    data.forEach(p => {
        tbody.innerHTML += `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td>${p.categoria}</td><td>${p.cantidad}</td><td>${p.estado}</td><td>${p.fecha}</td></tr>`;
    });
}