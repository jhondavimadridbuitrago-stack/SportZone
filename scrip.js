
// Disuadir la inspección casual desde la interfaz.
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

document.addEventListener('keydown', function (event) {
    const key = event.key.toLowerCase();
    const blockedShortcut = event.ctrlKey && ['u', 's'].includes(key);
    const blockedDevToolsShortcut = event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key);

    if (key === 'f12' || blockedShortcut || blockedDevToolsShortcut) {
        event.preventDefault();
        event.stopPropagation();
    }
});

// --- TEMA OSCURO/CLARO ---
const THEME_STORAGE_KEY = 'sportzone_theme';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
        body.classList.remove('dark-mode');
        themeIcon.textContent = '🌙';
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

// Agregar evento al botón de tema cuando la página carga
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadPendingRegistrations();
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
});

// --- BASE DE DATOS LOCAL SIMULADA (MOCK DATA) ---
let currentRole = 'invitado';

// Separar tablas por torneo/disciplina
let leaderboards = {
    Futbol: [
        { pos: 1, name: "11° A (Los Cracks)", pj: 3, pg: 3, pp: 0, pts: 9 },
        { pos: 2, name: "10° B (F.C. Alumnos)", pj: 3, pg: 2, pp: 1, pts: 6 }
    ],
    Baloncesto: [
        { pos: 1, name: "9° A (Sporting)", pj: 2, pg: 2, pp: 0, pts: 6 },
        { pos: 2, name: "9° B (Raptors)", pj: 2, pg: 0, pp: 2, pts: 0 }
    ],
    Voleibol: [
        { pos: 1, name: "Prom 2026", pj: 1, pg: 1, pp: 0, pts: 3 },
        { pos: 2, name: "Profesores", pj: 1, pg: 0, pp: 1, pts: 0 }
    ]
};

// Tabla de goleadores por torneo
let topScorers = {
    Futbol: [
        { name: 'Juan Pérez', team: '11° A', goals: 5 },
        { name: 'Luis Gómez', team: '10° B', goals: 3 }
    ],
    Baloncesto: [
        { name: 'Carlos Ruiz', team: '9° A', goals: 12 },
        { name: 'Pablo Díaz', team: '9° B', goals: 8 }
    ],
    Voleibol: [
        { name: 'María López', team: 'Prom 2026', goals: 7 },
        { name: 'Ana Torres', team: 'Profesores', goals: 4 }
    ]
};

let selectedTournament = 'Futbol';

const SPORT_LABELS = {
    Futbol: 'Fútbol Sala',
    Baloncesto: 'Baloncesto',
    Voleibol: 'Voleibol'
};

function getSelectedSportLabel() {
    return SPORT_LABELS[selectedTournament] || selectedTournament;
}

// Inscripciones pendientes para revisión por el profesor
let pendingRegistrations = [];
const REGISTRATIONS_API = 'api.php';

function applyDatabaseState(data) {
    if (data.leaderboards) leaderboards = data.leaderboards;
    if (data.topScorers) topScorers = data.topScorers;
    if (Array.isArray(data.upcomingMatches)) upcomingMatches = data.upcomingMatches;
    if (Array.isArray(data.playedMatches)) playedMatches = data.playedMatches;
    if (Array.isArray(data.registrations)) pendingRegistrations = data.registrations;
}

async function loadDatabaseState() {
    try {
        const response = await fetch(REGISTRATIONS_API);
        if (!response.ok) throw new Error('No se pudieron cargar los datos de MySQL.');
        applyDatabaseState(await response.json());
        renderLeaderboard();
        renderTopScorers();
        renderCalendar();
        renderPlayedMatches();
        notifyProfessor();
    } catch (error) {
        console.error(error);
    }
}

async function persistMockData() {
    try {
        const response = await fetch(REGISTRATIONS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync',
                leaderboards,
                topScorers,
                upcomingMatches,
                playedMatches
            })
        });
        if (!response.ok) throw new Error('No se pudieron guardar los cambios en MySQL.');
    } catch (error) {
        console.error(error);
        alert('Los cambios se muestran en pantalla, pero no se pudieron guardar en MySQL.');
    }
}

