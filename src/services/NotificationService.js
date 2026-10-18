/** Adaptador local: simula a notificacao, sem enviar e-mail real. */
class NotificationService {
  constructor(write = console.log) { this.write = write; }

  sendOrderConfirmation(contact, orderId, total) {
    this.write(`[EMAIL] Pedido ${orderId} confirmado para ${contact.name} (${contact.email}). Total: R$ ${total.toFixed(2)}.`);
  }
}

module.exports = NotificationService;
