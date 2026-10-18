const test = require("node:test");
const assert = require("node:assert/strict");
const { runScenario } = require("../support/scenarios");

const regions = ["sudeste", "sul", "centro-oeste", "nordeste", "norte", "desconhecida"];
for (const type of ["regular", "vip", "employee"]) {
  for (const coupon of ["", "TECH10", "FRETEGRATIS"]) {
    for (const payment of ["pix", "credit_card", "boleto"]) {
      test(`caracterizacao ${type} ${coupon || "sem-cupom"} ${payment} em 12 cenarios`, () => {
        for (const region of regions) {
          for (const installments of [1, 3]) {
            const input = { type, coupon, payment, region, installments };
            const actual = runScenario(input);
            assert.equal(actual.error, undefined);
            assert.deepEqual(actual, runScenario(input, true), JSON.stringify(input));
          }
        }
      });
    }
  }
}

for (const price of [7999.99, 8000, 8000.01, 9999.995]) {
  test(`limite do desconto por volume com subtotal ${price}`, () => {
    const input = { type: "regular", coupon: "", payment: "pix", items: [{ id: "p1", quantity: 1 }],
      products: [{ id: "p1", price }] };
    const actual = runScenario(input);
    assert.deepEqual(actual, runScenario(input, true));
    const expectedDiscount = Number((price * 0.03 + (price > 8000 ? 250 : 0)).toFixed(2));
    assert.equal(actual.result.discount, expectedDiscount);
  });
}

const invalid = [
  ["cliente ausente", { noCustomer: true }, "Cliente obrigatorio."],
  ["email sem arroba", { email: "invalido" }, "E-mail do cliente invalido."],
  ["email vazio", { email: "" }, "E-mail do cliente invalido."],
  ["email nulo", { email: null }, "E-mail do cliente invalido."],
  ["sem itens", { items: [] }, "Pedido sem itens."],
  ["itens nulos", { nullItems: true }, "Pedido sem itens."],
  ["produto ausente", { items: [{ missing: true, quantity: 1 }] }, "Item sem produto."],
  ["quantidade zero", { items: [{ id: "p1", quantity: 0 }] }, "Quantidade invalida."],
  ["quantidade negativa", { items: [{ id: "p1", quantity: -1 }] }, "Quantidade invalida."],
  ["produto inexistente", { items: [{ id: "p999", quantity: 1 }] }, "Produto p999 nao encontrado."],
  ["estoque insuficiente", { items: [{ id: "p1", quantity: 9 }] }, "Estoque insuficiente para Notebook Pro 14."],
  ["pagamento desconhecido", { payment: "bitcoin" }, "Forma de pagamento invalida."],
  ["total zero", { type: "regular", coupon: "FRETEGRATIS", payment: "boleto",
    items: [{ id: "p1", quantity: 1 }], products: [{ id: "p1", price: 0 }] }, "Total do pedido invalido."]
];
for (const [name, input, message] of invalid) {
  test(`falha preservada ${name} sem gravacao ou baixa de estoque`, () => {
    const actual = runScenario(input);
    assert.deepEqual(actual, runScenario(input, true));
    assert.equal(actual.error.message, message);
    assert.equal(actual.saved.length, 0);
    assert.equal(actual.notifications.length, 0);
    assert.equal(actual.status, "created");
    assert.equal(actual.stocks[0].stock, 8);
  });
}

test("cenario do README tem valores independentes conhecidos", () => {
  const { result, stocks, notifications, saved } = runScenario();
  assert.equal(result.subtotal, 6440);
  assert.equal(result.discount, 1159.2);
  assert.equal(result.freight, 30);
  assert.equal(result.paymentFee, 161);
  assert.equal(result.total, 5471.8);
  assert.equal(result.status, "confirmed");
  assert.equal(stocks[0].stock, 7);
  assert.equal(stocks[1].stock, 28);
  assert.equal(notifications.length, 1);
  assert.deepEqual(saved, [result]);
});

test("boleto continua reservando estoque e nao envia confirmacao", () => {
  const input = { payment: "boleto" };
  const actual = runScenario(input);
  assert.deepEqual(actual, runScenario(input, true));
  assert.equal(actual.result.status, "waiting_payment");
  assert.equal(actual.stocks[0].stock, 7);
  assert.equal(actual.notifications.length, 0);
  assert.ok(actual.logs.includes("[WARN] Pedido o1001 aguardando pagamento."));
});

test("tipo de cliente e cupom desconhecidos mantem desconto zero", () => {
  const input = { type: "outro", coupon: "OUTRO", payment: "boleto" };
  const actual = runScenario(input);
  assert.deepEqual(actual, runScenario(input, true));
  assert.equal(actual.result.discount, 0);
});

test("limite conhecido de estoque por item repetido permanece documentado", () => {
  const input = { items: [{ id: "p1", quantity: 5 }, { id: "p1", quantity: 5 }] };
  const actual = runScenario(input);
  assert.deepEqual(actual, runScenario(input, true));
  assert.equal(actual.stocks[0].stock, -2);
});
