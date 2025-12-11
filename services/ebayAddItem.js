const ebayAuth = require("./ebayAuth");

function buildAddFixedPriceItemXML(product) {
  return `
    <?xml version="1.0" encoding="utf-8"?>
    <AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuth.getAuthToken()}</eBayAuthToken>
      </RequesterCredentials>

      <ErrorLanguage>en_GB</ErrorLanguage>
      <WarningLevel>High</WarningLevel>

      <Item>
        <Title>${product.title}</Title>
        <Description>${product.description}</Description>
        <PrimaryCategory>
          <CategoryID>${product.categoryId}</CategoryID>
        </PrimaryCategory>
        <StartPrice>${product.price}</StartPrice>
        <ConditionID>${product.condition}</ConditionID>
        <Country>GB</Country>
        <Currency>GBP</Currency>
        <DispatchTimeMax>1</DispatchTimeMax>
        <ListingDuration>GTC</ListingDuration>
        <ListingType>FixedPriceItem</ListingType>
        <PayPalEmailAddress>${product.paypal}</PayPalEmailAddress>
        <Quantity>${product.quantity}</Quantity>
      </Item>
    </AddFixedPriceItemRequest>
  `;
}

module.exports = { buildAddFixedPriceItemXML };
