/**
 * MEDICARE PRO - app.js v7.3
 * ✅ Sistema de Disponibilidad de Doctores
 * ✅ Validación de horarios en tiempo real
 * ✅ FIX: Botón confirmar no persiste
 * ✅ FIX: Permisos Firestore manejados
 * ✅ FIX: Fecha/Hora corregida
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

console.log("🔥 MediCare Pro v7.3 - Versión Final Verificada");

// ============================================
// 3. INICIALIZAR FIREBASE
// ============================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ============================================
// 4. EMAILJS (Opcional)
// ============================================
const EMAILJS_CONFIG = {
    serviceId: '',
    templatePatient: '',
    templateDoctor: '',
    publicKey: '',
    enabled: false
};

// ============================================
// 5. REFERENCIAS DOM
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
const doctorAvailabilityPanel = document.getElementById('doctorAvailabilityPanel');
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
const appointmentDateInput = document.getElementById('appointmentDate');
const appointmentTimeInput = document.getElementById('appointmentTime');
const appointmentReasonInput = document.getElementById('appointmentReason');
const dateWarning = document.getElementById('dateWarning');
const timeWarning = document.getElementById('timeWarning');

// Variables globales
let currentUserUID = null;
let currentUserData = null;
let currentUserRole = 'paciente';
let isRegisterMode = false;
let unsubscribeAppointments = null;
let doctorsList = [];
let calendarInstance = null;
let doctorAvailability = null;

// ============================================
// 6. SISTEMA DE MENSAJES
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
    toast.className = `alert alert-${type} shadow`;
    toast.style.cssText = 'min-width:280px;max-width:350px;padding:0.75rem 1rem;border-radius:12px;border:none;font-weight:500;animation:slideInRight 0.3s ease-out;cursor:pointer;font-size:0.9rem;';
    
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
// 7. AUTENTICACIÓN
// ============================================

async function registerUser(email, password, role) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
    
    try {
        if (password.length < 6) throw new Error("Contraseña mínima 6 caracteres");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            email: userCredential.user.email,
            rol: role,
            nombre: email.split('@')[0],
            telefono: "",
            proveedor: "email",
            fechaRegistro: new Date(),
            ...(role === 'doctor' && {
                especialidad: "",
                disponibilidad: getDefaultAvailability()
            })
        });
        
        showMessage("✅ Registro exitoso", "success");
        showToast("Cuenta creada exitosamente", "success");
        
    } catch (error) {
        console.error("❌ Error:", error);
        let mensaje = error.code === 'auth/email-already-in-use' ? 'Este correo ya está registrado' : error.message;
        showMessage("❌ " + mensaje, "danger");
        showToast(mensaje, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Registrarse';
    }
}

async function loginUser(email, password) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Iniciando...';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("✅ Bienvenido", "success");
        showToast("Sesión iniciada", "success");
    } catch (error) {
        console.error("❌ Error:", error);
        showMessage("❌ Credenciales inválidas", "danger");
        showToast("Correo o contraseña incorrectos", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
    }
}

async function loginWithGoogle() {
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
        
        showMessage("✅ Bienvenido", "success");
        showToast(`Bienvenido, ${user.displayName?.split(' ')[0] || 'Usuario'}`, "success");
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            showMessage("❌ " + error.message, "danger");
            showToast(error.message, "error");
        }
    } finally {
        btnGoogle.disabled = false;
        btnGoogle.innerHTML = '<i class="bi bi-google me-2"></i>Continuar con Google';
    }
}

async function logoutUser() {
    if (unsubscribeAppointments) unsubscribeAppointments();
    if (calendarInstance) {
        calendarInstance.destroy();
        calendarInstance = null;
    }
    await signOut(auth);
    showToast("Sesión cerrada", "info");
    window.location.reload();
}

// ============================================
// 8. DISPONIBILIDAD DE DOCTORES
// ============================================

function getDefaultAvailability() {
    return {
        domingo: { enabled: false, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        lunes: { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        martes: { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        miércoles: { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        jueves: { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        viernes: { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        sábado: { enabled: false, startTime: '09:00', endTime: '18:00', slotDuration: 30 },
        blockedDates: []
    };
}

function generateTimeSlots(startTime, endTime, slotDuration) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    
    while (current + slotDuration <= end) {
        const hours = Math.floor(current / 60);
        const mins = current % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
        current += slotDuration;
    }
    
    return slots;
}

async function loadDoctorAvailability(doctorId) {
    const fallback = getDefaultAvailability();
    
    try {
        if (!doctorId) {
            console.warn("⚠️ No hay doctorId");
            doctorAvailability = fallback;
            return fallback;
        }
        
        const userDoc = await getDoc(doc(db, "users", doctorId));
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            doctorAvailability = data.disponibilidad || fallback;
            doctorAvailability.blockedDates = data.blockedDates || [];
            console.log("✅ Disponibilidad cargada");
            return doctorAvailability;
        } else {
            console.warn("⚠️ Documento del doctor no existe");
            doctorAvailability = fallback;
            return fallback;
        }
        
    } catch (error) {
        console.error("❌ Error cargando disponibilidad:", error.code, error.message);
        doctorAvailability = fallback;
        return fallback;
    }
}

async function saveDoctorAvailability() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    
    try {
        await updateDoc(doc(db, "users", currentUserUID), {
            disponibilidad: doctorAvailability
        });
        
        Swal.fire('✅ Guardado', 'Disponibilidad actualizada', 'success');
        showToast("Disponibilidad guardada", "success");
        
    } catch (error) {
        console.error("❌ Error guardando:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
}

function renderAvailabilityView() {
    const container = document.getElementById('availabilityDaysContainer');
    if (!container) return;
    
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    const days = [
        { key: 'domingo', name: 'Domingo', icon: '☀️' },
        { key: 'lunes', name: 'Lunes', icon: '🌙' },
        { key: 'martes', name: 'Martes', icon: '🌙' },
        { key: 'miércoles', name: 'Miércoles', icon: '🌙' },
        { key: 'jueves', name: 'Jueves', icon: '🌙' },
        { key: 'viernes', name: 'Viernes', icon: '🌙' },
        { key: 'sábado', name: 'Sábado', icon: '☀️' }
    ];
    
    let html = '';
    days.forEach(day => {
        const config = doctorAvailability[day.key] || { enabled: false, startTime: '09:00', endTime: '18:00' };
        const isEnabled = config.enabled || false;
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="availability-day-card ${isEnabled ? '' : 'disabled'}">
                    <div class="availability-day-header">
                        <div class="availability-day-name">
                            <span>${day.icon}</span>
                            <span>${day.name}</span>
                        </div>
                        <div class="availability-day-toggle ${isEnabled ? 'active' : ''}" 
                             onclick="window.toggleDayAvailability('${day.key}')">
                        </div>
                    </div>
                    ${isEnabled ? `
                    <div class="availability-time-inputs">
                        <input type="time" value="${config.startTime || '09:00'}" 
                               onchange="window.updateDayTime('${day.key}', 'startTime', this.value)">
                        <span>a</span>
                        <input type="time" value="${config.endTime || '18:00'}" 
                               onchange="window.updateDayTime('${day.key}', 'endTime', this.value)">
                    </div>
                    ` : '<small class="text-muted">No disponible</small>'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    renderBlockedDates();
}

function renderAvailabilityEditor() {
    const container = document.getElementById('availabilityEditorContainer');
    if (!container) return;
    
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    const days = [
        { key: 'domingo', name: 'Domingo', icon: '☀️' },
        { key: 'lunes', name: 'Lunes', icon: '🌙' },
        { key: 'martes', name: 'Martes', icon: '🌙' },
        { key: 'miércoles', name: 'Miércoles', icon: '🌙' },
        { key: 'jueves', name: 'Jueves', icon: '🌙' },
        { key: 'viernes', name: 'Viernes', icon: '🌙' },
        { key: 'sábado', name: 'Sábado', icon: '☀️' }
    ];
    
    let html = '';
    days.forEach(day => {
        const config = doctorAvailability[day.key] || { enabled: false, startTime: '09:00', endTime: '18:00' };
        const isEnabled = config.enabled || false;
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="availability-day-card ${isEnabled ? '' : 'disabled'}">
                    <div class="availability-day-header">
                        <div class="availability-day-name">
                            <span>${day.icon}</span>
                            <span>${day.name}</span>
                        </div>
                        <div class="availability-day-toggle ${isEnabled ? 'active' : ''}" 
                             onclick="window.toggleDayAvailability('${day.key}')">
                        </div>
                    </div>
                    ${isEnabled ? `
                    <div class="availability-time-inputs">
                        <input type="time" value="${config.startTime || '09:00'}" 
                               onchange="window.updateDayTime('${day.key}', 'startTime', this.value)">
                        <span>a</span>
                        <input type="time" value="${config.endTime || '18:00'}" 
                               onchange="window.updateDayTime('${day.key}', 'endTime', this.value)">
                    </div>
                    ` : '<small class="text-muted">No disponible</small>'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    renderBlockedDatesEditor();
}

function renderBlockedDates() {
    const container = document.getElementById('blockedDatesContainer');
    if (!container) return;
    
    if (!doctorAvailability?.blockedDates || doctorAvailability.blockedDates.length === 0) {
        container.innerHTML = '<small class="text-muted">Sin fechas bloqueadas</small>';
        return;
    }
    
    let html = '';
    doctorAvailability.blockedDates.forEach(date => {
        html += `
            <div class="blocked-date-badge">
                <i class="bi bi-calendar-x"></i>
                <span>${date}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderBlockedDatesEditor() {
    const container = document.getElementById('blockedDatesEditor');
    if (!container) return;
    
    if (!doctorAvailability?.blockedDates || doctorAvailability.blockedDates.length === 0) {
        container.innerHTML = '<small class="text-muted">Sin fechas bloqueadas</small>';
        return;
    }
    
    let html = '';
    doctorAvailability.blockedDates.forEach((date, index) => {
        html += `
            <div class="blocked-date-badge">
                <i class="bi bi-calendar-x"></i>
                <span>${date}</span>
                <button onclick="window.unblockDate(${index})">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

window.toggleDayAvailability = function(dayKey) {
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    if (!doctorAvailability[dayKey]) {
        doctorAvailability[dayKey] = { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 };
    } else {
        doctorAvailability[dayKey].enabled = !doctorAvailability[dayKey].enabled;
    }
    
    if (document.getElementById('availabilityEditor').classList.contains('d-none')) {
        renderAvailabilityView();
    } else {
        renderAvailabilityEditor();
    }
};

window.updateDayTime = function(dayKey, field, value) {
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    if (!doctorAvailability[dayKey]) {
        doctorAvailability[dayKey] = { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 };
    }
    doctorAvailability[dayKey][field] = value;
};

window.toggleAvailabilityEditor = function() {
    const view = document.getElementById('availabilityView');
    const editor = document.getElementById('availabilityEditor');
    
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    if (editor.classList.contains('d-none')) {
        renderAvailabilityEditor();
        editor.classList.remove('d-none');
        view.classList.add('d-none');
    } else {
        editor.classList.add('d-none');
        view.classList.remove('d-none');
        renderAvailabilityView();
    }
};

window.saveAvailability = async function() {
    await saveDoctorAvailability();
    window.toggleAvailabilityEditor();
};

window.blockDate = function() {
    const dateInput = document.getElementById('blockDateInput');
    const date = dateInput?.value;
    
    if (!date) {
        Swal.fire('⚠️ Fecha requerida', 'Selecciona una fecha para bloquear', 'warning');
        return;
    }
    
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    if (!doctorAvailability.blockedDates) {
        doctorAvailability.blockedDates = [];
    }
    
    if (!doctorAvailability.blockedDates.includes(date)) {
        doctorAvailability.blockedDates.push(date);
        doctorAvailability.blockedDates.sort();
        renderBlockedDatesEditor();
        if (dateInput) dateInput.value = '';
        showToast("Fecha bloqueada", "success");
    } else {
        Swal.fire('ℹ️ Ya bloqueada', 'Esta fecha ya está bloqueada', 'info');
    }
};

window.unblockDate = function(index) {
    if (doctorAvailability?.blockedDates && doctorAvailability.blockedDates[index]) {
        doctorAvailability.blockedDates.splice(index, 1);
        renderBlockedDatesEditor();
        showToast("Fecha desbloqueada", "success");
    }
};

window.isDoctorAvailable = function(date, time) {
    if (!doctorAvailability) return false;
    
    const dateObj = new Date(date + 'T12:00:00');
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = days[dateObj.getDay()];
    
    const dayConfig = doctorAvailability[dayName];
    if (!dayConfig || !dayConfig.enabled) return false;
    
    if (doctorAvailability.blockedDates?.includes(date)) return false;
    
    const [hour, min] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + min;
    
    const [startHour, startMin] = dayConfig.startTime.split(':').map(Number);
    const [endHour, endMin] = dayConfig.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return timeMinutes >= startMinutes && timeMinutes + (dayConfig.slotDuration || 30) <= endMinutes;
};

// ============================================
// 9. CARGAR HORARIOS DISPONIBLES
// ============================================

window.loadAvailableSlots = async function() {
    const doctorId = doctorSelect?.value;
    const date = appointmentDateInput?.value;
    const timeSelect = appointmentTimeInput;
    
    console.log("🔍 loadAvailableSlots:", { doctorId, date });
    
    if (dateWarning) dateWarning.classList.add('d-none');
    if (timeWarning) timeWarning.classList.add('d-none');
    
    if (!timeSelect) {
        console.error("❌ No se encontró appointmentTimeInput");
        return;
    }
    
    if (!doctorId) {
        timeSelect.innerHTML = '<option value="">Primero selecciona un doctor</option>';
        timeSelect.disabled = true;
        return;
    }
    
    if (!date) {
        timeSelect.innerHTML = '<option value="">Ahora selecciona una fecha</option>';
        timeSelect.disabled = true;
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        timeSelect.innerHTML = '<option value="">No puedes seleccionar fechas pasadas</option>';
        timeSelect.disabled = true;
        if (dateWarning) {
            dateWarning.classList.remove('d-none');
            dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Selecciona una fecha futura';
        }
        return;
    }
    
    await loadDoctorAvailability(doctorId);
    
    if (!doctorAvailability) {
        doctorAvailability = getDefaultAvailability();
    }
    
    const dateObj = new Date(date + 'T12:00:00');
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = days[dateObj.getDay()];
    
    console.log("📅 Día seleccionado:", dayName);
    
    const dayConfig = doctorAvailability[dayName];
    
    if (!dayConfig) {
        timeSelect.innerHTML = '<option value="">Horario no disponible</option>';
        timeSelect.disabled = true;
        if (dateWarning) {
            dateWarning.classList.remove('d-none');
            dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>El doctor no tiene horarios configurados';
        }
        return;
    }
    
    if (!dayConfig.enabled) {
        timeSelect.innerHTML = `<option value="">El doctor no atiende los ${dayName}</option>`;
        timeSelect.disabled = true;
        if (dateWarning) {
            dateWarning.classList.remove('d-none');
            dateWarning.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>El doctor no está disponible este día`;
        }
        return;
    }
    
    if (doctorAvailability.blockedDates?.includes(date)) {
        timeSelect.innerHTML = '<option value="">Fecha no disponible (bloqueada)</option>';
        timeSelect.disabled = true;
        if (dateWarning) {
            dateWarning.classList.remove('d-none');
            dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Esta fecha está bloqueada por el doctor';
        }
        return;
    }
    
    const slots = generateTimeSlots(dayConfig.startTime, dayConfig.endTime, dayConfig.slotDuration || 30);
    const bookedTimes = await getBookedTimes(doctorId, date);
    
    console.log("🕐 Slots:", slots.length, "| Ocupados:", bookedTimes.length);
    
    timeSelect.innerHTML = '<option value="">Selecciona un horario disponible</option>';
    
    let availableCount = 0;
    
    slots.forEach(slot => {
        const isBooked = bookedTimes.includes(slot);
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot + (isBooked ? ' (ocupado)' : '');
        option.disabled = isBooked;
        
        if (!isBooked) availableCount++;
        
        timeSelect.appendChild(option);
    });
    
    if (availableCount === 0) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles para esta fecha</option>';
        timeSelect.disabled = true;
        if (dateWarning) {
            dateWarning.classList.remove('d-none');
            dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>No hay horarios disponibles. Intenta otra fecha';
        }
    } else {
        timeSelect.disabled = false;
        if (dateWarning) dateWarning.classList.add('d-none');
    }
};

async function getBookedTimes(doctorId, date) {
    try {
        console.log("🔍 Buscando citas ocupadas:", { doctorId, date });
        
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId),
            where("date", "==", date)
        );
        
        const snapshot = await getDocs(q);
        const bookedTimes = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.time && (data.status === 'pendiente' || data.status === 'confirmada')) {
                bookedTimes.push(data.time);
            }
        });
        
        console.log("✅ Horarios ocupados:", bookedTimes);
        return bookedTimes;
    } catch (error) {
        console.error("❌ Error obteniendo horarios:", error);
        return [];
    }
}

// ============================================
// 10. CARGAR DOCTORES
// ============================================

async function loadDoctors() {
    try {
        if (!doctorSelect) return;
        
        doctorSelect.innerHTML = '<option value="">Cargando...</option>';
        doctorSelect.disabled = true;
        
        const snapshot = await getDocs(collection(db, "doctors"));
        doctorsList = [];
        doctorSelect.innerHTML = '<option value="">Seleccione un doctor...</option>';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const nombre = data.nombre || 'Sin nombre';
            const especialidad = data.especialidad || 'General';
            const doctorId = data.userId || docSnap.id;
            
            doctorsList.push({ id: docSnap.id, userId: doctorId, ...data });
            
            const option = document.createElement('option');
            option.value = doctorId;
            option.textContent = `${nombre} - ${especialidad}`;
            option.setAttribute('data-nombre', nombre);
            doctorSelect.appendChild(option);
        });
        
        doctorSelect.disabled = false;
        if (doctorsStatus) doctorsStatus.textContent = `${snapshot.size} doctores disponibles`;
        
    } catch (error) {
        console.warn("⚠️ Error doctores:", error);
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">No disponible</option>';
            doctorSelect.disabled = false;
        }
        if (doctorsStatus) doctorsStatus.textContent = "Sin doctores";
    }
}

// ============================================
// 11. GUARDAR CITA
// ============================================

async function saveAppointment(doctorId, date, time, reason) {
    if (!currentUserUID) {
        showMessage("❌ Debes iniciar sesión", "danger");
        return;
    }
    
    await loadDoctorAvailability(doctorId);
    
    if (!window.isDoctorAvailable(date, time)) {
        Swal.fire({
            icon: 'error',
            title: '⚠️ Horario no disponible',
            text: 'El doctor no está disponible en este horario. Por favor selecciona otro.',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    const bookedTimes = await getBookedTimes(doctorId, date);
    if (bookedTimes.includes(time)) {
        Swal.fire({
            icon: 'error',
            title: '⚠️ Horario ocupado',
            text: 'Este horario acaba de ser reservado. Por favor selecciona otro.',
            confirmButtonText: 'Entendido'
        });
        await window.loadAvailableSlots();
        return;
    }
    
    const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
    const doctorName = selectedOption.getAttribute('data-nombre') || 'Doctor';
    
    saveAppointmentBtn.disabled = true;
    saveAppointmentBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    
    try {
        await addDoc(collection(db, "appointments"), {
            patientId: currentUserUID,
            patientEmail: auth.currentUser?.email,
            patientNombre: currentUserData?.nombre || auth.currentUser?.email?.split('@')[0],
            doctorId: doctorId,
            doctor: doctorName,
            date: date,
            time: time,
            reason: reason,
            status: "pendiente",
            createdAt: new Date()
        });
        
        showMessage("✅ Cita agendada", "success");
        showToast("Cita agendada exitosamente", "success");
        if (appointmentForm) appointmentForm.reset();
        
    } catch (error) {
        console.error("❌ Error:", error);
        showMessage("❌ " + error.message, "danger");
        showToast(error.message, "error");
    } finally {
        saveAppointmentBtn.disabled = false;
        saveAppointmentBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar Cita';
    }
}

// ============================================
// 12. CALENDARIO
// ============================================

function initCalendar() {
    const calendarEl = document.getElementById('calendarContainer');
    if (!calendarEl) return;
    if (calendarInstance) calendarInstance.destroy();
    
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' },
        firstDay: 1,
        height: 'auto',
        eventDisplay: 'block',
        eventClick: handleEventClick,
        noEventsText: 'Sin citas',
        dayMaxEvents: 2,
        contentHeight: 280
    });
    
    calendarInstance.render();
    console.log("✅ Calendario inicializado");
}

function updateCalendarEvents(appointments) {
    if (!calendarInstance) {
        setTimeout(() => updateCalendarEvents(appointments), 500);
        return;
    }
    calendarInstance.removeAllEvents();
    if (!appointments || appointments.length === 0) return;
    
    appointments.forEach(cita => {
        try {
            const startDate = new Date(`${cita.date}T${cita.time}:00`);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            
            let colorClass = 'fc-event-status-pendiente';
            if (cita.status === 'confirmada') colorClass = 'fc-event-status-confirmada';
            if (cita.status === 'cancelada') colorClass = 'fc-event-status-cancelada';
            if (cita.status === 'completada') colorClass = 'fc-event-status-completada';
            
            calendarInstance.addEvent({
                id: cita.id,
                title: cita.doctor,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                className: colorClass,
                extendedProps: {
                    status: cita.status,
                    reason: cita.reason,
                    patient: cita.patientNombre || 'Paciente',
                    doctor: cita.doctor,
                    time: cita.time
                }
            });
        } catch (error) {
            console.error("❌ Error evento:", error);
        }
    });
}

function handleEventClick(info) {
    const event = info.event;
    const props = event.extendedProps;
    const statusIcons = { pendiente: '⏳', confirmada: '✅', cancelada: '❌', completada: '✔️' };
    const statusColors = { pendiente: 'warning', confirmada: 'success', cancelada: 'danger', completada: 'info' };
    
    Swal.fire({
        title: `${statusIcons[props.status]} ${event.title}`,
        html: `
            <div class="text-start">
                <p><strong>📅 Fecha:</strong> ${event.start.toLocaleDateString('es-MX')}</p>
                <p><strong>⏰ Hora:</strong> ${props.time}</p>
                <p><strong>👨‍⚕️ Doctor:</strong> ${props.doctor}</p>
                ${props.patient ? `<p><strong>👤 Paciente:</strong> ${props.patient}</p>` : ''}
                <p><strong>📝 Motivo:</strong> ${props.reason}</p>
                <span class="badge bg-${statusColors[props.status]}">${props.status.toUpperCase()}</span>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#6366f1'
    });
}

function setupCalendarButtons() {
    const monthBtn = document.getElementById('calendarMonthView');
    const weekBtn = document.getElementById('calendarWeekView');
    const listBtn = document.getElementById('calendarListView');
    if (monthBtn) monthBtn.addEventListener('click', () => calendarInstance?.changeView('dayGridMonth'));
    if (weekBtn) weekBtn.addEventListener('click', () => calendarInstance?.changeView('timeGridWeek'));
    if (listBtn) listBtn.addEventListener('click', () => calendarInstance?.changeView('listMonth'));
}

// ============================================
// 13. CARGAR CITAS
// ============================================

function loadAppointmentsRealtime() {
    if (!currentUserUID) {
        if (appointmentsList) appointmentsList.innerHTML = '<p class="text-muted text-center">Inicia sesión para ver citas</p>';
        return;
    }
    if (unsubscribeAppointments) unsubscribeAppointments();
    if (appointmentsList) {
        appointmentsList.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Cargando...</p>
            </div>
        `;
    }
    if (currentUserRole === 'doctor') {
        if (appointmentsTitle) appointmentsTitle.textContent = 'Citas de Mis Pacientes';
        loadDoctorAppointments();
    } else {
        if (appointmentsTitle) appointmentsTitle.textContent = 'Mis Citas';
        loadPatientAppointments();
    }
}

function loadPatientAppointments() {
    const q = query(collection(db, "appointments"), where("patientId", "==", currentUserUID), orderBy("date", "asc"));
    unsubscribeAppointments = onSnapshot(q, 
        (snapshot) => {
            console.log("✅ Citas:", snapshot.size);
            renderAppointments(snapshot, false);
        },
        (error) => {
            console.error("❌ Error:", error);
            handleIndexError(error, 'patientId');
        }
    );
}

function loadDoctorAppointments() {
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentUserUID), orderBy("date", "asc"));
    unsubscribeAppointments = onSnapshot(q, 
        (snapshot) => {
            console.log("✅ Citas doctor:", snapshot.size);
            renderAppointments(snapshot, true);
        },
        (error) => {
            if (error.code === 'failed-precondition') {
                const link = error.message.match(/https:\/\/[^\s]+/);
                if (appointmentsList) {
                    appointmentsList.innerHTML = `<div class="alert alert-warning">⚠️ Índice necesario<br><a href="${link ? link[0] : '#'}" target="_blank">Crear índice</a></div>`;
                }
                loadDoctorAppointmentsFallback();
            } else {
                if (appointmentsList) {
                    appointmentsList.innerHTML = `<div class="alert alert-danger">❌ Error: ${error.message}</div>`;
                }
            }
        }
    );
}

async function loadDoctorAppointmentsFallback() {
    try {
        const snapshot = await getDocs(query(collection(db, "appointments"), where("doctorId", "==", currentUserUID)));
        renderAppointments(snapshot, true);
    } catch (error) {
        if (appointmentsList) {
            appointmentsList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><h4>Sin citas</h4></div>`;
        }
    }
}

function renderAppointments(snapshot, isDoctor) {
    if (snapshot.empty) {
        if (appointmentsList) {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <h4>Sin citas</h4>
                    <p>${isDoctor ? 'Aún no tienes pacientes' : 'Agenda tu primera cita'}</p>
                </div>
            `;
        }
        if (citasCount) citasCount.textContent = '0 citas';
        if (totalCitasEl) totalCitasEl.textContent = '0';
        if (pendingCitasEl) pendingCitasEl.textContent = '0';
        updateCalendarEvents([]);
        return;
    }

    let html = '';
    let total = 0;
    let pending = 0;
    let patients = new Set();
    const appointmentsArray = [];

    snapshot.forEach(docSnap => {
        const c = docSnap.data();
        total++;
        if (c.status === 'pendiente') pending++;
        if (c.patientEmail) patients.add(c.patientEmail);
        appointmentsArray.push({ id: docSnap.id, ...c });
        
        const statusClass = c.status;
        const statusText = c.status.charAt(0).toUpperCase() + c.status.slice(1);
        const fecha = new Date(c.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

        html += `
            <div class="appointment-card ${statusClass} ${isDoctor ? 'doctor-view' : ''}">
                <div class="appointment-header">
                    <div>
                        <div class="appointment-doctor">${c.doctor}</div>
                        ${isDoctor && c.patientNombre ? `<div class="appointment-patient"><i class="bi bi-person me-1"></i>${c.patientNombre}</div>` : ''}
                        <small class="appointment-specialty">Cita médica</small>
                    </div>
                    <span class="appointment-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="bi bi-calendar"></i>
                        <div><span class="detail-label">Fecha</span><span class="detail-value">${fecha}</span></div>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-clock"></i>
                        <div><span class="detail-label">Hora</span><span class="detail-value">${c.time}</span></div>
                    </div>
                </div>
                <div class="appointment-reason">
                    <i class="bi bi-card-text me-2"></i>${c.reason}
                </div>
                ${renderActionButtons(c, isDoctor, docSnap.id)}
            </div>
        `;
    });

    if (appointmentsList) appointmentsList.innerHTML = html;
    if (citasCount) citasCount.textContent = `${total} ${total === 1 ? 'cita' : 'citas'}`;
    if (totalCitasEl) totalCitasEl.textContent = total;
    if (pendingCitasEl) pendingCitasEl.textContent = pending;
    if (isDoctor && patientCountEl) patientCountEl.textContent = patients.size;
    updateCalendarEvents(appointmentsArray);
}

// ✅ FUNCIÓN CORREGIDA - Botones por estado
function renderActionButtons(cita, isDoctor, citaId) {
    const status = cita.status;
    
    // ✅ COMPLETADA O CANCELADA = SIN BOTONES
    if (status === 'completada' || status === 'cancelada') {
        return '';
    }
    
    // ✅ PENDIENTE = Confirmar (doctor) + Editar + Cancelar
    if (status === 'pendiente') {
        return `
            <div class="appointment-actions">
                ${isDoctor ? `
                <button class="btn btn-success btn-sm flex-grow-1" 
                        onclick="window.updateStatus('${citaId}', 'confirmada')"
                        title="Confirmar esta cita">
                    <i class="bi bi-check-circle me-1"></i>Confirmar
                </button>` : ''}
                <button class="btn btn-outline-primary btn-sm flex-grow-1" 
                        onclick="window.editAppointment('${citaId}')"
                        title="Editar cita">
                    <i class="bi bi-pencil me-1"></i>Editar
                </button>
                <button class="btn btn-outline-danger btn-sm flex-grow-1" 
                        onclick="window.cancelAppointment('${citaId}')"
                        title="Cancelar cita">
                    <i class="bi bi-x-circle me-1"></i>Cancelar
                </button>
            </div>
        `;
    }
    
    // ✅ CONFIRMADA = Completar (doctor) + Reprogramar + Cancelar (NO mostrar Confirmar)
    if (status === 'confirmada') {
        return `
            <div class="appointment-actions">
                ${isDoctor ? `
                <button class="btn btn-info btn-sm flex-grow-1" 
                        onclick="window.completeAppointment('${citaId}')"
                        title="Marcar como completada">
                    <i class="bi bi-check-all me-1"></i>Completar
                </button>` : ''}
                <button class="btn btn-outline-primary btn-sm flex-grow-1" 
                        onclick="window.editAppointment('${citaId}')"
                        title="Reprogramar cita">
                    <i class="bi bi-pencil me-1"></i>Reprogramar
                </button>
                <button class="btn btn-outline-danger btn-sm flex-grow-1" 
                        onclick="window.cancelAppointment('${citaId}')"
                        title="Cancelar cita">
                    <i class="bi bi-x-circle me-1"></i>Cancelar
                </button>
            </div>
        `;
    }
    
    return '';
}

function handleIndexError(error, field) {
    if (appointmentsList) {
        if (error.code === 'failed-precondition') {
            const link = error.message.match(/https:\/\/[^\s]+/);
            appointmentsList.innerHTML = `<div class="alert alert-warning">⚠️ Índice necesario<br><a href="${link ? link[0] : '#'}" target="_blank">Crear índice</a></div>`;
        } else {
            appointmentsList.innerHTML = '<div class="alert alert-danger">Error al cargar</div>';
        }
    }
}

// ============================================
// 14. ADMINISTRACIÓN DE CITAS
// ============================================

window.editAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) {
            Swal.fire('❌ Error', 'Cita no encontrada', 'error');
            return;
        }
        const appointment = appointmentDoc.data();
        const canEdit = currentUserRole === 'admin' ||
            (currentUserRole === 'paciente' && appointment.patientId === currentUserUID) ||
            (currentUserRole === 'doctor' && appointment.doctorId === currentUserUID);
        if (!canEdit) {
            Swal.fire('❌ Permiso denegado', 'No puedes editar esta cita', 'error');
            return;
        }
        const { value: formValues } = await Swal.fire({
            title: '✏️ Reprogramar Cita',
            html: `
                <div class="text-start">
                    <label class="form-label">📅 Nueva Fecha</label>
                    <input type="date" id="editDate" class="form-control" value="${appointment.date}">
                    <label class="form-label mt-2">⏰ Nueva Hora</label>
                    <input type="time" id="editTime" class="form-control" value="${appointment.time}">
                    <label class="form-label mt-2">📝 Motivo</label>
                    <textarea id="editReason" class="form-control" rows="2">${appointment.reason}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#6b7280',
            preConfirm: () => {
                const date = document.getElementById('editDate').value;
                const time = document.getElementById('editTime').value;
                const reason = document.getElementById('editReason').value;
                if (!date || !time) { Swal.showValidationMessage('Fecha y hora requeridas'); return false; }
                const today = new Date().toISOString().split('T')[0];
                if (date < today) { Swal.showValidationMessage('No puedes programar en el pasado'); return false; }
                return { date, time, reason };
            }
        });
        if (formValues) {
            await updateDoc(doc(db, "appointments", appointmentId), {
                date: formValues.date, time: formValues.time, reason: formValues.reason,
                status: 'pendiente', updatedAt: new Date()
            });
            Swal.fire('✅ Reprogramada', 'La cita fue actualizada', 'success');
            showToast("Cita reprogramada", "success");
        }
    } catch (error) {
        console.error("❌ Error editando:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
};

// ✅ CORREGIDO - Verificar estado antes de completar
window.completeAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) {
            Swal.fire('❌ Error', 'Cita no encontrada', 'error');
            return;
        }
        const appointment = appointmentDoc.data();
        
        // ✅ VERIFICAR SI YA ESTÁ COMPLETADA
        if (appointment.status === 'completada') {
            Swal.fire('ℹ️ Ya completada', 'Esta cita ya fue completada', 'info');
            return;
        }
        
        if (currentUserRole !== 'doctor' || appointment.doctorId !== currentUserUID) {
            Swal.fire('❌ Permiso denegado', 'Solo el doctor puede completar', 'error');
            return;
        }
        const confirm = await Swal.fire({
            title: '✔️ ¿Completar Cita?',
            text: `Cita con ${appointment.patientNombre || 'Paciente'}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, completar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981'
        });
        if (confirm.isConfirmed) {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: 'completada', completedAt: new Date()
            });
            Swal.fire('✅ Completada', 'La cita fue completada', 'success');
            showToast("Cita completada", "success");
        }
    } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
};

window.cancelAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) {
            Swal.fire('❌ Error', 'Cita no encontrada', 'error');
            return;
        }
        const appointment = appointmentDoc.data();
        const canCancel = currentUserRole === 'admin' ||
            (currentUserRole === 'paciente' && appointment.patientId === currentUserUID) ||
            (currentUserRole === 'doctor' && appointment.doctorId === currentUserUID);
        if (!canCancel) {
            Swal.fire('❌ Permiso denegado', 'No puedes cancelar esta cita', 'error');
            return;
        }
        const confirm = await Swal.fire({
            title: '❌ ¿Cancelar Cita?',
            text: `Cita con ${appointment.doctor} el ${appointment.date}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            confirmButtonColor: '#dc3545'
        });
        if (confirm.isConfirmed) {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: 'cancelada', cancelledAt: new Date(), cancelledBy: currentUserUID
            });
            Swal.fire('✅ Cancelada', 'La cita fue cancelada', 'success');
            showToast("Cita cancelada", "success");
        }
    } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
};

// ✅ CORREGIDO - Prevenir confirmar cita ya confirmada
window.updateStatus = async function(id, status) {
    try {
        // ✅ VERIFICAR ESTADO ACTUAL
        const appointmentDoc = await getDoc(doc(db, "appointments", id));
        
        if (!appointmentDoc.exists()) {
            Swal.fire('❌ Error', 'Cita no encontrada', 'error');
            return;
        }
        
        const currentStatus = appointmentDoc.data().status;
        
        // ✅ PREVENIR CONFIRMAR SI YA ESTÁ CONFIRMADA
        if (currentStatus === 'confirmada' && status === 'confirmada') {
            Swal.fire('ℹ️ Ya confirmada', 'Esta cita ya fue confirmada', 'info');
            return;
        }
        
        // ✅ PREVENIR CONFIRMAR SI YA ESTÁ COMPLETADA
        if (currentStatus === 'completada') {
            Swal.fire('ℹ️ Ya completada', 'Esta cita ya fue completada', 'info');
            return;
        }
        
        await updateDoc(doc(db, "appointments", id), { 
            status: status, 
            updatedAt: new Date(),
            ...(status === 'confirmada' && { confirmedAt: new Date() }),
            ...(status === 'confirmada' && { confirmedBy: currentUserUID })
        });
        
        Swal.fire({
            icon: 'success',
            title: `✅ ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            text: 'Estado actualizado correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        
        showToast(`Cita ${status}`, "success");
        
    } catch (error) {
        console.error("❌ Error actualizando estado:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
};

// ============================================
// 15. PERFIL DOCTOR
// ============================================

async function saveDoctorProfile() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    const nombre = doctorNameInput.value.trim();
    const especialidad = doctorSpecialtyInput.value.trim();
    if (!nombre || !especialidad) {
        Swal.fire('⚠️ Campos vacíos', 'Completa nombre y especialidad', 'warning');
        return;
    }
    try {
        await updateDoc(doc(db, "users", currentUserUID), { nombre, especialidad });
        await setDoc(doc(db, "doctors", currentUserUID), {
            nombre, especialidad, activo: true, userId: currentUserUID
        }, { merge: true });
        Swal.fire('✅ Perfil guardado', '', 'success');
        showToast("Perfil actualizado", "success");
        currentUserData.nombre = nombre;
        currentUserData.especialidad = especialidad;
        await loadDoctors();
    } catch (error) {
        Swal.fire('❌ Error', error.message, 'error');
    }
}

// ============================================
// 16. AUTH STATE
// ============================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUID = user.uid;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentUserData = userDoc.exists() ? userDoc.data() : {};
        currentUserRole = currentUserData.rol || 'paciente';
        
        if (welcomeMessage) welcomeMessage.textContent = `Hola, ${currentUserData.nombre || user.email.split('@')[0]} 👋`;
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        if (userRole) userRole.textContent = currentUserRole.toUpperCase();
        if (navRole) { navRole.textContent = currentUserRole.toUpperCase(); navRole.classList.remove('d-none'); }
        
        if (currentUserRole === 'doctor') {
            if (patientFormSection) patientFormSection.classList.add('d-none');
            if (doctorPanel) doctorPanel.classList.remove('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.remove('d-none');
            if (doctorStats) doctorStats.classList.remove('d-none');
            if (doctorNameInput && currentUserData.nombre) doctorNameInput.value = currentUserData.nombre;
            if (doctorSpecialtyInput && currentUserData.especialidad) doctorSpecialtyInput.value = currentUserData.especialidad;
            
            doctorAvailability = currentUserData.disponibilidad || getDefaultAvailability();
            if (!doctorAvailability.blockedDates) doctorAvailability.blockedDates = [];
            renderAvailabilityView();
        } else {
            if (patientFormSection) patientFormSection.classList.remove('d-none');
            if (doctorPanel) doctorPanel.classList.add('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.add('d-none');
            if (doctorStats) doctorStats.classList.add('d-none');
            await loadDoctors();
        }
        
        if (authSection) authSection.classList.add('d-none');
        if (welcomePanel) welcomePanel.classList.remove('d-none');
        if (btnLogout) btnLogout.classList.remove('d-none');
        
        setTimeout(() => {
            loadAppointmentsRealtime();
            setTimeout(() => {
                initCalendar();
                setupCalendarButtons();
            }, 800);
        }, 300);
        
        showToast(`Bienvenido ${currentUserRole}`, "success");
    } else {
        currentUserUID = null;
        currentUserData = null;
        currentUserRole = 'paciente';
        doctorAvailability = null;
        if (unsubscribeAppointments) unsubscribeAppointments();
        if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; }
        if (welcomePanel) welcomePanel.classList.add('d-none');
        if (authSection) authSection.classList.remove('d-none');
        if (btnLogout) btnLogout.classList.add('d-none');
        if (navRole) navRole.classList.add('d-none');
        if (authMessage) authMessage.classList.add('d-none');
    }
});

// ============================================
// 17. EVENT LISTENERS
// ============================================

if (loginForm) loginForm.addEventListener('submit', (e) => {
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

if (btnGoogle) btnGoogle.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logoutUser);

if (toggleRegister) toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    if (formTitle) formTitle.textContent = isRegisterMode ? 'Crear Cuenta' : 'Bienvenido';
    if (submitBtn) submitBtn.innerHTML = isRegisterMode ? '<i class="bi bi-person-plus me-2"></i>Registrarse' : '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
    if (toggleRegister) toggleRegister.textContent = isRegisterMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    if (roleSelectContainer) roleSelectContainer.classList.toggle('d-none', !isRegisterMode);
    if (authMessage) authMessage.classList.add('d-none');
});

if (appointmentForm) appointmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const date = appointmentDateInput.value;
    if (date < today) {
        Swal.fire('⚠️ Fecha inválida', 'No puedes agendar en el pasado', 'warning');
        return;
    }
    const doctorId = doctorSelect.value;
    if (!doctorId) {
        Swal.fire('⚠️ Doctor requerido', 'Selecciona un doctor', 'warning');
        return;
    }
    const time = appointmentTimeInput.value;
    if (!time) {
        Swal.fire('⚠️ Hora requerida', 'Selecciona un horario disponible', 'warning');
        return;
    }
    const reason = appointmentReasonInput ? appointmentReasonInput.value.trim() : '';
    saveAppointment(doctorId, date, time, reason);
});

if (doctorProfileForm) doctorProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveDoctorProfile();
});

window.addEventListener('beforeunload', () => {
    if (unsubscribeAppointments) unsubscribeAppointments();
    if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; }
});

console.log("🚀 ========================================");
console.log("🚀 MediCare Pro v7.3 - FINAL VERIFICADA");
console.log("👥 Roles: Doctor/Paciente");
console.log("📅 Disponibilidad: Activada");
console.log("🕐 Fecha/Hora: Corregido");
console.log("✅ Botones: Estado correcto");
console.log("🚀 ========================================");