async function loadPendingRegistrations() {
    try {
        const response = await fetch(REGISTRATIONS_API);
        if (!response.ok) throw new Error('No se pudieron cargar las inscripciones.');
        const data = await response.json();
        if (data.registrations) pendingRegistrations = data.registrations;
        notifyProfessor();
    } catch (error) {
        console.error(error);
        pendingRegistrations = [];
        notifyProfessor();
    }
}

let upcomingMatches = [
    {
        home: '10° B',
        away: '11° A',
        sport: 'Fútbol Sala',
        phase: 'Octavos',
        date: '2026-05-27',
        time: '10:30',
        location: 'Cancha Municipal Norte',
        result: '2 - 1',
        mvp: 'Mateo Silva'
    },
    {
        home: '9° A',
        away: '9° B',
        sport: 'Baloncesto',
        phase: 'Cuartos',
        date: '2026-05-29',
        time: '08:00',
        location: 'Gimnasio Escolar',
        result: '74 - 68',
        mvp: 'Carlos Ruiz'
    },
    {
        home: 'Prom 2026',
        away: 'Profesores',
        sport: 'Voleibol',
        phase: 'Semifinal',
        date: '2026-06-01',
        time: '12:30',
        location: 'Pabellón de Voleibol',
        result: '3 - 2',
        mvp: 'María López'
    }
];

let playedMatches = [
    {
        home: '11° A',
        away: '9° B',
        sport: 'Fútbol Sala',
        phase: 'Cuartos',
        date: '2026-05-18',
        time: '09:15',
        location: 'Cancha Sur',
        result: '4 - 2',
        mvp: 'Juan Pérez'
    },
    {
        home: '10° A',
        away: '9° A',
        sport: 'Baloncesto',
        phase: 'Semifinal',
        date: '2026-05-16',
        time: '18:00',
        location: 'Gimnasio Central',
        result: '61 - 57',
        mvp: 'Carlos Ruiz'
    },
    {
        home: 'Profesores',
        away: 'Prom 2026',
        sport: 'Voleibol',
        phase: 'Final',
        date: '2026-05-12',
        time: '15:00',
        location: 'Pabellón de Voleibol',
        result: '3 - 1',
        mvp: 'María López'
    }
];

let editingMatchIndex = null;
const CALENDAR_STORAGE_KEY = 'sportzone_upcoming_matches';

function loadCalendarFromStorage() {
    try {
        const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                upcomingMatches = parsed;
            }
        }
    } catch (error) {
        console.warn('No se pudo cargar el calendario guardado.', error);
    }
}

function saveCalendarChanges() {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden guardar cambios en el calendario.');
        return;
    }

    persistMockData();
    alert('✅ Cambios en el calendario guardados correctamente.');
}

function userIsProfessor() {
    return currentRole === 'profesor';
}

function updateCalendarEditorVisibility() {
    const editor = document.querySelector('.calendar-actions');
    const saveBtn = document.getElementById('calendar-save-btn');
    const form = document.getElementById('add-match-form');
    const fields = form ? form.querySelectorAll('input, select, button') : [];
    const isProfessor = userIsProfessor();

    if (editor) {
        editor.style.display = isProfessor ? 'block' : 'none';
    }

    if (saveBtn) {
        saveBtn.style.display = isProfessor ? 'inline-block' : 'none';
    }

    fields.forEach((field) => {
        if (field.id === 'match-submit-btn' || field.id === 'match-cancel-btn') {
            field.style.display = isProfessor ? '' : 'none';
        }
        if (field.id !== 'match-index') {
            field.disabled = !isProfessor;
            field.readOnly = !isProfessor;
        }
    });

    const mvpInput = document.getElementById('match-mvp');
    if (mvpInput) {
        mvpInput.style.display = 'block';
        mvpInput.style.opacity = '1';
        mvpInput.disabled = !isProfessor;
        mvpInput.readOnly = !isProfessor;
        mvpInput.placeholder = isProfessor ? 'Ej. Mateo Silva' : 'Solo el profesor puede editar este campo';
        if (!isProfessor && !mvpInput.value.trim()) {
            mvpInput.value = 'Sin registrar';
        }
    }
}

