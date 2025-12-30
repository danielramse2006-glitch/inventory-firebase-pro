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
async function getGeo() {
    let geo = { ip: "0.0.0.0", loc: "Sin permiso" };
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        geo.ip = data.ip;
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                p => { geo.loc = `${p.coords.latitude},${p.coords.longitude}`; resolve(geo); },
                () => resolve(geo)
            );
        });
    } catch { return geo; }
}

async function registrarLog(tipo, detalle) {
    const info = await getGeo();
    await addDoc(collection(db, "historial"), {
        tipo, usuario: currentUser, detalle, ip: info.ip, loc: info.loc, fecha: new Date().toLocaleString()
    });
}

// --- LOGIN CON ROLES ---
document.getElementById('btnLogin').onclick = async () => {
    const user = document.getElementById('user-input').value;
    const pass = document.getElementById('pass-input').value;

    if (user === "admiut" && pass === "#Reyn0sa#") {
        currentUser = user;
        document.getElementById('nav-historial').style.display = "block";
    } else if (user === "usuariout" && pass === "12131415") {
        currentUser = user;
        document.getElementById('nav-historial').style.display = "none";
    } else {
        return alert("Credenciales incorrectas");
    }

    await registrarLog("LOGIN", "Inicio de sesión exitoso");
    document.getElementById('auth-status').innerText = `✅ CONECTADO: ${currentUser.toUpperCase()}`;
    showSection('gestion-section');
};

// --- GESTIÓN (IDEM ANTERIOR) ---
document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const nom = document.getElementById('g-nombre').value;
    
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await registrarLog("STOCK", `Sumó ${cant} a ${nom}`);
    } else {
        await addDoc(collection(db, "productos"), { nombre: nom, codigo: cod, cantidad: cant, categoria: document.getElementById('g-categoria').value, estado: document.getElementById('g-estado').value });
        await registrarLog("CREAR", `Creó producto: ${nom}`);
    }
};

document.getElementById('btnEliminar').onclick = async () => {
    if(!idSeleccionado) return alert("Selecciona fila");
    if(confirm("¿Eliminar?")) {
        await deleteDoc(doc(db, "productos", idSeleccionado));
        await registrarLog("BORRAR", `ID: ${idSeleccionado}`);
        idSeleccionado = null;
    }
};

// --- RENDERIZADO DE TABLAS ---
onSnapshot(collection(db, "productos"), s => {
    productosLocal = s.docs.map(d => ({id: d.id, ...d.data()}));
    const tb = document.getElementById('tbody-productos'); tb.innerHTML = "";
    productosLocal.forEach(p => {
        tb.innerHTML += `<tr onclick="idSeleccionado='${p.id}'; document.querySelectorAll('tr').forEach(r=>r.classList.remove('selected-row')); event.currentTarget.classList.add('selected-row');">
            <td>${p.codigo}</td><td>${p.nombre}</td><td><b>${p.cantidad}</b></td><td>${p.estado}</td>
        </tr>`;
    });
});

onSnapshot(collection(db, "historial"), s => {
    const tb = document.getElementById('tbody-historial'); tb.innerHTML = "";
    s.docs.forEach(d => {
        const v = d.data();
        const mapLink = v.loc !== "Sin permiso" ? `<a href="https://www.google.com/maps?q=${v.loc}" target="_blank">📍 Ver Mapa</a>` : "N/A";
        tb.innerHTML += `<tr><td>${v.tipo}</td><td>${v.usuario}</td><td>${v.detalle}</td><td>${v.ip}<br>${mapLink}</td><td>${v.fecha}</td></tr>`;
    });
});

// El resto de los onSnapshot para Salidas y Devoluciones se mantienen igual que tu código anterior...