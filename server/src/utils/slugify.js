const prisma = require('~/libs/prisma');
const slugify = require('slugify');

function generateSlug(text) {
    return slugify(text, {
        lower: true,
        strict: true,
        locale: 'vi',
        trim: true
    });
}

async function generateUniqueCategorySlug(name) {
    const baseSlug = generateSlug(name);

    let slug = baseSlug;
    let count = 1;

    while (
        await prisma.category.findUnique({
            where: {
                slug
            }
        })
    ) {
        slug = `${baseSlug}-${count}`;
        count++;
    }

    return slug;
}

async function generateUniqueSlugPrisma(text, modelName) {
    if (!text) {
        throw new Error('Text is required to generate slug');
    }

    if (!modelName || typeof modelName !== 'string') {
        throw new Error('modelName is required to generate unique slug');
    }

    const model = prisma[modelName];
    if (!model || typeof model.findUnique !== 'function') {
        throw new Error(`Model "${modelName}" is not available on Prisma client`);
    }

    const baseSlug = generateSlug(text);
    let slug = baseSlug;
    let count = 1;

    // Assumes model has unique field `slug`
    while (
        await model.findUnique({
            where: {
                slug
            }
        })
    ) {
        slug = `${baseSlug}-${count}`;
        count++;
    }

    return slug;
}

module.exports = {
    generateSlug,
    generateUniqueCategorySlug,
    generateUniqueSlugPrisma
};
