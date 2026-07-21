-- AlterTable
ALTER TABLE `Order` ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `assignedAt` DATETIME(3) NULL,
    ADD COLUMN `assignedToId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Order_assignedToId_idx` ON `Order`(`assignedToId`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
