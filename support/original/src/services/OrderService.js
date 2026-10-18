const ProductRepository = require("../repositories/ProductRepository");
const OrderRepository = require("../repositories/OrderRepository");
const NotificationService = require("./NotificationService");
const Logger = require("../utils/Logger");

class OrderService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.orderRepository = new OrderRepository();
    this.notificationService = new NotificationService();
    this.logger = new Logger();
  }

  process(order) {
    this.logger.info(`Iniciando processamento do pedido ${order.id}.`);

    if (!order.customer) {
      throw new Error("Cliente obrigatorio.");
    }

    if (!order.customer.email || !order.customer.email.includes("@")) {
      throw new Error("E-mail do cliente invalido.");
    }

    if (!order.items || order.items.length === 0) {
      throw new Error("Pedido sem itens.");
    }

    for (const item of order.items) {
      if (!item.product) {
        throw new Error("Item sem produto.");
      }

      if (item.quantity <= 0) {
        throw new Error("Quantidade invalida.");
      }

      const product = this.productRepository.findById(item.product.id);

      if (!product) {
        throw new Error(`Produto ${item.product.id} nao encontrado.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}.`);
      }
    }

    let subtotal = 0;

    for (const item of order.items) {
      subtotal += item.product.price * item.quantity;
    }

    let discount = 0;

    if (order.customer.type === "vip") {
      discount += subtotal * 0.08;
    }

    if (order.customer.type === "employee") {
      discount += subtotal * 0.15;
    }

    if (order.couponCode === "TECH10") {
      discount += subtotal * 0.1;
    }

    if (order.couponCode === "FRETEGRATIS") {
      discount += 0;
    }

    if (subtotal > 8000) {
      discount += 250;
    }

    let totalWeight = 0;

    for (const item of order.items) {
      totalWeight += item.product.weight * item.quantity;
    }

    let freight = 0;

    if (order.customer.address.region === "sudeste") {
      freight = 20 + totalWeight * 4;
    } else if (order.customer.address.region === "sul") {
      freight = 28 + totalWeight * 5;
    } else if (order.customer.address.region === "centro-oeste") {
      freight = 35 + totalWeight * 6;
    } else if (order.customer.address.region === "nordeste") {
      freight = 45 + totalWeight * 7;
    } else if (order.customer.address.region === "norte") {
      freight = 60 + totalWeight * 9;
    } else {
      freight = 50 + totalWeight * 8;
    }

    if (order.couponCode === "FRETEGRATIS") {
      freight = 0;
    }

    let paymentFee = 0;
    let paymentStatus = "pending";

    if (order.paymentMethod === "pix") {
      paymentStatus = "approved";
      discount += subtotal * 0.03;
    } else if (order.paymentMethod === "credit_card") {
      if (order.installments > 1) {
        paymentFee = subtotal * 0.025;
      }
      paymentStatus = "approved";
    } else if (order.paymentMethod === "boleto") {
      paymentStatus = "waiting_payment";
    } else {
      throw new Error("Forma de pagamento invalida.");
    }

    const total = Number((subtotal - discount + freight + paymentFee).toFixed(2));

    if (total <= 0) {
      throw new Error("Total do pedido invalido.");
    }

    for (const item of order.items) {
      this.productRepository.updateStock(item.product.id, item.quantity);
    }

    order.status = paymentStatus === "approved" ? "confirmed" : "waiting_payment";

    const orderSummary = {
      id: order.id,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      city: order.customer.address.city,
      state: order.customer.address.state,
      items: order.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        subtotal: item.getSubtotal()
      })),
      subtotal,
      discount: Number(discount.toFixed(2)),
      freight: Number(freight.toFixed(2)),
      paymentFee: Number(paymentFee.toFixed(2)),
      total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    };

    this.orderRepository.save(orderSummary);

    if (order.status === "confirmed") {
      this.notificationService.sendOrderConfirmation(order.customer, order.id, total);
    } else {
      this.logger.warn(`Pedido ${order.id} aguardando pagamento.`);
    }

    console.log("Resumo do pedido");
    console.log(`Cliente: ${order.customer.name}`);
    console.log(`Cidade: ${order.customer.address.city}/${order.customer.address.state}`);
    console.log(`Itens: ${order.getTotalItems()}`);
    console.log(`Subtotal: R$ ${subtotal.toFixed(2)}`);
    console.log(`Desconto: R$ ${discount.toFixed(2)}`);
    console.log(`Frete: R$ ${freight.toFixed(2)}`);
    console.log(`Taxas: R$ ${paymentFee.toFixed(2)}`);
    console.log(`Total: R$ ${total.toFixed(2)}`);

    return orderSummary;
  }
}

module.exports = OrderService;
