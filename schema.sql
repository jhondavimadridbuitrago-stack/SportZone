-- En phpMyAdmin, selecciona primero la base if0_42907839_sportzone y luego importa este archivo.

CREATE TABLE IF NOT EXISTS registrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_name VARCHAR(120) NOT NULL,
    sport ENUM('Futbol', 'Baloncesto', 'Voleibol') NOT NULL,
    captain VARCHAR(120) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_registrations_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leaderboard_teams (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sport ENUM('Futbol', 'Baloncesto', 'Voleibol') NOT NULL,
    team_name VARCHAR(120) NOT NULL,
    position_number INT UNSIGNED NOT NULL DEFAULT 1,
    matches_played INT UNSIGNED NOT NULL DEFAULT 0,
    matches_won INT UNSIGNED NOT NULL DEFAULT 0,
    matches_lost INT UNSIGNED NOT NULL DEFAULT 0,
    points INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_leaderboard_team (sport, team_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS top_scorers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sport ENUM('Futbol', 'Baloncesto', 'Voleibol') NOT NULL,
    player_name VARCHAR(120) NOT NULL,
    team_name VARCHAR(120) NOT NULL,
    goals INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_top_scorer (sport, player_name, team_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matches (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    home_team VARCHAR(120) NOT NULL,
    away_team VARCHAR(120) NOT NULL,
    sport ENUM('Fútbol Sala', 'Baloncesto', 'Voleibol') NOT NULL,
    phase VARCHAR(60) NOT NULL,
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    location VARCHAR(160) NOT NULL DEFAULT '',
    result VARCHAR(20) NOT NULL DEFAULT '',
    mvp VARCHAR(120) NOT NULL DEFAULT '',
    match_status ENUM('upcoming', 'played') NOT NULL DEFAULT 'upcoming',
    PRIMARY KEY (id),
    INDEX idx_matches_status_sport (match_status, sport)
) ENGINE=InnoDB;

INSERT IGNORE INTO leaderboard_teams
    (sport, team_name, position_number, matches_played, matches_won, matches_lost, points)
VALUES
    ('Futbol', '11° A (Los Cracks)', 1, 3, 3, 0, 9),
    ('Futbol', '10° B (F.C. Alumnos)', 2, 3, 2, 1, 6),
    ('Baloncesto', '9° A (Sporting)', 1, 2, 2, 0, 6),
    ('Baloncesto', '9° B (Raptors)', 2, 2, 0, 2, 0),
    ('Voleibol', 'Prom 2026', 1, 1, 1, 0, 3),
    ('Voleibol', 'Profesores', 2, 1, 0, 1, 0);

INSERT IGNORE INTO top_scorers (sport, player_name, team_name, goals)
VALUES
    ('Futbol', 'Juan Pérez', '11° A', 5),
    ('Futbol', 'Luis Gómez', '10° B', 3),
    ('Baloncesto', 'Carlos Ruiz', '9° A', 12),
    ('Baloncesto', 'Pablo Díaz', '9° B', 8),
    ('Voleibol', 'María López', 'Prom 2026', 7),
    ('Voleibol', 'Ana Torres', 'Profesores', 4);

INSERT INTO matches
    (home_team, away_team, sport, phase, match_date, match_time, location, result, mvp, match_status)
SELECT * FROM (
    SELECT '10° B', '11° A', 'Fútbol Sala', 'Octavos', '2026-05-27', '10:30:00', 'Cancha Municipal Norte', '2 - 1', 'Mateo Silva', 'upcoming'
    UNION ALL SELECT '9° A', '9° B', 'Baloncesto', 'Cuartos', '2026-05-29', '08:00:00', 'Gimnasio Escolar', '74 - 68', 'Carlos Ruiz', 'upcoming'
    UNION ALL SELECT 'Prom 2026', 'Profesores', 'Voleibol', 'Semifinal', '2026-06-01', '12:30:00', 'Pabellón de Voleibol', '3 - 2', 'María López', 'upcoming'
    UNION ALL SELECT '11° A', '9° B', 'Fútbol Sala', 'Cuartos', '2026-05-18', '09:15:00', 'Cancha Sur', '4 - 2', 'Juan Pérez', 'played'
    UNION ALL SELECT '10° A', '9° A', 'Baloncesto', 'Semifinal', '2026-05-16', '18:00:00', 'Gimnasio Central', '61 - 57', 'Carlos Ruiz', 'played'
    UNION ALL SELECT 'Profesores', 'Prom 2026', 'Voleibol', 'Final', '2026-05-12', '15:00:00', 'Pabellón de Voleibol', '3 - 1', 'María López', 'played'
) AS seed_matches
WHERE NOT EXISTS (SELECT 1 FROM matches LIMIT 1);