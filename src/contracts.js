/**
 * Contratos estruturais pequenos, usados por composicao em JavaScript.
 * Uma implementacao precisa fornecer somente as operacoes consumidas.
 *
 * @typedef {Object} OrderWriter
 * @property {function(Object): Object} save
 *
 * @typedef {Object} ProductStockAccess
 * @property {function(string): Object|undefined} findById
 * @property {function(string, number): Object} updateStock
 *
 * @typedef {Object} OrderNotifier
 * @property {function(Object, string, number): void} sendOrderConfirmation
 *
 * @typedef {Object} DiscountRule
 * @property {function(Object, number): number} calculate
 *
 * @typedef {Object} PaymentMethod
 * @property {function(number, number): {status: string, fee: number, discount: number}} process
 *
 * @typedef {Object} ReceiptPresenter
 * @property {function(Object, Object): void} present
 */
module.exports = {};
