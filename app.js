/**
 * MEDICARE PRO - app.js v4.2
 * Citas de doctor usando UID IscjlchavezG
 */

// ============================================
// 1. IMPORTS DE FIREBASE
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, collection, addDoc,
    query, where, orderBy, onSnapshot, getDocs, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
// 2. CONFIGURACIÓN FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDd6t8hnXa1O133pS-liPEEZMfwa2lpno4",
    authDomain: "agenda-medica-app-66f57.firebaseapp.com",
    projectId: "agenda-medica-app-66f57",
    storageBucket: "agenda-medica-app-66f57.firebasestorage.app",
    messagingSenderId: "495304456103",
    appId: "1:495304456103:web:92c24773173b9ea5012882"
};

console.log("🔥 MediCare Pro v4.2 - FIX UID Doctor");

// ============================================
// 3. INICIALIZAR FIREBASE
// ============================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ============================================
// 4. REFERENCIAS DOM
// ============================================
const authSection = document.getElementById('authSection');
const welcomePanel = document.getElementById('welcomePanel');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const toggleRegister = document.getElementById('toggleRegister');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const authMessage = document.getElementById('authMessage');
const roleSelectContainer = document.getElementById('roleSelectContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const userEmailDisplay = document.getElementById('userEmail');
const userRole = document.getElementById('userRole');
const navRole = document.getElementById('navRole');
const patientFormSection = document.getElementById('patientFormSection');
const doctorPanel = document.getElementById('doctorPanel');
const doctorStats = document.getElementById('doctorStats');
const appointmentsTitle = document.getElementById('appointmentsTitle');
const appointmentForm = document.getElementById('appointmentForm');
const doctorSelect = document.getElementById('doctorSelect');
const doctorsStatus = document.getElementById('doctorsStatus');
const appointmentsList = document.getElementById('appointmentsList');
const citasCount = document.getElementById('citasCount');
const totalCitasEl = document.getElementById('totalCitas');
const pendingCitasEl = document.getElementById('pendingCitas');
const patientCountEl = document.getElementById('patientCount');
const saveAppointmentBtn = document.getElementById('saveAppointmentBtn');
const doctorProfileForm = document.getElementById('doctorProfileForm');
const doctorNameInput = document.getElementById('doctorName');
const doctorSpecialtyInput = document.getElementById('doctorSpecialty');

// Variables globales
let currentUserUID = null;
let currentUserData = null;
let currentUserRole = 'paciente';
let isRegisterMode = false;
let unsubscribeAppointments = null;
let doctorsList = [];

// ============================================
// 5. SISTEMA DE MENSAJES
// ============================================

function showMessage(text, type = 'info') {
    if (!authMessage) return;
    authMessage.innerHTML = text;
    authMessage.className = `alert alert-${type}`;
    authMessage.classList.remove('d-none');
    setTimeout(() => authMessage.classList.add('d-none'), 5000);
}

function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} shadow-lg`;
    toast.style.cssText = 'min-width:300px;max-width:400px;padding:1rem 1.25rem;border-radius:12px;border:none;font-weight:500;animation:slideInRight 0.3s ease-out;cursor:pointer;';
    
    const icons = {
        success: '<i class="bi bi-check-circle-fill me-2"></i>',
        error: '<i class="bi bi-exclamation-triangle-fill me-2"></i>',
        warning: '<i class="bi bi-exclamation-circle-fill me-2"></i>',
        info: '<i class="bi bi-info-circle-fill me-2"></i>'
    };
    
    toast.innerHTML = `${icons[type] || icons.info}${message}`;
    toastContainer.appendChild(toast);
    toast.addEventListener('click', () => toast.remove());
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

if (!document.getElementById('toastAnimations')) {
    const style = document.createElement('style');
    style.id = 'toastAnimations';
    style.textContent = `
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0;} to{transform:translateX(0);opacity:1;} }
        @keyframes slideOutRight { from{transform:translateX(0);opacity:1;} to{transform:translateX(100%);opacity:0;} }
    `;
    document.head.appendChild(style);
}

// ============================================
// 6. AUTENTICACIÓN CON ROLES
// ============================================

async function registerUser(email, password, role) {
    console.log("Registrando:", email, "Rol:", role);
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
    
    try {
        if (password.length < 6) throw new Error("Contraseña mínima 6 caracteres");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            rol: role,
            nombre: email.split('@')[0],
            telefono: "",
            foto: null,
            proveedor: "email",
            fechaRegistro: new Date(),
            ...(role === 'doctor' && {
                especialidad: "",
                pacientesAtendidos: 0,
                citasTotales: 0
            })
        });
        
        showMessage("Registro exitoso", "success");
        showToast(`Cuenta de ${role} creada exitosamente`, "success");
        
    } catch (error) {
        console.error("Error registro:", error);
        let mensaje = error.message;
        if (error.code === 'auth/email-already-in-use') mensaje = 'Este correo ya está registrado';
        showMessage("Error" + mensaje, "danger");
        showToast(mensaje, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Registrarse';
    }
}

async function loginUser(email, password) {
    console.log("Login:", email);
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando...';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("Bienvenido", "success");
        showToast("Sesión iniciada correctamente", "success");
    } catch (error) {
        console.error("Error login:", error);
        showMessage("Credenciales inválidas", "danger");
        showToast("Correo o contraseña incorrectos", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
    }
}

async function loginWithGoogle() {
    console.log("Google Login");
    
    btnGoogle.disabled = true;
    btnGoogle.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Conectando...';
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                nombre: user.displayName || user.email.split('@')[0],
                rol: "paciente",
                foto: user.photoURL,
                proveedor: "google",
                fechaRegistro: new Date()
            });
        }
        
        showMessage("Bienvenido con Google", "success");
        showToast(`Bienvenido, ${user.displayName?.split(' ')[0] || 'Usuario'}`, "success");
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            showMessage("error " + error.message, "danger");
            showToast(error.message, "error");
        }
    } finally {
        btnGoogle.disabled = false;
        btnGoogle.innerHTML = '<i class="bi bi-google me-2"></i>Continuar con Google';
    }
}

async function logoutUser() {
    if (unsubscribeAppointments) unsubscribeAppointments();
    await signOut(auth);
    showToast("Sesión cerrada", "info");
    window.location.reload();
}

// ============================================
// 7. CARGAR DOCTORES (Para el select de pacientes)
// ============================================

async function loadDoctors() {
    try {
        doctorSelect.innerHTML = '<option value="">Cargando...</option>';
        doctorSelect.disabled = true;
        
        const snapshot = await getDocs(collection(db, "doctors"));
        doctorsList = [];
        doctorSelect.innerHTML = '<option value="">Seleccione un doctor...</option>';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const nombre = data.nombre || data.name || 'Sin nombre';
            const especialidad = data.especialidad || data.specialty || 'General';
            const doctorId = data.userId || docSnap.id; // Guardamos el UID
            
            doctorsList.push({ id: docSnap.id, userId: doctorId, ...data });
            
            const option = document.createElement('option');
            option.value = doctorId; // El value es el UID, no el nombre
            option.textContent = `${nombre} - ${especialidad}`;
            option.setAttribute('data-nombre', nombre);
            doctorSelect.appendChild(option);
        });
        
        doctorSelect.disabled = false;
        doctorsStatus.textContent = `${snapshot.size} doctores disponibles`;
        console.log(` ${snapshot.size} doctores cargados`);
        
    } catch (error) {
        console.warn("⚠️ Error cargando doctores:", error.message);
        doctorSelect.innerHTML = '<option value="">No disponible</option>';
        doctorsStatus.textContent = "Sin doctores registrados";
    }
}

// ============================================
// 8. CITAS - CORREGIDO CON UID 
// ============================================

async function saveAppointment(doctorId, date, time, reason) {
    if (!currentUserUID) {
        showMessage("Debes iniciar sesión", "danger");
        return;
    }
    
    // ✅ Obtener el nombre del doctor seleccionado
    const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
    const doctorName = selectedOption.getAttribute('data-nombre') || 'Doctor';
    
    console.log("Guardando cita:", { doctorId, doctorName, date, time });
    
    saveAppointmentBtn.disabled = true;
    saveAppointmentBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    
    try {
        await addDoc(collection(db, "appointments"), {
            patientId: currentUserUID,
            patientEmail: auth.currentUser?.email,
            patientNombre: currentUserData?.nombre || auth.currentUser?.email?.split('@')[0],
            doctorId: doctorId,        //  UID del doctor (para consulta)
            doctor: doctorName,        //  Nombre del doctor (para mostrar)
            date: date,
            time: time,
            reason: reason,
            status: "pendiente",
            createdAt: new Date()
        });
        
        showMessage("✅ Cita agendada", "success");
        showToast("Cita agendada correctamente", "success");
        appointmentForm.reset();
    } catch (error) {
        console.error(" Error guardando cita:", error);
        showMessage("error " + error.message, "danger");
        showToast(error.message, "error");
    } finally {
        saveAppointmentBtn.disabled = false;
        saveAppointmentBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar Cita';
    }
}

//  FUNCIÓN PRINCIPAL - Decide qué citas cargar según el rol
function loadAppointmentsRealtime() {
    if (!currentUserUID) {
        appointmentsList.innerHTML = '<p class="text-muted text-center">Inicia sesión para ver citas</p>';
        return;
    }

    if (unsubscribeAppointments) unsubscribeAppointments();

    appointmentsList.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Cargando citas...</p>
        </div>
    `;

    // CONSULTA SEGÚN ROL
    if (currentUserRole === 'doctor') {
        appointmentsTitle.textContent = 'Citas de Mis Pacientes';
        loadDoctorAppointments();
    } else {
        appointmentsTitle.textContent = 'Mis Citas';
        loadPatientAppointments();
    }
}

