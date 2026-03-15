// utils/slugHelper.js

/**
 * Convert text to SEO friendly slug
 */
const slugify = (text = "") => {
  return text
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")      // remove special characters
    .replace(/[\s_-]+/g, "-")      // replace spaces with -
    .replace(/^-+|-+$/g, "");      // remove leading/trailing -
};


/**
 * Generate unique slug for any model
 * @param {Model} Model - mongoose model
 * @param {String} value - slug or name
 */
const generateUniqueSlug = async (Model, value) => {

  const baseSlug = slugify(value);

  let slug = baseSlug;
  let counter = 1;

  while (await Model.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = {
  slugify,
  generateUniqueSlug
};