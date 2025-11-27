-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 25, 2025 at 03:09 PM
-- Server version: 10.11.14-MariaDB
-- PHP Version: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cybaemtechnet_LMS_Project`
--

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `gst_treatment` varchar(100) DEFAULT NULL,
  `source_of_supply` varchar(100) DEFAULT NULL,
  `gst` varchar(50) DEFAULT NULL,
  `currency_id` char(36) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `user_id`, `name`, `contact_person`, `email`, `phone`, `company_name`, `gst_treatment`, `source_of_supply`, `gst`, `currency_id`, `address`, `document_path`, `status`, `created_at`, `updated_at`) VALUES
('77f84a02-5b22-4193-a45e-972e55f02968', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', 'pranav divate', 'prajwal kadam', 'client@reqgen.com', '9876543210', 'Amar tech', 'Registered Business - Regular', 'thane', '123456789OIUJYH', '5e464c9c-7b45-96f0-3094-6da8f5b4c1a5', 'pune', '/uploads/clients/client_doc_691f55dfac965_1763661279.png', 'active', '2025-11-20 17:54:39', '2025-11-20 17:54:39'),
('80d7f33d-69ce-4714-adf4-8d24d345c8f5', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', 'Akshay Divate', 'Akshay', 'kadamprajwal358@gmail.com', '+919699720434', 'Akshay Technology', 'Registered Business - Regular', 'pune', '12345678QWERTYU', '5e464c9c-7b45-96f0-3094-6da8f5b4c1a5', 'abc', '/uploads/clients/client_doc_691fd5fb4e3e1_1763694075.pdf', 'active', '2025-11-21 03:01:16', '2025-11-21 03:01:16');

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL DEFAULT 'LicenseHub Enterprise',
  `company_email` varchar(255) DEFAULT NULL,
  `company_phone` varchar(50) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `company_logo_path` varchar(500) DEFAULT NULL,
  `company_website` varchar(255) DEFAULT NULL,
  `company_gst` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`id`, `company_name`, `company_email`, `company_phone`, `company_address`, `company_logo_path`, `company_website`, `company_gst`, `created_at`, `updated_at`) VALUES
(1, 'CybaemTech', 'info@licensehub.com', '+919699720434', 'Hinjewadi, Pune', '/uploads/company/logo_1763721180.png', 'http://cybaemtech.com', '12345678QWERTYU', '2025-11-20 07:11:39', '2025-11-25 04:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` char(36) NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `exchange_rate_to_inr` decimal(10,4) NOT NULL DEFAULT 1.0000,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `exchange_rate_to_inr`, `is_default`, `created_at`, `updated_at`) VALUES
('0650257f-b3f6-3288-2b7b-10b1498196de', 'SGD', 'Singapore Dollar', 'S$', 62.0000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('2b90ab8f-aa87-eb24-62d1-2dfbdcd9645b', 'EUR', 'Euro', '€', 90.0000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('2c53fcdd-c4d1-cad9-bf43-1374ed03d543', 'GBP', 'British Pound', '£', 105.0000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('3232d11c-a41e-1946-bb32-916edd0fe1a7', 'AUD', 'Australian Dollar', 'A$', 54.0000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('4f971249-cc93-7e9f-6213-03419c4064e5', 'JPY', 'Japanese Yen', '¥', 0.5600, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('5e464c9c-7b45-96f0-3094-6da8f5b4c1a5', 'INR', 'Indian Rupee', '₹', 1.0000, 1, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('83b70b90-63e7-8ec3-d64b-746b528df389', 'CNY', 'Chinese Yuan', '¥', 11.5000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('8f286e7f-dc26-af70-86ae-4180a2d4932f', 'USD', 'US Dollar', '$', 83.0000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('9f9ff41d-06fd-d28b-d9cb-2cd5cb0cc21f', 'CAD', 'Canadian Dollar', 'C$', 61.0000, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19'),
('f8aaae42-ce6c-c7ab-8687-6303886569a9', 'AED', 'UAE Dirham', 'د.إ', 22.6500, 0, '2025-11-20 05:02:19', '2025-11-20 05:02:19');

-- --------------------------------------------------------

--
-- Table structure for table `email_notifications`
--

CREATE TABLE `email_notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `license_id` char(36) DEFAULT NULL,
  `notification_type` enum('30_days','15_days','5_days','1_day','0_days','expired') NOT NULL,
  `email_sent_at` timestamp NULL DEFAULT current_timestamp(),
  `email_status` enum('sent','failed','pending') NOT NULL DEFAULT 'sent',
  `email_subject` varchar(500) NOT NULL,
  `email_body` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_notification_log`
--

CREATE TABLE `email_notification_log` (
  `id` int(11) NOT NULL,
  `license_id` char(36) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `days_until_expiry` int(11) NOT NULL,
  `sent_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `license_allocations`
--

CREATE TABLE `license_allocations` (
  `id` char(36) NOT NULL,
  `purchase_id` char(36) DEFAULT NULL,
  `assigned_to` varchar(255) NOT NULL,
  `allocated_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('active','revoked','expired') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `license_purchases`
--

CREATE TABLE `license_purchases` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `client_id` char(36) DEFAULT NULL,
  `tool_name` varchar(255) NOT NULL,
  `make` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `version` varchar(100) DEFAULT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `cost_per_user` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `purchased_quantity` int(11) NOT NULL DEFAULT 1,
  `total_cost` decimal(10,2) NOT NULL,
  `total_cost_inr` decimal(10,2) DEFAULT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `expiration_date` timestamp NOT NULL,
  `invoice_no` varchar(100) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `bill_path` varchar(500) DEFAULT NULL,
  `currency_code` varchar(10) DEFAULT 'INR',
  `original_amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `license_purchases`
--

INSERT INTO `license_purchases` (`id`, `user_id`, `client_id`, `tool_name`, `make`, `model`, `version`, `vendor`, `cost_per_user`, `quantity`, `purchased_quantity`, `total_cost`, `total_cost_inr`, `purchase_date`, `expiration_date`, `invoice_no`, `serial_no`, `bill_path`, `currency_code`, `original_amount`, `created_at`, `updated_at`) VALUES
('0d06d3c7-8390-4731-b452-f6fbeb57d7b5', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'Keyboard', '', '', '', 'Priyanka Karanjewar', 1200.00, 1, 1, 1200.00, 1200.00, '2025-11-24 18:30:00', '2025-11-26 18:30:00', 'CYB0010', NULL, NULL, 'INR', 1200.00, '2025-11-25 03:43:55', '2025-11-25 03:43:55'),
('14713dda-2f9e-4512-a14e-688454fbaada', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'keyboard', NULL, NULL, NULL, 'Prajwal Kadam', 166000.00, 2, 1, 59760.00, 59760.00, '2025-11-20 18:30:00', '2025-11-24 11:47:04', 'CYB0009', NULL, NULL, 'INR', 59760.00, '2025-11-24 11:47:04', '2025-11-24 11:47:04'),
('14723844-95a7-478f-b159-9be2697d35a3', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', NULL, NULL, NULL, 'Prajwal Kadam', 2451222.90, 1, 1, 441220.12, 441220.12, '2025-11-20 18:30:00', '2025-11-24 11:47:00', 'CYB0005', NULL, NULL, 'INR', 441220.12, '2025-11-24 11:47:00', '2025-11-24 11:47:00'),
('24081a75-5b7f-415f-adf1-02d6fc4b79fb', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '', 'tab', '', '', '', 'Prajwal Kadam', 246222.90, 0, 1, 246222.90, 246222.90, '2025-11-20 18:30:00', '2025-11-27 18:30:00', 'CYB0003', NULL, '/uploads/bills/bill_24081a75-5b7f-415f-adf1-02d6fc4b79fb_1763698324.pdf', 'GBP', 2344.98, '2025-11-21 04:12:06', '2025-11-21 04:21:36'),
('27e0a5b5-019d-4bd2-ae92-8bda64aa3965', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', '', '', '', 'Prajwal Kadam', 2451222.90, 1, 1, 2451222.90, 2451222.90, '2025-11-20 18:30:00', '2025-11-20 18:30:00', 'CYB0005', NULL, NULL, 'GBP', 23344.98, '2025-11-21 08:25:05', '2025-11-21 08:25:05'),
('3778f3d8-fb56-424e-8c11-5695e2512a04', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', NULL, NULL, NULL, 'Prajwal Kadam', 2490000.00, 1, 0, 448200.00, 448200.00, '2036-02-06 18:30:00', '2025-11-24 11:46:57', 'CYB0001', NULL, NULL, 'INR', 448200.00, '2025-11-24 11:46:57', '2025-11-24 11:46:57'),
('4f701a3e-f991-4997-bee9-629bdb12375f', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'keyboard', NULL, NULL, NULL, 'Abhi Prajwal Kadam', 2000.00, 2, 0, 720.00, 720.00, '2025-11-20 18:30:00', '2025-11-24 11:47:03', 'CYB0008', NULL, NULL, 'INR', 720.00, '2025-11-24 11:47:03', '2025-11-24 11:47:03'),
('6b6d5324-4a7e-4494-83ef-b209bd1a93e9', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', '', '', '', 'Prajwal Kadam', 2490000.00, 0, 1, 2490000.00, 2490000.00, '2025-11-19 18:30:00', '2025-11-20 18:30:00', 'CYB0001', NULL, '/uploads/bills/bill_6b6d5324-4a7e-4494-83ef-b209bd1a93e9_1763629533.pdf', 'USD', 30000.00, '2025-11-20 09:05:33', '2025-11-20 16:50:33'),
('6c4d38a7-90d7-42dc-a389-665e4a766808', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '', 'keyboard', '', '', '', 'Abhi Prajwal Kadam', 2000.00, 0, 2, 4000.00, 4000.00, '2025-11-20 18:30:00', '2025-11-21 18:30:00', 'CYB0008', NULL, '/uploads/bills/bill_6c4d38a7-90d7-42dc-a389-665e4a766808_1763718066.pdf', 'INR', 4000.00, '2025-11-21 09:41:07', '2025-11-21 09:43:42'),
('8e964c9f-4de4-48a5-b94b-c1c371c10f2e', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, '12313', '', '', '', 'Abhi Prajwal Kadam', 8765.00, 1, 1, 8765.00, 8765.00, '2025-11-20 18:30:00', '2025-11-20 18:30:00', 'CYB0007', NULL, NULL, 'INR', 8765.00, '2025-11-21 09:33:42', '2025-11-21 09:33:42'),
('a5ed2a65-b2b8-4cb3-a743-546ee8179a1a', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', NULL, NULL, NULL, 'Abhi Prajwal Kadam', 98765.00, 1, 1, 17777.70, 17777.70, '2025-11-20 18:30:00', '2025-11-24 11:46:59', 'CYB0004', NULL, NULL, 'INR', 17777.70, '2025-11-24 11:46:59', '2025-11-24 11:46:59'),
('aa2c73e8-c1d1-4df3-a7f1-abec4dd663d4', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'keyboard', '', '', '', 'Prajwal Kadam', 166000.00, 1, 2, 332000.00, 332000.00, '2025-11-20 18:30:00', '2025-11-23 18:30:00', 'CYB0009', NULL, '/uploads/bills/bill_aa2c73e8-c1d1-4df3-a7f1-abec4dd663d4_1763719527.pdf', 'USD', 4000.00, '2025-11-21 10:05:29', '2025-11-24 08:49:11'),
('bdd1eba6-3a6a-4dd0-aa26-e2abfe63e004', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'tab', NULL, NULL, NULL, 'Prajwal Kadam', 246222.90, 1, 0, 44320.12, 44320.12, '2025-11-20 18:30:00', '2025-11-24 11:46:59', 'CYB0003', NULL, NULL, 'INR', 44320.12, '2025-11-24 11:46:59', '2025-11-24 11:46:59'),
('c3695937-9d91-4a72-961b-35ff869e2727', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'tab', NULL, NULL, NULL, 'Priyanka Karanjewar', 987654.00, 1, 1, 177777.72, 177777.72, '2025-11-19 18:30:00', '2025-11-24 11:46:58', 'CYB0002', NULL, NULL, 'INR', 177777.72, '2025-11-24 11:46:58', '2025-11-24 11:46:58'),
('c6f86d0f-39c4-4e3b-a343-be43ff445c82', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '', 'tab', '', '', '', 'Priyanka Karanjewar', 987654.00, 1, 1, 987654.00, 987654.00, '2025-11-19 18:30:00', '2025-12-05 18:30:00', 'CYB0002', NULL, '/uploads/bills/bill_c6f86d0f-39c4-4e3b-a343-be43ff445c82_1763658965.pdf', 'INR', 987654.00, '2025-11-20 17:16:06', '2025-11-20 17:16:06'),
('dadd5102-30d0-4996-85e8-ed67ccd8c841', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, '12313', NULL, NULL, NULL, 'Abhi Prajwal Kadam', 8765.00, 1, 1, 1577.70, 1577.70, '2025-11-20 18:30:00', '2025-11-24 11:47:02', 'CYB0007', NULL, NULL, 'INR', 1577.70, '2025-11-24 11:47:02', '2025-11-24 11:47:02'),
('e0f0feb7-b400-4ce3-ad77-d0df28d2de44', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', '', '', '', 'Abhi Prajwal Kadam', 8765.00, 1, 1, 8765.00, 8765.00, '2025-11-20 18:30:00', '2025-11-20 18:30:00', 'CYB0006', NULL, NULL, 'INR', 8765.00, '2025-11-21 09:25:12', '2025-11-21 09:25:12'),
('f19f2f5c-a43f-4717-9d92-b3695d018abd', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', NULL, NULL, NULL, 'Abhi Prajwal Kadam', 8765.00, 1, 1, 1577.70, 1577.70, '2025-11-20 18:30:00', '2025-11-24 11:47:01', 'CYB0006', NULL, NULL, 'INR', 1577.70, '2025-11-24 11:47:01', '2025-11-24 11:47:01'),
('f7afff50-7095-40dc-9e79-b788c3e19b02', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', NULL, 'laptop', '', '', '', 'Abhi Prajwal Kadam', 98765.00, 1, 1, 98765.00, 98765.00, '2025-11-20 18:30:00', '2025-11-20 18:30:00', 'CYB0004', NULL, NULL, 'INR', 98765.00, '2025-11-21 06:45:28', '2025-11-21 06:45:28');

-- --------------------------------------------------------

--
-- Table structure for table `license_usage_logs`
--

CREATE TABLE `license_usage_logs` (
  `id` char(36) NOT NULL,
  `license_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `accessed_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `notify_45_days` tinyint(1) DEFAULT 1,
  `notify_30_days` tinyint(1) DEFAULT 1,
  `notify_15_days` tinyint(1) DEFAULT 1,
  `notify_7_days` tinyint(1) DEFAULT 1,
  `notify_5_days` tinyint(1) DEFAULT 1,
  `notify_1_day` tinyint(1) DEFAULT 1,
  `notify_0_days` tinyint(1) DEFAULT 1,
  `email_notifications_enabled` tinyint(1) DEFAULT 1,
  `notification_time` time DEFAULT '09:00:00',
  `timezone` varchar(50) DEFAULT 'UTC',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `purchase_id` char(36) NOT NULL,
  `tool_name` varchar(255) NOT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `invoice_no` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `purchase_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `purchase_gst` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_purchase_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `selling_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `selling_gst` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_selling_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `net_gst_paid` decimal(15,2) DEFAULT 0.00,
  `margin` decimal(15,2) DEFAULT 0.00,
  `sale_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `user_id`, `client_id`, `purchase_id`, `tool_name`, `vendor`, `invoice_no`, `quantity`, `purchase_amount`, `purchase_gst`, `total_purchase_cost`, `selling_amount`, `selling_gst`, `total_selling_price`, `net_gst_paid`, `margin`, `sale_date`, `expiry_date`, `created_at`, `updated_at`) VALUES
('02a014e9-9a7f-4661-a34d-9e1cf7e61653', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '80d7f33d-69ce-4714-adf4-8d24d345c8f5', '6c4d38a7-90d7-42dc-a389-665e4a766808', 'keyboard', 'Abhi Prajwal Kadam', 'CYB0003', 2, 4000.00, 720.00, 4720.00, 5000.00, 900.00, 5900.00, 180.00, 1000.00, '2025-11-21', '2025-12-02', '2025-11-21 09:43:42', '2025-11-21 09:43:42'),
('78354b39-a89f-4dc3-abaf-8a9af2720784', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '8d3f854b-1dac-462c-b620-d5ed77942ba4', '6b6d5324-4a7e-4494-83ef-b209bd1a93e9', 'laptop', 'Prajwal Kadam', 'CYB0001', 1, 2490000.00, 448200.00, 2938200.00, 8765.01, 1577.70, 10342.71, -446622.30, -2481234.99, '2025-11-20', '2025-11-20', '2025-11-20 16:50:02', '2025-11-20 16:50:02'),
('c6cd18f9-9d63-4385-886c-dff8de545d52', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '80d7f33d-69ce-4714-adf4-8d24d345c8f5', '24081a75-5b7f-415f-adf1-02d6fc4b79fb', 'tab', 'Prajwal Kadam', 'CYB0002', 1, 246222.90, 44320.12, 290543.02, 300000.00, 54000.00, 354000.00, 9679.88, 53777.10, '2025-11-21', '2025-11-28', '2025-11-21 04:21:36', '2025-11-21 04:21:36'),
('cdd83cc7-fee4-4e65-8f3d-901db571b769', '015ED30E-1B2E-40EB-BAC8-76624A340FE0', '80d7f33d-69ce-4714-adf4-8d24d345c8f5', 'aa2c73e8-c1d1-4df3-a7f1-abec4dd663d4', 'keyboard', 'Prajwal Kadam', 'CYB0004', 1, 166000.00, 29880.00, 195880.00, 9876.00, 1777.68, 11653.68, -28102.32, -156124.00, '2025-11-21', '2025-11-28', '2025-11-21 10:08:43', '2025-11-21 10:08:43');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tools`
--

CREATE TABLE `tools` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `cost_per_user` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','accounts','user') NOT NULL DEFAULT 'user',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `permissions`, `created_at`, `updated_at`) VALUES
('015ED30E-1B2E-40EB-BAC8-76624A340FE0', 'rohan.bhosale@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{\"dashboard\":{\"access\":true,\"actions\":{\"read\":true}},\"licenses\":{\"access\":true,\"actions\":{\"create\":true,\"read\":true,\"update\":true,\"delete\":true,\"add_purchase_license\":true,\"add_sell_license\":true}},\"purchase_licenses\":{\"access\":true,\"actions\":{\"read\":true,\"update\":true,\"delete\":true,\"add\":true,\"import_csv\":true}},\"selling_licenses\":{\"access\":true,\"actions\":{\"read\":true,\"update\":true,\"delete\":true,\"add\":true,\"import_csv\":true}},\"clients\":{\"access\":true,\"actions\":{\"create\":true,\"read\":true,\"update\":true,\"delete\":true,\"import_csv\":true}},\"vendors\":{\"access\":true,\"actions\":{\"create\":true,\"read\":true,\"update\":true,\"delete\":true,\"import_csv\":true}},\"reports\":{\"access\":true,\"actions\":{\"read\":true}},\"settings\":{\"access\":true,\"actions\":[]},\"notifications\":{\"access\":true,\"actions\":{\"read\":true,\"edit\":true,\"send\":true}}}', '2025-11-20 05:02:19', '2025-11-25 04:13:30'),
('283aaf9d-cb3c-483f-abe9-979d83e21549', 'kadamprajwal358@gmail.com', '$2y$10$H7w8GSAO96nSBiYXTY99/eLm.8P.vEteW1CPdCJGX9Udqdo4Ssxhm', 'user', '{\"dashboard\":{\"access\":true},\"licenses\":{\"access\":true,\"actions\":{\"create\":false,\"read\":true,\"update\":false,\"delete\":false}},\"sales\":{\"access\":false,\"actions\":{\"create\":false,\"read\":false,\"update\":false,\"delete\":false}},\"clients\":{\"access\":true,\"actions\":{\"create\":false,\"read\":true,\"update\":false,\"delete\":false}},\"vendors\":false,\"reports\":{\"access\":true},\"teams\":{\"access\":false},\"settings\":false,\"notifications\":false}', '2025-11-21 06:10:09', '2025-11-21 09:24:22'),
('5d4873c1-c907-11f0-a8a9-bc2411abf67b', 'admin@example.com', '$2y$10$p62XCBqs5b1ZBgbg6GDMdOCmPd/UHE5yRPVUm/73LDQuoe8UgJDce', 'admin', '{\"dashboard\":{\"access\":true,\"actions\":{\"read\":true}},\"licenses\":{\"access\":true,\"actions\":{\"create\":true,\"read\":true,\"update\":true,\"delete\":true,\"add_purchase_license\":false,\"add_sell_license\":false}},\"clients\":{\"access\":true,\"actions\":{\"create\":true,\"read\":true,\"update\":true,\"delete\":true}},\"vendors\":{\"access\":true,\"actions\":{\"create\":true,\"read\":true,\"update\":true,\"delete\":true}},\"reports\":{\"access\":true,\"actions\":{\"read\":true}},\"settings\":{\"access\":true,\"actions\":[]},\"notifications\":{\"access\":true,\"actions\":{\"read\":true,\"edit\":true,\"send\":true}}}', '2025-11-24 07:29:49', '2025-11-24 10:07:15'),
('6fbb98a1-003a-40f6-af2a-725a6f83eb3b', 'nilraj@gmail.com', '$2y$10$ebV/jSwMOPrc7Abx89sYB.cQoBr3vHZ44zH2KNyPeb3cT6KOI88B.', 'user', '{\"dashboard\":{\"access\":true,\"actions\":{\"read\":true}},\"licenses\":{\"access\":true,\"actions\":{\"create\":false,\"read\":true,\"update\":false,\"delete\":false,\"add_purchase_license\":true,\"add_sell_license\":false}},\"purchase_licenses\":{\"access\":true,\"actions\":{\"read\":true,\"update\":false,\"delete\":false,\"add\":false}},\"selling_licenses\":{\"access\":false,\"actions\":{\"read\":true,\"update\":false,\"delete\":false,\"add\":false}},\"clients\":{\"access\":true,\"actions\":{\"create\":false,\"read\":true,\"update\":false,\"delete\":false}},\"vendors\":{\"access\":true,\"actions\":{\"create\":false,\"read\":true,\"update\":false,\"delete\":false}},\"reports\":{\"access\":true,\"actions\":{\"read\":true}},\"settings\":{\"access\":true,\"actions\":[]},\"notifications\":{\"access\":true,\"actions\":{\"read\":true,\"edit\":false,\"send\":false}}}', '2025-11-24 05:06:35', '2025-11-24 10:54:28'),
('70C30432-C2B0-4C0D-92AD-615A663CDB1E', 'accounts@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'accounts', '{\"dashboard\":true,\"licenses\":true,\"sales\":true,\"clients\":true,\"vendors\":true,\"reports\":true,\"teams\":true,\"settings\":false,\"notifications\":true}', '2025-11-20 05:02:19', '2025-11-20 05:02:19');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `gst_treatment` varchar(100) DEFAULT NULL,
  `source_of_supply` varchar(100) DEFAULT NULL,
  `gst` varchar(50) DEFAULT NULL,
  `currency_id` char(36) DEFAULT NULL,
  `mode_of_payment` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `document_path` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `contact_person`, `email`, `phone`, `address`, `company_name`, `gst_treatment`, `source_of_supply`, `gst`, `currency_id`, `mode_of_payment`, `amount`, `quantity`, `created_at`, `updated_at`, `document_path`) VALUES
('5dd118a3-6414-4f00-8614-f8f8eb3d3238', 'Sujay Palande', 'Sujay Palande', 'kadamprajwal358@gmail.com', '+919699720434', 'pune', 'cybaemtech', 'Unregistered Business', 'landon', '12345678QWERTYU', '5e464c9c-7b45-96f0-3094-6da8f5b4c1a5', NULL, NULL, NULL, '2025-11-21 09:55:37', '2025-11-21 09:55:37', '/uploads/vendors/vendor_doc_69203717b2bda_1763718935.png'),
('69dfda6c-1ee9-4fdf-8761-8b947f853f3f', 'Priyanka Karanjewar', 'prajwal kadam', 'cz8wpufz@mokook.com', '1234567890', 'pune', 'Praj tech', 'Registered Business - Regular', 'india', '123445678QWERTY', '5e464c9c-7b45-96f0-3094-6da8f5b4c1a5', NULL, NULL, NULL, '2025-11-20 08:55:32', '2025-11-20 08:55:32', NULL),
('c83e68a0-02aa-4360-ac7a-05087ebf3026', 'Prajwal Kadam', 'prajwal kadam', 'accounts@cybaemtech.com', '1234567890', 'pune', 'Cybaem tech', 'Registered Business - Regular', 'india', '123445678QWERTY', '2c53fcdd-c4d1-cad9-bf43-1374ed03d543', NULL, NULL, NULL, '2025-11-20 17:20:23', '2025-11-20 17:20:23', '/uploads/vendors/vendor_doc_691f4dd781e7c_1763659223.pdf');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_clients_user_id` (`user_id`),
  ADD KEY `idx_clients_name` (`name`),
  ADD KEY `idx_clients_currency_id` (`currency_id`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_currencies_code` (`code`);

--
-- Indexes for table `email_notifications`
--
ALTER TABLE `email_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_notifications_user_id` (`user_id`),
  ADD KEY `idx_email_notifications_license_id` (`license_id`),
  ADD KEY `idx_email_notifications_type` (`notification_type`);

--
-- Indexes for table `email_notification_log`
--
ALTER TABLE `email_notification_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_license_id` (`license_id`),
  ADD KEY `idx_recipient_email` (`recipient_email`),
  ADD KEY `idx_sent_at` (`sent_at`);

--
-- Indexes for table `license_allocations`
--
ALTER TABLE `license_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_license_allocations_purchase_id` (`purchase_id`),
  ADD KEY `idx_license_allocations_status` (`status`);

--
-- Indexes for table `license_purchases`
--
ALTER TABLE `license_purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `serial_no` (`serial_no`),
  ADD KEY `idx_license_purchases_user_id` (`user_id`),
  ADD KEY `idx_license_purchases_client_id` (`client_id`),
  ADD KEY `idx_license_purchases_tool_name` (`tool_name`),
  ADD KEY `idx_license_purchases_vendor` (`vendor`),
  ADD KEY `idx_license_purchases_expiration` (`expiration_date`),
  ADD KEY `idx_license_purchases_serial_no` (`serial_no`),
  ADD KEY `idx_license_purchases_bill_path` (`bill_path`),
  ADD KEY `idx_license_purchases_purchased_qty` (`purchased_quantity`);

--
-- Indexes for table `license_usage_logs`
--
ALTER TABLE `license_usage_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_license_usage_logs_license_id` (`license_id`),
  ADD KEY `idx_license_usage_logs_user_id` (`user_id`),
  ADD KEY `idx_license_usage_logs_accessed_at` (`accessed_at`);

--
-- Indexes for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_notification_settings_user_id` (`user_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sales_user_id` (`user_id`),
  ADD KEY `idx_sales_client_id` (`client_id`),
  ADD KEY `idx_sales_purchase_id` (`purchase_id`),
  ADD KEY `idx_sales_tool_name` (`tool_name`),
  ADD KEY `idx_sales_sale_date` (`sale_date`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `tools`
--
ALTER TABLE `tools`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tools_name` (`name`),
  ADD KEY `idx_tools_vendor` (`vendor`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendors_name` (`name`),
  ADD KEY `idx_vendors_currency_id` (`currency_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `email_notification_log`
--
ALTER TABLE `email_notification_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