// --- SISTEMA DE NAVEGACIÓN (Single Page Application) ---
function showPage(pageId) {
    // Quitar clase activa de todas las páginas y enlaces del menú
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
    document.querySelectorAll('#main-nav a').forEach(nav => nav.classList.remove('active'));
    
    // Activar la página y el botón del menú correspondiente
    document.getElementById(`page-${pageId}`).classList.add('active-page');
    document.getElementById(`nav-${pageId}`).classList.add('active');
}


// --- CONTROL DE PERMISOS Y ROLES ---
function setRole(role) {
    currentRole = role;
    const bannerText = document.getElementById('current-role-text');
    const banner = document.getElementById('role-banner');

    if (role === 'estudiante') {
        bannerText.innerText = "Estudiante (Permisos de lectura y registro)";
        banner.style.backgroundColor = "#e0f7fa";
        bannerText.style.color = "#006064";
    } else if (role === 'profesor') {
        bannerText.innerText = "Profesor de Ed. Física (Permisos totales / Edición)";
        banner.style.backgroundColor = "#fbe9e7";
        bannerText.style.color = "#d84315";
    }

    // Mostrar/ocultar UI de profesor
    const addScorerBox = document.getElementById('add-scorer-box');
    if (addScorerBox) addScorerBox.style.display = (role === 'profesor') ? 'block' : 'none';

    renderLeaderboard();
    renderTopScorers();
    renderCalendar();
    renderPlayedMatches();
    updateCalendarEditorVisibility();
    notifyProfessor();
    showPage('posiciones');
}

function logout() {
    currentRole = 'invitado';
    document.getElementById('current-role-text').innerText = "Invitado (Por favor selecciona una zona en Inicio)";
    document.getElementById('role-banner').style.backgroundColor = "#e3f2fd";
    document.getElementById('role-banner').style.color = "#0d47a1";
    renderLeaderboard();
    renderTopScorers();
    renderCalendar();
    renderPlayedMatches();
    updateCalendarEditorVisibility();
    notifyProfessor();
    const addScorerBox = document.getElementById('add-scorer-box');
    if (addScorerBox) addScorerBox.style.display = 'none';
    // Restablecer al modo claro
    applyTheme('light');
    showPage('inicio');
}

// --- LÓGICA DE LA TABLA DE POSICIONES INTERACTIVA ---
// Renderizar tabla para el torneo seleccionado
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const msg = document.getElementById('table-permission-msg');
    const saveBtn = document.getElementById('save-table-btn');
    tbody.innerHTML = '';

    const data = leaderboards[selectedTournament] || [];

    if (currentRole === 'profesor') {
        msg.innerText = `📝 Editando: ${selectedTournament}. Modifica campos y presiona Guardar.`;
        msg.style.color = '#ff5722';
        msg.style.fontWeight = 'bold';
        saveBtn.style.display = 'inline-block';
    } else {
        msg.innerText = `👁️ Vista: ${selectedTournament} (Lectura).`;
        msg.style.color = document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#666';
        msg.style.fontWeight = 'normal';
        saveBtn.style.display = 'none';
    }

    data.forEach((team, index) => {
        const tr = document.createElement('tr');
        const idPrefix = `${selectedTournament}-${index}`;

        if (currentRole === 'profesor') {
            tr.innerHTML = `
                <td>${team.pos}</td>
                <td><strong>${team.name}</strong></td>
                <td><input type="number" class="editable-input" id="${idPrefix}-pj" value="${team.pj}"></td>
                <td><input type="number" class="editable-input" id="${idPrefix}-pg" value="${team.pg}" onchange="recalculatePoints(${index})"></td>
                <td><input type="number" class="editable-input" id="${idPrefix}-pp" value="${team.pp}"></td>
                <td><input type="number" class="editable-input" id="${idPrefix}-pts" value="${team.pts}" readonly style="opacity: 0.7;"></td>
                <td><button class="btn btn-danger" onclick="deleteTeam(${index})">Eliminar</button></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${team.pos}</td>
                <td><strong>${team.name}</strong></td>
                <td>${team.pj}</td>
                <td>${team.pg}</td>
                <td>${team.pp}</td>
                <td><strong>${team.pts} PTS</strong></td>
                <td></td>
            `;
        }

        tbody.appendChild(tr);
    });
}

