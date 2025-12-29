import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const productosRef = collection(db, "productos");

let todosLosProductos = []; // Guardaremos una copia para el buscador

// GUARDAR
document.getElementById('btnGuardar').onclick = async () => {
    const nombre = document.getElementById('nombre').value;
    const codigo = document.getElementById('codigo').value;
    const categoria = document.getElementById('categoria').value;
    const cantidad = document.getElementById('cantidad').value;

    if(nombre && codigo && cantidad) {
        await addDoc(productosRef, {
            nombre, codigo, categoria, cantidad: Number(cantidad), fecha: new Date().toLocaleString()
        });
        alert("Guardado correctamente");
    }
};

// LEER Y RENDERIZAR
onSnapshot(productosRef, (snapshot) => {
    todosLosProductos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderizarTabla(todosLosProductos);
});

function renderizarTabla(datos) {
    const listaDiv = document.getElementById('listaProductos');
    listaDiv.innerHTML = "";
    datos.forEach(p => {
        listaDiv.innerHTML += `
            <tr>
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.cantidad}</td>
                <td>
                    <button class="btn-delete-row" onclick="eliminar('${p.id}')">Eliminar</button>
                </td>
            </tr>`;
    });
}

// BUSCADOR EN TIEMPO REAL
document.getElementById('buscador').oninput = (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = todosLosProductos.filter(p => 
        p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino)
    );
    renderizarTabla(filtrados);
};

// ELIMINAR
window.eliminar = async (id) => {
    if(confirm("¿Eliminar producto?")) await deleteDoc(doc(db, "productos", id));
};