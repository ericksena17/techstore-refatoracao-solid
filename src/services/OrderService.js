/** Coordena o caso de uso. Os detalhes concretos ficam na composicao. */
class OrderService {
  constructor({ validator, inventory, discountCalculator, freightCalculator,
    paymentProcessor, orderRepository, notificationService, logger, presenter }) {
    this.validator = validator;
    this.inventory = inventory;
    this.discountCalculator = discountCalculator;
    this.freightCalculator = freightCalculator;
    this.paymentProcessor = paymentProcessor;
    /** @type {import('../contracts').OrderWriter} */
    this.orderRepository = orderRepository;
    /** @type {import('../contracts').OrderNotifier} */
    this.notificationService = notificationService;
    this.logger = logger;
    this.presenter = presenter;
  }

  process(order) {
    this.logger.info(`Iniciando processamento do pedido ${order.getId()}.`);
    this.validator.validate(order);
    this.inventory.validate(order);
    const subtotal = order.getSubtotal();
    let discount = this.discountCalculator.calculate(order, subtotal);
    const freight = this.freightCalculator.calculate(order);
    const payment = this.paymentProcessor.process(order, subtotal);
    discount += payment.discount;
    const paymentFee = payment.fee;
    const total = Number((subtotal - discount + freight + paymentFee).toFixed(2));

    if (total <= 0) throw new Error("Total do pedido invalido.");

    this.inventory.reserve(order);
    order.applyPaymentStatus(payment.status);
    const summary = order.createSummary({ subtotal, discount, freight, paymentFee, total });
    this.orderRepository.save(summary);
    if (order.isConfirmed()) {
      this.notificationService.sendOrderConfirmation(order.getCustomerContact(), order.getId(), total);
    } else {
      this.logger.warn(`Pedido ${order.getId()} aguardando pagamento.`);
    }
    this.presenter.present(order, summary);
    return summary;
  }
}

module.exports = OrderService;