function deleteTeam(index) {
    if (currentRole !== 'profesor') {
        alert('Solo los profesores pueden eliminar equipos.');
        return;
    }
    if (!confirm('¿Seguro que deseas eliminar este equipo?')) return;

    const arr = leaderboards[selectedTournament];
    arr.splice(index, 1);
    arr.forEach((t, i) => t.pos = i + 1);
    persistMockData();
    renderLeaderboard();
    alert('✅ Equipo eliminado con éxito.');
}

// Recalcular puntos automáticamente al editar victorias (3 pts por victoria)
function recalculatePoints(index) {
    const idPrefix = `${selectedTournament}-${index}`;
    const pgValue = parseInt(document.getElementById(`${idPrefix}-pg`).value) || 0;
    document.getElementById(`${idPrefix}-pts`).value = pgValue * 3;
}

function saveLeaderboard() {
    if (currentRole !== 'profesor') return;

    const arr = leaderboards[selectedTournament];
    arr.forEach((team, index) => {
        const idPrefix = `${selectedTournament}-${index}`;
        team.pj = parseInt(document.getElementById(`${idPrefix}-pj`).value) || 0;
        team.pg = parseInt(document.getElementById(`${idPrefix}-pg`).value) || 0;
        team.pp = parseInt(document.getElementById(`${idPrefix}-pp`).value) || 0;
        team.pts = parseInt(document.getElementById(`${idPrefix}-pts`).value) || 0;
    });

    arr.sort((a, b) => b.pts - a.pts);
    arr.forEach((team, idx) => team.pos = idx + 1);

    persistMockData();
    alert('¡Tabla de posiciones actualizada y reordenada con éxito!');
    renderLeaderboard();
}

// --- LÓGICA DE INSCRIPCIÓN DE NUEVOS EQUIPOS ---
async function registerTeam(event) {
    event.preventDefault();
    const name = document.getElementById('team-name').value;
    const sport = document.getElementById('sport').value;
    const captain = document.getElementById('captain').value;

    const msgDiv = document.getElementById('reg-message');
    try {
        const response = await fetch(REGISTRATIONS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sport, captain })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo guardar la inscripción.');

        msgDiv.innerText = `✅ Inscripción enviada: El equipo "${name}" será revisado por un profesor.`;
        await loadPendingRegistrations();
    } catch (error) {
        msgDiv.innerText = `❌ ${error.message} Verifica que el servidor PHP esté activo.`;
        return;
    }

    document.getElementById('registration-form').reset();
    notifyProfessor();
}

