// Helper to safely parse JSON strings from FormData
const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data; // Already parsed
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Parsing Error for field:", data);
        return fallback;
    }
};

module.exports = safeParse