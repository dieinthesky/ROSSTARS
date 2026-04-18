-- 15 contas de teste: userid dietestes1..dietestes15, senha dietestes1..dietestes15 (texto plano)
-- Requer: use_MD5_passwords: no no login_athena.conf (padrão deste projeto)
-- Se algum userid já existir, o INSERT falha nessa linha — apague a conta ou remova a linha antes.

INSERT INTO `login` (`userid`, `user_pass`, `sex`, `email`) VALUES
('dietestes1', 'dietestes1', 'M', 'dietestes@local'),
('dietestes2', 'dietestes2', 'M', 'dietestes@local'),
('dietestes3', 'dietestes3', 'M', 'dietestes@local'),
('dietestes4', 'dietestes4', 'M', 'dietestes@local'),
('dietestes5', 'dietestes5', 'M', 'dietestes@local'),
('dietestes6', 'dietestes6', 'M', 'dietestes@local'),
('dietestes7', 'dietestes7', 'M', 'dietestes@local'),
('dietestes8', 'dietestes8', 'M', 'dietestes@local'),
('dietestes9', 'dietestes9', 'M', 'dietestes@local'),
('dietestes10', 'dietestes10', 'M', 'dietestes@local'),
('dietestes11', 'dietestes11', 'M', 'dietestes@local'),
('dietestes12', 'dietestes12', 'M', 'dietestes@local'),
('dietestes13', 'dietestes13', 'M', 'dietestes@local'),
('dietestes14', 'dietestes14', 'M', 'dietestes@local'),
('dietestes15', 'dietestes15', 'M', 'dietestes@local');
