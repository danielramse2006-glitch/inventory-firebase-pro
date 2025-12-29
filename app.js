import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tus credenciales reales
const firebaseConfig = {
  apiKey: "AIzaSyCtIagFFJBFRjvg5usXTm575YqOeeDE1G0",
  authDomain: "mi-inventario-51f82.firebaseapp.com",
  projectId: "mi-inventario-51f82",
  storageBucket: "mi-inventario-51f82.firebasestorage.app",
  messagingSenderId: "79417755416",
  appId: "1:79417755416:web:e1bbab46cda2bdbb5da56d",
  measurementId: "G-P1PRV5HE93"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productosRef = collection(db, "productos");

// --- 1. AGREGAR PRODUCTO ---
document.getElementById('btnGuardar').onclick = async () => {
    const nombre = document.getElementById('nombre').value;
    const cantidad = document.getElementById('cantidad').value;

    if(nombre && cantidad) {
        await addDoc(productosRef, {
            nombre: nombre,
            cantidad: Number(cantidad)
        });
        document.getElementById('nombre').value = "";
        document.getElementById('cantidad').value = "";
    }
};

// --- 2. LEER Y MOSTRAR (TIEMPO REAL) ---
onSnapshot(productosRef, (snapshot) => {
    const listaDiv = document.getElementById('listaProductos');
    listaDiv.innerHTML = "";
    snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        const id = docSnap.id;
        
        listaDiv.innerHTML += `
            <div class="producto-card">
                <div>
                    <strong>${p.nombre}</strong> <br>
                    <span>Stock: ${p.cantidad}</span>
                </div>
                <div>
                    <button onclick="vender('${id}', ${p.cantidad})" style="background:#28a745; width:auto;">Vender 1</button>
                    <button onclick="eliminar('${id}')" style="background:#dc3545; width:auto;">Eliminar</button>
                </div>
            </div>`;
    });
});

// --- 3. FUNCIONES GLOBALES PARA LOS BOTONES ---
window.vender = async (id, stockActual) => {
    if (stockActual > 0) {
        const docRef = doc(db, "productos", id);
        await updateDoc(docRef, { cantidad: stockActual - 1 });
    } else {
        alert("Sin stock disponible");
    }
};

window.eliminar = async (id) => {
    if(confirm("¿Seguro que quieres borrar este producto?")) {
        await deleteDoc(doc(db, "productos", id));
    }
};