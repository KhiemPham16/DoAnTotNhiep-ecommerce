function parseExpiresInToMs(expiresIn) {
    if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
        return expiresIn * 1000;
    }
    const s = String(expiresIn).trim();
    const m = /^(\d+)(ms|s|m|h|d)$/i.exec(s);
    if (!m) {
        throw new Error(`Invalid expiresIn: ${expiresIn}`);
    }
    const val = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return val * mult[unit];
}

function dateAfterExpiresIn(expiresIn) {
    return new Date(Date.now() + parseExpiresInToMs(expiresIn));
}

module.exports = { parseExpiresInToMs, dateAfterExpiresIn };
