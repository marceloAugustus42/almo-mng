CREATE DATABASE IF NOT EXISTS almoxarifado
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE almoxarifado;

CREATE TABLE IF NOT EXISTS itens (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(120) NOT NULL,
  tipo      VARCHAR(60)  NOT NULL,
  unidade   VARCHAR(40)  NOT NULL,
  vlr_unit  DECIMAL(10,2) DEFAULT 0.00,
  ativo     TINYINT(1)   DEFAULT 1,
  criado_em DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_nome (nome)
);

CREATE TABLE IF NOT EXISTS entradas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  item_id     INT          NOT NULL,
  data        DATE         NOT NULL,
  nf          VARCHAR(60),
  fornecedor  VARCHAR(120),
  quantidade  INT          NOT NULL CHECK (quantidade > 0),
  vlr_unit    DECIMAL(10,2) DEFAULT 0.00,
  responsavel VARCHAR(100),
  obs         TEXT,
  criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS saidas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  item_id     INT          NOT NULL,
  data        DATE         NOT NULL,
  pedido      VARCHAR(40),
  destino     VARCHAR(100) NOT NULL,
  quantidade  INT          NOT NULL CHECK (quantidade > 0),
  solicitante VARCHAR(100),
  responsavel VARCHAR(100),
  obs         TEXT,
  criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE RESTRICT
);

-- Saldo calculado por item (usada nas queries de estoque e dashboard)
CREATE OR REPLACE VIEW vw_saldos AS
SELECT
  i.id, i.nome, i.tipo, i.unidade, i.vlr_unit, i.ativo, i.criado_em,
  COALESCE(SUM(e.quantidade), 0)                                          AS total_entradas,
  COALESCE(SUM(s.quantidade), 0)                                          AS total_saidas,
  COALESCE(SUM(e.quantidade),0) - COALESCE(SUM(s.quantidade),0)          AS saldo
FROM itens i
LEFT JOIN entradas e ON e.item_id = i.id
LEFT JOIN saidas   s ON s.item_id = i.id
WHERE i.ativo = 1
GROUP BY i.id, i.nome, i.tipo, i.unidade, i.vlr_unit, i.ativo, i.criado_em;
