-- Opcional: nomes de ficheiro BMP no servidor de jogo (hint para o cliente HUD via pacote 0x7BFD).
-- NAO substitui emblem_data na tabela `guild`: se HUD EMBLEM native/blob der SKIP reason=len_zero,
-- o map-server nao tem bytes do emblema em memoria — confirme emblem_len/emblem_data na tabela `guild`
-- (char-server) ou peça ao GM a voltar a gravar o emblema no jogo.

CREATE TABLE IF NOT EXISTS `guild_emblem_files` (
  `guild_id` int(11) unsigned NOT NULL,
  `file_name` varchar(96) NOT NULL,
  `enabled` tinyint(1) unsigned NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`guild_id`)
) ENGINE=MyISAM;

-- Examples:
-- INSERT INTO guild_emblem_files (guild_id, file_name, enabled) VALUES (4356, 'bananinha4356.bmp', 1)
-- ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), enabled = VALUES(enabled);
