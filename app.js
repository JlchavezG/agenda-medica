/**
 * MEDICARE PRO - app.js v12.0 FINAL
 * ✅ 3 Actores: Paciente/Doctor/Admin
 * ✅ Todo funcional y verificado
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
    query, where, orderBy, onSnapshot, getDocs, updateDoc, deleteDoc 
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

console.log("🔥 MediCare Pro v12.0 - Iniciando...");

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
const btnPayments = document.getElementById('btnPayments');
const btnMedicalHistory = document.getElementById('btnMedicalHistory');
const btnAdmin = document.getElementById('btnAdmin');
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
const paymentsPanel = document.getElementById('paymentsPanel');
const adminPanel = document.getElementById('adminPanel');
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
const consultationFeeInput = document.getElementById('consultationFee');
const appointmentDateInput = document.getElementById('appointmentDate');
const appointmentTimeInput = document.getElementById('appointmentTime');
const appointmentReasonInput = document.getElementById('appointmentReason');
const dateWarning = document.getElementById('dateWarning');
const timeWarning = document.getElementById('timeWarning');
const paymentWarning = document.getElementById('paymentWarning');
const pastAppointmentsList = document.getElementById('pastAppointmentsList');
const patientMedicalInfoForm = document.getElementById('patientMedicalInfoForm');
const bloodTypeInput = document.getElementById('bloodType');
const emergencyContactInput = document.getElementById('emergencyContact');
const allergiesInput = document.getElementById('allergies');
const medicalAntecedentsInput = document.getElementById('medicalAntecedents');
const pendingPaymentsList = document.getElementById('pendingPaymentsList');
const recentPaymentsList = document.getElementById('recentPaymentsList');
const summaryPaid = document.getElementById('summaryPaid');
const summaryPending = document.getElementById('summaryPending');
const paidCount = document.getElementById('paidCount');
const pendingPaymentCount = document.getElementById('pendingPaymentCount');
const paidPercentage = document.getElementById('paidPercentage');
const pendingPercentage = document.getElementById('pendingPercentage');
const totalRevenue = document.getElementById('totalRevenue');
const adminUsersList = document.getElementById('adminUsersList');
const adminCitasList = document.getElementById('adminCitasList');
const adminPagosList = document.getElementById('adminPagosList');
const adminCitasFilter = document.getElementById('adminCitasFilter');

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
let paymentsChart = null;
let adminCitasChart = null;
let adminStatusChart = null;
let allAppointments = [];
let allUsers = [];
let allCitas = [];
let patientMedicalInfo = {};
let hasPendingPayments = false;

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
            ...(role === 'doctor' && { especialidad: "", disponibilidad: getDefaultAvailability(), consultationFee: 500 }),
            ...(role === 'paciente' && { medicalInfo: { bloodType: '', emergencyContact: '', allergies: '', medicalAntecedents: '' } })
        });
        showMessage("✅ Registro exitoso", "success");
        showToast("Cuenta creada", "success");
    } catch (error) {
        console.error("❌ Error registro:", error);
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
        console.error("❌ Error login:", error);
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
    if (paymentsChart) { paymentsChart.destroy(); paymentsChart = null; }
    if (adminCitasChart) { adminCitasChart.destroy(); adminCitasChart = null; }
    if (adminStatusChart) { adminStatusChart.destroy(); adminStatusChart = null; }
    await signOut(auth);
    showToast("Sesión cerrada", "info");
    window.location.reload();
}

// ============================================
// 7. SISTEMA DE PAGOS
// ============================================

window.togglePaymentsPanel = function() {
    if (!paymentsPanel) return;
    const isHidden = paymentsPanel.classList.contains('d-none');
    paymentsPanel.classList.toggle('d-none');
    if (isHidden) loadPaymentsData();
};

async function loadPaymentsData() {
    if (currentUserRole !== 'doctor') return;
    try {
        const q = query(collection(db, "appointments"), where("doctorId", "==", currentUserUID));
        const snapshot = await getDocs(q);
        let paid = 0, pending = 0, totalRevenueAmount = 0;
        const pendingPayments = [], recentPayments = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        snapshot.forEach(doc => {
            const cita = doc.data();
            const createdAt = cita.createdAt?.toDate ? cita.createdAt.toDate() : new Date();
            if (cita.paymentStatus === 'paid') {
                paid++;
                const paidAmount = cita.paidAmount || cita.consultationFee || 500;
                if (cita.paidAt) {
                    const paidDate = cita.paidAt.toDate ? cita.paidAt.toDate() : createdAt;
                    if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                        totalRevenueAmount += paidAmount;
                    }
                }
                recentPayments.push({ id: doc.id, ...cita, paidAmount });
            } else if (cita.status === 'completada' && (cita.paymentStatus === 'pending' || !cita.paymentStatus)) {
                pending++;
                pendingPayments.push({ id: doc.id, ...cita });
            }
        });
        
        if (summaryPaid) summaryPaid.textContent = paid;
        if (summaryPending) summaryPending.textContent = pending;
        if (paidCount) paidCount.textContent = paid;
        if (pendingPaymentCount) pendingPaymentCount.textContent = pending;
        if (paidPercentage) paidPercentage.textContent = (paid + pending > 0 ? ((paid / (paid + pending)) * 100).toFixed(1) : 0) + '%';
        if (pendingPercentage) pendingPercentage.textContent = (paid + pending > 0 ? ((pending / (paid + pending)) * 100).toFixed(1) : 0) + '%';
        if (totalRevenue) totalRevenue.textContent = '$' + totalRevenueAmount.toLocaleString();
        
        renderPendingPayments(pendingPayments);
        renderRecentPayments(recentPayments.slice(0, 10));
        updatePaymentsChart(paid, pending);
    } catch (error) {
        console.error("❌ Error cargando pagos:", error);
    }
}

function renderPendingPayments(pendingPayments) {
    if (!pendingPaymentsList) return;
    if (pendingPayments.length === 0) {
        pendingPaymentsList.innerHTML = '<div class="empty-state"><i class="bi bi-check-circle"></i><h4>¡No hay pagos pendientes!</h4></div>';
        return;
    }
    let html = '';
    pendingPayments.forEach(cita => {
        const fecha = new Date(cita.date).toLocaleDateString('es-MX');
        const amount = cita.consultationFee || 500;
        html += `<div class="payment-item pending"><div class="payment-info"><div class="payment-patient">👤 ${cita.patientNombre || 'Paciente'}</div><div class="payment-date">📅 ${fecha}</div></div><div class="payment-amount pending">$${amount}</div><div class="payment-actions"><button class="btn btn-sm btn-success" onclick="window.markAsPaid('${cita.id}', ${amount})"><i class="bi bi-check-circle"></i></button><button class="btn btn-sm btn-outline-warning" onclick="window.sendPaymentReminder('${cita.patientEmail || ''}', '${cita.patientNombre || 'Paciente'}', ${amount})"><i class="bi bi-bell"></i></button></div></div>`;
    });
    pendingPaymentsList.innerHTML = html;
}

function renderRecentPayments(recentPayments) {
    if (!recentPaymentsList) return;
    if (recentPayments.length === 0) {
        recentPaymentsList.innerHTML = '<div class="empty-state"><i class="bi bi-receipt"></i><h4>Sin pagos recientes</h4></div>';
        return;
    }
    let html = '';
    recentPayments.forEach(cita => {
        const fecha = new Date(cita.date).toLocaleDateString('es-MX');
        const amount = cita.paidAmount || cita.consultationFee || 500;
        html += `<div class="payment-item paid"><div class="payment-info"><div class="payment-patient">👤 ${cita.patientNombre || 'Paciente'}</div><div class="payment-date">📅 ${fecha}</div></div><div class="payment-amount paid">$${amount}</div><span class="payment-status-badge paid">Pagado</span></div>`;
    });
    recentPaymentsList.innerHTML = html;
}

window.markAsPaid = async function(appointmentId, defaultAmount) {
    try {
        const { value: paymentData } = await Swal.fire({
            title: '💰 Confirmar Pago',
            html: `<div class="text-start"><label class="form-label">Monto recibido ($)</label><input type="number" id="paymentAmount" class="form-control" value="${defaultAmount}" min="0" step="1"></div>`,
            showCancelButton: true,
            confirmButtonText: '✅ Confirmar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981',
            preConfirm: () => {
                const amount = document.getElementById('paymentAmount').value;
                if (!amount || amount <= 0) { Swal.showValidationMessage('Ingresa un monto válido'); return false; }
                return { amount: parseFloat(amount) };
            }
        });
        if (paymentData) {
            await updateDoc(doc(db, "appointments", appointmentId), { paymentStatus: 'paid', paidAmount: paymentData.amount, paidAt: new Date() });
            Swal.fire('✅ Pago Confirmado', `Se registró $${paymentData.amount.toLocaleString()}`, 'success');
            loadPaymentsData();
            loadAppointmentsRealtime();
        }
    } catch (error) {
        Swal.fire('❌ Error', error.message, 'error');
    }
};

window.sendPaymentReminder = async function(patientEmail, patientName, amount) {
    const { value: method } = await Swal.fire({
        title: '📱 Enviar Recordatorio',
        html: `<p>Enviar a <strong>${patientName}</strong></p><div class="d-flex gap-3 justify-content-center mt-3"><button class="btn btn-success" id="sendWhatsApp"><i class="bi bi-whatsapp me-2"></i>WhatsApp</button><button class="btn btn-primary" id="sendEmail"><i class="bi bi-envelope me-2"></i>Email</button></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
    });
    document.getElementById('sendWhatsApp')?.addEventListener('click', () => {
        const message = `Hola ${patientName}, tienes un pago pendiente de $${amount}. Por favor acércate a pagar.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        Swal.close();
    });
    document.getElementById('sendEmail')?.addEventListener('click', () => {
        if (patientEmail) {
            window.location.href = `mailto:${patientEmail}?subject=Recordatorio de Pago&body=Tienes un pago pendiente de $${amount}`;
            Swal.close();
        } else {
            Swal.fire('⚠️ Sin Email', 'El paciente no tiene email', 'warning');
        }
    });
};

function updatePaymentsChart(paid, pending) {
    const ctx = document.getElementById('paymentsChart');
    if (!ctx) return;
    if (paymentsChart) paymentsChart.destroy();
    try {
        paymentsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pagadas', 'Pendientes'],
                datasets: [{ data: [paid, pending], backgroundColor: ['#10b981', '#f59e0b'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } }
        });
    } catch (error) {
        console.error("❌ Error creando gráfica:", error);
    }
}

async function checkPatientPendingPayments() {
    if (!currentUserUID || currentUserRole !== 'paciente') return false;
    try {
        const q = query(collection(db, "appointments"), where("patientId", "==", currentUserUID), where("status", "==", "completada"));
        const snapshot = await getDocs(q);
        let pendingCount = 0;
        snapshot.forEach(doc => {
            const cita = doc.data();
            if (cita.paymentStatus !== 'paid') pendingCount++;
        });
        hasPendingPayments = pendingCount > 0;
        if (paymentWarning) {
            if (hasPendingPayments) {
                paymentWarning.classList.remove('d-none');
                paymentWarning.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>Tienes ${pendingCount} pago(s) pendiente(s)`;
            } else {
                paymentWarning.classList.add('d-none');
            }
        }
        return hasPendingPayments;
    } catch (error) {
        return false;
    }
}

// ============================================
// 8. HISTORIAL MÉDICO
// ============================================

window.toggleMedicalHistory = function() {
    if (!medicalHistoryPanel) return;
    medicalHistoryPanel.classList.toggle('d-none');
    if (!medicalHistoryPanel.classList.contains('d-none')) {
        loadPatientMedicalInfo();
        loadPastAppointments();
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
        Swal.fire('✅ Guardado', 'Información actualizada', 'success');
        showToast("Información guardada", "success");
    } catch (error) {
        Swal.fire('❌ Error', error.message, 'error');
    }
}

async function loadPastAppointments() {
    if (!currentUserUID || !pastAppointmentsList) return;
    try {
        pastAppointmentsList.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-clock-history" style="font-size: 2rem;"></i><p class="mt-2 small">Cargando...</p></div>';
        const q = query(collection(db, "appointments"), where("patientId", "==", currentUserUID), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            pastAppointmentsList.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><h4>Sin citas anteriores</h4></div>';
            return;
        }
        let html = '';
        snapshot.forEach(docSnap => {
            const cita = docSnap.data();
            if (cita.status !== 'completada' && cita.status !== 'cancelada') return;
            const fecha = new Date(cita.date).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
            const paymentStatus = cita.paymentStatus === 'paid' ? '<span class="badge bg-success">Pagado</span>' : '<span class="badge bg-warning">Pendiente</span>';
            html += `<div class="past-appointment-item"><div class="past-appointment-header"><span class="past-appointment-date">📅 ${fecha}</span><span class="past-appointment-status ${cita.status}">${cita.status}</span></div><div class="past-appointment-content"><strong>👨‍⚕️ ${cita.doctor}</strong><p><strong>Motivo:</strong> ${cita.reason || 'N/A'}</p><div class="mb-2">${paymentStatus}</div>${cita.diagnosis ? `<div class="medical-record-section"><div class="medical-record-label">📋 Diagnóstico</div><div class="medical-record-value">${cita.diagnosis}</div></div>` : ''}${cita.treatment ? `<div class="medical-record-section"><div class="medical-record-label">💊 Tratamiento</div><div class="medical-record-value">${cita.treatment}</div></div>` : ''}${cita.medications && cita.medications.length > 0 ? `<div class="medical-record-section"><div class="medical-record-label">💉 Medicamentos</div><ul class="medication-list">${cita.medications.map(med => `<li class="medication-item"><i class="bi bi-capsule"></i> ${med}</li>`).join('')}</ul></div>` : ''}${cita.status === 'completada' && cita.sendToPatient ? `<button class="btn btn-sm btn-outline-info mt-2" onclick="window.viewMedicalNote('${docSnap.id}')"><i class="bi bi-file-earmark-medical me-1"></i>Ver nota</button>` : ''}</div></div>`;
        });
        pastAppointmentsList.innerHTML = html;
    } catch (error) {
        console.error("❌ Error cargando historial:", error);
    }
}

window.viewMedicalNote = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const cita = appointmentDoc.data();
        Swal.fire({
            title: '📋 Nota Médica',
            html: `<div class="text-start"><div class="mb-3"><strong>📅 Fecha:</strong> ${new Date(cita.date).toLocaleDateString('es-MX')}</div><div class="mb-3"><strong>👨‍⚕️ Doctor:</strong> ${cita.doctor}</div>${cita.diagnosis ? `<div class="mb-3 p-3 bg-light rounded"><strong>📋 Diagnóstico:</strong><br><span>${cita.diagnosis}</span></div>` : ''}${cita.treatment ? `<div class="mb-3 p-3 bg-light rounded"><strong>💊 Tratamiento:</strong><br><span>${cita.treatment}</span></div>` : ''}${cita.medications && cita.medications.length > 0 ? `<div class="mb-3 p-3 bg-light rounded"><strong>💉 Medicamentos:</strong><ul class="mt-2">${cita.medications.map(med => `<li>${med}</li>`).join('')}</ul></div>` : ''}</div>`,
            width: '600px'
        });
    } catch (error) {
        Swal.fire('❌ Error', error.message, 'error');
    }
};

window.addMedicalNote = async function(appointmentId) {
    if (currentUserRole !== 'doctor') { Swal.fire('❌ Solo doctores', 'No tienes permisos', 'error'); return; }
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const cita = appointmentDoc.data();
        const { value: formValues } = await Swal.fire({
            title: '📝 Nota Médica',
            html: `<div class="text-start"><div class="mb-3"><label class="form-label">📋 Diagnóstico</label><textarea id="medicalDiagnosis" class="form-control" rows="3">${cita.diagnosis || ''}</textarea></div><div class="mb-3"><label class="form-label">💊 Tratamiento</label><textarea id="medicalTreatment" class="form-control" rows="3">${cita.treatment || ''}</textarea></div><div class="mb-3"><label class="form-label">💉 Medicamentos</label><textarea id="medicalMedications" class="form-control" rows="3">${cita.medications ? cita.medications.join('\n') : ''}</textarea></div><div class="form-check"><input type="checkbox" class="form-check-input" id="sendToPatient" ${cita.sendToPatient ? 'checked' : ''}><label class="form-check-label">Compartir con paciente</label></div></div>`,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        });
        if (formValues) {
            const medications = document.getElementById('medicalMedications').value ? document.getElementById('medicalMedications').value.split('\n').filter(m => m.trim()) : [];
            await updateDoc(doc(db, "appointments", appointmentId), {
                diagnosis: document.getElementById('medicalDiagnosis').value,
                treatment: document.getElementById('medicalTreatment').value,
                medications: medications,
                sendToPatient: document.getElementById('sendToPatient').checked
            });
            Swal.fire('✅ Guardado', 'Nota actualizada', 'success');
            loadAppointmentsRealtime();
        }
    } catch (error) {
        Swal.fire('❌ Error', error.message, 'error');
    }
};

// ============================================
// 9. DASHBOARD
// ============================================

window.refreshDashboard = async function() {
    if (currentUserRole !== 'doctor') return;
    showToast("📊 Actualizando...", "info");
    await loadDashboardData();
    await loadPaymentsData();
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
    } catch (error) {
        console.error("❌ Error dashboard:", error);
    }
}

function calculateStats(appointments) {
    const stats = { total: appointments.length, pendientes: 0, confirmadas: 0, completadas: 0, canceladas: 0, pacientesUnicos: new Set(), porMes: {} };
    appointments.forEach(cita => {
        if (cita.status === 'pendiente') stats.pendientes++;
        else if (cita.status === 'confirmada') stats.confirmadas++;
        else if (cita.status === 'completada') stats.completadas++;
        else if (cita.status === 'cancelada') stats.canceladas++;
        if (cita.patientEmail) stats.pacientesUnicos.add(cita.patientEmail);
        if (cita.date) {
            const monthKey = new Date(cita.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
            stats.porMes[monthKey] = (stats.porMes[monthKey] || 0) + 1;
        }
    });
    stats.pacientesCount = stats.pacientesUnicos.size;
    return stats;
}

function updateKPIs(stats) {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('kpiTotalCitas', stats.total);
    el('kpiConfirmadas', stats.confirmadas + stats.completadas);
    el('kpiPendientes', stats.pendientes);
    el('kpiPacientes', stats.pacientesCount);
}

function updateCharts(stats) {
    const ctx = document.getElementById('appointmentsChart');
    if (!ctx) return;
    if (appointmentsChart) appointmentsChart.destroy();
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = monthNames[date.getMonth()];
        last6Months.push({ label: `${key}`, count: stats.porMes[`${key} ${date.getFullYear().toString().slice(-2)}`] || 0 });
    }
    appointmentsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last6Months.map(m => m.label),
            datasets: [{ label: 'Citas', data: last6Months.map(m => m.count), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', tension: 0.4, fill: true }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function updateRates(stats) {
    const total = stats.confirmadas + stats.completadas + stats.pendientes + stats.canceladas;
    const confirmRate = total > 0 ? ((stats.confirmadas + stats.completadas) / total * 100).toFixed(1) : 0;
    const confirmEl = document.getElementById('confirmationRate');
    const confirmProgress = document.getElementById('confirmationProgress');
    if (confirmEl) confirmEl.textContent = `${confirmRate}%`;
    if (confirmProgress) confirmProgress.style.width = `${confirmRate}%`;
}

// ============================================
// 10. PANEL DE ADMINISTRACIÓN
// ============================================

window.toggleAdminPanel = async function() {
    if (!adminPanel) return;
    const isHidden = adminPanel.classList.contains('d-none');
    adminPanel.classList.toggle('d-none');
    if (isHidden) {
        console.log("🔐 Abriendo panel de admin...");
        await loadAdminData();
    }
};

async function loadAdminData() {
    if (currentUserRole !== 'admin') return;
    try {
        console.log("📊 Cargando datos de admin...");
        const usersSnapshot = await getDocs(collection(db, "users"));
        allUsers = [];
        usersSnapshot.forEach(doc => { allUsers.push({ id: doc.id, ...doc.data() }); });
        const citasSnapshot = await getDocs(collection(db, "appointments"));
        allCitas = [];
        citasSnapshot.forEach(doc => { allCitas.push({ id: doc.id, ...doc.data() }); });
        updateAdminStats();
        renderAdminUsers();
        renderAdminCitas();
        renderAdminPagos();
        setTimeout(() => renderAdminCharts(), 100);
        console.log("✅ Datos de admin cargados");
    } catch (error) {
        console.error("❌ Error cargando datos de admin:", error);
    }
}

function updateAdminStats() {
    const totalUsers = allUsers.length;
    const totalCitas = allCitas.length;
    const totalDoctores = allUsers.filter(u => u.rol === 'doctor').length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let ingresosMes = 0;
    allCitas.forEach(cita => {
        if (cita.paymentStatus === 'paid' && cita.paidAt) {
            const paidDate = cita.paidAt.toDate ? cita.paidAt.toDate() : new Date(cita.paidAt);
            if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                ingresosMes += cita.paidAmount || cita.consultationFee || 0;
            }
        }
    });
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('adminTotalUsers', totalUsers);
    el('adminTotalCitas', totalCitas);
    el('adminIngresos', '$' + ingresosMes.toLocaleString());
    el('adminDoctores', totalDoctores);
}

function renderAdminUsers() {
    const container = document.getElementById('adminUsersList');
    if (!container) return;
    if (allUsers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><h4>Sin usuarios</h4><p class="text-muted">No hay usuarios registrados</p></div>';
        return;
    }
    let html = '';
    allUsers.forEach(user => {
        const roleClass = user.rol === 'admin' ? 'admin' : user.rol === 'doctor' ? 'doctor' : 'paciente';
        const statusClass = user.activo !== false ? 'active' : 'inactive';
        const roleIcon = user.rol === 'admin' ? '👑' : user.rol === 'doctor' ? '👨‍⚕️' : '👤';
        html += `<div class="admin-item"><div class="admin-item-info"><div class="admin-item-title"><span class="me-2">${roleIcon}</span><span>${user.nombre || user.email}</span><span class="role-badge ${roleClass}">${user.rol}</span><span class="status-badge ${statusClass}">${user.activo !== false ? 'Activo' : 'Inactivo'}</span></div><div class="admin-item-subtitle"><i class="bi bi-envelope"></i> ${user.email} • <i class="bi bi-calendar"></i> ${user.fechaRegistro?.toDate ? user.fechaRegistro.toDate().toLocaleDateString() : 'N/A'}</div></div><div class="admin-item-actions"><button class="btn btn-sm btn-outline-primary" onclick="window.editUserRole('${user.id}', '${user.rol}')" title="Cambiar rol"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="window.toggleUserStatus('${user.id}', ${user.activo !== false})" title="${user.activo !== false ? 'Desactivar' : 'Activar'}"><i class="bi bi-${user.activo !== false ? 'lock' : 'unlock'}"></i></button></div></div>`;
    });
    container.innerHTML = html;
}

function renderAdminCitas() {
    const container = document.getElementById('adminCitasList');
    const filter = document.getElementById('adminCitasFilter')?.value || 'all';
    if (!container) return;
    let filteredCitas = allCitas;
    if (filter !== 'all') { filteredCitas = allCitas.filter(c => c.status === filter); }
    if (filteredCitas.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-calendar-x"></i><h4>Sin citas</h4><p class="text-muted">No hay citas para mostrar</p></div>';
        return;
    }
    let html = '';
    filteredCitas.slice(0, 50).forEach(cita => {
        const fecha = new Date(cita.date).toLocaleDateString('es-MX');
        const statusEmoji = cita.status === 'pendiente' ? '⏳' : cita.status === 'confirmada' ? '✅' : cita.status === 'completada' ? '✔️' : '❌';
        const paymentEmoji = cita.paymentStatus === 'paid' ? '💵' : '⏳';
        html += `<div class="admin-item"><div class="admin-item-info"><div class="admin-item-title"><span class="me-2">${statusEmoji}</span><span>${cita.doctor} - ${cita.patientNombre}</span><span class="appointment-badge ${cita.status}">${cita.status}</span><span class="status-badge ${cita.paymentStatus === 'paid' ? 'active' : 'pending'}">${paymentEmoji} ${cita.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}</span></div><div class="admin-item-subtitle"><i class="bi bi-calendar"></i> ${fecha} ${cita.time} • <i class="bi bi-currency-dollar"></i> $${cita.consultationFee || 0}</div></div><div class="admin-item-actions"><button class="btn btn-sm btn-outline-info" onclick="window.viewCitaDetail('${cita.id}')" title="Ver detalle"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-outline-danger" onclick="window.deleteCita('${cita.id}')" title="Eliminar"><i class="bi bi-trash"></i></button></div></div>`;
    });
    container.innerHTML = html;
}

function renderAdminPagos() {
    const container = document.getElementById('adminPagosList');
    if (!container) return;
    const pagosCitas = allCitas.filter(c => c.paymentStatus === 'paid' || c.paymentStatus === 'pending');
    if (pagosCitas.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-cash-coin"></i><h4>Sin pagos</h4><p class="text-muted">No hay registros de pago</p></div>';
        return;
    }
    let html = '';
    pagosCitas.slice(0, 50).forEach(cita => {
        const amount = cita.paidAmount || cita.consultationFee || 0;
        const statusClass = cita.paymentStatus === 'paid' ? 'active' : 'pending';
        const statusEmoji = cita.paymentStatus === 'paid' ? '✅' : '⏳';
        html += `<div class="admin-item"><div class="admin-item-info"><div class="admin-item-title"><span class="me-2">${statusEmoji}</span><span>${cita.patientNombre} - ${cita.doctor}</span><span class="status-badge ${statusClass}">${cita.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}</span></div><div class="admin-item-subtitle"><i class="bi bi-calendar"></i> ${new Date(cita.date).toLocaleDateString('es-MX')} • <i class="bi bi-currency-dollar"></i> $${amount}</div></div><div class="admin-item-actions">${cita.paymentStatus !== 'paid' ? `<button class="btn btn-sm btn-success" onclick="window.markAsPaid('${cita.id}', ${amount})"><i class="bi bi-check-circle"></i> Marcar Pagado</button>` : ''}</div></div>`;
    });
    container.innerHTML = html;
}

function renderAdminCharts() {
    const citasCtx = document.getElementById('adminCitasChart');
    if (citasCtx) {
        if (adminCitasChart) adminCitasChart.destroy();
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const citasPorMes = {};
        allCitas.forEach(cita => {
            const date = new Date(cita.date);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
            citasPorMes[key] = (citasPorMes[key] || 0) + 1;
        });
        adminCitasChart = new Chart(citasCtx, {
            type: 'line',
            data: { labels: Object.keys(citasPorMes), datasets: [{ label: 'Citas', data: Object.values(citasPorMes), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', tension: 0.4, fill: true }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
    const statusCtx = document.getElementById('adminStatusChart');
    if (statusCtx) {
        if (adminStatusChart) adminStatusChart.destroy();
        const statusCount = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 };
        allCitas.forEach(cita => { statusCount[cita.status] = (statusCount[cita.status] || 0) + 1; });
        adminStatusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: { labels: ['Pendiente', 'Confirmada', 'Completada', 'Cancelada'], datasets: [{ data: [statusCount.pendiente, statusCount.confirmada, statusCount.completada, statusCount.cancelada], backgroundColor: ['#f59e0b', '#10b981', '#06b6d4', '#ef4444'], borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

window.editUserRole = async function(userId, currentRole) {
    const newRole = prompt(`Nuevo rol para este usuario (paciente/doctor/admin):`, currentRole);
    if (newRole && ['paciente', 'doctor', 'admin'].includes(newRole)) {
        try {
            await updateDoc(doc(db, "users", userId), { rol: newRole });
            Swal.fire('✅ Rol actualizado', `Usuario ahora es ${newRole}`, 'success');
            loadAdminData();
        } catch (error) {
            Swal.fire('❌ Error', error.message, 'error');
        }
    }
};

window.toggleUserStatus = async function(userId, currentStatus) {
    const confirm = await Swal.fire({
        title: currentStatus ? '¿Desactivar usuario?' : '¿Activar usuario?',
        text: `El usuario ${currentStatus ? 'no podrá' : 'podrá'} acceder al sistema`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
    });
    if (confirm.isConfirmed) {
        try {
            await updateDoc(doc(db, "users", userId), { activo: !currentStatus });
            Swal.fire('✅ Actualizado', `Usuario ${!currentStatus ? 'activado' : 'desactivado'}`, 'success');
            loadAdminData();
        } catch (error) {
            Swal.fire('❌ Error', error.message, 'error');
        }
    }
};

window.viewCitaDetail = async function(citaId) {
    const citaDoc = await getDoc(doc(db, "appointments", citaId));
    if (citaDoc.exists()) {
        const cita = citaDoc.data();
        Swal.fire({
            title: '📋 Detalle de Cita',
            html: `<div class="text-start"><p><strong>👤 Paciente:</strong> ${cita.patientNombre}</p><p><strong>👨‍⚕️ Doctor:</strong> ${cita.doctor}</p><p><strong>📅 Fecha:</strong> ${cita.date} ${cita.time}</p><p><strong>📊 Estado:</strong> ${cita.status}</p><p><strong>💳 Pago:</strong> ${cita.paymentStatus}</p><p><strong>📝 Motivo:</strong> ${cita.reason}</p>${cita.diagnosis ? `<p><strong>📋 Diagnóstico:</strong> ${cita.diagnosis}</p>` : ''}${cita.treatment ? `<p><strong>💊 Tratamiento:</strong> ${cita.treatment}</p>` : ''}</div>`,
            width: '600px'
        });
    }
};

window.deleteCita = async function(citaId) {
    const confirm = await Swal.fire({
        title: '¿Eliminar cita?',
        text: 'Esta acción no se puede deshacer',
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (confirm.isConfirmed) {
        try {
            await deleteDoc(doc(db, "appointments", citaId));
            Swal.fire('✅ Eliminada', 'La cita fue eliminada', 'success');
            loadAdminData();
        } catch (error) {
            Swal.fire('❌ Error', error.message, 'error');
        }
    }
};

window.filterAdminCitas = function() { renderAdminCitas(); };

window.exportPaymentsReport = function() {
    const pagosCitas = allCitas.filter(c => c.paymentStatus === 'paid');
    let csv = 'Fecha,Paciente,Doctor,Monto,Estado\n';
    pagosCitas.forEach(cita => { csv += `${cita.date},${cita.patientNombre},${cita.doctor},${cita.paidAmount || cita.consultationFee},Pagado\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_pagos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    Swal.fire('✅ Exportado', 'Reporte descargado', 'success');
};

// ============================================
// 11. DISPONIBILIDAD
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
        doctorAvailability = fallback;
        return fallback;
    }
}

async function saveDoctorAvailability() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    try {
        await updateDoc(doc(db, "users", currentUserUID), { disponibilidad: doctorAvailability });
        Swal.fire('✅ Guardado', 'Disponibilidad actualizada', 'success');
    } catch (error) {
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
    container.innerHTML = doctorAvailability.blockedDates.map(date => `<div class="blocked-date-badge"><i class="bi bi-calendar-x"></i><span>${date}</span></div>`).join('');
}

function renderBlockedDatesEditor() {
    const container = document.getElementById('blockedDatesEditor');
    if (!container) return;
    if (!doctorAvailability?.blockedDates || doctorAvailability.blockedDates.length === 0) { container.innerHTML = '<small class="text-muted">Sin fechas bloqueadas</small>'; return; }
    container.innerHTML = doctorAvailability.blockedDates.map((date, i) => `<div class="blocked-date-badge"><i class="bi bi-calendar-x"></i><span>${date}</span><button onclick="window.unblockDate(${i})"><i class="bi bi-x-lg"></i></button></div>`).join('');
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
    if (!date) { Swal.fire('⚠️ Fecha requerida', 'Selecciona una fecha', 'warning'); return; }
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    if (!doctorAvailability.blockedDates) doctorAvailability.blockedDates = [];
    if (!doctorAvailability.blockedDates.includes(date)) {
        doctorAvailability.blockedDates.push(date);
        doctorAvailability.blockedDates.sort();
        renderBlockedDatesEditor();
        if (dateInput) dateInput.value = '';
        showToast("Fecha bloqueada", "success");
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
    return timeMinutes >= (startHour * 60 + startMin) && timeMinutes + (dayConfig.slotDuration || 30) <= (endHour * 60 + endMin);
};

// ============================================
// 12. HORARIOS DISPONIBLES
// ============================================

window.loadAvailableSlots = async function() {
    const doctorId = doctorSelect?.value;
    const date = appointmentDateInput?.value;
    const timeSelect = appointmentTimeInput;
    if (dateWarning) dateWarning.classList.add('d-none');
    if (!timeSelect) return;
    if (!doctorId) { timeSelect.innerHTML = '<option value="">Selecciona doctor</option>'; timeSelect.disabled = true; return; }
    if (!date) { timeSelect.innerHTML = '<option value="">Selecciona fecha</option>'; timeSelect.disabled = true; return; }
    const today = new Date().toISOString().split('T')[0];
    if (date < today) { timeSelect.innerHTML = '<option value="">Fecha inválida</option>'; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.textContent = 'Fecha inválida'; } return; }
    await loadDoctorAvailability(doctorId);
    if (!doctorAvailability) doctorAvailability = getDefaultAvailability();
    const dateObj = new Date(date + 'T12:00:00');
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayConfig = doctorAvailability[days[dateObj.getDay()]];
    if (!dayConfig || !dayConfig.enabled) { timeSelect.innerHTML = '<option value="">No disponible</option>'; timeSelect.disabled = true; if (dateWarning) { dateWarning.classList.remove('d-none'); dateWarning.textContent = 'No disponible'; } return; }
    if (doctorAvailability.blockedDates?.includes(date)) { timeSelect.innerHTML = '<option value="">Bloqueado</option>'; timeSelect.disabled = true; return; }
    const slots = generateTimeSlots(dayConfig.startTime, dayConfig.endTime, dayConfig.slotDuration || 30);
    const bookedTimes = await getBookedTimes(doctorId, date);
    timeSelect.innerHTML = '<option value="">Selecciona hora</option>';
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
    timeSelect.disabled = availableCount === 0;
    if (dateWarning) dateWarning.classList.add('d-none');
};

async function getBookedTimes(doctorId, date) {
    try {
        const q = query(collection(db, "appointments"), where("doctorId", "==", doctorId), where("date", "==", date));
        const snapshot = await getDocs(q);
        const bookedTimes = [];
        snapshot.forEach(doc => { const data = doc.data(); if (data.time && (data.status === 'pendiente' || data.status === 'confirmada')) { bookedTimes.push(data.time); } });
        return bookedTimes;
    } catch (error) { return []; }
}

// ============================================
// 13. CARGAR DOCTORES
// ============================================

async function loadDoctors() {
    try {
        if (!doctorSelect) return;
        doctorSelect.innerHTML = '<option value="">Cargando...</option>';
        doctorSelect.disabled = true;
        const snapshot = await getDocs(collection(db, "doctors"));
        doctorsList = [];
        doctorSelect.innerHTML = '<option value="">Seleccionar doctor...</option>';
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
            option.setAttribute('data-fee', data.consultationFee || 500);
            doctorSelect.appendChild(option);
        });
        doctorSelect.disabled = false;
        if (doctorsStatus) doctorsStatus.textContent = `${snapshot.size} doctores`;
    } catch (error) {
        if (doctorSelect) { doctorSelect.innerHTML = '<option value="">Error</option>'; doctorSelect.disabled = false; }
    }
}

// ============================================
// 14. GUARDAR CITA
// ============================================

async function saveAppointment(doctorId, date, time, reason) {
    if (!currentUserUID) { showMessage("❌ Inicia sesión", "danger"); return; }
    const hasPending = await checkPatientPendingPayments();
    if (hasPending) { Swal.fire('⚠️ Pagos Pendientes', 'Debes pagar antes de agendar', 'warning'); return; }
    await loadDoctorAvailability(doctorId);
    if (!window.isDoctorAvailable(date, time)) { Swal.fire('⚠️ No disponible', 'Horario no disponible', 'error'); return; }
    const bookedTimes = await getBookedTimes(doctorId, date);
    if (bookedTimes.includes(time)) { Swal.fire('⚠️ Ocupado', 'Horario ocupado', 'error'); await window.loadAvailableSlots(); return; }
    const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
    const doctorName = selectedOption.getAttribute('data-nombre') || 'Doctor';
    const consultationFee = parseInt(selectedOption.getAttribute('data-fee')) || 500;
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
            paymentStatus: "pending",
            consultationFee: consultationFee,
            createdAt: new Date()
        });
        showMessage("✅ Cita agendada", "success");
        showToast("Cita agendada", "success");
        if (appointmentForm) appointmentForm.reset();
    } catch (error) {
        showMessage("❌ " + error.message, "danger");
    } finally {
        saveAppointmentBtn.disabled = false;
        saveAppointmentBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar Cita';
    }
}

// ============================================
// 15. CALENDARIO
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
    Swal.fire({
        title: `${statusIcons[props.status]} ${event.title}`,
        html: `<div class="text-start"><p><strong>📅 Fecha:</strong> ${event.start.toLocaleDateString('es-MX')}</p><p><strong>⏰ Hora:</strong> ${props.time}</p><p><strong>👨‍⚕️ Doctor:</strong> ${props.doctor}</p><p><strong>📝 Motivo:</strong> ${props.reason}</p></div>`,
        icon: 'info',
        confirmButtonText: 'Cerrar'
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
// 16. CARGAR CITAS
// ============================================

function loadAppointmentsRealtime() {
    if (!currentUserUID) { if (appointmentsList) appointmentsList.innerHTML = '<p class="text-muted text-center">Inicia sesión</p>'; return; }
    if (unsubscribeAppointments) unsubscribeAppointments();
    if (appointmentsList) { appointmentsList.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div>`; }
    if (currentUserRole === 'doctor') { if (appointmentsTitle) appointmentsTitle.textContent = 'Citas de Pacientes'; loadDoctorAppointments(); }
    else { if (appointmentsTitle) appointmentsTitle.textContent = 'Mis Citas'; loadPatientAppointments(); }
}

function loadPatientAppointments() {
    const q = query(collection(db, "appointments"), where("patientId", "==", currentUserUID), orderBy("date", "asc"));
    unsubscribeAppointments = onSnapshot(q, (snapshot) => { renderAppointments(snapshot, false); }, (error) => { console.error("❌ Error paciente:", error); });
}

function loadDoctorAppointments() {
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentUserUID), orderBy("date", "asc"));
    unsubscribeAppointments = onSnapshot(q, (snapshot) => { console.log("✅ Citas doctor:", snapshot.size); renderAppointments(snapshot, true); loadDashboardData(); }, (error) => { console.error("❌ Error doctor:", error); });
}

function renderAppointments(snapshot, isDoctor) {
    if (snapshot.empty) {
        if (appointmentsList) appointmentsList.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><h4>Sin citas</h4><p>${isDoctor ? 'Sin pacientes' : 'Agenda tu primera cita'}</p></div>`;
        if (citasCount) citasCount.textContent = '0 citas';
        if (totalCitasEl) totalCitasEl.textContent = '0';
        if (pendingCitasEl) pendingCitasEl.textContent = '0';
        updateCalendarEvents([]);
        return;
    }
    let html = '';
    let total = 0;
    let pending = 0;
    const appointmentsArray = [];
    snapshot.forEach(docSnap => {
        const c = docSnap.data();
        total++;
        if (c.status === 'pendiente') pending++;
        appointmentsArray.push({ id: docSnap.id, ...c });
        const statusClass = c.status;
        const statusText = c.status.charAt(0).toUpperCase() + c.status.slice(1);
        const fecha = new Date(c.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
        const paymentBadge = c.paymentStatus === 'paid' ? '<span class="badge bg-success ms-2">Pagado</span>' : (c.status === 'completada' ? '<span class="badge bg-warning ms-2">Pendiente</span>' : '');
        const hasMedicalNote = c.diagnosis || c.treatment || (c.medications && c.medications.length > 0);
        const medicalNoteButton = isDoctor ? `<button class="btn btn-sm ${hasMedicalNote ? 'btn-info' : 'btn-outline-info'} flex-grow-1 mt-2" onclick="window.addMedicalNote('${docSnap.id}')"><i class="bi bi-file-earmark-medical me-1"></i>${hasMedicalNote ? 'Editar Nota' : 'Agregar Nota'}</button>` : '';
        const paymentButton = isDoctor && c.status === 'completada' && c.paymentStatus !== 'paid' ? `<button class="btn btn-sm btn-success flex-grow-1 mt-2" onclick="window.markAsPaid('${docSnap.id}', ${c.consultationFee || 500})"><i class="bi bi-cash-coin me-1"></i>Marcar Pagado</button>` : '';
        html += `<div class="appointment-card ${statusClass}"><div class="appointment-header"><div><div class="appointment-doctor">${c.doctor}</div>${isDoctor && c.patientNombre ? `<div class="appointment-patient"><i class="bi bi-person me-1"></i>${c.patientNombre}</div>` : ''}<small class="appointment-specialty">Cita médica</small></div><span class="appointment-badge ${statusClass}">${statusText}</span></div><div class="appointment-details"><div class="detail-item"><i class="bi bi-calendar"></i><div><span class="detail-label">Fecha</span><span class="detail-value">${fecha}</span></div></div><div class="detail-item"><i class="bi bi-clock"></i><div><span class="detail-label">Hora</span><span class="detail-value">${c.time}</span></div></div></div><div class="appointment-reason"><i class="bi bi-card-text me-2"></i>${c.reason}</div><div class="mb-2">${paymentBadge}</div>${renderActionButtons(c, isDoctor, docSnap.id)}${paymentButton}${medicalNoteButton}</div>`;
    });
    if (appointmentsList) appointmentsList.innerHTML = html;
    if (citasCount) citasCount.textContent = `${total} ${total === 1 ? 'cita' : 'citas'}`;
    if (totalCitasEl) totalCitasEl.textContent = total;
    if (pendingCitasEl) pendingCitasEl.textContent = pending;
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

// ============================================
// 17. ADMINISTRACIÓN DE CITAS
// ============================================

window.editAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const appointment = appointmentDoc.data();
        const { value: formValues } = await Swal.fire({
            title: '✏️ Reprogramar',
            html: `<div class="text-start"><label class="form-label">📅 Fecha</label><input type="date" id="editDate" class="form-control" value="${appointment.date}"><label class="form-label mt-2">⏰ Hora</label><input type="time" id="editTime" class="form-control" value="${appointment.time}"><label class="form-label mt-2">📝 Motivo</label><textarea id="editReason" class="form-control" rows="2">${appointment.reason}</textarea></div>`,
            showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const date = document.getElementById('editDate').value;
                const time = document.getElementById('editTime').value;
                const reason = document.getElementById('editReason').value;
                if (!date || !time) { Swal.showValidationMessage('Fecha y hora requeridas'); return false; }
                return { date, time, reason };
            }
        });
        if (formValues) {
            await updateDoc(doc(db, "appointments", appointmentId), { date: formValues.date, time: formValues.time, reason: formValues.reason, status: 'pendiente' });
            Swal.fire('✅ Reprogramada', 'Cita actualizada', 'success');
        }
    } catch (error) { Swal.fire('❌ Error', error.message, 'error'); }
};

window.completeAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const appointment = appointmentDoc.data();
        if (appointment.status === 'completada') { Swal.fire('ℹ️ Ya completada', '', 'info'); return; }
        const confirm = await Swal.fire({ title: '✔️ ¿Completar?', text: `Cita con ${appointment.patientNombre || 'Paciente'}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No' });
        if (confirm.isConfirmed) {
            await updateDoc(doc(db, "appointments", appointmentId), { status: 'completada', completedAt: new Date() });
            Swal.fire('✅ Completada', '', 'success');
            loadAppointmentsRealtime();
        }
    } catch (error) { Swal.fire('❌ Error', error.message, 'error'); }
};

window.cancelAppointment = async function(appointmentId) {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) { Swal.fire('❌ Error', 'Cita no encontrada', 'error'); return; }
        const confirm = await Swal.fire({ title: '❌ ¿Cancelar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No' });
        if (confirm.isConfirmed) {
            await updateDoc(doc(db, "appointments", appointmentId), { status: 'cancelada', cancelledAt: new Date() });
            Swal.fire('✅ Cancelada', '', 'success');
        }
    } catch (error) { Swal.fire('❌ Error', error.message, 'error'); }
};

window.updateStatus = async function(id, status) {
    try {
        await updateDoc(doc(db, "appointments", id), { status: status, updatedAt: new Date() });
        Swal.fire({ icon: 'success', title: `✅ ${status}`, timer: 1500, showConfirmButton: false });
        loadAppointmentsRealtime();
    } catch (error) { Swal.fire('❌ Error', error.message, 'error'); }
};

// ============================================
// 18. PERFIL DOCTOR
// ============================================

async function saveDoctorProfile() {
    if (!currentUserUID || currentUserRole !== 'doctor') return;
    const nombre = doctorNameInput.value.trim();
    const especialidad = doctorSpecialtyInput.value.trim();
    const consultationFee = consultationFeeInput.value.trim() || 500;
    if (!nombre || !especialidad) { Swal.fire('⚠️ Campos vacíos', 'Completa nombre y especialidad', 'warning'); return; }
    try {
        await updateDoc(doc(db, "users", currentUserUID), { nombre, especialidad, consultationFee: parseInt(consultationFee) });
        await setDoc(doc(db, "doctors", currentUserUID), { nombre, especialidad, activo: true, userId: currentUserUID, consultationFee: parseInt(consultationFee) }, { merge: true });
        Swal.fire('✅ Perfil guardado', '', 'success');
        await loadDoctors();
    } catch (error) { Swal.fire('❌ Error', error.message, 'error'); }
}

// ============================================
// 19. AUTH STATE
// ============================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUID = user.uid;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentUserData = userDoc.exists() ? userDoc.data() : {};
        currentUserRole = currentUserData.rol || 'paciente';
        console.log("👤 Usuario:", { uid: currentUserUID, rol: currentUserRole });
        if (welcomeMessage) welcomeMessage.textContent = `Hola, ${currentUserData.nombre || user.email.split('@')[0]} 👋`;
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        if (userRole) userRole.textContent = currentUserRole.toUpperCase();
        if (navRole) { navRole.textContent = currentUserRole.toUpperCase(); navRole.classList.remove('d-none'); }
        if (btnDashboard) btnDashboard.classList.toggle('d-none', currentUserRole !== 'doctor');
        if (btnPayments) btnPayments.classList.toggle('d-none', currentUserRole !== 'doctor');
        if (btnMedicalHistory) btnMedicalHistory.classList.toggle('d-none', currentUserRole !== 'paciente');
        if (btnAdmin) btnAdmin.classList.toggle('d-none', currentUserRole !== 'admin');
        if (currentUserRole === 'doctor') {
            if (patientFormSection) patientFormSection.classList.add('d-none');
            if (doctorPanel) doctorPanel.classList.remove('d-none');
            if (dashboardPanel) dashboardPanel.classList.remove('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.remove('d-none');
            if (doctorStats) doctorStats.classList.remove('d-none');
            if (doctorNameInput && currentUserData.nombre) doctorNameInput.value = currentUserData.nombre;
            if (doctorSpecialtyInput && currentUserData.especialidad) doctorSpecialtyInput.value = currentUserData.especialidad;
            if (consultationFeeInput) consultationFeeInput.value = currentUserData.consultationFee || 500;
            doctorAvailability = currentUserData.disponibilidad || getDefaultAvailability();
            if (!doctorAvailability.blockedDates) doctorAvailability.blockedDates = [];
            renderAvailabilityView();
            await loadDashboardData();
            await loadPaymentsData();
        } else if (currentUserRole === 'admin') {
            if (patientFormSection) patientFormSection.classList.add('d-none');
            if (doctorPanel) doctorPanel.classList.add('d-none');
            if (dashboardPanel) dashboardPanel.classList.add('d-none');
            if (paymentsPanel) paymentsPanel.classList.add('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.add('d-none');
            if (medicalHistoryPanel) medicalHistoryPanel.classList.add('d-none');
            if (adminPanel) adminPanel.classList.remove('d-none');
            await loadAdminData();
        } else {
            if (patientFormSection) patientFormSection.classList.remove('d-none');
            if (doctorPanel) doctorPanel.classList.add('d-none');
            if (dashboardPanel) dashboardPanel.classList.add('d-none');
            if (paymentsPanel) paymentsPanel.classList.add('d-none');
            if (adminPanel) adminPanel.classList.add('d-none');
            if (doctorAvailabilityPanel) doctorAvailabilityPanel.classList.add('d-none');
            if (doctorStats) doctorStats.classList.add('d-none');
            await loadDoctors();
            await checkPatientPendingPayments();
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
        hasPendingPayments = false;
        if (unsubscribeAppointments) unsubscribeAppointments();
        if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; }
        if (appointmentsChart) { appointmentsChart.destroy(); appointmentsChart = null; }
        if (paymentsChart) { paymentsChart.destroy(); paymentsChart = null; }
        if (adminCitasChart) { adminCitasChart.destroy(); adminCitasChart = null; }
        if (adminStatusChart) { adminStatusChart.destroy(); adminStatusChart = null; }
        if (welcomePanel) welcomePanel.classList.add('d-none');
        if (authSection) authSection.classList.remove('d-none');
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnDashboard) btnDashboard.classList.add('d-none');
        if (btnPayments) btnPayments.classList.add('d-none');
        if (btnMedicalHistory) btnMedicalHistory.classList.add('d-none');
        if (btnAdmin) btnAdmin.classList.add('d-none');
        if (navRole) navRole.classList.add('d-none');
        if (authMessage) authMessage.classList.add('d-none');
    }
});

// ============================================
// 20. EVENT LISTENERS
// ============================================

if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); const email = emailInput.value.trim(); const password = passwordInput.value; if (isRegisterMode) { const selectedRole = document.querySelector('input[name="userRole"]:checked').value; registerUser(email, password, selectedRole); } else { loginUser(email, password); } });
if (btnGoogle) btnGoogle.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logoutUser);
if (btnDashboard) btnDashboard.addEventListener('click', () => { if (dashboardPanel) dashboardPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
if (btnPayments) btnPayments.addEventListener('click', window.togglePaymentsPanel);
if (btnAdmin) btnAdmin.addEventListener('click', window.toggleAdminPanel);
if (btnMedicalHistory) btnMedicalHistory.addEventListener('click', window.toggleMedicalHistory);
if (toggleRegister) toggleRegister.addEventListener('click', (e) => { e.preventDefault(); isRegisterMode = !isRegisterMode; if (formTitle) formTitle.textContent = isRegisterMode ? 'Crear Cuenta' : 'Bienvenido'; if (submitBtn) submitBtn.innerHTML = isRegisterMode ? '<i class="bi bi-person-plus me-2"></i>Registrarse' : '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión'; if (toggleRegister) toggleRegister.textContent = isRegisterMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'; if (roleSelectContainer) roleSelectContainer.classList.toggle('d-none', !isRegisterMode); if (authMessage) authMessage.classList.add('d-none'); });
if (appointmentForm) appointmentForm.addEventListener('submit', (e) => { e.preventDefault(); const today = new Date().toISOString().split('T')[0]; const date = appointmentDateInput.value; if (date < today) { Swal.fire('⚠️ Fecha inválida', 'No puedes agendar en el pasado', 'warning'); return; } const doctorId = doctorSelect.value; if (!doctorId) { Swal.fire('⚠️ Doctor requerido', 'Selecciona un doctor', 'warning'); return; } const time = appointmentTimeInput.value; if (!time) { Swal.fire('⚠️ Hora requerida', 'Selecciona una hora', 'warning'); return; } const reason = appointmentReasonInput ? appointmentReasonInput.value.trim() : ''; saveAppointment(doctorId, date, time, reason); });
if (doctorProfileForm) doctorProfileForm.addEventListener('submit', (e) => { e.preventDefault(); saveDoctorProfile(); });
if (patientMedicalInfoForm) patientMedicalInfoForm.addEventListener('submit', (e) => { e.preventDefault(); savePatientMedicalInfo(); });
window.addEventListener('beforeunload', () => { if (unsubscribeAppointments) unsubscribeAppointments(); if (calendarInstance) { calendarInstance.destroy(); calendarInstance = null; } if (appointmentsChart) { appointmentsChart.destroy(); appointmentsChart = null; } if (paymentsChart) { paymentsChart.destroy(); paymentsChart = null; } if (adminCitasChart) { adminCitasChart.destroy(); adminCitasChart = null; } if (adminStatusChart) { adminStatusChart.destroy(); adminStatusChart = null; } });

console.log("🚀 ========================================");
console.log("🚀 MediCare Pro v12.0 - COMPLETO");
console.log("✅ 3 Actores: Paciente/Doctor/Admin");
console.log("✅ Todas las funciones operativas");
console.log("🚀 ========================================");