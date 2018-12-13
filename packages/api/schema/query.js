export default [/* GraphQL */`
  type Query {
    """
    Currently logged in user
    """
    me: User

    """
    Get list of users
    """
    users(limit: Int, offset: Int, includeGuests: Boolean): [User!]!

    """
    Specific user data if userId provided, else returns currently logged in
    """
    user(userId: ID): User

    """
    Simple list of published products filtered either by tags or explicit slugs
    If a slug is provided, limit and offset don't have any effect on the result
    """
    products(tags: [String!], limit: Int, offset: Int, slugs: [String!], includeDrafts: Boolean): [Product!]!

    """
    Get a specific product by id or slug
    """
    product(productId: ID, slug: String): Product

    """
    List prices
    """
    productCatalogPrices(productId: ID!): [ProductPrice!]!

    """
    Localization: Meta data for product
    """
    translatedProductTexts(productId: ID!): [ProductTexts!]!

    """
    Localization: Media title/subtitle of a media that is attached to a product
    """
    translatedProductMediaTexts(productMediaId: ID!): [ProductMediaTexts!]!

    """
    Localization: Variations and Variation Options
    """
    translatedProductVariationTexts(productVariationId: ID!, productVariationOptionValue: String): [ProductVariationTexts!]!

    """
    Get all languages
    """
    languages(limit: Int, offset: Int, includeInactive: Boolean): [Language]!

    """
    Get a specific language
    """
    language(languageId: ID!): Language

    """
    Get all countries
    """
    countries(limit: Int, offset: Int, includeInactive: Boolean): [Country!]!

    """
    Get a specific country by ID
    """
    country(countryId: ID!): Country

    """
    Get all currencies
    """
    currencies(limit: Int, offset: Int, includeInactive: Boolean): [Currency!]!

    """
    Get a specific currency by ID
    """
    currency(currencyId: ID!): Currency

    """
    Get all delivery providers, optionally filtered by type
    """
    deliveryProviders(type: DeliveryProviderType): [DeliveryProvider!]!

    """
    Get a specific delivery provider by ID
    """
    deliveryProvider(deliveryProviderId: ID!): DeliveryProvider

    """
    Get all delivery interfaces filtered by type
    """
    deliveryInterfaces(type: DeliveryProviderType!): [DeliveryInterface!]!

    """
    Get all delivery providers, optionally filtered by type
    """
    warehousingProviders(type: WarehousingProviderType): [WarehousingProvider!]!

    """
    Get a specific warehousing provider by ID
    """
    warehousingProvider(warehousingProviderId: ID!): WarehousingProvider

    """
    Get all warehousing interfaces filtered by type
    """
    warehousingInterfaces(type: WarehousingProviderType!): [WarehousingInterface!]!

    """
    Get all payment providers, optionally filtered by type
    """
    paymentProviders(type: PaymentProviderType): [PaymentProvider!]!

    """
    Get a specific payment provider by ID
    """
    paymentProvider(paymentProviderId: ID!): PaymentProvider

    """
    Get all payment interfaces filtered by type
    """
    paymentInterfaces(type: PaymentProviderType!): [PaymentInterface!]!

    """
    Get all orders
    """
    orders(limit: Int, offset: Int, includeCarts: Boolean): [Order!]!

    """
    Get a specific single order, use the otp to get access to the information without beeing logged in as the user that created the order
    """
    order(orderId: ID!, otp: String): Order

    """
    Get all logs, sorted by most recent creation date first
    """
    logs(limit: Int, offset: Int): [Log!]!

    """
    Get shop-global data and the resolved country/language pair
    """
    shopInfo: Shop!

    """
    Get all root assortments
    """
    assortments(limit: Int, offset: Int, includeInactive: Boolean, includeLeaves: Boolean): [Assortment!]!

    """
    Get a specific assortment by ID
    """
    assortment(assortmentId: ID, slug: String): Assortment

    """
    Localization: Meta data for assortments
    """
    translatedAssortmentTexts(assortmentId: ID!): [AssortmentTexts!]!

    """
    Localization: Filters and Filter Options
    """
    translatedFilterTexts(filterId: ID!, filterOptionValue: String): [FilterTexts!]!

    """
    Get all filters
    """
    filters(limit: Int, offset: Int, includeInactive: Boolean): [Filter!]!

    """
    Get a specific filter by ID
    """
    filter(filterId: ID): Filter

    """
    Get all product reviews
    """
    productReviews(limit: Int, offset: Int): [ProductReview!]!

    """
    Get a specific product review by ID
    """
    productReview(productReviewId: ID!): [ProductReview!]!
  }
`];
