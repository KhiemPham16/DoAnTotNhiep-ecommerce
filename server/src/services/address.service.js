const prisma = require('~/libs/prisma');

class AddressService {
    async getMyAddress(userId) {
        return prisma.address.findUnique({
            where: {
                userId
            }
        });
    }

    async upsertMyAddress(userId, data) {
        const { receiverName, receiverPhone, provinceCity, ward, specificAddress } = data;

        return prisma.address.upsert({
            where: {
                userId
            },
            update: {
                receiverName,
                receiverPhone,
                provinceCity,
                ward,
                specificAddress
            },
            create: {
                userId,
                receiverName,
                receiverPhone,
                provinceCity,
                ward,
                specificAddress,
                isDefault: true
            }
        });
    }
}

module.exports = new AddressService();
