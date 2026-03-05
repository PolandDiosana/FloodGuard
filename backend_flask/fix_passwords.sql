USE `floodguard`;

UPDATE `admins` SET `password` = 'scrypt:32768:8:1$8skEc8wzWEWXn7Zu$93e8fb5c32575d13270585334da0bc88182ca90c4bbd04c91009cbfd3515b7744fcd3f0f450e49d2ee55ad7cb196d4eb2e6c5516fd5128ff01e1dfc4fe2fc7c8' WHERE `username` = 'admin@system.com';
UPDATE `admins` SET `password` = 'scrypt:32768:8:1$Vhoswh8WSvR8z1gX$bb0264a985f1a707e7dec2cf5e50881f3193a08ea8b728d8ab8e18209f1691c0c7e57c3a6e640a48c315eb0ccbf080221a4f873ab019ce54907a18aa3c7c335f' WHERE `username` = 'moderator@lgu.gov';
