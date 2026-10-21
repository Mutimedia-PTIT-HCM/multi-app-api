-- CreateTable
CREATE TABLE `students` (
    `studentCode` VARCHAR(12) NOT NULL,
    `uisPassword` TEXT NULL,
    `classCode` VARCHAR(50) NOT NULL,
    `fcmToken` TEXT NULL,
    `fullName` VARCHAR(300) NULL,
    `phone` VARCHAR(20) NULL,
    `personalEmail` VARCHAR(255) NULL,
    `facebook` VARCHAR(500) NULL,
    `gender` INTEGER NOT NULL DEFAULT 0,
    `birthDate` VARCHAR(10) NULL,
    `avatarKey` VARCHAR(500) NULL,
    `role` INTEGER NOT NULL DEFAULT 6,
    `isCollaborator` BOOLEAN NOT NULL DEFAULT false,
    `hidePersonalEmail` BOOLEAN NOT NULL DEFAULT false,
    `hideFacebook` BOOLEAN NOT NULL DEFAULT false,
    `hidePhone` BOOLEAN NOT NULL DEFAULT false,
    `otp` VARCHAR(10) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `students_classCode_idx`(`classCode`),
    PRIMARY KEY (`studentCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `teacherCode` VARCHAR(10) NOT NULL,
    `fullName` VARCHAR(100) NULL,
    `birthDate` VARCHAR(10) NULL,
    `zalo` VARCHAR(20) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `academicRank` VARCHAR(30) NULL,
    `degree` VARCHAR(30) NULL,

    PRIMARY KEY (`teacherCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mentors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherCode` VARCHAR(10) NOT NULL,
    `classCode` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `mentors_teacherCode_classCode_key`(`teacherCode`, `classCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semesterCode` VARCHAR(5) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_point_forms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNo` DOUBLE NULL,
    `content` TEXT NOT NULL,
    `maxPoint` INTEGER NULL,
    `type` VARCHAR(50) NOT NULL,
    `parentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_points` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NOT NULL,
    `studentCode` VARCHAR(12) NOT NULL,
    `selfPoint` INTEGER NOT NULL DEFAULT 0,
    `finalPoint` INTEGER NOT NULL DEFAULT 0,

    INDEX `training_points_studentCode_idx`(`studentCode`),
    UNIQUE INDEX `training_points_formId_studentCode_key`(`formId`, `studentCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_point_statuses` (
    `classCode` VARCHAR(50) NOT NULL,
    `isOpen` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`classCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentCode` VARCHAR(12) NOT NULL,
    `title` TEXT NOT NULL,
    `imageKeys` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `certificates_studentCode_idx`(`studentCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `eventCode` VARCHAR(30) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `content` TEXT NOT NULL,
    `eventTime` VARCHAR(256) NULL,
    `isDone` BOOLEAN NOT NULL DEFAULT false,
    `thumbnailKey` VARCHAR(500) NULL,
    `posterCode` VARCHAR(12) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`eventCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_check_ins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventCode` VARCHAR(30) NOT NULL,
    `studentCode` VARCHAR(12) NOT NULL,
    `checkInAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location` VARCHAR(255) NULL,

    INDEX `event_check_ins_eventCode_idx`(`eventCode`),
    UNIQUE INDEX `event_check_ins_eventCode_studentCode_key`(`eventCode`, `studentCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notificationCode` VARCHAR(30) NOT NULL,
    `title` TEXT NOT NULL,
    `content` TEXT NOT NULL,
    `posterCode` VARCHAR(12) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(30) NOT NULL,
    `fileKeys` TEXT NULL,

    PRIMARY KEY (`notificationCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_recipients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notificationCode` VARCHAR(30) NOT NULL,
    `studentCode` VARCHAR(12) NOT NULL,
    `seen` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_recipients_studentCode_idx`(`studentCode`),
    UNIQUE INDEX `notification_recipients_notificationCode_studentCode_key`(`notificationCode`, `studentCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `productCode` VARCHAR(30) NOT NULL,
    `sellerCode` VARCHAR(12) NOT NULL,
    `name` VARCHAR(256) NOT NULL,
    `price` VARCHAR(50) NULL,
    `stock` INTEGER NOT NULL,
    `description` TEXT NULL,
    `imageKeys` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`productCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `orderCode` VARCHAR(30) NOT NULL,
    `buyerCode` VARCHAR(12) NOT NULL,
    `productCode` VARCHAR(30) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `status` INTEGER NOT NULL DEFAULT -1,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orders_buyerCode_idx`(`buyerCode`),
    INDEX `orders_productCode_idx`(`productCode`),
    PRIMARY KEY (`orderCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `messageCode` VARCHAR(30) NOT NULL,
    `senderCode` VARCHAR(12) NOT NULL,
    `receiverCode` VARCHAR(12) NOT NULL,
    `content` TEXT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `state` INTEGER NOT NULL DEFAULT 1,

    INDEX `messages_senderCode_receiverCode_idx`(`senderCode`, `receiverCode`),
    PRIMARY KEY (`messageCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `point_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentCode` VARCHAR(12) NOT NULL,
    `semesterCode` VARCHAR(5) NOT NULL,
    `gpa` DOUBLE NULL,

    UNIQUE INDEX `point_snapshots_studentCode_semesterCode_key`(`studentCode`, `semesterCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `training_points` ADD CONSTRAINT `training_points_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `training_point_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_points` ADD CONSTRAINT `training_points_studentCode_fkey` FOREIGN KEY (`studentCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_studentCode_fkey` FOREIGN KEY (`studentCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_posterCode_fkey` FOREIGN KEY (`posterCode`) REFERENCES `students`(`studentCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_check_ins` ADD CONSTRAINT `event_check_ins_eventCode_fkey` FOREIGN KEY (`eventCode`) REFERENCES `events`(`eventCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_check_ins` ADD CONSTRAINT `event_check_ins_studentCode_fkey` FOREIGN KEY (`studentCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_posterCode_fkey` FOREIGN KEY (`posterCode`) REFERENCES `students`(`studentCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_recipients` ADD CONSTRAINT `notification_recipients_notificationCode_fkey` FOREIGN KEY (`notificationCode`) REFERENCES `notifications`(`notificationCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_recipients` ADD CONSTRAINT `notification_recipients_studentCode_fkey` FOREIGN KEY (`studentCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_sellerCode_fkey` FOREIGN KEY (`sellerCode`) REFERENCES `students`(`studentCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyerCode_fkey` FOREIGN KEY (`buyerCode`) REFERENCES `students`(`studentCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_productCode_fkey` FOREIGN KEY (`productCode`) REFERENCES `products`(`productCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderCode_fkey` FOREIGN KEY (`senderCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiverCode_fkey` FOREIGN KEY (`receiverCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `point_snapshots` ADD CONSTRAINT `point_snapshots_studentCode_fkey` FOREIGN KEY (`studentCode`) REFERENCES `students`(`studentCode`) ON DELETE CASCADE ON UPDATE CASCADE;

