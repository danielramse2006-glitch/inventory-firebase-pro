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

// --- NAVEGACIÓN ---
window.showSection = (id) => {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// --- FUNCIÓN PARA OBTENER IP Y UBICACIÓN ---
async function capturarSeguridad() {
    let info = { ip: "Desconocida", lat: "N/A", lon: "N/A" };
    try {
        // Obtener IP
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        info.ip = data.ip;

        // Obtener Coordenadas
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    info.lat = pos.coords.latitude;
                    info.lon = pos.coords.longitude;
                    resolve(info);
                },
                () => resolve(info) // Si niega permiso, devuelve solo IP
            );
        });
    } catch (e) { return info; }
}

// --- LOGIN CON REGISTRO DE SEGURIDAD ---
document.getElementById('btnLogin').onclick = async () => {
    const user = document.getElementById('user-input').value.toUpperCase();
    if(user === "A") {
        document.getElementById('log-msg').innerText = "Obteniendo seguridad...";
        const seg = await capturarSeguridad();
        
        // Guardar registro de acceso en Firebase
        await addDoc(collection(db, "accesos"), {
            usuario: user,
            ip: seg.ip,
            ubicacion: `${seg.lat}, ${seg.lon}`,
            fecha: new Date().toLocaleString()
        });

        document.getElementById('auth-status').innerText = "✅ AUTENTICADO";
        document.getElementById('user-info').innerText = `IP: ${seg.ip} | Loc: ${seg.lat},${seg.lon}`;
        showSection('gestion-section');
    } else { alert("Acceso denegado"); }
};

// --- BUSCADOR POR BOTÓN ---
document.getElementById('btnBuscar').onclick = () => {
    const term = document.getElementById('buscador').value.toLowerCase();
    const filtrados = productosLocal.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(term)) || 
        (p.codigo && p.codigo.toLowerCase().includes(term))
    );
    renderTable(filtrados);
};

// --- GESTIÓN DE PRODUCTOS ---
document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const nom = document.getElementById('g-nombre').value;

    if(!cod || !nom) return alert("Campos incompletos");

    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if (!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { 
            cantidad: snap.docs[0].data().cantidad + cant 
        });
        alert("Stock actualizado");
    } else {
        await addDoc(collection(db, "productos"), {
            nombre: nom, codigo: cod, cantidad: cant,
            categoria: document.getElementById('g-categoria').value,
            estado: document.getElementById('g-estado').value
        });
        alert("Producto creado");
    }
};

// --- SALIDAS ---
document.getElementById('btnRegistrarSalida').onclick = async () => {
    const cod = document.getElementById('s-codigo').value;
    const cant = Number(document.getElementById('s-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if (!snap.empty && snap.docs[0].data().cantidad >= cant) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad - cant });
        await addDoc(collection(db, "salidas"), { codigo: cod, cantidad: cant, responsable: document.getElementById('s-responsable').value, fecha: new Date().toLocaleString() });
        alert("Salida registrada");
    } else { alert("Error de stock o código"); }
};

// --- DEVOLUCIONES ---
document.getElementById('btnRegistrarDevolucion').onclick = async () => {
    const cod = document.getElementById('d-codigo').value;
    const cant = Number(document.getElementById('d-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if (!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await addDoc(collection(db, "devoluciones"), { codigo: cod, cantidad: cant, motivo: document.getElementById('d-motivo').value, fecha: new Date().toLocaleString() });
        alert("Devolución aceptada");
    }
};

// --- TABLAS EN TIEMPO REAL ---
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