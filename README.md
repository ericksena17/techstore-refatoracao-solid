# TechStore refatorado

Atividade de Arquitetura de Software: diagnóstico de projeto orientado a objetos e aplicação de SOLID, composição e Princípio de Demeter.

Repositório refatorado: https://github.com/ericksena17/techstore-refatoracao-solid

Projeto base: https://github.com/vanessaborges2/refatoracao-solid

Commit analisado: `511732495c69d01de227482d00b0a2e62a08aae3`.

## Executar

Requisito: Node.js 20 ou superior. O projeto usa CommonJS e apenas módulos nativos. Não depende de banco de dados, bibliotecas externas ou credenciais.

Na pasta que contém este README e `package.json`, execute:

```bash
npm start
npm test
npm run evidence
```

- `npm start` executa o pedido de exemplo e imprime o resumo e o JSON.
- `npm test` executa a suíte com `node:test` e `node:assert/strict`.
- `npm run evidence` registra a falha original, a execução refatorada, os testes e a comparação do exemplo na pasta `evidencias`.

O exemplo resulta em subtotal de R$ 6.440,00, desconto de R$ 1.159,20, frete de R$ 30,00, taxa de R$ 161,00 e total de **R$ 5.471,80**. Estoques finais: notebook 7 e mouse 28. A data de criação varia a cada execução de `npm start`.

## Condição encontrada no código original

A versão fornecida importa `./NotificationService` em `OrderService.js`, mas não contém esse módulo. A execução original termina com `MODULE_NOT_FOUND`. O registro está em `evidencias/01_execucao_original.txt`.

A cópia original, sem alterações, foi mantida em `support/original`. Para comparar a lógica disponível, `support/scenarios.js` carrega o serviço original e substitui **somente o notificador ausente por um espião de teste**. Os demais módulos continuam sendo os originais. O espião registra os argumentos da confirmação; não presume uma implementação de e-mail que não foi fornecida.

A versão refatorada inclui um `NotificationService` local que imprime a confirmação. Não envia e-mail real. A compatibilidade comprovada cobre os cenários exercitados da lógica fornecida; não inclui o texto de uma notificação original inexistente.

## Estrutura e responsabilidades

| Pasta ou arquivo | Responsabilidade |
| --- | --- |
| `src/domain` | Pedido, itens, cliente, endereço e produto; cálculos e informações do domínio |
| `src/services/OrderService.js` | Coordenação do processamento, sem construir dependências concretas |
| `src/services/OrderValidator.js` | Validação de cliente, e-mail e existência de itens |
| `src/services/InventoryService.js` | Validação dos itens e consulta e baixa de estoque |
| `src/discounts` e `DiscountCalculator` | Regras de desconto combinadas por composição |
| `FreightCalculator` | Frete por região e peso, com tabela de tarifas configurável |
| `src/payments` e `PaymentProcessor` | Estratégias substituíveis de pagamento |
| `src/presenters` | Formatação e saída do resumo |
| `src/composition/createOrderService.js` | Montagem das implementações e injeção das dependências |
| `src/contracts.js` | Contratos estruturais pequenos documentados com JSDoc |
| `test` | Testes de comportamento e de extensibilidade, substituição e isolamento |
| `support/original` | Referência original para os testes de caracterização |
| `evidencias` | Saídas reais e resumo da verificação |

## Diagnóstico e refatoração

- **SRP e coesão:** validação, cálculo, persistência, estoque, notificação e apresentação estavam no mesmo serviço. Foram separadas em componentes com responsabilidades próprias. `OrderService` passou de 176 para 46 linhas.
- **OCP:** condicionais sobre tipos de cliente, cupons, regiões e pagamentos exigiam alterações no serviço. Agora regras de desconto são compostas, tarifas são configuradas e formas de pagamento são registradas no processador.
- **DIP e composição:** o serviço criava seus próprios repositórios, notificador e logger. Agora recebe colaboradores pelo construtor. As classes concretas são conectadas na fábrica de composição. Injeção é a técnica usada para realizar a inversão, não um sinônimo do princípio.
- **Demeter:** acessos como `order.customer.address.region` e `item.product.weight` saíram do serviço. `Order`, `Customer`, `Address` e `OrderItem` assumiram as operações correspondentes, preservando o formato do resumo.
- **LSP:** o original não possui hierarquia que comprove uma violação de Liskov. A solução estabelece contratos de pagamento e desconto, com testes de substituição de suas implementações.
- **ISP:** não foi inventada uma interface extensa no diagnóstico original. Na solução, os consumidores usam contratos mínimos, como `save` para persistir um pedido e `findById/updateStock` para o estoque, sem exigir operações alheias ao uso.

## Regras preservadas

- VIP: 8%; funcionário: 15%; demais tipos: sem desconto de categoria.
- Cupom `TECH10`: 10% sobre o subtotal; `FRETEGRATIS`: zera apenas o frete.
- Desconto adicional de R$ 250,00 somente quando o subtotal é **maior que** R$ 8.000,00.
- PIX: desconto adicional de 3% sobre o subtotal e pagamento aprovado.
- Cartão: taxa de 2,5% sobre o subtotal se houver mais de uma parcela; aprovado.
- Boleto: status `waiting_payment`; mantém a baixa de estoque e não envia confirmação.
- Mesmas tarifas por região e regra padrão para região desconhecida.
- Mesma ordem de validação, cálculo, baixa de estoque, atualização do status, gravação e notificação.
- Mesmo formato do resumo, arredondamento monetário e mensagens de validação cobertas pelos testes.

## Verificação

Foram executados localmente **64 testes, todos aprovados**, no Node.js v24.19.0. Há 27 testes parametrizados que cobrem **324 combinações** de 3 categorias de cliente, 3 cupons, 3 formas de pagamento, 6 regiões e 2 configurações de parcelamento. Outros testes verificam limites, erros, estado persistido, estoque, chamadas de confirmação, extensão e contratos pequenos.

O cenário de exemplo também possui valores esperados calculados independentemente da implementação original. A data é fixada apenas no harness, para permitir comparação reprodutível. Não é alterada na aplicação.

O workflow do GitHub Actions está preparado para rodar `npm test` em Node.js 20 e 24 após a publicação. Esses jobs remotos não foram executados nesta verificação local.

## Limites mantidos e decisão de escopo

Os repositórios continuam em memória e são reiniciados a cada processo. Não foram acrescentados banco de dados ou envio real de e-mail.

A validação original de estoque é feita por linha: duas linhas do mesmo produto podem, juntas, exceder o saldo. Esse defeito já existia e foi caracterizado em um teste separado. A refatoração preserva esse comportamento; agrupar quantidades ou acrescentar transações seria uma correção funcional que deve ser tratada em outra mudança.

Os testes não alegam cobrir todos os objetos JavaScript arbitrários ou falhas externas. A comparação concentra-se nos objetos de domínio e nas regras disponibilizadas pelo projeto.

## Publicação para a entrega

Repositório da entrega: https://github.com/ericksena17/techstore-refatoracao-solid

O relatório técnico em Word contém esse link, o diagnóstico, os conceitos relacionados, as refatorações, as justificativas e os resultados dos testes. Código, testes e evidências estão neste repositório.
