// The exact 20 real productType values already live in your Product
// schema's enum, this is the one-time seed list, and also exactly what
// "Reset to Default" restores. Order here is the default display order.
const DEFAULT_CATEGORIES = [
    // Indian Wear
    { value: "saree", label: "Sarees", group: "Indian Wear", sortOrder: 1 },
    { value: "lehenga", label: "Lehengas", group: "Indian Wear", sortOrder: 2 },
    { value: "suit_set", label: "Suit Sets", group: "Indian Wear", sortOrder: 3 },
    { value: "kurta", label: "Kurtas", group: "Indian Wear", sortOrder: 4 },
    { value: "dupatta", label: "Dupattas", group: "Indian Wear", sortOrder: 5 },
    // Western Wear
    { value: "tshirt", label: "T-Shirts", group: "Western Wear", sortOrder: 6 },
    { value: "jeans", label: "Jeans", group: "Western Wear", sortOrder: 7 },
    { value: "trouser", label: "Trousers", group: "Western Wear", sortOrder: 8 },
    { value: "shirt", label: "Shirts", group: "Western Wear", sortOrder: 9 },
    { value: "top", label: "Tops", group: "Western Wear", sortOrder: 10 },
    { value: "dress", label: "Dresses", group: "Western Wear", sortOrder: 11 },
    { value: "coat", label: "Coats", group: "Western Wear", sortOrder: 12 },
    { value: "jacket", label: "Jackets", group: "Western Wear", sortOrder: 13 },
    // Accessories
    { value: "Jewellery", label: "Jewellery", group: "Accessories", sortOrder: 14 },
    { value: "bag", label: "Bags", group: "Accessories", sortOrder: 15 },
    { value: "footwear", label: "Footwear", group: "Accessories", sortOrder: 16 },
    { value: "watch", label: "Watches", group: "Accessories", sortOrder: 17 },
    { value: "perfume", label: "Perfume", group: "Accessories", sortOrder: 18 },
    { value: "belt", label: "Belts", group: "Accessories", sortOrder: 19 },
    // Other
    { value: "other", label: "Other", group: "Other", sortOrder: 20 },
].map((c) => ({ ...c, description: "", imageUrl: null, isDefault: true }));

module.exports = { DEFAULT_CATEGORIES };