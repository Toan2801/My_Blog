const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { runCommand, runWithRetry } = require('./generate-gcp-audio');

test('403 gets bounded retries instead of stopping immediately', async () => {
  let attempts = 0;
  await assert.rejects(runWithRetry(async () => {
    attempts++;
    await runCommand(process.execPath, ['-e', 'console.error("WSServerHandshakeError: 403"); process.exit(1)'], 'edge-tts');
  }, 'probe', 3, 0), { code: 'EDGE_UNAVAILABLE', retryable: true });
  assert.equal(attempts, 3);
});

test('NoAudioReceived gets bounded retries', async () => {
  let attempts = 0;
  await assert.rejects(runWithRetry(async () => {
    attempts++;
    await runCommand(process.execPath, ['-e', 'console.error("NoAudioReceived"); process.exit(1)'], 'edge-tts');
  }, 'probe', 3, 0), { code: 'EDGE_UNAVAILABLE', retryable: true });
  assert.equal(attempts, 3);
});

function harness(provider) {
  const context = vm.createContext({
    require, __dirname, module: { exports: {} },
    process: { env: { TTS_PROVIDER: provider }, argv: ['node', 'script'] },
    console: { log() {}, warn() {} }, setTimeout, clearTimeout,
    calls: [],
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'generate-gcp-audio.js'), 'utf8'), context);
  vm.runInContext(`
    getArticleFiles = () => ['first.json', 'second.json'];
    findPythonCommand = () => 'python';
    findPiperRuntime = () => ({ provider: 'piper' });
    processArticle = async (file, runtime) => {
      calls.push(file + ':' + runtime.provider);
      if (runtime.provider === 'edge') {
        throw Object.assign(new Error('blocked'), { code: 'EDGE_UNAVAILABLE' });
      }
      return true;
    };
  `, context);
  return context;
}

test('waits one minute between attempts and resumes the failing chunk', async () => {
  const context = harness('edge');
  vm.runInContext('sleep = async (ms) => { calls.push(ms); };', context);
  let attempts = 0;
  await context.module.exports.runWithRetry(async () => {
    attempts++;
    if (attempts < 3) {
      throw Object.assign(new Error('blocked'), { code: 'EDGE_UNAVAILABLE', retryable: true });
    }
  }, 'chunk 56', 3, vm.runInContext('retryDelayMs', context));
  assert.equal(attempts, 3);
  assert.deepEqual(context.calls, [60000, 60000]);
});

test('legacy auto setting stays on Edge when it fails', async () => {
  const context = harness('auto');
  await assert.rejects(context.module.exports.processArticles(), { code: 'EDGE_UNAVAILABLE' });
  assert.deepEqual(context.calls, ['first.json:edge']);
});

test('default provider stays on Edge when it fails', async () => {
  const context = harness(undefined);
  await assert.rejects(context.module.exports.processArticles(), { code: 'EDGE_UNAVAILABLE' });
  assert.deepEqual(context.calls, ['first.json:edge']);
});

test('explicit edge selection does not change voice on failure', async () => {
  const context = harness('edge');
  await assert.rejects(context.module.exports.processArticles(), { code: 'EDGE_UNAVAILABLE' });
  assert.deepEqual(context.calls, ['first.json:edge']);
});
