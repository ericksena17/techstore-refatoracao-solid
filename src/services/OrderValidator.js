class OrderValidator {
  validate(order) {
    if (!order.hasCustomer()) throw new Error("Cliente obrigatorio.");
    if (!order.hasValidCustomerEmail()) throw new Error("E-mail do cliente invalido.");
    if (!order.hasItems()) throw new Error("Pedido sem itens.");
  }
}

module.exports = OrderValidator;
