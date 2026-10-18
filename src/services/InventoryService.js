class InventoryService {
  /** @param {import('../contracts').ProductStockAccess} productRepository */
  constructor(productRepository) { this.productRepository = productRepository; }

  validate(order) {
    // A ordem das validacoes e a verificacao por item seguem a versao original.
    for (const item of order.getItems()) {
      if (!item.hasProduct()) throw new Error("Item sem produto.");
      if (item.getQuantity() <= 0) throw new Error("Quantidade invalida.");
      const product = this.productRepository.findById(item.getProductId());
      if (!product) throw new Error(`Produto ${item.getProductId()} nao encontrado.`);
      if (product.stock < item.getQuantity()) {
        throw new Error(`Estoque insuficiente para ${product.name}.`);
      }
    }
  }

  reserve(order) {
    for (const item of order.getItems()) {
      this.productRepository.updateStock(item.getProductId(), item.getQuantity());
    }
  }
}

module.exports = InventoryService;
