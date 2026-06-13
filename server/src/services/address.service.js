const prisma = require('~/libs/prisma');
const { AppError } = require('~/errors/AppError');

class AddressService {
    toPublicAddress(address) {
        if (!address) return null;

        return {
            id: address.publicId,
            receiverName: address.receiverName,
            receiverPhone: address.receiverPhone,
            provinceCity: address.provinceCity,
            ward: address.ward,
            specificAddress: address.specificAddress,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt
        };
    }

    async getMyAddress(userId) {
        if (!userId) {
            throw new AppError(401, 'Không xác định được người dùng');
        }

        const address = await prisma.address.findUnique({
            where: {
                userId
            }
        });

        return this.toPublicAddress(address);
    }

    async upsertMyAddress(userId, data) {
        if (!userId) {
            throw new AppError(401, 'Không xác định được người dùng');
        }

        const { receiverName, receiverPhone, provinceCity, ward, specificAddress } = data || {};

        if (!receiverName || !receiverPhone || !provinceCity || !ward || !specificAddress) {
            throw new AppError(400, 'Vui lòng nhập đầy đủ thông tin địa chỉ');
        }

        const address = await prisma.address.upsert({
            where: {
                userId
            },
            update: {
                receiverName: receiverName.trim(),
                receiverPhone: receiverPhone.trim(),
                provinceCity: provinceCity.trim(),
                ward: ward.trim(),
                specificAddress: specificAddress.trim(),
                isDefault: true
            },
            create: {
                userId,
                receiverName: receiverName.trim(),
                receiverPhone: receiverPhone.trim(),
                provinceCity: provinceCity.trim(),
                ward: ward.trim(),
                specificAddress: specificAddress.trim(),
                isDefault: true
            }
        });

        return this.toPublicAddress(address);
    }
}

module.exports = new AddressService();
