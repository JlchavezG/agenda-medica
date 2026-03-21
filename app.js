// ============================================
// 1. IMPORTAR FUNCIONES DE FIREBASE
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
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
// 2. TU CONFIGURACIÓN DE FIREBASE
// ============================================
// ⚠️ REEMPLAZA ESTO CON LO QUE COPIASTE DE FIREBASE CONSOLE ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyDd6t8hnXa1O133pS-liPEEZMfwa2lpno4",
    authDomain: "agenda-medica-app-66f57.firebaseapp.com",
    projectId: "agenda-medica-app-66f57",
    storageBucket: "agenda-medica-app-66f57.firebasestorage.app",
    messagingSenderId: "495304456103",
    appId: "1:495304456103:web:92c24773173b9ea5012882"
};
// ⚠️ FIN DE TU CONFIGURACIÓN ⚠️

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

// Variable para saber si estamos en modo registro o login
let isRegisterMode = false;

// ============================================
// 5. FUNCIÓN PARA REGISTRAR USUARIO (EMAIL/PASSWORD)
// ============================================
async function registerUser(email, password) {
    try {
        // Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Guardar información adicional en Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            rol: "paciente", // Por defecto todos son pacientes
            nombre: email.split('@')[0], // Tomamos la parte antes del @
            telefono: "",
            fechaRegistro: new Date()
        });
        
        alert("✅ Usuario registrado con éxito");
        console.log("Usuario registrado:", user.email);
        
    } catch (error) {
        console.error("Error en registro:", error);
        alert("❌ Error: " + error.message);
    }
}

// ============================================
// 6. FUNCIÓN PARA INICIAR SESIÓN (EMAIL/PASSWORD)
// ============================================
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        alert("✅ Bienvenido: " + user.email);
        console.log("Usuario logueado:", user.email);
        
    } catch (error) {
        console.error("Error en login:", error);
        alert("❌ Error: " + error.message);
    }
}

// ============================================
// 7. FUNCIÓN PARA LOGIN CON GOOGLE
// ============================================
async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Verificar si el usuario ya existe en Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            // Si es la primera vez, crear documento en Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                nombre: user.displayName,
                foto: user.photoURL,
                rol: "paciente",
                telefono: "",
                proveedor: "google",
                fechaRegistro: new Date()
            });
            console.log("Usuario nuevo creado en Firestore");
        } else {
            console.log("Usuario ya existía en Firestore");
        }
        
        alert("✅ Bienvenido con Google: " + user.email);
        
    } catch (error) {
        console.error("Error en Google Login:", error);
        alert("❌ Error con Google: " + error.message);
    }
}

// ============================================
// 8. FUNCIÓN PARA CERRAR SESIÓN
// ============================================
async function logoutUser() {
    try {
        await signOut(auth);
        alert("👋 Sesión cerrada");
        window.location.reload(); // Recargar página
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

// ============================================
// 9. ESCUCHAR CAMBIOS DE AUTENTICACIÓN
// ============================================
// Esta función se ejecuta cada vez que el estado del usuario cambia
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuario está logueado
        console.log("Usuario activo:", user.email);
        
        // Mostrar panel de bienvenida
        welcomePanel.classList.remove('d-none');
        loginForm.parentElement.parentElement.classList.add('d-none');
        btnLogout.classList.remove('d-none');
        
        // Obtener datos del usuario de Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            welcomeMessage.textContent = `Hola, ${userData.nombre || user.email}`;
        } else {
            welcomeMessage.textContent = `Hola, ${user.email}`;
        }
        
    } else {
        // Usuario NO está logueado
        console.log("No hay usuario activo");
        
        // Mostrar formulario de login
        welcomePanel.classList.add('d-none');
        loginForm.parentElement.parentElement.classList.remove('d-none');
        btnLogout.classList.add('d-none');
    }
});

// ============================================
// 10. EVENT LISTENERS (BOTONES Y FORMULARIOS)
// ============================================

// Submit del formulario (Login o Registro)
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

// Botón de Google
btnGoogle.addEventListener('click', loginWithGoogle);

// Botón de Logout
btnLogout.addEventListener('click', logoutUser);

// Cambiar entre Login y Registro
toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    
    if (isRegisterMode) {
        toggleRegister.textContent = "¿Ya tienes cuenta? Por favor Inicia sesión";
        loginForm.querySelector('h3').textContent = "Registro de Usuario";
        loginForm.querySelector('button[type="submit"]').textContent = "Registrarse";
    } else {
        toggleRegister.textContent = "¿No tienes cuenta? Regístrate aquí";
        loginForm.querySelector('h3').textContent = "Acceso Usuarios";
        loginForm.querySelector('button[type="submit"]').textContent = "Ingresar";
    }
});

console.log("🔥 App.js cargado correctamente");