//  Cargar citas para PACIENTES (por patientId)
function loadPatientAppointments() {
    console.log("👤 Cargando citas del paciente:", currentUserUID);
    
    const q = query(
        collection(db, "appointments"),
        where("patientId", "==", currentUserUID),
        orderBy("date", "asc")
    );

    unsubscribeAppointments = onSnapshot(q, 
        (snapshot) => {
            console.log(" Citas paciente:", snapshot.size);
            renderAppointments(snapshot, false);
        },
        (error) => {
            console.error(" Error paciente:", error);
            handleIndexError(error, 'patientId');
        }
    );
}

// ✅ Cargar citas para DOCTORES (por doctorId - UID) 🔥
function loadDoctorAppointments() {
    console.log("🩺 Cargando citas del doctor:", currentUserUID);
    
    // ✅ Usamos el UID del doctor (currentUserUID) para buscar citas
    const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", currentUserUID),
        orderBy("date", "asc")
    );

    unsubscribeAppointments = onSnapshot(q, 
        (snapshot) => {
            console.log(" Citas doctor cargadas:", snapshot.size);
            renderAppointments(snapshot, true);
        },
        (error) => {
            console.error(" Error doctor:", error.code, error.message);
            
            if (error.code === 'failed-precondition') {
                const link = error.message.match(/https:\/\/[^\s]+/);
                appointmentsList.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Índice necesario</strong><br>
                        <small>Firestore necesita un índice para: doctorId + date</small><br>
                        <a href="${link ? link[0] : '#'}" target="_blank" class="btn btn-sm btn-warning mt-2">
                            <i class="bi bi-link-45deg me-1"></i>Crear índice en Firebase
                        </a>
                    </div>
                `;
                
                // Fallback sin orderBy
                loadDoctorAppointmentsFallback();
            } else {
                appointmentsList.innerHTML = `
                    <div class="alert alert-danger">
                         Error: ${error.message}<br>
                        <button class="btn btn-sm btn-outline-danger mt-2" onclick="location.reload()">
                            🔄 Reintentar
                        </button>
                    </div>
                `;
            }
        }
    );
}

// ✅ Fallback para doctores (sin orderBy)
async function loadDoctorAppointmentsFallback() {
    try {
        console.log("Fallback: Cargando sin orderBy...");
        
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", currentUserUID)
        );
        
        const snapshot = await getDocs(q);
        console.log(" Fallback exitoso:", snapshot.size);
        renderAppointments(snapshot, true);
    } catch (error) {
        console.error(" Fallback falló:", error);
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <h4>Sin citas encontradas</h4>
                <p>Aún no tienes pacientes agendados</p>
            </div>
        `;
    }
}

// Renderizar citas (compartido)
function renderAppointments(snapshot, isDoctor) {
    if (snapshot.empty) {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <h4>Sin citas</h4>
                <p>${isDoctor ? 'Aún no tienes pacientes agendados' : 'Agenda tu primera cita'}</p>
            </div>
        `;
        citasCount.textContent = '0 citas';
        totalCitasEl.textContent = '0';
        pendingCitasEl.textContent = '0';
        return;
    }

    let html = '';
    let total = 0;
    let pending = 0;
    let patients = new Set();

    snapshot.forEach(docSnap => {
        const c = docSnap.data();
        total++;
        if (c.status === 'pendiente') pending++;
        if (c.patientEmail) patients.add(c.patientEmail);
        
        const statusClass = c.status === 'pendiente' ? 'pendiente' : c.status === 'confirmada' ? 'confirmada' : 'cancelada';
        const statusText = c.status.charAt(0).toUpperCase() + c.status.slice(1);
        const fecha = new Date(c.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

        html += `
            <div class="appointment-card ${statusClass} ${isDoctor ? 'doctor-view' : ''}">
                <div class="appointment-header">
                    <div>
                        <div class="appointment-doctor">${c.doctor}</div>
                        ${isDoctor && c.patientNombre ? `
                            <div class="appointment-patient">
                                <i class="bi bi-person me-1"></i>${c.patientNombre}
                            </div>
                        ` : ''}
                        <small class="appointment-specialty">Cita médica</small>
                    </div>
                    <span class="appointment-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="bi bi-calendar"></i>
                        <div>
                            <span class="detail-label">Fecha</span>
                            <span class="detail-value">${fecha}</span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-clock"></i>
                        <div>
                            <span class="detail-label">Hora</span>
                            <span class="detail-value">${c.time}</span>
                        </div>
                    </div>
                </div>
                <div class="appointment-reason">
                    <i class="bi bi-card-text me-2"></i>${c.reason}
                </div>
                ${c.status === 'pendiente' ? `
                <div class="appointment-actions">
                    <button class="btn btn-success btn-sm flex-grow-1" onclick="window.updateStatus('${docSnap.id}', 'confirmada')">
                        <i class="bi bi-check-circle me-1"></i>Confirmar
                    </button>
                    <button class="btn btn-outline-danger btn-sm flex-grow-1" onclick="window.cancelAppointment('${docSnap.id}')">
                        <i class="bi bi-x-circle me-1"></i>Cancelar
                    </button>
                </div>` : ''}
            </div>
        `;
    });

    appointmentsList.innerHTML = html;
    citasCount.textContent = `${total} ${total === 1 ? 'cita' : 'citas'}`;
    totalCitasEl.textContent = total;
    pendingCitasEl.textContent = pending;
    
    if (isDoctor && patientCountEl) {
        patientCountEl.textContent = patients.size;
    }
}

//  Manejar error de índice
function handleIndexError(error, field) {
    if (error.code === 'failed-precondition') {
        const link = error.message.match(/https:\/\/[^\s]+/);
        appointmentsList.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Índice necesario</strong><br>
                <small>Campo: ${field} + date</small><br>
                <a href="${link ? link[0] : '#'}" target="_blank" class="btn btn-sm btn-warning mt-2">
                    <i class="bi bi-link-45deg me-1"></i>Crear índice
                </a>
            </div>
        `;
    } else {
        appointmentsList.innerHTML = '<div class="alert alert-danger">Error al cargar citas</div>';
    }
}

// ============================================
// 9. PERFIL DE DOCTOR
// ============================================

async function saveDoctorProfile() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    
    const nombre = doctorNameInput.value.trim();
    const especialidad = doctorSpecialtyInput.value.trim();
    
    if (!nombre || !especialidad) {
        showMessage(" Completa todos los campos", "warning");
        return;
    }
    
    try {
        await updateDoc(doc(db, "users", currentUserUID), {
            nombre: nombre,
            especialidad: especialidad
        });
        
        // Agregar/actualizar en colección doctors
        await setDoc(doc(db, "doctors", currentUserUID), {
            nombre: nombre,
            especialidad: especialidad,
            activo: true,
            userId: currentUserUID, //  Importante: mismo UID
            email: auth.currentUser.email
        }, { merge: true });
        
        showMessage(" Perfil guardado", "success");
        showToast("Perfil profesional actualizado", "success");
        currentUserData.nombre = nombre;
        currentUserData.especialidad = especialidad;
        
        // Recargar doctores en el select
        await loadDoctors();
        
    } catch (error) {
        console.error("Error guardando perfil:", error);
        showMessage(" Error: " + error.message, "danger");
    }
}

