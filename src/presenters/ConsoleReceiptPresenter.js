class ConsoleReceiptPresenter {
  constructor(write = console.log) { this.write = write; }

  present(order, summary) {
    this.write("Resumo do pedido");
    this.write(`Cliente: ${summary.customerName}`);
    this.write(`Cidade: ${summary.city}/${summary.state}`);
    this.write(`Itens: ${order.getTotalItems()}`);
    this.write(`Subtotal: R$ ${summary.subtotal.toFixed(2)}`);
    this.write(`Desconto: R$ ${summary.discount.toFixed(2)}`);
    this.write(`Frete: R$ ${summary.freight.toFixed(2)}`);
    this.write(`Taxas: R$ ${summary.paymentFee.toFixed(2)}`);
    this.write(`Total: R$ ${summary.total.toFixed(2)}`);
  }
}

module.exports = ConsoleReceiptPresenter;
