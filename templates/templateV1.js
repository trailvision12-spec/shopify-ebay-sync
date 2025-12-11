module.exports = function templateV1(product, variants = [], images = []) {
  const title = product?.title || "";
  const description = product?.body_html || "";

  // Ensure we always have arrays
  variants = Array.isArray(variants) ? variants : [];
  images = Array.isArray(images) ? images : [];

  const firstImage = images?.[0]?.src || "";

  // Detect product material types safely
 const isMax = variants.some(v => {
  const sku = v?.sku || "";
  return /(_M|_MAX|MAX|M_|FC|fp_|FP_)/i.test(sku);
});

  const isStainless = variants.some(v => v?.sku?.includes("_SS"));
  const isBlackOxide = variants.some(v => v?.sku?.includes("_BO"));

  // Variant list
  const variantList =
    variants.length > 1
      ? `
      <h4>Available Variants:</h4>
      <ul>
        ${variants
          .map(
            v =>
              `<li>${v.title} — SKU: ${v.sku} — £${v.price}</li>`
          )
          .join("")}
      </ul>`
      : "";

  // Stainless / Black Oxide notes
  const materialNotes = `
    ${
      isStainless
        ? `<p><strong>Stainless Steel Upgrade:</strong> Corrosion resistant — ideal for riders in wet or winter conditions.</p>`
        : ""
    }
    ${
      isBlackOxide
        ? `<p><strong>Black Oxide Upgrade:</strong> Increased hardness & rust resistance for aggressive riding.</p>`
        : ""
    }
  `;

  // ⭐ NEW REASONS TO BUY SECTION ⭐
  const reasonsSection = `
<style>
  .reasons-wrapper {
    background: linear-gradient(135deg, #eef5ff 0%, #f9fbff 100%);
    border: 2px solid #d4e4f7;
    border-radius: 16px;
    padding: 40px 25px;
    margin-top: 40px;
    margin-bottom: 25px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.05);
  }

  .reasons-logo {
    width: 160px;
    margin: 0 auto 15px auto;
    display: block;
  }

  .reasons-title {
    text-align: center;
    font-size: 26px;
    font-weight: 700;
    margin-top: 10px;
    margin-bottom: 25px;
    color: #0b3c78;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .reasons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 20px;
    justify-items: center;
  }

  .reason-card {
    background: #ffffff;
    border-radius: 14px;
    padding: 22px 18px;
    width: 100%;
    max-width: 280px;
    text-align: center;
    border: 1px solid #dce8f7;
    box-shadow: 0 3px 9px rgba(0,0,0,0.05);
    transition: all .25s ease;
  }

  .reason-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  }

  .reason-icon {
    font-size: 50px;
    margin-bottom: 12px;
    color: #1a73e8;
  }

  .reason-max .reason-icon {
    color: #e88f00 !important;
  }

  .reason-max h4 {
    color: #d37a00 !important;
  }

  .reason-card h4 {
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 10px;
    text-transform: uppercase;
    color: #0b3c78;
  }

  .reason-card p {
    font-size: 14px;
    color: #333;
    line-height: 1.45;
  }
</style>

<div class="reasons-wrapper">

  <!-- Blueseal Logo -->
  <img class="reasons-logo" 
       src="https://i.ebayimg.com/images/g/M5cAAOSwwFlfDFTA/s-l1600.webp"
       alt="Blueseal Bike Bearings Logo">

  <div class="reasons-title">Why Choose Blueseal?</div>

  <div class="reasons-grid">

    <div class="reason-card">
      <i class="fa fa-shield-halved reason-icon"></i>
      <h4>Bicycle Specific</h4>
      <p>Engineered for mud, rain, vibration & harsh riding — made for bikes, not machinery.</p>
    </div>

    <div class="reason-card">
      <i class="fa fa-gauge-high reason-icon"></i>
      <h4>Long Lasting</h4>
      <p>Premium Mobil grease + LLU seals dramatically extend bearing lifespan.</p>
    </div>

    <div class="reason-card">
      <i class="fa fa-circle-check reason-icon"></i>
      <h4>ABEC 3 Quality</h4>
      <p>Smoother, tighter tolerance and stronger than standard budget bearings.</p>
    </div>

    <div class="reason-card">
      <i class="fa fa-house-user reason-icon"></i>
      <h4>UK Support</h4>
      <p>Small UK business — fast replies, expert help & huge UK stock availability.</p>
    </div>

    ${
      isMax
        ? `
        <div class="reason-card reason-max">
          <i class="fa fa-bolt reason-icon"></i>
          <h4>MAX Full Complement</h4>
          <p>Up to 40% stronger — more ball bearings, no cage, perfect for heavy load pivots.</p>
        </div>`
        : ""
    }

  </div>
</div>
`;


  // FINAL COMBINED TEMPLATE OUTPUT
  return `
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${title} | Blueseal Bike Bearings</title>

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://ebay.finestdesign.app/templates/basic/css/style.css">
<link rel="stylesheet" href="https://ebay.finestdesign.app/templates/basic/css/colours/blue.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

<div id="fd_listing">
<article>
<div class="container">

<h2 class="listing-title">${title}</h2>

<div class="description content-box">
<h3>Description</h3>
<div class="product-description">
${description}
${variantList}
${materialNotes}
</div>
</div>

${reasonsSection}

</div>
</article>
</div>
`;
};