// Renderizar goleadores para el torneo seleccionado
function renderTopScorers() {
    const tbody = document.getElementById('top-scorers-body');
    tbody.innerHTML = '';
    const arr = topScorers[selectedTournament] || [];
    // Mostrar u ocultar la cabecera 'Acciones' según el rol
    const headerThs = document.querySelectorAll('#top-scorers thead th');
    headerThs.forEach(th => {
        try {
            if (th.textContent.trim().toLowerCase() === 'acciones') {
                th.style.display = (currentRole === 'profesor') ? '' : 'none';
            }
        } catch (e) { /* ignorar */ }
    });
    // Ordenar por goles descendente antes de mostrar (mayor a menor)
    arr.sort((a, b) => b.goals - a.goals);
    arr.forEach((player, idx) => {
        const tr = document.createElement('tr');
        // Mostrar botón de eliminar solo para profesores (si no es profesor, no añadimos la celda de acciones)
        if (currentRole === 'profesor') {
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${player.name}</td>
                <td>${player.team}</td>
                <td>${player.goals}</td>
                <td><button class="btn btn-danger" onclick="deleteTopScorer(${idx})">Eliminar</button></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${player.name}</td>
                <td>${player.team}</td>
                <td>${player.goals}</td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function deleteTopScorer(index) {
    if (currentRole !== 'profesor') {
        alert('Solo los profesores pueden eliminar goleadores.');
        return;
    }
    const arr = topScorers[selectedTournament] || [];
    const player = arr[index];
    if (!player) return;
    if (!confirm(`¿Eliminar a ${player.name} (${player.team}) de la tabla de goleadores?`)) return;
    arr.splice(index, 1);
    persistMockData();
    renderTopScorers();
    alert('Goleador eliminado correctamente.');
}

function onTournamentChange() {
    const sel = document.getElementById('tournament-select');
    selectedTournament = sel.value;
    renderLeaderboard();
    renderTopScorers();
    renderCalendar();
    renderPlayedMatches();
    updateFutsalGalleryVisibility();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sportLabel = getSelectedSportLabel();
    const filteredMatches = upcomingMatches.filter(match => match.sport === sportLabel);

    filteredMatches.forEach((match, index) => {
        const isNext = index === 0;
        const card = document.createElement('div');
        card.className = `match-card${isNext ? ' next-match' : ''}`;
        card.innerHTML = `
            <span class="match-badge ${isNext ? '' : 'badge-neutral'}">${isNext ? 'PRÓXIMO PARTIDO 🔥' : match.phase}</span>
            <div class="match-teams">${match.home} vs ${match.away}</div>
            <p><strong>Deporte:</strong> ${match.sport}</p>
            <p><strong>Fase:</strong> ${match.phase}</p>
            <p><strong>Fecha:</strong> ${formatDate(match.date)}</p>
            <p><strong>Hora:</strong> ${formatTime(match.time)}</p>
            <p><strong>Lugar:</strong> ${match.location || 'Sin registrar'}</p>
            <p><strong>Resultado:</strong> ${match.result || 'Pendiente'}</p>
            <p><strong>MVP:</strong> ${match.mvp || 'Sin registrar'}</p>
            ${userIsProfessor() ? `
            <div class="match-actions">
                <button class="btn btn-secondary" type="button" onclick="startMatchEdit(${index})">Editar</button>
                <button class="btn btn-success" type="button" onclick="markMatchAsPlayed(${index})">Marcar como jugado</button>
                <button class="btn btn-danger" type="button" onclick="deleteUpcomingMatch(${index})">Eliminar</button>
            </div>
        ` : ''}
        `;
        grid.appendChild(card);
    });

    if (filteredMatches.length === 0) {
        grid.innerHTML = '<p>No hay partidos próximos para esta disciplina.</p>';
    }
}

function renderPlayedMatches() {
    const grid = document.getElementById('played-matches-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sportLabel = getSelectedSportLabel();
    const filteredMatches = playedMatches.filter(match => match.sport === sportLabel);

    filteredMatches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <span class="match-badge badge-neutral">${match.phase}</span>
            <div class="match-teams">${match.home} vs ${match.away}</div>
            <p><strong>Deporte:</strong> ${match.sport}</p>
            <p><strong>Fecha:</strong> ${formatDate(match.date)}</p>
            <p><strong>Resultado:</strong> ${match.result || 'Sin registrar'}</p>
            <p><strong>Lugar:</strong> ${match.location || 'Sin registrar'}</p>
            <p><strong>MVP:</strong> ${match.mvp || 'Sin registrar'}</p>
            ${userIsProfessor() ? `
                <div class="match-actions">
                    <button class="btn btn-secondary" type="button" onclick="editPlayedMatch(${index})">Editar</button>
                    <button class="btn btn-warning" type="button" onclick="restorePlayedMatch(${index})">Marcar como próximo</button>
                </div>
            ` : ''}
        `;
        grid.appendChild(card);
    });

    if (filteredMatches.length === 0) {
        grid.innerHTML = '<p>No hay partidos ya jugados para esta disciplina.</p>';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('es-ES', options);
}

function formatTime(timeString) {
    const [hour, minute] = timeString.split(':');
    return `${hour}:${minute}`;
}

function addUpcomingMatch(event) {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden modificar el calendario.');
        return;
    }
    event.preventDefault();
    const indexField = document.getElementById('match-index');
    const home = document.getElementById('match-home').value.trim();
    const away = document.getElementById('match-away').value.trim();
    const sport = document.getElementById('match-sport').value;
    const phase = document.getElementById('match-phase').value;
    const date = document.getElementById('match-date').value;
    const time = document.getElementById('match-time').value;
    const result = document.getElementById('match-result').value.trim();

    if (!home || !away || !sport || !phase || !date || !time) return;

    const mvp = document.getElementById('match-mvp').value.trim();
    const matchData = { home, away, sport, phase, date, time, result, mvp };

    if (editingMatchIndex !== null && editingMatchIndex !== '') {
        upcomingMatches[editingMatchIndex] = matchData;
        editingMatchIndex = null;
        indexField.value = '';
        document.getElementById('match-submit-btn').textContent = 'Agregar Partido';
        document.getElementById('match-cancel-btn').style.display = 'none';
    } else {
        upcomingMatches.push(matchData);
    }

    persistMockData();
    document.getElementById('add-match-form').reset();
    renderCalendar();
}

function startMatchEdit(index) {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden editar partidos.');
        return;
    }
    const match = upcomingMatches[index];
    document.getElementById('match-home').value = match.home;
    document.getElementById('match-away').value = match.away;
    document.getElementById('match-sport').value = match.sport;
    document.getElementById('match-phase').value = match.phase;
    document.getElementById('match-date').value = match.date;
    document.getElementById('match-time').value = match.time;
    const resultInput = document.getElementById('match-result');
    if (resultInput) resultInput.value = match.result || '';
    const mvpInput = document.getElementById('match-mvp');
    if (mvpInput) mvpInput.value = match.mvp || '';
    document.getElementById('match-index').value = index;
    editingMatchIndex = index;
    document.getElementById('match-submit-btn').textContent = 'Actualizar Partido';
    document.getElementById('match-cancel-btn').style.display = 'inline-block';
}

function cancelMatchEdit() {
    editingMatchIndex = null;
    document.getElementById('match-index').value = '';
    document.getElementById('add-match-form').reset();
    document.getElementById('match-submit-btn').textContent = 'Agregar Partido';
    document.getElementById('match-cancel-btn').style.display = 'none';
}

function deleteUpcomingMatch(index) {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden eliminar partidos.');
        return;
    }
    if (!confirm('¿Deseas eliminar este partido del calendario?')) return;
    upcomingMatches.splice(index, 1);
    if (editingMatchIndex === index) {
        cancelMatchEdit();
    } else if (editingMatchIndex !== null && index < editingMatchIndex) {
        editingMatchIndex -= 1;
        document.getElementById('match-index').value = editingMatchIndex !== null ? editingMatchIndex : '';
    }
    persistMockData();
    renderCalendar();
}

function markMatchAsPlayed(index) {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden cerrar partidos.');
        return;
    }

    const match = upcomingMatches[index];
    if (!match) return;

    if (!match.result || !match.mvp) {
        alert('Completa el resultado y el MVP antes de marcar el partido como jugado.');
        startMatchEdit(index);
        return;
    }

    if (!confirm(`¿Deseas mover "${match.home} vs ${match.away}" a la sección de partidos jugados?`)) return;

    playedMatches.unshift({ ...match });
    upcomingMatches.splice(index, 1);
    persistMockData();
    renderCalendar();
    renderPlayedMatches();
}

function editPlayedMatch(index) {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden editar partidos jugados.');
        return;
    }

    const match = playedMatches[index];
    if (!match) return;

    const confirmEdit = confirm(`¿Deseas editar el resultado del partido ${match.home} vs ${match.away}?`);
    if (!confirmEdit) return;

    const form = document.getElementById('add-match-form');
    if (!form) return;

    document.getElementById('match-home').value = match.home;
    document.getElementById('match-away').value = match.away;
    document.getElementById('match-sport').value = match.sport;
    document.getElementById('match-phase').value = match.phase;
    document.getElementById('match-date').value = match.date;
    document.getElementById('match-time').value = match.time;
    const resultInput = document.getElementById('match-result');
    if (resultInput) resultInput.value = match.result || '';
    const mvpInput = document.getElementById('match-mvp');
    if (mvpInput) mvpInput.value = match.mvp || '';
    document.getElementById('match-submit-btn').textContent = 'Actualizar Partido';
    document.getElementById('match-cancel-btn').style.display = 'inline-block';
    document.getElementById('match-index').value = 'played-' + index;
    editingMatchIndex = 'played-' + index;
    showPage('calendario');
}

function restorePlayedMatch(index) {
    if (!userIsProfessor()) {
        alert('Solo los profesores pueden restaurar partidos.');
        return;
    }

    const match = playedMatches[index];
    if (!match) return;

    if (!confirm(`¿Deseas volver "${match.home} vs ${match.away}" a la lista de próximos partidos?`)) return;

    upcomingMatches.push({ ...match });
    playedMatches.splice(index, 1);
    persistMockData();
    renderCalendar();
    renderPlayedMatches();
}

// --- GESTIÓN DE INSCRIPCIONES PENDIENTES Y NOTIFICACIONES ---
function notifyProfessor() {
    const count = pendingRegistrations.length;
    const btn = document.getElementById('notif-btn');
    const span = document.getElementById('notif-count');
    if (!btn || !span) return;
    span.innerText = count;
    // Mostrar la campana de notificaciones sólo si hay pendientes AND el rol actual es profesor
    btn.style.display = (currentRole === 'profesor' && count > 0) ? 'inline-block' : 'none';
}

function openPendingModal() {
    if (currentRole !== 'profesor') {
        alert('Solo los profesores pueden ver las inscripciones pendientes.');
        return;
    }
    renderPendingList();
    document.getElementById('pending-modal').style.display = 'flex';
}

function closePendingModal() {
    document.getElementById('pending-modal').style.display = 'none';
}

function renderPendingList() {
    const container = document.getElementById('pending-list');
    container.innerHTML = '';
    if (pendingRegistrations.length === 0) {
        container.innerHTML = '<p>No hay inscripciones pendientes.</p>';
        return;
    }

    pendingRegistrations.forEach((reg, idx) => {
        const div = document.createElement('div');
        div.style.borderBottom = '1px solid #eee';
        div.style.padding = '8px 0';
        div.innerHTML = `
            <strong>${reg.name}</strong> — <em>${reg.sport}</em><br>
            Capitán: ${reg.captain}<br>
            <button class="btn" onclick="acceptRegistration(${idx})">Aceptar</button>
            <button class="btn btn-danger" onclick="rejectRegistration(${idx})">Rechazar</button>
        `;
        container.appendChild(div);
    });
}

async function updateRegistrationStatus(id, status) {
    const response = await fetch(REGISTRATIONS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la inscripción.');
}

async function acceptRegistration(index) {
    if (currentRole !== 'profesor') { alert('Solo los profesores pueden aceptar inscripciones.'); return; }
    const reg = pendingRegistrations[index];
    if (!reg) return;
    try {
        await updateRegistrationStatus(reg.id, 'approved');
    } catch (error) {
        alert(error.message);
        return;
    }
    const arr = leaderboards[reg.sport] || [];
    arr.push({ pos: arr.length + 1, name: `${reg.name} (${reg.sport})`, pj: 0, pg: 0, pp: 0, pts: 0 });
    pendingRegistrations.splice(index, 1);
    persistMockData();
    renderPendingList();
    notifyProfessor();
    if (reg.sport === selectedTournament) renderLeaderboard();
    alert(`La inscripción de ${reg.name} fue aceptada.`);
}

async function rejectRegistration(index) {
    if (currentRole !== 'profesor') { alert('Solo los profesores pueden rechazar inscripciones.'); return; }
    const reg = pendingRegistrations[index];
    if (!reg) return;
    if (!confirm(`¿Rechazar la inscripción de ${reg.name}?`)) return;
    try {
        await updateRegistrationStatus(reg.id, 'rejected');
    } catch (error) {
        alert(error.message);
        return;
    }
    pendingRegistrations.splice(index, 1);
    renderPendingList();
    notifyProfessor();
    alert(`La inscripción de ${reg.name} fue rechazada.`);
}

// Agregar goleador desde UI
function addTopScorer(event) {
    event.preventDefault();
    const name = document.getElementById('scorer-name').value.trim();
    const team = document.getElementById('scorer-team').value.trim();
    const goals = parseInt(document.getElementById('scorer-goals').value) || 0;
    if (!name || !team) return;
    if (!topScorers[selectedTournament]) topScorers[selectedTournament] = [];
    const arr = topScorers[selectedTournament];
    // Buscar si ya existe el jugador (mismo nombre y mismo equipo) — comparar en minúsculas
    const existing = arr.find(p => p.name.toLowerCase() === name.toLowerCase() && p.team.toLowerCase() === team.toLowerCase());
    if (existing) {
        // Acumular goles si ya existe
        existing.goals = (existing.goals || 0) + goals;
    } else {
        arr.push({ name, team, goals });
    }
    // Reordenar por goles (mayor a menor)
    arr.sort((a, b) => b.goals - a.goals);
    document.getElementById('add-scorer-form').reset();
    persistMockData();
    renderTopScorers();
}

// --- PANEL DE CONTROL / AUTENTICACIÓN SIMPLE PARA PROFESORES ---
function openProfessorLogin() {
    document.getElementById('prof-login-modal').style.display = 'flex';
}

function closeProfessorLogin() {
    document.getElementById('prof-login-modal').style.display = 'none';
}

async function handleProfessorLogin(e) {
    e.preventDefault();
    const adminUser = document.getElementById('admin-user').value;
    const profPassword = document.getElementById('prof-password').value;

    try {
        const response = await fetch(REGISTRATIONS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', adminUser, profPassword })
        });

        if (!response.ok) {
            throw new Error('Usuario y contraseña incorrectos.');
        }

        closeProfessorLogin();
        setRole('profesor');
        await loadDatabaseState();
        alert('Acceso concedido. Bienvenido, Profesor.');
    } catch (error) {
        alert(error.message || 'No se pudo iniciar sesión.');
    }
}

// Mostrar/ocultar contraseña en el modal de profesor
function togglePasswordVisibility() {
    const pwd = document.getElementById('prof-password');
    const btn = document.getElementById('toggle-password-btn');
    if (!pwd || !btn) return;
    if (pwd.type === 'password') {
        pwd.type = 'text';
        btn.textContent = 'Ocultar';
    }
}

// Inicialización de la carga al abrir el sitio
window.onload = function() {
    // Si existe el selector en la página, establecer el valor
    const sel = document.getElementById('tournament-select');
    if (sel) sel.value = selectedTournament;
    loadCalendarFromStorage();
    loadDatabaseState();
    renderLeaderboard();
    renderTopScorers();
    renderCalendar();
    renderPlayedMatches();
    updateCalendarEditorVisibility();
    notifyProfessor();
    updateFutsalGalleryVisibility();
    // Vincular botón de ver fotos al modal
    const viewBtn = document.getElementById('view-futsal-photos-btn');
    if (viewBtn) viewBtn.addEventListener('click', openGalleryModal);
    // Cerrar modal al hacer clic fuera del contenido
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeGalleryModal(); });
};

// Mostrar/ocultar galería de Fútbol Sala según torneo seleccionado
function updateFutsalGalleryVisibility() {
    const bg = document.getElementById('futsal-bg');
    if (!bg) return;
    bg.style.display = (selectedTournament === 'Futbol') ? 'block' : 'none';
    const btn = document.getElementById('view-futsal-photos-btn');
    if (btn) btn.style.display = (selectedTournament === 'Futbol') ? 'inline-block' : 'none';
}

// Abrir/Cerrar modal de galería
function openGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (!modal) return;
    modal.style.display = 'flex';
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (!modal) return;
    modal.style.display = 'none';
}


