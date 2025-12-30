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
let currentUser = "";

window.showSection = (id) => {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// --- AUDITORÍA CON MÁXIMA PRECISIÓN GPS ---
async function getAuditData() {
    let data = { 
        ip: "0.0.0.0", 
        loc: "Sin permiso", 
        device: navigator.userAgent.includes("Windows") ? "Laptop/PC" : "Móvil"
    };
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        data.ip = json.ip;
        
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                p => { 
                    // Captura con máximo detalle decimal
                    data.loc = `${p.coords.latitude},${p.coords.longitude}`; 
                    resolve(data); 
                },
                () => resolve(data),
                { 
                    enableHighAccuracy: true, // FORZAR GPS REAL
                    timeout: 15000,           // ESPERAR SEÑAL FUERTE
                    maximumAge: 0             // NO USAR CACHÉ
                }
            );
        });
    } catch { return data; }
}

async function registrarLog(tipo, detalle) {
    const info = await getAuditData();
    await addDoc(collection(db, "historial"), {
        tipo, usuario: currentUser, detalle, ip: info.ip, loc: info.loc, device: info.device, fecha: new Date().toLocaleString()
    });
}

// --- LOGIN ---
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

    await registrarLog("LOGIN", "Entró");
    document.getElementById('auth-status').innerText = `✅ ${currentUser.toUpperCase()}`;
    showSection('gestion-section');
};

// --- BORRADO RÁPIDO ---
document.getElementById('btnEliminarRapido').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    if(!cod || cant <= 0) return alert("Escriba código y cantidad");

    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);
    if(snap.empty) return alert("No existe");

    const pDoc = snap.docs[0];
    const nuevaCant = pDoc.data().cantidad - cant;

    if(nuevaCant <= 0) {
        if(confirm("Stock agotado. ¿Borrar producto?")) {
            await deleteDoc(doc(db, "productos", pDoc.id));
            await registrarLog("ELIMINAR", `Borró: ${pDoc.data().nombre}`);
        }
    } else {
        await updateDoc(doc(db, "productos", pDoc.id), { cantidad: nuevaCant });
        await registrarLog("RESTAR", `Quitó ${cant} a ${pDoc.data().nombre}`);
    }
};

// --- GUARDAR ---
document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const nom = document.getElementById('g-nombre').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await registrarLog("STOCK", `Añadió ${cant} a ${nom}`);
    } else {
        await addDoc(collection(db, "productos"), { 
            nombre: nom, codigo: cod, cantidad: cant, 
            categoria: document.getElementById('g-categoria').value, 
            estado: document.getElementById('g-estado').value 
        });
        await registrarLog("CREAR", `Nuevo: ${nom}`);
    }
    alert("Hecho");
};

// --- TABLAS ---
onSnapshot(collection(db, "productos"), s => {
    const tb = document.getElementById('tbody-productos'); tb.innerHTML = "";
    s.docs.forEach(d => {
        const p = d.data();
        tb.innerHTML += `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td><b>${p.cantidad}</b></td><td>${p.estado}</td></tr>`;
    });
});

onSnapshot(collection(db, "historial"), s => {
    const tb = document.getElementById('tbody-historial'); tb.innerHTML = "";
    s.docs.forEach(d => {
        const v = d.data();
        const mapLink = v.loc !== "Sin permiso" 
            ? `<a href="https://www.google.com/maps?q=${v.loc}" target="_blank">📍 Ver Mapa Exacto</a>` 
            : "N/A";
        tb.innerHTML += `<tr><td>${v.tipo}</td><td>${v.usuario}</td><td>${v.device}</td><td>${v.ip}<br>${mapLink}</td><td>${v.fecha}</td></tr>`;
    });
});