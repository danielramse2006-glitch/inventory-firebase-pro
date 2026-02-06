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

// --- SISTEMA DE NAVEGACIÓN PROTEGIDO ---
window.showSection = (id) => {
    // Bloqueo total si no hay sesión activa
    if (!currentUser && id !== 'login-section') {
        alert("⛔ Acceso restringido. Por favor, inicie sesión.");
        return;
    }
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// --- AUDITORÍA Y GPS ---
async function getAuditData() {
    let data = { 
        ip: "0.0.0.0", 
        loc: "Sin permiso", 
        device: navigator.userAgent.includes("Windows") ? "PC/Laptop" : "Dispositivo Móvil"
    };
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        data.ip = json.ip;
        
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                p => { 
                    data.loc = `${p.coords.latitude},${p.coords.longitude}`; 
                    resolve(data); 
                },
                () => resolve(data),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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

// --- LOGIN CON REDIRECCIÓN A REGISTRO ---
document.getElementById('btnLogin').onclick = async () => {
    const u = document.getElementById('user-input').value;
    const p = document.getElementById('pass-input').value;
    
    if (u === "admiut" && p === "#Reyn0sa#") {
        currentUser = u;
        document.getElementById('nav-historial').style.display = "block";
    } else if (u === "usuariout" && p === "12131415") {
        currentUser = u;
        document.getElementById('nav-historial').style.display = "none";
    } else { 
        return alert("Acceso Incorrecto"); 
    }

    // Desbloqueamos la navegación y redirigimos
    document.getElementById('main-nav-bar').style.display = "flex";
    
    await registrarLog("LOGIN", "Entró al sistema");
    document.getElementById('auth-status').innerText = `✅ ${currentUser.toUpperCase()}`;
    
    // REDIRECCIÓN A GESTIÓN (Nuevo Registro)
    showSection('gestion-section');
};

// --- GESTIÓN DE PRODUCTOS ---
document.getElementById('btnEliminarRapido').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    if(!cod || cant <= 0) return alert("Escriba código y cantidad");

    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);
    if(snap.empty) return alert("Producto no encontrado");

    const pDoc = snap.docs[0];
    const nuevaCant = pDoc.data().cantidad - cant;

    if(nuevaCant <= 0) {
        if(confirm(`Stock insuficiente. ¿Deseas ELIMINAR ${pDoc.data().nombre} del sistema?`)) {
            await deleteDoc(doc(db, "productos", pDoc.id));
            await registrarLog("ELIMINAR", `Borrado total de: ${pDoc.data().nombre}`);
        }
    } else {
        await updateDoc(doc(db, "productos", pDoc.id), { cantidad: nuevaCant });
        await registrarLog("RESTAR", `Restó ${cant} a ${pDoc.data().nombre}`);
    }
};

document.getElementById('btnGuardar').onclick = async () => {
    const cod = document.getElementById('g-codigo').value;
    const nom = document.getElementById('g-nombre').value;
    const cant = Number(document.getElementById('g-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await registrarLog("STOCK", `Sumó ${cant} a ${nom}`);
    } else {
        await addDoc(collection(db, "productos"), { 
            nombre: nom, codigo: cod, cantidad: cant, 
            categoria: document.getElementById('g-categoria').value, 
            estado: document.getElementById('g-estado').value 
        });
        await registrarLog("CREAR", `Nuevo producto: ${nom}`);
    }
    alert("Guardado");
};

// --- SALIDAS Y DEVOLUCIONES ---
document.getElementById('btnRegistrarSalida').onclick = async () => {
    const cod = document.getElementById('s-codigo').value;
    const cant = Number(document.getElementById('s-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty && snap.docs[0].data().cantidad >= cant) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad - cant });
        await addDoc(collection(db, "salidas"), { codigo: cod, responsable: document.getElementById('s-responsable').value, cantidad: cant, fecha: new Date().toLocaleString() });
        await registrarLog("SALIDA", `Salida de ${cant} unid. de ${cod}`);
        alert("Salida registrada");
    } else { alert("Stock insuficiente o producto no existe"); }
};

document.getElementById('btnRegistrarDevolucion').onclick = async () => {
    const cod = document.getElementById('d-codigo').value;
    const cant = Number(document.getElementById('d-cantidad').value);
    const q = query(collection(db, "productos"), where("codigo", "==", cod));
    const snap = await getDocs(q);

    if(!snap.empty) {
        await updateDoc(doc(db, "productos", snap.docs[0].id), { cantidad: snap.docs[0].data().cantidad + cant });
        await addDoc(collection(db, "devoluciones"), { codigo: cod, nombre: snap.docs[0].data().nombre, cantidad: cant, motivo: document.getElementById('d-motivo').value, usuario: currentUser, fecha: new Date().toLocaleString() });
        await registrarLog("DEVOLUCION", `Regresaron ${cant} de ${cod}`);
        alert("Devolución exitosa");
    } else { alert("Código no reconocido"); }
};

// --- TIEMPO REAL ---
onSnapshot(collection(db, "productos"), s => {
    productosLocal = s.docs.map(d => ({id: d.id, ...d.data()}));
    const tb = document.getElementById('tbody-productos'); tb.innerHTML = "";
    productosLocal.forEach(p => { tb.innerHTML += `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td><b>${p.cantidad}</b></td><td>${p.estado}</td></tr>`; });
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
        const mapLink = v.loc !== "Sin permiso" ? `<a href="https://www.google.com/maps?q=${v.loc}" target="_blank">📍 Ver GPS</a>` : "N/A";
        tb.innerHTML += `<tr><td>${v.tipo}</td><td>${v.usuario}</td><td>${v.device}</td><td>${v.ip}<br>${mapLink}</td><td>${v.fecha}</td></tr>`;
    });
});
