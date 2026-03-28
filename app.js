// ============================================
// 1. IMPORTAR FUNCIONES DE FIREBASE (COMPLETO)
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
// 2. TU CONFIGURACIÓN DE FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDd6t8hnXa1O133pS-liPEEZMfwa2lpno4",
    authDomain: "agenda-medica-app-66f57.firebaseapp.com",
    projectId: "agenda-medica-app-66f57",
    storageBucket: "agenda-medica-app-66f57.firebasestorage.ap",
    messagingSenderId: "495304456103",
    appId: "1:495304456103:web:92c24773173b9ea5012882"
};

// ============================================
// 3. INICIALIZAR FIREBASE
// ============================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ============================================
// 4. REFERENCIAS A ELEMENTOS DEL HTML
// ============================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const toggleRegister = document.getElementById('toggleRegister');
const welcomePanel = document.getElementById('welcomePanel');
const welcomeMessage = document.getElementById('welcomeMessage');
const userEmailDisplay = document.getElementById('userEmail');
const appointmentForm = document.getElementById('appointmentForm');
const appointmentsList = document.getElementById('appointmentsList');

// Variable global para el UID del usuario
let currentUserUID = null;
let isRegisterMode = false;

// ============================================
// 5. FUNCIONES DE AUTENTICACIÓN
// ============================================
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            rol: "paciente",
            nombre: email.split('@')[0],
            telefono: "",
            fechaRegistro: new Date()
        });
        
        alert("✅ Usuario registrado con éxito");
    } catch (error) {
        console.error("Error en registro:", error);
        alert("❌ Error: " + error.message);
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("✅ Bienvenido: " + userCredential.user.email);
    } catch (error) {
        console.error("Error en login:", error);
        alert("❌ Error: " + error.message);
    }
}

async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                nombre: user.displayName,
                foto: user.photoURL,
                rol: "paciente",
                telefono: "",
                proveedor: "google",
                fechaRegistro: new Date()
            });
        }
        
        alert("✅ Bienvenido con Google: " + user.email);
    } catch (error) {
        console.error("Error en Google Login:", error);
        alert("❌ Error con Google: " + error.message);
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
        alert("👋 Sesión cerrada");
        window.location.reload();
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

// ============================================
// 6. FUNCIONES DE CITAS
// ============================================
async function saveAppointment(doctor, date, time, reason) {
    try {
        if (!currentUserUID) {
            alert("❌ Error: No hay usuario identificado");
            return;
        }

        await addDoc(collection(db, "appointments"), {
            patientId: currentUserUID,
            patientEmail: auth.currentUser.email,
            doctor: doctor,
            date: date,
            time: time,
            reason: reason,
            status: "pendiente",
            createdAt: new Date()
        });

        alert("✅ Cita agendada exitosamente");
        appointmentForm.reset();
        loadAppointments();
        
    } catch (error) {
        console.error("Error al guardar cita:", error);
        alert("❌ Error: " + error.message);
    }
}

async function loadAppointments() {
    try {
        if (!currentUserUID) {
            appointmentsList.innerHTML = '<p class="text-center text-muted">Inicie sesión para ver sus citas</p>';
            return;
        }

        appointmentsList.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Cargando...</p></div>';

        const q = query(
            collection(db, "appointments"),
            where("patientId", "==", currentUserUID),
            orderBy("date", "asc")
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            appointmentsList.innerHTML = '<p class="text-center text-muted">No tienes citas agendadas</p>';
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnapshot) => {
            const cita = docSnapshot.data();
            const citaId = docSnapshot.id;
            
            let statusColor = 'warning';
            if (cita.status === 'confirmada') statusColor = 'success';
            if (cita.status === 'cancelada') statusColor = 'danger';

            html += `
                <div class="card mb-2 border-${statusColor}">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-1">👨‍⚕️ ${cita.doctor}</h6>
                            <span class="badge bg-${statusColor}">${cita.status}</span>
                        </div>
                        <p class="mb-1 small">📅 ${cita.date} - ⏰ ${cita.time}</p>
                        <p class="mb-1 small">📝 ${cita.reason}</p>
                        <button class="btn btn-sm btn-danger mt-1" onclick="cancelAppointment('${citaId}')">Cancelar</button>
                    </div>
                </div>
            `;
        });

        appointmentsList.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar citas:", error);
        if (error.code === 'failed-precondition') {
            const indexLink = error.message.match(/https:\/\/[^\s]+/);
            appointmentsList.innerHTML = `
                <div class="alert alert-warning">
                    <strong>⚠️ Índice necesario:</strong> 
                    <a href="${indexLink ? indexLink[0] : '#'}" target="_blank">Haz clic aquí para crear el índice en Firebase</a>
                </div>
            `;
        } else {
            appointmentsList.innerHTML = '<p class="text-center text-danger">Error al cargar citas</p>';
        }
    }
}

async function cancelAppointment(appointmentId) {
    if (!confirm("¿Estás seguro de cancelar esta cita?")) return;

    try {
        await deleteDoc(doc(db, "appointments", appointmentId));
        alert("Cita cancelada");
        loadAppointments();
    } catch (error) {
        console.error("Error al cancelar:", error);
        alert("Error al cancelar: " + error.message);
    }
}

// Hacer función global para HTML
window.cancelAppointment = cancelAppointment;

// ============================================
// 7. ESCUCHAR CAMBIOS DE AUTENTICACIÓN
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUID = user.uid;
        
        welcomePanel.classList.remove('d-none');
        loginForm.parentElement.parentElement.classList.add('d-none');
        btnLogout.classList.remove('d-none');
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            welcomeMessage.textContent = `Hola, ${userData.nombre || user.email}`;
        } else {
            welcomeMessage.textContent = `Hola, ${user.email}`;
        }

        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email;
        }

        loadAppointments();
        
    } else {
        currentUserUID = null;
        
        welcomePanel.classList.add('d-none');
        loginForm.parentElement.parentElement.classList.remove('d-none');
        btnLogout.classList.add('d-none');
    }
});

// ============================================
// 8. EVENT LISTENERS
// ============================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (isRegisterMode) {
        registerUser(email, password);
    } else {
        loginUser(email, password);
    }
});

btnGoogle.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    
    if (isRegisterMode) {
        toggleRegister.textContent = "¿Ya tienes cuenta? Inicia sesión";
        loginForm.querySelector('h3').textContent = "Registro de Usuario";
        loginForm.querySelector('button[type="submit"]').textContent = "Registrarse";
    } else {
        toggleRegister.textContent = "¿No tienes cuenta? Regístrate aquí";
        loginForm.querySelector('h3').textContent = "Acceso Usuarios";
        loginForm.querySelector('button[type="submit"]').textContent = "Ingresar";
    }
});

appointmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const doctor = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const reason = document.getElementById('appointmentReason').value;
    
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        alert("❌ No puedes agendar citas en fechas pasadas");
        return;
    }
    
    saveAppointment(doctor, date, time, reason);
});

console.log("🔥 App.js cargado correctamente");