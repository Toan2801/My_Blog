const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

test('resumes after failure, rejects damaged/stale chunks, preserves final audio on concat failure', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-resume-'));
  t.after(() => {
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'data/articles'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/audio'), { recursive: true });
  const article = path.join(root, 'data/articles/demo.json');
  const final = path.join(root, 'public/audio/demo.mp3');
  const writeArticle = (content) => fs.writeFileSync(article, JSON.stringify({ slug: 'demo', content }));
  writeArticle('<p>first</p>\n<p>second</p>\n<p>third</p>');
  fs.writeFileSync(final, 'old good audio');
  const source = fs.readFileSync(path.join(__dirname, 'generate-gcp-audio.js'), 'utf8');
  function run({ failChunk = '', failConcat = false, pitch = '-2Hz' } = {}) {
    const calls = [];
    const context = vm.createContext({ require, __dirname: path.join(root, 'scripts'),
      module: { exports: {} }, process: { argv: ['node', 'script', '--force'],
        env: { TTS_CHUNK_CHARS: '6', TTS_CHUNK_DELAY_MS: '0', TTS_RETRY_DELAY_MS: '0', EDGE_TTS_PITCH: pitch } },
      console: { log() {}, warn() {} }, setTimeout, clearTimeout, calls, failChunk, failConcat });
    vm.runInContext(source, context);
    vm.runInContext(`
      synthesizeChunk = async (runtime, textPath, outputPath) => {
        const text = fs.readFileSync(textPath, 'utf8');
        calls.push(text);
        fs.writeFileSync(outputPath, 'audio:' + text);
        if (text === failChunk) throw Object.assign(new Error('blocked'), { retryable: false });
      };
      runCommand = async (command, args) => {
        fs.writeFileSync(args[args.length - 1], 'new complete audio');
        if (failConcat) throw new Error('concat failed');
      };
    `, context);
    return { calls, result: vm.runInContext("processArticle('demo.json', { provider: 'edge', chunkExtension: 'mp3' })", context) };
  }
  let job = run({ failChunk: 'second' });
  await assert.rejects(job.result, /blocked/);
  assert.deepEqual(job.calls, ['first', 'second']);
  assert.equal(fs.readFileSync(final, 'utf8'), 'old good audio');
  job = run({ failConcat: true });
  await assert.rejects(job.result, /concat failed/);
  assert.deepEqual(job.calls, ['second', 'third']);
  assert.equal(fs.readFileSync(final, 'utf8'), 'old good audio');
  job = run();
  await job.result;
  assert.deepEqual(job.calls, []);
  assert.equal(fs.readFileSync(final, 'utf8'), 'new complete audio');
  const cache = path.join(root, 'temp_edge_audio/demo');
  const version = fs.readdirSync(cache)[0];
  fs.writeFileSync(path.join(cache, version, '0002.mp3'), 'damaged');
  job = run();
  await job.result;
  assert.deepEqual(job.calls, ['second']);
  job = run({ pitch: '+0Hz' });
  await job.result;
  assert.deepEqual(job.calls, ['first', 'second', 'third']);
  writeArticle('<p>fresh</p>');
  job = run();
  await job.result;
  assert.deepEqual(job.calls, ['fresh']);
});
