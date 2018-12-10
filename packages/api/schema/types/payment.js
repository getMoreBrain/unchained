export default [/* GraphQL */`
type PaymentInterface {
  _id: ID!
  label: String
  version: String
}

enum PaymentProviderType {
  """
  Card
  """
  CARD

  """
  Invoice
  """
  INVOICE

  """
  PostFinance
  """
  POSTFINANCE

  """
  Paypal
  """
  PAYPAL

  """
  Crypto
  """
  CRYPTO
}

enum PaymentProviderError {
  ADAPTER_NOT_FOUND
  NOT_IMPLEMENTED
  INCOMPLETE_CONFIGURATION
  WRONG_CREDENTIALS
}

type PaymentProvider {
  _id: ID!
  type: PaymentProviderType
  interface: PaymentInterface
  configuration: JSON
  configurationError: PaymentProviderError
}
`];