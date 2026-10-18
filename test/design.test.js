const test = require("node:test");
const assert = require("node:assert/strict");
const DiscountCalculator = require("../src/services/DiscountCalculator");
const CustomerDiscount = require("../src/discounts/CustomerDiscount");
const CouponDiscount = require("../src/discounts/CouponDiscount");
const VolumeDiscount = require("../src/discounts/VolumeDiscount");
const FreightCalculator = require("../src/services/FreightCalculator");
const PaymentProcessor = require("../src/services/PaymentProcessor");
const PixPayment = require("../src/payments/PixPayment");
const CreditCardPayment = require("../src/payments/CreditCardPayment");
const BoletoPayment = require("../src/payments/BoletoPayment");
const InventoryService = require("../src/services/InventoryService");
const NotificationService = require("../src/services/NotificationService");
const { createScenario, runScenario } = require("../support/scenarios");

test("OCP acrescenta uma regra de desconto por composicao", () => {
  const { order } = createScenario();
  const calculator = new DiscountCalculator([
    new CustomerDiscount(), new CouponDiscount(), { calculate: () => 100 }
  ]);
  assert.equal(calculator.calculate(order, 1000), 280);
});

test("OCP registra nova forma de pagamento sem mudar o processador", () => {
  const processor = new PaymentProcessor({ voucher: { process: () => ({ status: "approved", fee: 2, discount: 0 }) } });
  const order = { getPaymentMethod: () => "voucher", getInstallments: () => 1 };
  assert.deepEqual(processor.process(order, 100), { status: "approved", fee: 2, discount: 0 });
});

test("OCP inclui uma regiao por configuracao", () => {
  const { order } = createScenario({ region: "especial" });
  assert.equal(new FreightCalculator({ especial: { base: 10, perKg: 2 } }).calculate(order), 15);
});

for (const [name, method] of [
  ["pix", new PixPayment()], ["cartao", new CreditCardPayment()], ["boleto", new BoletoPayment()]
]) {
  test(`LSP contrato de pagamento substituivel ${name}`, () => {
    for (const installments of [1, 3]) {
      const result = new PaymentProcessor({ any: method }).process(
        { getPaymentMethod: () => "any", getInstallments: () => installments }, 1000);
      assert.deepEqual(Object.keys(result).sort(), ["discount", "fee", "status"]);
      assert.ok(["approved", "waiting_payment"].includes(result.status));
      assert.ok(Number.isFinite(result.fee) && result.fee >= 0);
      assert.ok(Number.isFinite(result.discount) && result.discount >= 0);
    }
  });
}

for (const rule of [new CustomerDiscount(), new CouponDiscount(), new VolumeDiscount()]) {
  test(`LSP regra ${rule.constructor.name} respeita o mesmo contrato`, () => {
    const { order } = createScenario();
    for (const subtotal of [1, 1000, 9000]) {
      const value = new DiscountCalculator([rule]).calculate(order, subtotal);
      assert.ok(Number.isFinite(value) && value >= 0);
    }
  });
}

test("ISP repositorio de pedido precisa somente de save", () => {
  const written = [];
  const actual = runScenario({ dependencies: { orderRepository: { save: (summary) => {
    written.push(summary);
    return summary;
  } } } });
  assert.equal(actual.error, undefined);
  assert.deepEqual(written, [actual.result]);
});

test("ISP estoque nao exige operacoes de listagem ou gravacao de pedido", () => {
  const changes = [];
  const inventory = new InventoryService({
    findById: () => ({ stock: 8, name: "Produto" }),
    updateStock: (id, quantity) => changes.push({ id, quantity })
  });
  const { order } = createScenario();
  inventory.validate(order);
  inventory.reserve(order);
  assert.deepEqual(changes, [{ id: "p1", quantity: 1 }, { id: "p2", quantity: 2 }]);
});

test("Demeter frete usa somente o contrato de Order", () => {
  const order = { getDeliveryRegion: () => "sul", getTotalWeight: () => 2, getCouponCode: () => "" };
  assert.equal(new FreightCalculator().calculate(order), 38);
});

test("Demeter subtotal peso e resumo sao calculados pelos objetos do dominio", () => {
  const { order } = createScenario();
  assert.equal(order.getSubtotal(), 6440);
  assert.equal(order.getTotalWeight(), 2.5);
  assert.equal(order.getTotalItems(), 3);
  assert.deepEqual(order.getCustomerLocation(), { city: "Presidente Prudente", state: "SP" });
});

test("DIP permite substituir notificacao e apresentacao por objetos simples", () => {
  const calls = [];
  const actual = runScenario({ dependencies: {
    notificationService: { sendOrderConfirmation: (...args) => calls.push(["notification", ...args]) },
    presenter: { present: (order, summary) => calls.push(["receipt", summary.id]) }
  } });
  assert.equal(actual.error, undefined);
  assert.deepEqual(calls, [
    ["notification", { name: "Ana Souza", email: "ana.souza@example.com" }, "o1001", 5471.8],
    ["receipt", "o1001"]
  ]);
});

test("notificador local gera mensagem deterministica sem acesso a rede", () => {
  const messages = [];
  new NotificationService((text) => messages.push(text)).sendOrderConfirmation(
    { name: "Ana", email: "ana@example.com" }, "o1", 100);
  assert.deepEqual(messages, ["[EMAIL] Pedido o1 confirmado para Ana (ana@example.com). Total: R$ 100.00."]);
});

test("sequencia do caso de uso preserva reserva gravacao e notificacao", () => {
  const events = [];
  const actual = runScenario({ dependencies: {
    inventory: { validate: () => events.push("validate"), reserve: () => events.push("reserve") },
    orderRepository: { save: (summary) => { events.push("save"); return summary; } },
    notificationService: { sendOrderConfirmation: () => events.push("notify") },
    presenter: { present: () => events.push("present") }
  } });
  assert.equal(actual.error, undefined);
  assert.deepEqual(events, ["validate", "reserve", "save", "notify", "present"]);
});
