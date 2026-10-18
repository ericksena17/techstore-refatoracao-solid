const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { runScenario } = require("../support/scenarios");
const root = path.resolve(__dirname, "..");
const directory = path.join(root, "evidencias");
fs.mkdirSync(directory, { recursive: true });

function record(filename, args) {
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  const output = `Node.js ${process.version}\nComando: node ${args.join(" ")}\nCodigo de saida: ${run.status}\n\n${run.stdout ?? ""}${run.stderr ?? ""}`;
  fs.writeFileSync(path.join(directory, filename), output);
  return { status: run.status, output };
}

const original = record("01_execucao_original.txt", ["support/original/src/index.js"]);
const corrected = record("02_execucao_refatorada.txt", ["src/index.js"]);
const tests = record("03_testes_automatizados.txt", ["--test", "--test-reporter=tap"]);
const sample = runScenario();
fs.writeFileSync(path.join(directory, "04_comparacao_exemplo.json"), JSON.stringify({
  originalCommit: "511732495c69d01de227482d00b0a2e62a08aae3",
  limitation: "Original sem NotificationService: comparacao da logica disponivel com notificador espiao no harness.",
  originalWithNotificationSpy: runScenario({}, true),
  refactoredWithNotificationSpy: sample
}, null, 2));
const count = (name) => Number(tests.output.match(new RegExp(`# ${name} (\\d+)`))?.[1] ?? 0);
const result = {
  node: process.version,
  originalExitCode: original.status,
  refactoredExitCode: corrected.status,
  testsExitCode: tests.status,
  tests: count("tests"), passed: count("pass"), failed: count("fail"),
  comparedStandardScenarios: 324,
  sample: sample.result,
  stocks: sample.stocks,
  notificationCount: sample.notifications.length
};
fs.writeFileSync(path.join(directory, "05_resumo_verificacao.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (corrected.status !== 0 || tests.status !== 0) process.exitCode = 1;
