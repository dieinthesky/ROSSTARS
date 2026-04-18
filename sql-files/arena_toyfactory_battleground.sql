CREATE TABLE IF NOT EXISTS `toy7_matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` DATETIME NULL,
  `map_name` VARCHAR(32) NOT NULL DEFAULT '25ros03_01',
  `winner_team` TINYINT UNSIGNED NULL COMMENT '1=Azul,2=Vermelho,0=Empate',
  `end_reason` TINYINT UNSIGNED NULL COMMENT '1=Kills,3=Tempo(Empate)',
  `blue_alive_end` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `red_alive_end` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_started_at` (`started_at`),
  KEY `idx_map_name` (`map_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `toy7_match_players` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id` INT UNSIGNED NOT NULL,
  `char_id` INT UNSIGNED NOT NULL,
  `char_name` VARCHAR(30) NOT NULL DEFAULT '',
  `account_id` INT UNSIGNED NOT NULL,
  `guild_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `team` TINYINT UNSIGNED NOT NULL,
  `class_id` SMALLINT UNSIGNED NOT NULL,
  `result` TINYINT UNSIGNED NULL COMMENT '1=Vitoria,0=Derrota,2=Empate',
  `apm` INT UNSIGNED NOT NULL DEFAULT 0,
  `damage_done` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `damage_taken` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_match_char` (`match_id`,`char_id`),
  KEY `idx_match_team_result` (`match_id`,`team`,`result`),
  KEY `idx_char_id` (`char_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `toy7_guild_stats` (
  `guild_id` INT UNSIGNED NOT NULL,
  `guild_name` VARCHAR(24) NOT NULL DEFAULT '',
  `arena_name` VARCHAR(50) NOT NULL DEFAULT 'Toy Factory 7x7',
  `wins` INT UNSIGNED NOT NULL DEFAULT 0,
  `losses` INT UNSIGNED NOT NULL DEFAULT 0,
  `draws` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`guild_id`,`arena_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `toy7_match_skill_usage` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id` INT UNSIGNED NOT NULL,
  `char_id` INT UNSIGNED NOT NULL,
  `team` TINYINT UNSIGNED NOT NULL,
  `skill_id` SMALLINT UNSIGNED NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL DEFAULT '',
  `uses` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_match_char_team_skill` (`match_id`,`char_id`,`team`,`skill_id`),
  KEY `idx_match_team_uses` (`match_id`,`team`,`uses`),
  KEY `idx_match_skill` (`match_id`,`skill_id`),
  KEY `idx_char_match` (`char_id`,`match_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
