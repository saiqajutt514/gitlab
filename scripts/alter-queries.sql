-- PR-380
ALTER TABLE `trips` ADD `motAmount` float DEFAULT '0' COMMENT 'Ministry of Transportation fee';
INSERT INTO `setting` (`id`, `createdAt`, `updatedAt`, `name`, `value`, `category`, `description`) VALUES
(UUID(),	NOW(),	NOW(),	'MOT_AMOUNT',	'0.5',	'1',	'Applicable MOT(Ministry of Transportation) fee for for each trip ( in SAR )');

-- PR-382
ALTER TABLE `trips` ADD `changedDestinationCount` int NOT NULL DEFAULT '0' COMMENT 'No.of destinations changed for a trip';

-- PR-384
CREATE TABLE `trip_locations` ( `id` varchar(36) NOT NULL, `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `userType` enum('1','2') NOT NULL DEFAULT '2' COMMENT 'to which user the location belongs', `latitude` double NOT NULL, `longitude` double NOT NULL, `tripId` varchar(36) DEFAULT NULL, PRIMARY KEY (`id`), KEY `IDX_0041e4d26c56e593d1f15f8035` (`tripId`), CONSTRAINT `FK_0041e4d26c56e593d1f15f80351` FOREIGN KEY (`tripId`) REFERENCES `trips` (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PR-405
UPDATE trips t SET t.driverId=(SELECT c.userId FROM customer c WHERE c.driverId = t.driverId) WHERE t.driverId IS NOT NULL;
UPDATE trip_drivers t SET t.driverId=(SELECT c.userId FROM customer c WHERE c.driverId = t.driverId) WHERE t.driverId IS NOT NULL;
ALTER TABLE `trips` MODIFY `driverId` bigint DEFAULT NULL COMMENT 'Driver Id who will accept, reject, cancel or complete the trip'

-- PR-409
ALTER TABLE `category` ADD `moduleType` enum ('1','2','3') NOT NULL DEFAULT '1';
INSERT INTO `category` (`id`, `createdAt`, `updatedAt`, `categoryName`, `createdBy`, `modifiedBy`, `isDeleted`, `status`, `moduleType`) VALUES
('d0e57846-0fd5-11ec-b8d5-0242196278f7', NOW(), NOW(), 'Chat Users', NULL, NULL, NULL, 1, 2),
('d0e57925-0fd5-11ec-b8d5-0242196278f7', NOW(), NOW(), 'Chat Settings', NULL, NULL, NULL, 1, 2);

INSERT INTO `permission` (`id`, `createdAt`, `updatedAt`, `accessName`, `accessCode`, `sequence`, `createdBy`, `modifiedBy`, `isDeleted`, `status`, `categoryId`) VALUES
(UUID(), NOW(), NOW(), 'List', 'chat-user-list', 1, NULL, NULL, NULL, 1, 'd0e57846-0fd5-11ec-b8d5-0242196278f7'),
(UUID(), NOW(), NOW(), 'Detail', 'chat-user-detail', 2, NULL, NULL, NULL, 1, 'd0e57846-0fd5-11ec-b8d5-0242196278f7'),
(UUID(), NOW(), NOW(), 'Update Status', 'chat-user-status', 3, NULL, NULL, NULL, 1, 'd0e57846-0fd5-11ec-b8d5-0242196278f7'),
(UUID(), NOW(), NOW(), 'Status Log', 'chat-user-audit-log', 4, NULL, NULL, NULL, 1, 'd0e57846-0fd5-11ec-b8d5-0242196278f7'),
(UUID(), NOW(), NOW(), 'List', 'chat-settings-list', 1, NULL, NULL, NULL, 1, 'd0e57925-0fd5-11ec-b8d5-0242196278f7'),
(UUID(), NOW(), NOW(), 'Audit Log', 'chat-settings-audit-log', 2, NULL, NULL, NULL, 1, 'd0e57925-0fd5-11ec-b8d5-0242196278f7');

UPDATE role SET capabilites='[\"riders-list\", \"riders-view\", \"riders-trip-history\", \"riders-scheduled-trips\", \"drivers-list\", \"drivers-edit\", \"drivers-view\", \"drivers-trip-history\", \"drivers-subscriptions\", \"drivers-earnings\", \"trips-list\", \"trips-view\", \"trips-canel\", \"dashboard_view\", \"subadmin-list\", \"subadmin-add\", \"subadmin-edit\", \"subadmin-view\", \"subadmin-delete\", \"rider-ratings-list\", \"rider-ratings-view\", \"driver-ratings-list\", \"driver-ratings-view\", \"promotions-list\", \"promotions-add\", \"promotions-edit\", \"promotions-view\", \"promotions-delete\", \"subcription-packages-list\", \"subcription-packages-add\", \"subcription-packages-edit\", \"subcription-packages-view\", \"subcription-packages-delete\", \"roles-list\", \"roles-add\", \"roles-edit\", \"roles-view\", \"roles-delete\", \"driver-registrations-list\", \"report-riders-list\", \"report-drivers-list\", \"report-driver-earnings\", \"report-trips-list\", \"report-transactions\", \"report-trips-declined-by-driver\", \"report-trips-cancelled-by-driver\", \"report-trips-cancelled-by-rider\", \"report-vehicle-registrations\", \"vehicle-type-list\", \"vehicle-type-add\", \"vehicle-type-edit\", \"vehicle-type-view\", \"vehicle-type-delete\", \"vehicles-list\", \"vehicles-add\", \"vehicles-edit\", \"vehicles-view\", \"vehicles-delete\", \"rejected-reasons-list\", \"rejected-reasons-add\", \"rejected-reasons-edit\", \"rejected-reasons-view\", \"rejected-reasons-delete\", \"subscription-transaction-active-list\", \"subscription-transaction-expired-list\", \"push-templates-list\", \"push-templates-view\", \"push-templates-edit\", \"sms-templates-list\", \"sms-templates-view\", \"sms-templates-edit\", \"email-templates-list\", \"email-templates-view\", \"email-templates-edit\", \"settings-list\", \"settings-edit\", \"emergency-team-list\", \"emergency-request-list\", \"emergency-request-edit\", \"dispatcher-team-list\", \"dispatcher-trips-list\", \"dispatcher-trips-view\", \"dispatcher-trips-add\", \"incomplete-trips-requests\", \"chat-user-list\", \"chat-user-detail\", \"chat-user-status\", \"chat-user-audit-log\", \"chat-settings-list\", \"chat-settings-audit-log\"]' WHERE code='admin';

ALTER TABLE `setting` MODIFY `category` enum('1','2','3','4','5') DEFAULT '4';
ALTER TABLE `setting` ADD `subCategory` enum('51','52','53','1') NULL DEFAULT '1';
INSERT INTO `setting` (`id`, `createdAt`, `updatedAt`, `name`, `value`, `category`, `subCategory`, `description`) VALUES
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_USER_LIMIT',	'20',	'5',  '51',  'Maximum no.of of users allowed to chat'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_CAMERA_VIDEO_SIZE',	'16',	'5',  '51',  'Maximum allowed filesize of video taken from Camera (In MB)'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_GALLERY_VIDEO_SIZE',	'16',	'5',  '51',  'Maximum allowed filesize of video from Gallery (In MB)'),
(UUID(),	NOW(),	NOW(),	'GROUP_CAMERA_VIDEO_SIZE',	'16',	'5',  '52',  'Maximum allowed filesize of video  taken from Camera (In MB)'),
(UUID(),	NOW(),	NOW(),	'GROUP_GALLERY_VIDEO_SIZE',	'16',	'5',  '52',  'Maximum allowed filesize of video from Gallery (In MB)'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_CAMERA_PHOTO_SIZE',	'10',	'5',  '51',  'Maximum allowed filesize of photo taken from Camera (In MB)'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_GALLERY_PHOTO_SIZE',	'10',	'5',  '51',  'Maximum allowed filesize of photo from Gallery (In MB)'),
(UUID(),	NOW(),	NOW(),	'GROUP_CAMERA_PHOTO_SIZE',	'10',	'5',  '52',  'Maximum allowed filesize of photo  taken from Camera (In MB)'),
(UUID(),	NOW(),	NOW(),	'GROUP_GALLERY_PHOTO_SIZE',	'10',	'5',  '52',  'Maximum allowed filesize of photo from Gallery (In MB)'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_LIVE_VOICENOTE_SIZE',	'10',	'5',  '51',  'Maximum allowed filesize of voice note Live (In MB)'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_GALLERY_VOICENOTE_SIZE',	'10',	'5',  '51',  'Maximum allowed filesize of voice note from Gallery (In MB)'),
(UUID(),	NOW(),	NOW(),	'GROUP_LIVE_VOICENOTE_SIZE',	'10',	'5',  '52',  'Maximum allowed filesize of voice note Live (In MB)'),
(UUID(),	NOW(),	NOW(),	'GROUP_GALLERY_VOICENOTE_SIZE',	'10',	'5',  '52',  'Maximum allowed filesize of voice note from Gallery (In MB)'),
(UUID(),	NOW(),	NOW(),	'INDIVIDUAL_VOICENOTE_LENGTH',	'10',	'5',  '51',  'Maximum allowed time for voice note (In minutes)'),
(UUID(),	NOW(),	NOW(),	'GROUP_VOICENOTE_LENGTH',	'10',	'5',  '52',  'Maximum allowed time for voice note (In minutes)'),
(UUID(),	NOW(),	NOW(),	'GROUP_USER_LIMIT',	'20',	'5',  '52',  'Maximum no.of of users in a single group');

-- PR-422
ALTER TABLE `push_notification_log` DROP COLUMN `isViewable`;
ALTER TABLE `email_templates` ADD `logStatus` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `push_templates` ADD `logStatus` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `sms_templates` ADD `logStatus` tinyint NOT NULL DEFAULT 1;
UPDATE `push_templates` SET `logStatus` = '0' WHERE `templateCode` = 'CHAT_MESSAGE';
-- DELETE FROM `push_notification_log` WHERE `title` LIKE 'New text message from%';

-- PR-437
ALTER TABLE `captain` ADD `isWASLApproved` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Driver''s WASL eligibility status' AFTER notifiedForEligibilityExpiry;

-- PR-441
ALTER TABLE `captain` ADD `WASLRejectionReasons` text NULL COMMENT 'Driver''s WASL eligibility rejection reason(s)';