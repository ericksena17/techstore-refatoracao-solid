const OrderService = require("../services/OrderService");
const OrderValidator = require("../services/OrderValidator");
const InventoryService = require("../services/InventoryService");
const DiscountCalculator = require("../services/DiscountCalculator");
const FreightCalculator = require("../services/FreightCalculator");
const PaymentProcessor = require("../services/PaymentProcessor");
const NotificationService = require("../services/NotificationService");
const CustomerDiscount = require("../discounts/CustomerDiscount");
const CouponDiscount = require("../discounts/CouponDiscount");
const VolumeDiscount = require("../discounts/VolumeDiscount");
const PixPayment = require("../payments/PixPayment");
const CreditCardPayment = require("../payments/CreditCardPayment");
const BoletoPayment = require("../payments/BoletoPayment");
const ProductRepository = require("../repositories/ProductRepository");
const OrderRepository = require("../repositories/OrderRepository");
const ConsoleReceiptPresenter = require("../presenters/ConsoleReceiptPresenter");
const Logger = require("../utils/Logger");

// Unico ponto que conhece e conecta as implementacoes concretas.
function createOrderService(overrides = {}) {
  const productRepository = overrides.productRepository ?? new ProductRepository();
  return new OrderService({
    validator: overrides.validator ?? new OrderValidator(),
    inventory: overrides.inventory ?? new InventoryService(productRepository),
    discountCalculator: overrides.discountCalculator ?? new DiscountCalculator([
      new CustomerDiscount(), new CouponDiscount(), new VolumeDiscount()
    ]),
    freightCalculator: overrides.freightCalculator ?? new FreightCalculator(),
    paymentProcessor: overrides.paymentProcessor ?? new PaymentProcessor({
      pix: new PixPayment(), credit_card: new CreditCardPayment(), boleto: new BoletoPayment()
    }),
    orderRepository: overrides.orderRepository ?? new OrderRepository(),
    notificationService: overrides.notificationService ?? new NotificationService(),
    logger: overrides.logger ?? new Logger(),
    presenter: overrides.presenter ?? new ConsoleReceiptPresenter()
  });
}

module.exports = createOrderService;
