/**
 * MEDICARE PRO - app.js v9.0 FINAL
 * ✅ Historial Médico Completo
 * ✅ Notas médicas por cita
 * ✅ Dashboard con estadísticas
 * ✅ Disponibilidad de doctores
 * ✅ Todas las funciones integradas
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

console.log("🔥 MediCare Pro v9.0 - Historial Médico");

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
const btnDashboard = document.getElementById('btnDashboard');
const btnMedicalHistory = document.getElementById('btnMedicalHistory');
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
const dashboardPanel = document.getElementById('dashboardPanel');
const medicalHistoryPanel = document.getElementById('medicalHistoryPanel');
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
const pastAppointmentsList = document.getElementById('pastAppointmentsList');
const patientMedicalInfoForm = document.getElementById('patientMedicalInfoForm');
const bloodTypeInput = document.getElementById('bloodType');
const emergencyContactInput = document.getElementById('emergencyContact');
const allergiesInput = document.getElementById('allergies');
const medicalAntecedentsInput = document.getElementById('medicalAntecedents');

// Variables globales
let currentUserUID = null;
let currentUserData = null;
let currentUserRole = 'paciente';
let isRegisterMode = false;
let unsubscribeAppointments = null;
let doctorsList = [];
let calendarInstance = null;
let doctorAvailability = null;
let appointmentsChart = null;
let statusChart = null;
let allAppointments = [];
let patientMedicalInfo = {};

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
    style.textContent = `@keyframes slideInRight { from{transform:translateX(100%);opacity:0;} to{transform:translateX(0);opacity:1;} } @keyframes slideOutRight { from{transform:translateX(0);opacity:1;} to{transform:translateX(100%);opacity:0;} }`;
    document.head.appendChild(style);
}

// ============================================
// 6. AUTENTICACIÓN
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
            ...(role === 'doctor' && { especialidad: "", disponibilidad: getDefaultAvailability() }),
            ...(role === 'paciente' && { medicalInfo: { bloodType: '', emergencyContact: '', allergies: '', medicalAntecedents: '' } })
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
                fechaRegistro: new Date(),
                medicalInfo: { bloodType: '', emergencyContact: '', allergies: '', medicalAntecedents: '' }
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
    if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; }
    if (appointmentsChart) { appointmentsChart.destroy(); appointmentsChart = null; }
    if (statusChart) { statusChart.destroy(); statusChart = null; }
    await signOut(auth);
    showToast("Sesión cerrada", "info");
    window.location.reload();
}

// ============================================
// 7. HISTORIAL MÉDICO
// ============================================

window.toggleMedicalHistory = function() {
    if (medicalHistoryPanel) {
        medicalHistoryPanel.classList.toggle('d-none');
        if (!medicalHistoryPanel.classList.contains('d-none')) {
            loadPatientMedicalInfo();
            loadPastAppointments();
        }
    }
};

async function loadPatientMedicalInfo() {
    if (!currentUserUID || currentUserRole !== 'paciente') return;
    try {
        const userDoc = await getDoc(doc(db, "users", currentUserUID));
        if (userDoc.exists()) {
            const data = userDoc.data();
            patientMedicalInfo = data.medicalInfo || {};
            if (bloodTypeInput) bloodTypeInput.value = patientMedicalInfo.bloodType || '';
            if (emergencyContactInput) emergencyContactInput.value = patientMedicalInfo.emergencyContact || '';
            if (allergiesInput) allergiesInput.value = patientMedicalInfo.allergies || '';
            if (medicalAntecedentsInput) medicalAntecedentsInput.value = patientMedicalInfo.medicalAntecedents || '';
        }
    } catch (error) { console.error("❌ Error cargando información médica:", error); }
}

async function savePatientMedicalInfo() {
    if (!currentUserUID || currentUserRole !== 'paciente') return;
    const medicalInfo = {
        bloodType: bloodTypeInput?.value || '',
        emergencyContact: emergencyContactInput?.value || '',
        allergies: allergiesInput?.value || '',
        medicalAntecedents: medicalAntecedentsInput?.value || ''
    };
    try {
        await updateDoc(doc(db, "users", currentUserUID), { medicalInfo: medicalInfo });
        patientMedicalInfo = medicalInfo;
        Swal.fire('✅ Guardado', 'Información médica actualizada', 'success');
        showToast("Información guardada", "success");
    } catch (error) {
        console.error("❌ Error guardando:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
}

async function loadPastAppointments() {
    if (!currentUserUID || !pastAppointmentsList) return;
    try {
        pastAppointmentsList.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-clock-history" style="font-size: 2rem;"></i><p class="mt-2 small">Cargando historial...</p></div>';
        const q = query(collection(db, "appointments"), where("patientId", "==", currentUserUID), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            pastAppointmentsList.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-inbox" style="font-size: 2rem;"></i><p class="mt-2 small">Sin citas anteriores</p></div>';
            return;
        }
        let html = '';
        snapshot.forEach(docSnap => {
            const cita = docSnap.data();
            if (cita.status !== 'completada' && cita.status !== 'cancelada') return;
            const fecha = new Date(cita.date).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
            const hasNote = cita.diagnosis || cita.treatment || (cita.medications && cita.medications.length > 0);
            html += `
                <div class="past-appointment-item">
                    <div class="past-appointment-header">
                        <span class="past-appointment-date">📅 ${fecha}</span>
                        <span class="past-appointment-status ${cita.status}">${cita.status}</span>
                    </div>
                    <div class="past-appointment-content">
                        <strong>👨‍⚕️ ${cita.doctor}</strong>
                        <p><strong>Motivo:</strong> ${cita.reason || 'N/A'}</p>
                        ${cita.diagnosis ? `<div class="medical-record-section"><div class="medical-record-label">📋 Diagnóstico</div><div class="medical-record-value">${cita.diagnosis}</div></div>` : ''}
                        ${cita.treatment ? `<div class="medical-record-section"><div class="medical-record-label">💊 Tratamiento</div><div class="medical-record-value">${cita.treatment}</div></div>` : ''}
                        ${cita.medications && cita.medications.length > 0 ? `<div class="medical-record-section"><div class="medical-record-label">💉 Medicamentos</div><ul class="medication-list">${cita.medications.map(med => `<li class="medication-item"><i class="bi bi-capsule"></i> ${med}</li>`).join('')}</ul></div>` : ''}
                        ${cita.status === 'completada' && currentUserRole === 'paciente' && cita.sendToPatient ? `<button class="btn btn-sm btn-outline-info mt-2" onclick="window.viewMedicalNote('${docSnap.id}')"><i class="bi bi-file-earmark-medical me-1"></i>Ver nota completa</button>` : ''}
                    </div>
                </div>`;
        });
        pastAppointmentsList.innerHTML = html || '<div class="text-center py-4 text-muted"><i class="bi bi-inbox" style="font-size: 2rem;"></i><p class="mt-2 small">Sin citas anteriores</p></div>';
    } catch (error) {
        console.error("❌ Error cargando historial:", error);
        pastAppointmentsList.innerHTML = '<div class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i><p class="mt-2 small">Error al cargar historial</p></div>';
    }
}

window.viewMedicalNote = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const cita = appointmentDoc.data();
        Swal.fire({
            title: '📋 Nota Médica Completa',
            html: `<div class="text-start">
                <div class="mb-3"><strong>📅 Fecha:</strong> ${new Date(cita.date).toLocaleDateString('es-MX')}</div>
                <div class="mb-3"><strong>👨‍⚕️ Doctor:</strong> ${cita.doctor}</div>
                <div class="mb-3"><strong>📝 Motivo:</strong><br><span class="text-muted">${cita.reason || 'N/A'}</span></div>
                ${cita.diagnosis ? `<div class="mb-3 p-3 bg-light rounded"><strong>📋 Diagnóstico:</strong><br><span>${cita.diagnosis}</span></div>` : ''}
                ${cita.treatment ? `<div class="mb-3 p-3 bg-light rounded"><strong>💊 Tratamiento:</strong><br><span>${cita.treatment}</span></div>` : ''}
                ${cita.medications && cita.medications.length > 0 ? `<div class="mb-3 p-3 bg-light rounded"><strong>💉 Medicamentos Recetados:</strong><ul class="mt-2">${cita.medications.map(med => `<li>${med}</li>`).join('')}</ul></div>` : ''}
                ${cita.notes ? `<div class="mb-3 p-3 bg-light rounded"><strong>📝 Notas Adicionales:</strong><br><span>${cita.notes}</span></div>` : ''}
            </div>`,
            width: '600px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#6366f1'
        });
    } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
};

window.addMedicalNote = async function(appointmentId) {
    if (currentUserRole !== 'doctor') { Swal.fire('❌ Permiso denegado', 'Solo los doctores pueden agregar notas médicas', 'error'); return; }
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const cita = appointmentDoc.data();
        if (cita.status !== 'completada') {
            const completeFirst = await Swal.fire({
                title: '⚠️ Cita No Completada',
                text: 'Debes completar la cita antes de agregar la nota médica. ¿Deseas completarla ahora?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, completar cita',
                cancelButtonText: 'No, cancelar'
            });
            if (completeFirst.isConfirmed) {
                await updateDoc(doc(db, "appointments", appointmentId), { status: 'completada', completedAt: new Date() });
                window.addMedicalNote(appointmentId);
                return;
            } else { return; }
        }
        const { value: formValues } = await Swal.fire({
            title: '📝 Nota Médica',
            html: `<div class="text-start">
                <div class="alert alert-info mb-3"><i class="bi bi-info-circle me-2"></i><strong>Paciente:</strong> ${cita.patientNombre || 'N/A'}<br><strong>Fecha:</strong> ${new Date(cita.date).toLocaleDateString('es-MX')}</div>
                <div class="mb-3"><label class="form-label fw-bold">📋 Diagnóstico</label><textarea id="medicalDiagnosis" class="form-control" rows="3" placeholder="Escribe el diagnóstico...">${cita.diagnosis || ''}</textarea></div>
                <div class="mb-3"><label class="form-label fw-bold">💊 Tratamiento Recomendado</label><textarea id="medicalTreatment" class="form-control" rows="3" placeholder="Escribe el tratamiento...">${cita.treatment || ''}</textarea></div>
                <div class="mb-3"><label class="form-label fw-bold">💉 Medicamentos (uno por línea)</label><textarea id="medicalMedications" class="form-control" rows="3" placeholder="Ej: Ibuprofeno 400mg cada 8 horas">${cita.medications ? cita.medications.join('\n') : ''}</textarea><small class="text-muted">Escribe cada medicamento en una línea diferente</small></div>
                <div class="mb-3"><label class="form-label fw-bold">📝 Notas Adicionales</label><textarea id="medicalNotes" class="form-control" rows="2" placeholder="Notas adicionales...">${cita.notes || ''}</textarea></div>
                <div class="form-check mb-3"><input type="checkbox" class="form-check-input" id="sendToPatient" ${cita.sendToPatient ? 'checked' : ''}><label class="form-check-label" for="sendToPatient">Compartir nota con el paciente (visible en su historial)</label></div>
                ${cita.medicalNoteAddedAt ? `<div class="alert alert-success mt-3"><i class="bi bi-check-circle me-2"></i><small>Nota médica agregada el ${new Date(cita.medicalNoteAddedAt).toLocaleDateString('es-MX')}</small></div>` : ''}
            </div>`,
            showCancelButton: true,
            confirmButtonText: '💾 Guardar Nota',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#6b7280',
            width: '700px',
            customClass: { popup: 'medical-notes-modal' },
            preConfirm: () => {
                const diagnosis = document.getElementById('medicalDiagnosis').value.trim();
                const treatment = document.getElementById('medicalTreatment').value.trim();
                const medicationsText = document.getElementById('medicalMedications').value.trim();
                const notes = document.getElementById('medicalNotes').value.trim();
                const sendToPatient = document.getElementById('sendToPatient').checked;
                const medications = medicationsText ? medicationsText.split('\n').filter(m => m.trim()) : [];
                return { diagnosis, treatment, medications, notes, sendToPatient };
            }
        });
        if (formValues) {
            await updateDoc(doc(db, "appointments", appointmentId), {
                diagnosis: formValues.diagnosis || '',
                treatment: formValues.treatment || '',
                medications: formValues.medications || [],
                notes: formValues.notes || '',
                sendToPatient: formValues.sendToPatient || false,
                medicalNoteAddedAt: new Date(),
                medicalNoteAddedBy: currentUserUID,
                medicalNoteAddedByName: currentUserData.nombre || 'Doctor',
                updatedAt: new Date()
            });
            Swal.fire('✅ Guardado', 'Nota médica actualizada exitosamente', 'success');
            showToast("Nota médica guardada", "success");
            loadAppointmentsRealtime();
        }
    } catch (error) {
        console.error("❌ Error guardando nota:", error);
        Swal.fire('❌ Error', error.message, 'error');
    }
};

// ============================================
// 8. DASHBOARD - ESTADÍSTICAS
// ============================================

window.refreshDashboard = async function() {
    if (currentUserRole !== 'doctor') return;
    showToast("📊 Actualizando estadísticas...", "info");
    await loadDashboardData();
};

async function loadDashboardData() {
    if (currentUserRole !== 'doctor' || !currentUserUID) return;
    try {
        const q = query(collection(db, "appointments"), where("doctorId", "==", currentUserUID));
        const snapshot = await getDocs(q);
        allAppointments = [];
        snapshot.forEach(doc => { allAppointments.push({ id: doc.id, ...doc.data() }); });
        const stats = calculateStats(allAppointments);
        updateKPIs(stats);
        updateCharts(stats);
        updateRates(stats);
        showToast("✅ Dashboard actualizado", "success");
    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
        showToast("Error al cargar estadísticas", "error");
    }
}

function calculateStats(appointments) {
    const stats = { total: appointments.length, pendientes: 0, confirmadas: 0, completadas: 0, canceladas: 0, pacientesUnicos: new Set(), porMes: {} };
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    appointments.forEach(cita => {
        if (cita.status === 'pendiente') stats.pendientes++;
        else if (cita.status === 'confirmada') stats.confirmadas++;
        else if (cita.status === 'completada') stats.completadas++;
        else if (cita.status === 'cancelada') stats.canceladas++;
        if (cita.patientEmail) stats.pacientesUnicos.add(cita.patientEmail);
        if (cita.date) {
            const citaDate = new Date(cita.date);
            if (citaDate >= sixMonthsAgo) {
                const monthKey = citaDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
                stats.porMes[monthKey] = (stats.porMes[monthKey] || 0) + 1;
            }
        }
    });
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthNames[date.getMonth()];
        last6Months.push({ key: monthKey, label: `${monthKey} ${date.getFullYear().toString().slice(-2)}`, count: stats.porMes[monthKey] || 0 });
    }
    stats.porMesArray = last6Months;
    stats.pacientesCount = stats.pacientesUnicos.size;
    stats.tasaConfirmacion = stats.total > 0 ? ((stats.confirmadas + stats.completadas) / stats.total * 100).toFixed(1) : 0;
    stats.tasaCancelacion = stats.total > 0 ? (stats.canceladas / stats.total * 100).toFixed(1) : 0;
    return stats;
}

function updateKPIs(stats) {
    animateValue(document.getElementById('kpiTotalCitas'), 0, stats.total, 1000);
    animateValue(document.getElementById('kpiConfirmadas'), 0, stats.confirmadas + stats.completadas, 1000);
    animateValue(document.getElementById('kpiPendientes'), 0, stats.pendientes, 1000);
    animateValue(document.getElementById('kpiPacientes'), 0, stats.pacientesCount, 1000);
}

function updateCharts(stats) {
    const appointmentsCtx = document.getElementById('appointmentsChart');
    if (appointmentsCtx) {
        if (appointmentsChart) appointmentsChart.destroy();
        appointmentsChart = new Chart(appointmentsCtx, {
            type: 'line',
            data: { labels: stats.porMesArray.map(m => m.label), datasets: [{ label: 'Citas', data: stats.porMesArray.map(m => m.count), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.4, fill: true }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        if (statusChart) statusChart.destroy();
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: { labels: ['Pendientes', 'Confirmadas', 'Completadas', 'Canceladas'], datasets: [{ data: [stats.pendientes, stats.confirmadas, stats.completadas, stats.canceladas], backgroundColor: ['#f59e0b', '#10b981', '#06b6d4', '#ef4444'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } }
        });
    }
}

function updateRates(stats) {
    const confirmationRateEl = document.getElementById('confirmationRate');
    const confirmationProgressEl = document.getElementById('confirmationProgress');
    if (confirmationRateEl) confirmationRateEl.textContent = `${stats.tasaConfirmacion}%`;
    if (confirmationProgressEl) confirmationProgressEl.style.width = `${stats.tasaConfirmacion}%`;
    const cancellationRateEl = document.getElementById('cancellationRate');
    const cancellationProgressEl = document.getElementById('cancellationProgress');
    if (cancellationRateEl) cancellationRateEl.textContent = `${stats.tasaCancelacion}%`;
    if (cancellationProgressEl) cancellationProgressEl.style.width = `${stats.tasaCancelacion}%`;
}

function animateValue(element, start, end, duration) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// ============================================
// 9. DISPONIBILIDAD DE DOCTORES
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
        if (!doctorId) { doctorAvailability = fallback; return fallback; }
        const userDoc = await getDoc(doc(db, "users", doctorId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            doctorAvailability = data.disponibilidad || fallback;
            doctorAvailability.blockedDates = data.blockedDates || [];
            return doctorAvailability;
        }
        doctorAvailability = fallback;
        return fallback;
    } catch (error) {
        console.error("❌ Error cargando disponibilidad:", error);
        doctorAvailability = fallback;
        return fallback;
    }
}

async function saveDoctorAvailability() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    try {
        await updateDoc(doc(db, "users", currentUserUID), { disponibilidad: doctorAvailability });
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
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    const days = [{ key: 'domingo', name: 'Domingo', icon: '☀️' }, { key: 'lunes', name: 'Lunes', icon: '🌙' }, { key: 'martes', name: 'Martes', icon: '🌙' }, { key: 'miércoles', name: 'Miércoles', icon: '🌙' }, { key: 'jueves', name: 'Jueves', icon: '🌙' }, { key: 'viernes', name: 'Viernes', icon: '🌙' }, { key: 'sábado', name: 'Sábado', icon: '☀️' }];
    let html = '';
    days.forEach(day => {
        const config = doctorAvailability[day.key] || { enabled: false, startTime: '09:00', endTime: '18:00' };
        const isEnabled = config.enabled || false;
        html += `<div class="col-md-6 col-lg-4"><div class="availability-day-card ${isEnabled ? '' : 'disabled'}"><div class="availability-day-header"><div class="availability-day-name"><span>${day.icon}</span><span>${day.name}</span></div><div class="availability-day-toggle ${isEnabled ? 'active' : ''}" onclick="window.toggleDayAvailability('${day.key}')"></div></div>${isEnabled ? `<div class="availability-time-inputs"><input type="time" value="${config.startTime || '09:00'}" onchange="window.updateDayTime('${day.key}', 'startTime', this.value)"><span>a</span><input type="time" value="${config.endTime || '18:00'}" onchange="window.updateDayTime('${day.key}', 'endTime', this.value)"></div>` : '<small class="text-muted">No disponible</small>'}</div></div>`;
    });
    container.innerHTML = html;
    renderBlockedDates();
}

function renderAvailabilityEditor() {
    const container = document.getElementById('availabilityEditorContainer');
    if (!container) return;
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    const days = [{ key: 'domingo', name: 'Domingo', icon: '☀️' }, { key: 'lunes', name: 'Lunes', icon: '🌙' }, { key: 'martes', name: 'Martes', icon: '🌙' }, { key: 'miércoles', name: 'Miércoles', icon: '🌙' }, { key: 'jueves', name: 'Jueves', icon: '🌙' }, { key: 'viernes', name: 'Viernes', icon: '🌙' }, { key: 'sábado', name: 'Sábado', icon: '☀️' }];
    let html = '';
    days.forEach(day => {
        const config = doctorAvailability[day.key] || { enabled: false, startTime: '09:00', endTime: '18:00' };
        const isEnabled = config.enabled || false;
        html += `<div class="col-md-6 col-lg-4"><div class="availability-day-card ${isEnabled ? '' : 'disabled'}"><div class="availability-day-header"><div class="availability-day-name"><span>${day.icon}</span><span>${day.name}</span></div><div class="availability-day-toggle ${isEnabled ? 'active' : ''}" onclick="window.toggleDayAvailability('${day.key}')"></div></div>${isEnabled ? `<div class="availability-time-inputs"><input type="time" value="${config.startTime || '09:00'}" onchange="window.updateDayTime('${day.key}', 'startTime', this.value)"><span>a</span><input type="time" value="${config.endTime || '18:00'}" onchange="window.updateDayTime('${day.key}', 'endTime', this.value)"></div>` : '<small class="text-muted">No disponible</small>'}</div></div>`;
    });
    container.innerHTML = html;
    renderBlockedDatesEditor();
}

function renderBlockedDates() {
    const container = document.getElementById('blockedDatesContainer');
    if (!container) return;
    if (!doctorAvailability?.blockedDates || doctorAvailability.blockedDates.length === 0) { container.innerHTML = '<small class="text-muted">Sin fechas bloqueadas</small>'; return; }
    let html = '';
    doctorAvailability.blockedDates.forEach(date => { html += `<div class="blocked-date-badge"><i class="bi bi-calendar-x"></i><span>${date}</span></div>`; });
    container.innerHTML = html;
}

function renderBlockedDatesEditor() {
    const container = document.getElementById('blockedDatesEditor');
    if (!container) return;
    if (!doctorAvailability?.blockedDates || doctorAvailability.blockedDates.length === 0) { container.innerHTML = '<small class="text-muted">Sin fechas bloqueadas</small>'; return; }
    let html = '';
    doctorAvailability.blockedDates.forEach((date, index) => { html += `<div class="blocked-date-badge"><i class="bi bi-calendar-x"></i><span>${date}</span><button onclick="window.unblockDate(${index})"><i class="bi bi-x-lg"></i></button></div>`; });
    container.innerHTML = html;
}

window.toggleDayAvailability = function(dayKey) {
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    if (!doctorAvailability[dayKey]) { doctorAvailability[dayKey] = { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 }; }
    else { doctorAvailability[dayKey].enabled = !doctorAvailability[dayKey].enabled; }
    if (document.getElementById('availabilityEditor').classList.contains('d-none')) { renderAvailabilityView(); } else { renderAvailabilityEditor(); }
};

window.updateDayTime = function(dayKey, field, value) {
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    if (!doctorAvailability[dayKey]) { doctorAvailability[dayKey] = { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 30 }; }
    doctorAvailability[dayKey][field] = value;
};

window.toggleAvailabilityEditor = function() {
    const view = document.getElementById('availabilityView');
    const editor = document.getElementById('availabilityEditor');
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    if (editor.classList.contains('d-none')) { renderAvailabilityEditor(); editor.classList.remove('d-none'); view.classList.add('d-none'); }
    else { editor.classList.add('d-none'); view.classList.remove('d-none'); renderAvailabilityView(); }
};

window.saveAvailability = async function() { await saveDoctorAvailability(); window.toggleAvailabilityEditor(); };

window.blockDate = function() {
    const dateInput = document.getElementById('blockDateInput');
    const date = dateInput?.value;
    if (!date) { Swal.fire('⚠️ Fecha requerida', 'Selecciona una fecha para bloquear', 'warning'); return; }
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    if (!doctorAvailability.blockedDates) doctorAvailability.blockedDates = [];
    if (!doctorAvailability.blockedDates.includes(date)) {
        doctorAvailability.blockedDates.push(date);
        doctorAvailability.blockedDates.sort();
        renderBlockedDatesEditor();
        if (dateInput) dateInput.value = '';
        showToast("Fecha bloqueada", "success");
    } else { Swal.fire('ℹ️ Ya bloqueada', 'Esta fecha ya está bloqueada', 'info'); }
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
// 10. CARGAR HORARIOS DISPONIBLES
// ============================================

window.loadAvailableSlots = async function() {
    const doctorId = doctorSelect?.value;
    const date = appointmentDateInput?.value;
    const timeSelect = appointmentTimeInput;
    if (dateWarning) dateWarning.classList.add('d-none');
    if (timeWarning) timeWarning.classList.add('d-none');
    if (!timeSelect) return;
    if (!doctorId) { timeSelect.innerHTML = '<option value="">Primero selecciona un doctor</option>'; timeSelect.disabled = true; return; }
    if (!date) { timeSelect.innerHTML = '<option value="">Ahora selecciona una fecha</option>'; timeSelect.disabled = true; return; }
    const today = new Date().toISOString().split('T')[0];
    if (date < today) { timeSelect.innerHTML = '<option value="">No puedes seleccionar fechas pasadas</option>'; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Selecciona una fecha futura'; } return; }
    await loadDoctorAvailability(doctorId);
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    const dateObj = new Date(date + 'T12:00:00');
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = days[dateObj.getDay()];
    const dayConfig = doctorAvailability[dayName];
    if (!dayConfig) { timeSelect.innerHTML = '<option value="">Horario no disponible</option>'; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>El doctor no tiene horarios configurados'; } return; }
    if (!dayConfig.enabled) { timeSelect.innerHTML = `<option value="">El doctor no atiende los ${dayName}</option>`; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>El doctor no está disponible este día`; } return; }
    if (doctorAvailability.blockedDates?.includes(date)) { timeSelect.innerHTML = '<option value="">Fecha no disponible (bloqueada)</option>'; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Esta fecha está bloqueada por el doctor'; } return; }
    const slots = generateTimeSlots(dayConfig.startTime, dayConfig.endTime, dayConfig.slotDuration || 30);
    const bookedTimes = await getBookedTimes(doctorId, date);
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
    if (availableCount === 0) { timeSelect.innerHTML = '<option value="">No hay horarios disponibles para esta fecha</option>'; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>No hay horarios disponibles. Intenta otra fecha'; } }
    else { timeSelect.disabled = false; if (dateWarning) dateWarning.classList.add('d-none'); }
};

async function getBookedTimes(doctorId, date) {
    try {
        const q = query(collection(db, "appointments"), where("doctorId", "==", doctorId), where("date", "==", date));
        const snapshot = await getDocs(q);
        const bookedTimes = [];
        snapshot.forEach(doc => { const data = doc.data(); if (data.time && (data.status === 'pendiente' || data.status === 'confirmada')) { bookedTimes.push(data.time); } });
        return bookedTimes;
    } catch (error) { console.error("❌ Error obteniendo horarios:", error); return []; }
}

// ============================================
// 11. CARGAR DOCTORES
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
        if (doctorSelect) { doctorSelect.innerHTML = '<option value="">No disponible</option>'; doctorSelect.disabled = false; }
        if (doctorsStatus) doctorsStatus.textContent = "Sin doctores";
    }
}

// ============================================
// 12. GUARDAR CITA
// ============================================

async function saveAppointment(doctorId, date, time, reason) {
    if (!currentUserUID) { showMessage("❌ Debes iniciar sesión", "danger"); return; }
    await loadDoctorAvailability(doctorId);
    if (!window.isDoctorAvailable(date, time)) { Swal.fire({ icon: 'error', title: '⚠️ Horario no disponible', text: 'El doctor no está disponible en este horario.', confirmButtonText: 'Entendido' }); return; }
    const bookedTimes = await getBookedTimes(doctorId, date);
    if (bookedTimes.includes(time)) { Swal.fire({ icon: 'error', title: '⚠️ Horario ocupado', text: 'Este horario acaba de ser reservado.', confirmButtonText: 'Entendido' }); await window.loadAvailableSlots(); return; }
    const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
    const doctorName = selectedOption.getAttribute('data-nombre') || 'Doctor';
    saveAppointmentBtn.disabled = true;
    saveAppointmentBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    try {
        await addDoc(collection(db, "appointments"), { patientId: currentUserUID, patientEmail: auth.currentUser?.email, patientNombre: currentUserData?.nombre || auth.currentUser?.email?.split('@')[0], doctorId: doctorId, doctor: doctorName, date: date, time: time, reason: reason, status: "pendiente", createdAt: new Date() });
        showMessage("✅ Cita agendada", "success");
        showToast("Cita agendada exitosamente", "success");
        if (appointmentForm) appointmentForm.reset();
        if (currentUserRole === 'doctor') await loadDashboardData();
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
// 13. CALENDARIO
// ============================================

function initCalendar() {
    const calendarEl = document.getElementById('calendarContainer');
    if (!calendarEl) return;
    if (calendarInstance) calendarInstance.destroy();
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', locale: 'es',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listMonth' },
        buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' },
        firstDay: 1, height: 'auto', eventDisplay: 'block', eventClick: handleEventClick,
        noEventsText: 'Sin citas', dayMaxEvents: 2, contentHeight: 280
    });
    calendarInstance.render();
}

function updateCalendarEvents(appointments) {
    if (!calendarInstance) { setTimeout(() => updateCalendarEvents(appointments), 500); return; }
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
            calendarInstance.addEvent({ id: cita.id, title: cita.doctor, start: startDate.toISOString(), end: endDate.toISOString(), className: colorClass, extendedProps: { status: cita.status, reason: cita.reason, patient: cita.patientNombre || 'Paciente', doctor: cita.doctor, time: cita.time } });
        } catch (error) { console.error("❌ Error evento:", error); }
    });
}

function handleEventClick(info) {
    const event = info.event;
    const props = event.extendedProps;
    const statusIcons = { pendiente: '⏳', confirmada: '✅', cancelada: '❌', completada: '✔️' };
    const statusColors = { pendiente: 'warning', confirmada: 'success', cancelada: 'danger', completada: 'info' };
    const extraButtons = (currentUserRole === 'doctor' && props.status === 'completada') ? `<button class="btn btn-sm btn-outline-primary mt-3 w-100" onclick="window.addMedicalNote('${event.id}')"><i class="bi bi-file-earmark-medical me-1"></i>Agregar/Editar Nota Médica</button>` : '';
    Swal.fire({
        title: `${statusIcons[props.status]} ${event.title}`,
        html: `<div class="text-start">
            <p><strong>📅 Fecha:</strong> ${event.start.toLocaleDateString('es-MX')}</p>
            <p><strong>⏰ Hora:</strong> ${props.time}</p>
            <p><strong>👨‍⚕️ Doctor:</strong> ${props.doctor}</p>
            ${props.patient ? `<p><strong>👤 Paciente:</strong> ${props.patient}</p>` : ''}
            <p><strong>📝 Motivo:</strong> ${props.reason}</p>
            <span class="badge bg-${statusColors[props.status]}">${props.status.toUpperCase()}</span>
            ${extraButtons}
        </div>`,
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
// 14. CARGAR CITAS
// ============================================

function loadAppointmentsRealtime() {
    if (!currentUserUID) { if (appointmentsList) appointmentsList.innerHTML = '<p class="text-muted text-center">Inicia sesión para ver citas</p>'; return; }
    if (unsubscribeAppointments) unsubscribeAppointments();
    if (appointmentsList) { appointmentsList.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div>`; }
    if (currentUserRole === 'doctor') { if (appointmentsTitle) appointmentsTitle.textContent = 'Citas de Mis Pacientes'; loadDoctorAppointments(); }
    else { if (appointmentsTitle) appointmentsTitle.textContent = 'Mis Citas'; loadPatientAppointments(); }
}

function loadPatientAppointments() {
    const q = query(collection(db, "appointments"), where("patientId", "==", currentUserUID), orderBy("date", "asc"));
    unsubscribeAppointments = onSnapshot(q, (snapshot) => { console.log("✅ Citas:", snapshot.size); renderAppointments(snapshot, false); }, (error) => { console.error("❌ Error:", error); handleIndexError(error, 'patientId'); });
}

function loadDoctorAppointments() {
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentUserUID), orderBy("date", "asc"));
    unsubscribeAppointments = onSnapshot(q, (snapshot) => { console.log("✅ Citas doctor:", snapshot.size); renderAppointments(snapshot, true); loadDashboardData(); }, (error) => {
        if (error.code === 'failed-precondition') {
            const link = error.message.match(/https:\/\/[^\s]+/);
            if (appointmentsList) appointmentsList.innerHTML = `<div class="alert alert-warning">⚠️ Índice necesario<br><a href="${link ? link[0] : '#'}" target="_blank">Crear índice</a></div>`;
            loadDoctorAppointmentsFallback();
        } else { if (appointmentsList) appointmentsList.innerHTML = `<div class="alert alert-danger">❌ Error: ${error.message}</div>`; }
    });
}

async function loadDoctorAppointmentsFallback() {
    try {
        const snapshot = await getDocs(query(collection(db, "appointments"), where("doctorId", "==", currentUserUID)));
        renderAppointments(snapshot, true);
        loadDashboardData();
    } catch (error) { if (appointmentsList) appointmentsList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><h4>Sin citas</h4></div>`; }
}

function renderAppointments(snapshot, isDoctor) {
    if (snapshot.empty) {
        if (appointmentsList) appointmentsList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><h4>Sin citas</h4><p>${isDoctor ? 'Aún no tienes pacientes' : 'Agenda tu primera cita'}</p></div>`;
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
        const hasMedicalNote = c.diagnosis || c.treatment || (c.medications && c.medications.length > 0);
        const medicalNoteButton = isDoctor ? `<button class="btn btn-sm ${hasMedicalNote ? 'btn-info' : 'btn-outline-info'} flex-grow-1 mt-2" onclick="window.addMedicalNote('${docSnap.id}')" title="${hasMedicalNote ? 'Editar nota médica' : 'Agregar nota médica'}"><i class="bi bi-file-earmark-medical me-1"></i>${hasMedicalNote ? '📝 Editar Nota' : '📝 Agregar Nota'}</button>` : '';
        const medicalNoteIndicator = (currentUserRole === 'paciente' && hasMedicalNote && c.sendToPatient) ? `<div class="alert alert-info mt-2 mb-0 py-2"><i class="bi bi-file-earmark-check me-2"></i><small><strong>Nota médica disponible</strong> - Tu doctor agregó información a esta cita</small><button class="btn btn-sm btn-outline-info ms-2" onclick="window.viewMedicalNote('${docSnap.id}')">Ver</button></div>` : '';
        html += `<div class="appointment-card ${statusClass} ${isDoctor ? 'doctor-view' : ''}">
            <div class="appointment-header">
                <div><div class="appointment-doctor">${c.doctor}</div>${isDoctor && c.patientNombre ? `<div class="appointment-patient"><i class="bi bi-person me-1"></i>${c.patientNombre}</div>` : ''}<small class="appointment-specialty">Cita médica</small></div>
                <span class="appointment-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="appointment-details">
                <div class="detail-item"><i class="bi bi-calendar"></i><div><span class="detail-label">Fecha</span><span class="detail-value">${fecha}</span></div></div>
                <div class="detail-item"><i class="bi bi-clock"></i><div><span class="detail-label">Hora</span><span class="detail-value">${c.time}</span></div></div>
            </div>
            <div class="appointment-reason"><i class="bi bi-card-text me-2"></i>${c.reason}</div>
            ${renderActionButtons(c, isDoctor, docSnap.id)}
            ${medicalNoteButton}
            ${medicalNoteIndicator}
        </div>`;
    });
    if (appointmentsList) appointmentsList.innerHTML = html;
    if (citasCount) citasCount.textContent = `${total} ${total === 1 ? 'cita' : 'citas'}`;
    if (totalCitasEl) totalCitasEl.textContent = total;
    if (pendingCitasEl) pendingCitasEl.textContent = pending;
    if (isDoctor && patientCountEl) patientCountEl.textContent = patients.size;
    updateCalendarEvents(appointmentsArray);
}

function renderActionButtons(cita, isDoctor, citaId) {
    const status = cita.status;
    if (status === 'completada' || status === 'cancelada') return '';
    if (status === 'pendiente') {
        return `<div class="appointment-actions">${isDoctor ? `<button class="btn btn-success btn-sm flex-grow-1" onclick="window.updateStatus('${citaId}', 'confirmada')"><i class="bi bi-check-circle me-1"></i>Confirmar</button>` : ''}<button class="btn btn-outline-primary btn-sm flex-grow-1" onclick="window.editAppointment('${citaId}')"><i class="bi bi-pencil me-1"></i>Editar</button><button class="btn btn-outline-danger btn-sm flex-grow-1" onclick="window.cancelAppointment('${citaId}')"><i class="bi bi-x-circle me-1"></i>Cancelar</button></div>`;
    }
    if (status === 'confirmada') {
        return `<div class="appointment-actions">${isDoctor ? `<button class="btn btn-info btn-sm flex-grow-1" onclick="window.completeAppointment('${citaId}')"><i class="bi bi-check-all me-1"></i>Completar</button>` : ''}<button class="btn btn-outline-primary btn-sm flex-grow-1" onclick="window.editAppointment('${citaId}')"><i class="bi bi-pencil me-1"></i>Reprogramar</button><button class="btn btn-outline-danger btn-sm flex-grow-1" onclick="window.cancelAppointment('${citaId}')"><i class="bi bi-x-circle me-1"></i>Cancelar</button></div>`;
    }
    return '';
}

function handleIndexError(error, field) {
    if (appointmentsList) {
        if (error.code === 'failed-precondition') { const link = error.message.match(/https:\/\/[^\s]+/); appointmentsList.innerHTML = `<div class="alert alert-warning">⚠️ Índice necesario<br><a href="${link ? link[0] : '#'}" target="_blank">Crear índice</a></div>`; }
        else { appointmentsList.innerHTML = '<div class="alert alert-danger">Error al cargar</div>'; }
    }
}

// ============================================
// 15. ADMINISTRACIÓN DE CITAS
// ============================================

window.editAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const appointment = appointmentDoc.data();
        const canEdit = currentUserRole === 'admin' || (currentUserRole === 'paciente' && appointment.patientId === currentUserUID) || (currentUserRole === 'doctor' && appointment.doctorId === currentUserUID);
        if (!canEdit) { Swal.fire('❌ Permiso denegado', 'No puedes editar esta cita', 'error'); return; }
        const { value: formValues } = await Swal.fire({
            title: '✏️ Reprogramar Cita',
            html: `<div class="text-start"><label class="form-label">📅 Nueva Fecha</label><input type="date" id="editDate" class="form-control" value="${appointment.date}"><label class="form-label mt-2">⏰ Nueva Hora</label><input type="time" id="editTime" class="form-control" value="${appointment.time}"><label class="form-label mt-2">📝 Motivo</label><textarea id="editReason" class="form-control" rows="2">${appointment.reason}</textarea></div>`,
            showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar', confirmButtonColor: '#6366f1', cancelButtonColor: '#6b7280',
            preConfirm: () => {
                const date = document.getElementById('editDate').value;
                const time = document.getElementById('editTime').value;
                const reason = document.getElementById('editReason').value;
                if (!date || !time) { Swal.showValidationMessage('Fecha y hora requeridas'); return false; }
                if (date < new Date().toISOString().split('T')[0]) { Swal.showValidationMessage('No puedes programar en el pasado'); return false; }
                return { date, time, reason };
            }
        });
        if (formValues) {
            await updateDoc(doc(db, "appointments", appointmentId), { date: formValues.date, time: formValues.time, reason: formValues.reason, status: 'pendiente', updatedAt: new Date() });
            Swal.fire('✅ Reprogramada', 'La cita fue actualizada', 'success');
            showToast("Cita reprogramada", "success");
        }
    } catch (error) { console.error("❌ Error editando:", error); Swal.fire('❌ Error', error.message, 'error'); }
};

window.completeAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const appointment = appointmentDoc.data();
        if (appointment.status === 'completada') {
            const editNote = await Swal.fire({ title: 'ℹ️ Cita Ya Completada', text: '¿Deseas editar la nota médica de esta cita?', icon: 'info', showCancelButton: true, confirmButtonText: 'Sí, editar nota', cancelButtonText: 'No, cancelar' });
            if (editNote.isConfirmed) { window.addMedicalNote(appointmentId); }
            return;
        }
        if (currentUserRole !== 'doctor' || appointment.doctorId !== currentUserUID) { Swal.fire('❌ Permiso denegado', 'Solo el doctor puede completar', 'error'); return; }
        await updateDoc(doc(db, "appointments", appointmentId), { status: 'completada', completedAt: new Date() });
        const { value: formValues } = await Swal.fire({
            title: '📝 Nota Médica de la Cita',
            html: `<div class="text-start">
                <div class="alert alert-info mb-3"><i class="bi bi-info-circle me-2"></i><strong>Importante:</strong> Completa esta información para el historial del paciente.</div>
                <div class="mb-3"><label class="form-label fw-bold">📋 Diagnóstico</label><textarea id="medicalDiagnosis" class="form-control" rows="3" placeholder="Ej: Infección respiratoria alta, gastritis aguda..."></textarea></div>
                <div class="mb-3"><label class="form-label fw-bold">💊 Tratamiento Recomendado</label><textarea id="medicalTreatment" class="form-control" rows="3" placeholder="Ej: Reposo por 3 días, abundantes líquidos, dieta blanda..."></textarea></div>
                <div class="mb-3"><label class="form-label fw-bold">💉 Medicamentos (uno por línea)</label><textarea id="medicalMedications" class="form-control" rows="3" placeholder="Ej:&#10;Ibuprofeno 400mg cada 8 horas por 5 días&#10;Amoxicilina 500mg cada 12 horas por 7 días"></textarea><small class="text-muted">Escribe cada medicamento en una línea diferente</small></div>
                <div class="mb-3"><label class="form-label fw-bold">📝 Notas Adicionales</label><textarea id="medicalNotes" class="form-control" rows="2" placeholder="Recomendaciones adicionales, seguimiento, etc."></textarea></div>
                <div class="form-check mb-3"><input type="checkbox" class="form-check-input" id="sendToPatient"><label class="form-check-label" for="sendToPatient">Compartir nota con el paciente (visible en su historial)</label></div>
            </div>`,
            showCancelButton: true,
            confirmButtonText: '💾 Guardar Nota Médica',
            cancelButtonText: '⏭️ Omitir por ahora',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            width: '700px',
            customClass: { popup: 'medical-notes-modal' },
            allowOutsideClick: false,
            preConfirm: () => {
                const diagnosis = document.getElementById('medicalDiagnosis').value.trim();
                const treatment = document.getElementById('medicalTreatment').value.trim();
                const medicationsText = document.getElementById('medicalMedications').value.trim();
                const notes = document.getElementById('medicalNotes').value.trim();
                const sendToPatient = document.getElementById('sendToPatient').checked;
                const medications = medicationsText ? medicationsText.split('\n').filter(m => m.trim()) : [];
                if (!diagnosis && !treatment && medications.length === 0) { Swal.showValidationMessage('⚠️ Ingresa al menos un diagnóstico, tratamiento o medicamento'); return false; }
                return { diagnosis, treatment, medications, notes, sendToPatient };
            }
        });
        if (formValues) {
            await updateDoc(doc(db, "appointments", appointmentId), { diagnosis: formValues.diagnosis || '', treatment: formValues.treatment || '', medications: formValues.medications || [], notes: formValues.notes || '', sendToPatient: formValues.sendToPatient || false, medicalNoteAddedAt: new Date(), medicalNoteAddedBy: currentUserUID, medicalNoteAddedByName: currentUserData.nombre || 'Doctor' });
            Swal.fire({ icon: 'success', title: '✅ Cita Completada', html: '<strong>La cita fue completada y la nota médica guardada exitosamente.</strong><br><br>El paciente podrá ver esta información en su historial médico.', confirmButtonText: 'Entendido', confirmButtonColor: '#10b981' });
            showToast("Cita completada con nota médica", "success");
        } else {
            Swal.fire({ icon: 'info', title: 'ℹ️ Cita Completada', text: 'La cita fue completada. Puedes agregar la nota médica más tarde haciendo clic en la cita.', confirmButtonText: 'Entendido' });
        }
        loadAppointmentsRealtime();
    } catch (error) { console.error("❌ Error completando cita:", error); Swal.fire('❌ Error', error.message, 'error'); }
};

window.cancelAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const appointment = appointmentDoc.data();
        const canCancel = currentUserRole === 'admin' || (currentUserRole === 'paciente' && appointment.patientId === currentUserUID) || (currentUserRole === 'doctor' && appointment.doctorId === currentUserUID);
        if (!canCancel) { Swal.fire('❌ Permiso denegado', 'No puedes cancelar esta cita', 'error'); return; }
        const confirm = await Swal.fire({ title: '❌ ¿Cancelar Cita?', text: `Cita con ${appointment.doctor} el ${appointment.date}`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No, mantener', confirmButtonColor: '#dc3545' });
        if (confirm.isConfirmed) {
            await updateDoc(doc(db, "appointments", appointmentId), { status: 'cancelada', cancelledAt: new Date(), cancelledBy: currentUserUID });
            Swal.fire('✅ Cancelada', 'La cita fue cancelada', 'success');
            showToast("Cita cancelada", "success");
        }
    } catch (error) { console.error("❌ Error:", error); Swal.fire('❌ Error', error.message, 'error'); }
};

window.updateStatus = async function(id, status) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", id));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const currentStatus = appointmentDoc.data().status;
        if (currentStatus === 'confirmada' && status === 'confirmada') { Swal.fire('ℹ️ Ya confirmada', 'Esta cita ya fue confirmada', 'info'); return; }
        if (currentStatus === 'completada') { Swal.fire('ℹ️ Ya completada', 'Esta cita ya fue completada', 'info'); return; }
        await updateDoc(doc(db, "appointments", id), { status: status, updatedAt: new Date(), ...(status === 'confirmada' && { confirmedAt: new Date(), confirmedBy: currentUserUID }) });
        Swal.fire({ icon: 'success', title: `✅ ${status.charAt(0).toUpperCase() + status.slice(1)}`, text: 'Estado actualizado correctamente', timer: 2000, showConfirmButton: false });
        showToast(`Cita ${status}`, "success");
    } catch (error) { console.error("❌ Error actualizando estado:", error); Swal.fire('❌ Error', error.message, 'error'); }
};

// ============================================
// 16. PERFIL DOCTOR
// ============================================

async function saveDoctorProfile() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    const nombre = doctorNameInput.value.trim();
    const especialidad = doctorSpecialtyInput.value.trim();
    if (!nombre || !especialidad) { Swal.fire('⚠️ Campos vacíos', 'Completa nombre y especialidad', 'warning'); return; }
    try {
        await updateDoc(doc(db, "users", currentUserUID), { nombre, especialidad });
        await setDoc(doc(db, "doctors", currentUserUID), { nombre, especialidad, activo: true, userId: currentUserUID }, { merge: true });
        Swal.fire('✅ Perfil guardado', '', 'success');
        showToast("Perfil actualizado", "success");
        currentUserData.nombre = nombre;
        currentUserData.especialidad = especialidad;
        await loadDoctors();
    } catch (error) { Swal.fire('❌ Error', error.message, 'error'); }
}

// ============================================
// 17. AUTH STATE
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
        if (btnDashboard) btnDashboard.classList.toggle('d-none', currentUserRole !== 'doctor');
        if (btnMedicalHistory) btnMedicalHistory.classList.toggle('d-none', currentUserRole !== 'paciente');
        if (currentUserRole === 'doctor') {
            if (patientFormSection) patientFormSection.classList.add('d-none');
            if (doctorPanel) doctorPanel.classList.remove('d-none');
            if (dashboardPanel) dashboardPanel.classList.remove('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.remove('d-none');
            if (doctorStats) doctorStats.classList.remove('d-none');
            if (doctorNameInput && currentUserData.nombre) doctorNameInput.value = currentUserData.nombre;
            if (doctorSpecialtyInput && currentUserData.especialidad) doctorSpecialtyInput.value = currentUserData.especialidad;
            doctorAvailability = currentUserData.disponibilidad || getDefaultAvailability();
            if (!doctorAvailability.blockedDates) doctorAvailability.blockedDates = [];
            renderAvailabilityView();
            await loadDashboardData();
        } else {
            if (patientFormSection) patientFormSection.classList.remove('d-none');
            if (doctorPanel) doctorPanel.classList.add('d-none');
            if (dashboardPanel) dashboardPanel.classList.add('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.add('d-none');
            if (doctorStats) doctorStats.classList.add('d-none');
            await loadDoctors();
        }
        if (authSection) authSection.classList.add('d-none');
        if (welcomePanel) welcomePanel.classList.remove('d-none');
        if (btnLogout) btnLogout.classList.remove('d-none');
        setTimeout(() => { loadAppointmentsRealtime(); setTimeout(() => { initCalendar(); setupCalendarButtons(); }, 800); }, 300);
        showToast(`Bienvenido ${currentUserRole}`, "success");
    } else {
        currentUserUID = null;
        currentUserData = null;
        currentUserRole = 'paciente';
        doctorAvailability = null;
        if (unsubscribeAppointments) unsubscribeAppointments();
        if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; }
        if (appointmentsChart) { appointmentsChart.destroy(); appointmentsChart = null; }
        if (statusChart) { statusChart.destroy(); statusChart = null; }
        if (welcomePanel) welcomePanel.classList.add('d-none');
        if (authSection) authSection.classList.remove('d-none');
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnDashboard) btnDashboard.classList.add('d-none');
        if (btnMedicalHistory) btnMedicalHistory.classList.add('d-none');
        if (navRole) navRole.classList.add('d-none');
        if (authMessage) authMessage.classList.add('d-none');
    }
});

// ============================================
// 18. EVENT LISTENERS
// ============================================

if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); const email = emailInput.value.trim(); const password = passwordInput.value; if (isRegisterMode) { const selectedRole = document.querySelector('input[name="userRole"]:checked').value; registerUser(email, password, selectedRole); } else { loginUser(email, password); } });
if (btnGoogle) btnGoogle.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logoutUser);
if (btnDashboard) btnDashboard.addEventListener('click', () => { if (dashboardPanel) dashboardPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
if (btnMedicalHistory) btnMedicalHistory.addEventListener('click', window.toggleMedicalHistory);
if (toggleRegister) toggleRegister.addEventListener('click', (e) => { e.preventDefault(); isRegisterMode = !isRegisterMode; if (formTitle) formTitle.textContent = isRegisterMode ? 'Crear Cuenta' : 'Bienvenido'; if (submitBtn) submitBtn.innerHTML = isRegisterMode ? '<i class="bi bi-person-plus me-2"></i>Registrarse' : '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión'; if (toggleRegister) toggleRegister.textContent = isRegisterMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'; if (roleSelectContainer) roleSelectContainer.classList.toggle('d-none', !isRegisterMode); if (authMessage) authMessage.classList.add('d-none'); });
if (appointmentForm) appointmentForm.addEventListener('submit', (e) => { e.preventDefault(); const today = new Date().toISOString().split('T')[0]; const date = appointmentDateInput.value; if (date < today) { Swal.fire('⚠️ Fecha inválida', 'No puedes agendar en el pasado', 'warning'); return; } const doctorId = doctorSelect.value; if (!doctorId) { Swal.fire('⚠️ Doctor requerido', 'Selecciona un doctor', 'warning'); return; } const time = appointmentTimeInput.value; if (!time) { Swal.fire('⚠️ Hora requerida', 'Selecciona un horario disponible', 'warning'); return; } const reason = appointmentReasonInput ? appointmentReasonInput.value.trim() : ''; saveAppointment(doctorId, date, time, reason); });
if (doctorProfileForm) doctorProfileForm.addEventListener('submit', (e) => { e.preventDefault(); saveDoctorProfile(); });
if (patientMedicalInfoForm) patientMedicalInfoForm.addEventListener('submit', (e) => { e.preventDefault(); savePatientMedicalInfo(); });
window.addEventListener('beforeunload', () => { if (unsubscribeAppointments) unsubscribeAppointments(); if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; } if (appointmentsChart) { appointmentsChart.destroy(); appointmentsChart = null; } if (statusChart) { statusChart.destroy(); statusChart = null; } });

console.log("🚀 ========================================");
console.log("🚀 MediCare Pro v9.0 - HISTORIAL MÉDICO COMPLETO");
console.log("👥 Roles: Doctor/Paciente");
console.log("📅 Disponibilidad: Activada");
console.log("📊 Dashboard: Con gráficas");
console.log("📋 Historial Médico: Completo");
console.log("📝 Notas Médicas: Funcionales");
console.log("🚀 ========================================");