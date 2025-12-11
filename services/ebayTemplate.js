const { getProductImages } = require("./shopify");

async function buildEbayHtml(product, options = {}) {
  const templateVersion = options.templateVersion || 1;

  // Shopify variants are already included in product
  const variants = Array.isArray(product.variants) ? product.variants : [];

  // Fetch images
  const images = await getProductImages(product.id);

  // Load templates
  const templateV1 = require("../templates/templateV1");
  const templateV2 = require("../templates/templateV2");

  switch (templateVersion) {
    case 1:
      return templateV1(product, variants, images);
    case 2:
      return templateV2(product, variants, images);
    default:
      return templateV1(product, variants, images);
  }
}

module.exports = buildEbayHtml;
