const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Module = require("node:module");
const createOrderService = require("../src/composition/createOrderService");

function loadOriginalService(notifications) {
  const filename = path.join(__dirname, "original/src/services/OrderService.js");
  const originalRequire = Module.createRequire(filename);
  const legacyRequire = (id) => {
    if (id === "./NotificationService") {
      return class NotificationSpy {
        sendOrderConfirmation(customer, orderId, total) {
          notifications.push({ contact: { name: customer.name, email: customer.email }, orderId, total });
        }
      };
    }
    return originalRequire(id);
  };
  const target = { exports: {} };
  const wrapper = new vm.Script(Module.wrap(fs.readFileSync(filename, "utf8")), { filename });
  wrapper.runInThisContext()(target.exports, legacyRequire, target, filename, path.dirname(filename));
  return target.exports;
}

function createScenario(options = {}, original = false) {
  const root = original ? "./original/src" : "../src";
  const Address = require(`${root}/domain/Address`);
  const Customer = require(`${root}/domain/Customer`);
  const Order = require(`${root}/domain/Order`);
  const OrderItem = require(`${root}/domain/OrderItem`);
  const Product = require(`${root}/domain/Product`);
  const ProductRepository = require(`${root}/repositories/ProductRepository`);
  const OrderRepository = require(`${root}/repositories/OrderRepository`);
  const notifications = [];
  let service;
  let productRepository;
  let orderRepository;
  if (original) {
    const OriginalService = loadOriginalService(notifications);
    service = new OriginalService();
    productRepository = service.productRepository;
    orderRepository = service.orderRepository;
  } else {
    productRepository = new ProductRepository();
    orderRepository = new OrderRepository();
    service = createOrderService({
      productRepository,
      orderRepository,
      notificationService: {
        sendOrderConfirmation(contact, orderId, total) {
          notifications.push({ contact, orderId, total });
        }
      },
      ...options.dependencies
    });
  }

  // O catalogo separado reproduz a montagem original de src/index.js.
  const catalog = new ProductRepository();
  for (const change of options.products ?? []) {
    Object.assign(catalog.findById(change.id), change);
    Object.assign(productRepository.findById(change.id), change);
  }
  const customer = options.noCustomer ? null : new Customer(
    "c1", "Ana Souza", options.email === undefined ? "ana.souza@example.com" : options.email,
    "18999990000", options.type ?? "vip",
    new Address("Rua das Palmeiras", "120", "Presidente Prudente", "SP", "19000-000", options.region ?? "sudeste")
  );
  const specifications = options.items ?? [{ id: "p1", quantity: 1 }, { id: "p2", quantity: 2 }];
  const items = specifications.map(({ id, quantity, missing }) => new OrderItem(
    missing ? null : catalog.findById(id) ?? new Product(id, "Desconhecido", "other", 100, 1, 1), quantity
  ));
  const order = new Order("o1001", customer, options.nullItems ? null : items,
    options.coupon === undefined ? "TECH10" : options.coupon,
    options.payment ?? "credit_card", options.installments ?? 3);
  order.createdAt = new Date("2026-10-18T12:00:00.000Z");
  return { order, service, productRepository, orderRepository, notifications };
}

function runScenario(options = {}, original = false) {
  const logs = [];
  const oldLog = console.log;
  let environment;
  let result;
  let error;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    environment = createScenario(options, original);
    result = environment.service.process(environment.order);
  } catch (caught) {
    error = { name: caught.name, message: caught.message };
  } finally {
    console.log = oldLog;
  }
  return {
    result, error,
    stocks: environment.productRepository.list().map(({ id, stock }) => ({ id, stock })),
    status: environment.order.status,
    saved: environment.orderRepository.findAll(),
    notifications: environment.notifications,
    logs
  };
}

module.exports = { createScenario, runScenario };