// Funciones globales
window.updateStatus = async function(id, status) {
    try {
        await setDoc(doc(db, "appointments", id), { status, updatedAt: new Date() }, { merge: true });
        showMessage(` Cita ${status}`, "success");
        showToast(`Cita ${status}`, "success");
    } catch (error) {
        showMessage("Error", "danger");
    }
};

window.cancelAppointment = async function(id) {
    if (confirm("¿Cancelar esta cita?")) {
        await window.updateStatus(id, 'cancelada');
    }
};

// ============================================
// 10. AUTH STATE CON ROLES
// ============================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUID = user.uid;
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentUserData = userDoc.exists() ? userDoc.data() : {};
        currentUserRole = currentUserData.rol || 'paciente';
        
        console.log("👤 Usuario logueado:", {
            uid: currentUserUID,
            rol: currentUserRole,
            nombre: currentUserData.nombre
        });
        
        welcomeMessage.textContent = `Hola, ${currentUserData.nombre || user.email.split('@')[0]} 👋`;
        userEmailDisplay.textContent = user.email;
        userRole.textContent = currentUserRole.toUpperCase();
        navRole.textContent = currentUserRole.toUpperCase();
        navRole.classList.remove('d-none');
        
        if (currentUserRole === 'doctor') {
            patientFormSection.classList.add('d-none');
            doctorPanel.classList.remove('d-none');
            doctorStats.classList.remove('d-none');
            
            if (currentUserData.nombre) doctorNameInput.value = currentUserData.nombre;
            if (currentUserData.especialidad) doctorSpecialtyInput.value = currentUserData.especialidad;
        } else {
            patientFormSection.classList.remove('d-none');
            doctorPanel.classList.add('d-none');
            doctorStats.classList.add('d-none');
            await loadDoctors();
        }
        
        authSection.classList.add('d-none');
        welcomePanel.classList.remove('d-none');
        btnLogout.classList.remove('d-none');
        
        setTimeout(() => {
            loadAppointmentsRealtime();
        }, 300);
        
        showToast(`Bienvenido ${currentUserRole}`, "success");
        
    } else {
        currentUserUID = null;
        currentUserData = null;
        currentUserRole = 'paciente';
        
        if (unsubscribeAppointments) unsubscribeAppointments();
        
        welcomePanel.classList.add('d-none');
        authSection.classList.remove('d-none');
        btnLogout.classList.add('d-none');
        navRole.classList.add('d-none');
        if (authMessage) authMessage.classList.add('d-none');
    }
});

