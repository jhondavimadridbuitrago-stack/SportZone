<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Credenciales de InfinityFree. Completa solo la contraseña antes de subir el archivo.
$host = 'sql208.infinityfree.com';
$database = 'if0_42907839_sportzone';
$username = 'if0_42907839';
$password = 'Jhon12061991';

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function professorIsAuthenticated(): bool
{
    return !empty($_SESSION['professor_authenticated']);
}

function requireProfessor(): void
{
    if (!professorIsAuthenticated()) {
        respond(['error' => 'Se requiere acceso de profesor.'], 401);
    }
}

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $error) {
    respond(['error' => 'No se pudo conectar con la base de datos.'], 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

function getState(PDO $pdo): array
{
    $leaderboards = ['Futbol' => [], 'Baloncesto' => [], 'Voleibol' => []];
    $statement = $pdo->query('SELECT sport, team_name AS name, position_number AS pos, matches_played AS pj, matches_won AS pg, matches_lost AS pp, points AS pts FROM leaderboard_teams ORDER BY sport, position_number');
    foreach ($statement as $row) {
        $sport = $row['sport'];
        $leaderboards[$sport][] = intvalFields($row);
    }

    $topScorers = ['Futbol' => [], 'Baloncesto' => [], 'Voleibol' => []];
    $statement = $pdo->query('SELECT sport, player_name AS name, team_name AS team, goals FROM top_scorers ORDER BY sport, goals DESC');
    foreach ($statement as $row) {
        $sport = $row['sport'];
        $row['goals'] = (int)$row['goals'];
        unset($row['sport']);
        $topScorers[$sport][] = $row;
    }

    $upcomingMatches = [];
    $playedMatches = [];
    $statement = $pdo->query("SELECT home_team AS home, away_team AS away, sport, phase, DATE_FORMAT(match_date, '%Y-%m-%d') AS date, TIME_FORMAT(match_time, '%H:%i') AS time, location, result, mvp, match_status FROM matches ORDER BY match_date, match_time");
    foreach ($statement as $row) {
        $status = $row['match_status'];
        unset($row['match_status']);
        if ($status === 'played') {
            $playedMatches[] = $row;
        } else {
            $upcomingMatches[] = $row;
        }
    }

    $registrations = [];
    if (professorIsAuthenticated()) {
        $statement = $pdo->query("SELECT id, team_name AS name, sport, captain, status, created_at FROM registrations WHERE status = 'pending' ORDER BY created_at ASC");
        $registrations = $statement->fetchAll();
    }
    return [
        'leaderboards' => $leaderboards,
        'topScorers' => $topScorers,
        'upcomingMatches' => $upcomingMatches,
        'playedMatches' => $playedMatches,
        'registrations' => $registrations
    ];
}

function intvalFields(array $row): array
{
    foreach (['pos', 'pj', 'pg', 'pp', 'pts'] as $field) {
        $row[$field] = (int)$row[$field];
    }
    unset($row['sport']);
    return $row;
}

function syncState(PDO $pdo, array $input): void
{
    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM leaderboard_teams');
        $teamStatement = $pdo->prepare('INSERT INTO leaderboard_teams (sport, team_name, position_number, matches_played, matches_won, matches_lost, points) VALUES (:sport, :name, :pos, :pj, :pg, :pp, :pts)');
        foreach (($input['leaderboards'] ?? []) as $sport => $teams) {
            foreach ($teams as $team) {
                $teamStatement->execute(['sport' => $sport, 'name' => $team['name'], 'pos' => (int)$team['pos'], 'pj' => (int)$team['pj'], 'pg' => (int)$team['pg'], 'pp' => (int)$team['pp'], 'pts' => (int)$team['pts']]);
            }
        }

        $pdo->exec('DELETE FROM top_scorers');
        $scorerStatement = $pdo->prepare('INSERT INTO top_scorers (sport, player_name, team_name, goals) VALUES (:sport, :name, :team, :goals)');
        foreach (($input['topScorers'] ?? []) as $sport => $players) {
            foreach ($players as $player) {
                $scorerStatement->execute(['sport' => $sport, 'name' => $player['name'], 'team' => $player['team'], 'goals' => (int)$player['goals']]);
            }
        }

        $pdo->exec('DELETE FROM matches');
        $matchStatement = $pdo->prepare('INSERT INTO matches (home_team, away_team, sport, phase, match_date, match_time, location, result, mvp, match_status) VALUES (:home, :away, :sport, :phase, :date, :time, :location, :result, :mvp, :status)');
        foreach (['upcoming' => $input['upcomingMatches'] ?? [], 'played' => $input['playedMatches'] ?? []] as $status => $matches) {
            foreach ($matches as $match) {
                $matchStatement->execute(['home' => $match['home'], 'away' => $match['away'], 'sport' => $match['sport'], 'phase' => $match['phase'], 'date' => $match['date'], 'time' => $match['time'], 'location' => $match['location'] ?? '', 'result' => $match['result'] ?? '', 'mvp' => $match['mvp'] ?? '', 'status' => $status]);
            }
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

try {
    if ($method === 'POST' && ($input['action'] ?? '') === 'login') {
        $adminUser = (string)($input['adminUser'] ?? '');
        $profPassword = (string)($input['profPassword'] ?? '');
        $validUser = 'Admin';
        $validPassword = 'prof2026';

        if (hash_equals($validUser, $adminUser) && hash_equals($validPassword, $profPassword)) {
            session_regenerate_id(true);
            $_SESSION['professor_authenticated'] = true;
            respond(['authenticated' => true]);
        }

        respond(['error' => 'Usuario y contraseña incorrectos.'], 401);
    }

    if ($method === 'GET') {
        respond(getState($pdo));
    }

    if ($method === 'POST' && ($input['action'] ?? '') === 'sync') {
        requireProfessor();
        syncState($pdo, $input);
        respond(['message' => 'Datos sincronizados correctamente.']);
    }

    if ($method === 'POST') {
        $name = trim((string)($input['name'] ?? ''));
        $sport = (string)($input['sport'] ?? '');
        $captain = trim((string)($input['captain'] ?? ''));
        if ($name === '' || $captain === '' || !in_array($sport, ['Futbol', 'Baloncesto', 'Voleibol'], true)) {
            respond(['error' => 'Los datos de inscripción no son válidos.'], 422);
        }
        $statement = $pdo->prepare('INSERT INTO registrations (team_name, sport, captain) VALUES (:name, :sport, :captain)');
        $statement->execute(['name' => $name, 'sport' => $sport, 'captain' => $captain]);
        respond(['id' => (int)$pdo->lastInsertId(), 'message' => 'Inscripción guardada.'], 201);
    }

    if ($method === 'DELETE') {
        requireProfessor();
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        $status = (string)($input['status'] ?? '');
        if (!$id || !in_array($status, ['approved', 'rejected'], true)) {
            respond(['error' => 'La decisión de inscripción no es válida.'], 422);
        }
        $statement = $pdo->prepare("UPDATE registrations SET status = :status WHERE id = :id AND status = 'pending'");
        $statement->execute(['id' => $id, 'status' => $status]);
        respond(['message' => 'Inscripción actualizada.']);
    }

    respond(['error' => 'Método no permitido.'], 405);
} catch (Throwable $error) {
    respond(['error' => 'No se pudo completar la operación.'], 500);
}