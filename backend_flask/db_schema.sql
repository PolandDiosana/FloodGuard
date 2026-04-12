-- FloodGuard Database Schema
CREATE DATABASE IF NOT EXISTS `floodguard`;
USE `floodguard`;

-- Admin accounts for the web dashboard
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','lgu_admin') NOT NULL DEFAULT 'lgu_admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Registered mobile app users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `phone` varchar(20) NOT NULL,
  `barangay` varchar(100),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IoT Sensor devices configuration and meta-data
CREATE TABLE IF NOT EXISTS `sensors` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `barangay` varchar(100),
  `description` text,
  `lat` decimal(10, 8) NOT NULL,
  `lng` decimal(11, 8) NOT NULL,
  `status` enum('active', 'inactive', 'maintenance') DEFAULT 'active',
  `battery_level` int DEFAULT 100,
  `signal_strength` enum('strong', 'medium', 'weak') DEFAULT 'strong',
  `last_update` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historical water level data for charts and analysis
CREATE TABLE IF NOT EXISTS `water_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sensor_id` varchar(50) NOT NULL,
  `level` decimal(10, 2) NOT NULL, -- level in centimeters or meters
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Full IoT readings including diagnostic data
CREATE TABLE IF NOT EXISTS `iot_readings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sensor_id` varchar(50) NOT NULL,
  `raw_distance` decimal(10, 2),
  `flood_level` decimal(10, 2),
  `status` varchar(50) DEFAULT 'NORMAL',
  `latitude` decimal(10, 8),
  `longitude` decimal(11, 8),
  `maps_url` varchar(255),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Emergency alerts and advisories
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `level` enum('advisory', 'warning', 'critical') NOT NULL,
  `barangay` varchar(100), -- specific target or 'All'
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active', 'resolved') DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Community reports submitted via mobile app
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `reporter_name` varchar(100) DEFAULT 'Anonymous',
  `type` varchar(50) NOT NULL,
  `location` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(255),
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending', 'verified', 'dismissed') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evacuation centers information
CREATE TABLE IF NOT EXISTS `evacuation_centers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `lat` decimal(10, 8) NOT NULL,
  `lng` decimal(11, 8) NOT NULL,
  `capacity` int(11) DEFAULT 0,
  `slots_filled` int(11) DEFAULT 0,
  `status` enum('open', 'full', 'closed') DEFAULT 'open',
  `phone` varchar(20),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial default admin setup
-- Default password: 'admin123'
INSERT INTO `admins` (`username`, `password`, `role`) VALUES
('admin@system.com', 'scrypt:32768:8:1$12Jjtqo4$c62fa32f70f45d0029c304ba7eb5982d37748c', 'super_admin')
ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role);

-- Default password: 'password123'
INSERT INTO `admins` (`username`, `password`, `role`) VALUES
('moderator@lgu.gov', 'scrypt:32768:8:1$kJCjfddr$kF', 'lgu_admin')
ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role);
