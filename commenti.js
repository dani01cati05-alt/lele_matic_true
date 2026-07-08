// ============================================================
// FIREBASE — i commenti sono condivisi tra tutti i visitatori
// tramite Firestore (non più solo nel browser di chi scrive).
// SDK caricato via CDN in formato ESM: nessun bundler necessario,
// coerente con il resto del sito che non ha uno step di build.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyARruJt08AsQREXmEZ-kdCgbMCpSYDgUWU",
    authDomain: "lele-matic-true.firebaseapp.com",
    projectId: "lele-matic-true",
    storageBucket: "lele-matic-true.firebasestorage.app",
    messagingSenderId: "829792966186",
    appId: "1:829792966186:web:0c1281fa62bea583d85553",
    measurementId: "G-WDTKZYDJJG"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const commentsRef = collection(db, 'comments');

document.addEventListener('DOMContentLoaded', () => {
    // === INVERSIONE COLORI (stessa logica di index.html) ===
    const toggleBtn = document.getElementById('toggle-colors');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
        });
    }

    // ============================================================
    // USERNAME (si imposta una sola volta)
    // Salvato in localStorage: la prima volta che si apre questa
    // pagina su un browser viene chiesto un nome, poi resta fisso
    // per tutti i commenti successivi. Per resettarlo in fase di
    // test, da console: localStorage.removeItem('lelematic_username')
    // ============================================================
    const USERNAME_KEY = 'lelematic_username';

    const usernameGate = document.getElementById('username-gate');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username-input');
    // Mostrato sulla barra commenti in basso, sotto "Chatting as"
    const currentUsernameLabel = document.getElementById('bar-username');

    function getUsername() {
        return localStorage.getItem(USERNAME_KEY);
    }

    function initUsername() {
        const existing = getUsername();
        if (existing) {
            currentUsernameLabel.textContent = existing;
            usernameGate.classList.remove('active');
        } else {
            usernameGate.classList.add('active');
            usernameInput.focus();
        }
    }

    usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = usernameInput.value.trim();
        if (!name) return;

        localStorage.setItem(USERNAME_KEY, name);
        currentUsernameLabel.textContent = name;
        usernameGate.classList.remove('active');
    });

    // ============================================================
    // COMMENTI
    // Salvati su Firestore (collection "comments"): condivisi in
    // tempo reale tra tutti i visitatori del sito, non più solo nel
    // browser di chi scrive.
    // ============================================================
    const commentBar = document.getElementById('comment-bar');
    const commentTextInput = document.getElementById('comment-text');
    const list = document.getElementById('comment-list');
    const emptyMsg = document.getElementById('comment-empty');

    function formatDate(timestamp) {
        // Il commento appena inviato arriva prima con timestamp lato
        // client nullo (in attesa di conferma dal server), poi Firestore
        // aggiorna in automatico lo snapshot col valore reale.
        if (!timestamp) return 'Invio in corso...';
        const d = timestamp.toDate();
        return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }

    function renderComments(comments) {
        list.innerHTML = '';
        emptyMsg.style.display = comments.length ? 'none' : 'block';

        comments.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';

            const header = document.createElement('div');
            header.className = 'comment-item-header';

            // Nome utente evidenziato (badge rosso, vedi .comment-item-name in commenti.css)
            const name = document.createElement('span');
            name.className = 'comment-item-name';
            name.textContent = comment.name;

            // Orario di invio
            const date = document.createElement('span');
            date.className = 'comment-item-date';
            date.textContent = formatDate(comment.date);

            header.appendChild(name);
            header.appendChild(date);

            const text = document.createElement('p');
            text.className = 'comment-item-text';
            text.textContent = comment.text;

            item.appendChild(header);
            item.appendChild(text);
            list.appendChild(item);
        });
    }

    // Ascolta in tempo reale: ogni nuovo commento (da chiunque) appare
    // subito a tutti senza bisogno di ricaricare la pagina.
    const commentsQuery = query(commentsRef, orderBy('date', 'desc'));
    onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map(doc => doc.data());
        renderComments(comments);
    });

    // L'input della barra è un <input> singolo dentro un <form> col
    // bottone di invio: Invio da tastiera e click su "Send Message"
    // fanno entrambi submit del form, nessun codice extra necessario.
    commentBar.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = getUsername();
        const text = commentTextInput.value.trim();
        if (!name || !text) return;

        commentTextInput.value = '';
        commentTextInput.focus();

        await addDoc(commentsRef, { name, text, date: serverTimestamp() });
    });

    initUsername();
});
