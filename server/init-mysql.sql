CREATE DATABASE IF NOT EXISTS `3it_andrejkulicm23` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `3it_andrejkulicm23`;

CREATE TABLE IF NOT EXISTS `rating` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rating` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