// ============================================
// 11. EVENT LISTENERS
// ============================================

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (isRegisterMode) {
        const selectedRole = document.querySelector('input[name="userRole"]:checked').value;
        registerUser(email, password, selectedRole);
    } else {
        loginUser(email, password);
    }
});

btnGoogle.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    formTitle.textContent = isRegisterMode ? 'Crear Cuenta' : 'Bienvenido';
    submitBtn.innerHTML = isRegisterMode ? '<i class="bi bi-person-plus me-2"></i>Registrarse' : '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
    toggleRegister.textContent = isRegisterMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    roleSelectContainer.classList.toggle('d-none', !isRegisterMode);
    if (authMessage) authMessage.classList.add('d-none');
});

appointmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const date = document.getElementById('appointmentDate').value;
    
    if (date < today) {
        showMessage(" No puedes agendar en el pasado", "warning");
        return;
    }
    
    const doctorId = doctorSelect.value;
    if (!doctorId) {
        showMessage(" Selecciona un doctor", "warning");
        return;
    }
    
    saveAppointment(
        doctorId,
        date,
        document.getElementById('appointmentTime').value,
        document.getElementById('appointmentReason').value.trim()
    );
});

doctorProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveDoctorProfile();
});

window.addEventListener('beforeunload', () => {
    if (unsubscribeAppointments) unsubscribeAppointments();
});

console.log("🚀 ========================================");
console.log("🚀 MediCare Pro v4.2 - UID FIX");
console.log("Roles: Doctor/Paciente");
console.log("Fix: doctorId en lugar de nombre");
console.log("🚀 ========================================");