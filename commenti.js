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
    // Salvati in locale nel browser di chi scrive (nessun server
    // dietro questo sito): restano visibili solo su quel dispositivo.
    // ============================================================
    const COMMENTS_KEY = 'lelematic_comments';

    const commentBar = document.getElementById('comment-bar');
    const commentTextInput = document.getElementById('comment-text');
    const list = document.getElementById('comment-list');
    const emptyMsg = document.getElementById('comment-empty');

    function loadComments() {
        try {
            const saved = JSON.parse(localStorage.getItem(COMMENTS_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function saveComments(comments) {
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }

    function renderComments() {
        const comments = loadComments();
        list.innerHTML = '';
        emptyMsg.style.display = comments.length ? 'none' : 'block';

        // Più recenti in cima
        comments.slice().reverse().forEach(comment => {
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

    // L'input della barra è un <input> singolo dentro un <form> col
    // bottone di invio: Invio da tastiera e click su "Send Message"
    // fanno entrambi submit del form, nessun codice extra necessario.
    commentBar.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = getUsername();
        const text = commentTextInput.value.trim();
        if (!name || !text) return;

        const comments = loadComments();
        comments.push({ name, text, date: new Date().toISOString() });
        saveComments(comments);

        commentTextInput.value = '';
        commentTextInput.focus();
        renderComments();
    });

    initUsername();
    renderComments();
});
