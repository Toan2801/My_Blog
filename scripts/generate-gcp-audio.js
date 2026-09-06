const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const articlesDir = path.join(__dirname, '../data/articles');
const audioDir = path.join(__dirname, '../public/audio');
const tempDir = path.join(__dirname, '../temp_edge_audio');

const requestedProvider = (process.env.TTS_PROVIDER || 'edge').toLowerCase();
// Keep legacy auto settings on Edge without silently changing the voice.
const provider = requestedProvider === 'auto' ? 'edge' : requestedProvider;
const maxChunkChars = Number(process.env.TTS_CHUNK_CHARS || process.env.EDGE_TTS_CHUNK_CHARS || 1000);
const chunkDelayMs = Number(process.env.TTS_CHUNK_DELAY_MS || process.env.EDGE_TTS_DELAY_MS || 8000);
const retryDelayMs = Number(process.env.TTS_RETRY_DELAY_MS || 60000);

const edgeVoice = process.env.EDGE_TTS_VOICE || 'vi-VN-NamMinhNeural';
const edgeRate = process.env.EDGE_TTS_RATE || '-8%';
const edgePitch = process.env.EDGE_TTS_PITCH || '-2Hz';
const edgeVolume = process.env.EDGE_TTS_VOLUME || '+0%';
const edgeTtsTimeoutMs = Number(process.env.EDGE_TTS_TIMEOUT_MS || 180000);

const piperModelPath = process.env.PIPER_MODEL_PATH || path.join(__dirname, '../models/piper/vi_VN-25hours_single-low.onnx');
const piperConfigPath = process.env.PIPER_CONFIG_PATH || `${piperModelPath}.json`;
const piperLengthScale = process.env.PIPER_LENGTH_SCALE || '1.12';
const piperSentenceSilence = process.env.PIPER_SENTENCE_SILENCE || '0.25';
const piperVolume = process.env.PIPER_VOLUME || '1.0';
const piperTimeoutMs = Number(process.env.PIPER_TIMEOUT_MS || 180000);

const args = process.argv.slice(2);
const force = args.includes('--force');
const listMissingOnly = args.includes('--list-missing');
const targetSlug = args.find((arg) => !arg.startsWith('--'));

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

function decodeHtmlEntities(text) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '...',
    laquo: '"',
    ldquo: '"',
    lsquo: "'",
    lt: '<',
    mdash: ' - ',
    nbsp: ' ',
    ndash: ' - ',
    quot: '"',
    raquo: '"',
    rdquo: '"',
    rsquo: "'",
  };

  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    if (entity.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }

    return namedEntities[entity.toLowerCase()] || match;
  });
}

function htmlToPlainText(html) {
  return decodeHtmlEntities(
    String(html)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|blockquote|tr|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

function splitLongParagraph(text) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > maxChunkChars) {
    const window = remaining.slice(0, maxChunkChars + 1);
    let splitPos = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf('? '),
      window.lastIndexOf('! '),
      window.lastIndexOf('; '),
      window.lastIndexOf(': '),
      window.lastIndexOf(', '),
      window.lastIndexOf(' '),
    );

    if (splitPos < Math.floor(maxChunkChars * 0.5)) {
      splitPos = maxChunkChars;
    }

    chunks.push(remaining.slice(0, splitPos + 1).trim());
    remaining = remaining.slice(splitPos + 1).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function splitIntoChunks(text) {
  const chunks = [];
  let current = '';
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      chunks.push(...splitLongParagraph(paragraph));
      continue;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxChunkChars) {
      current = next;
    } else {
      if (current) {
        chunks.push(current);
      }
      current = paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function findPythonCommand() {
  const candidates = process.env.EDGE_TTS_PYTHON
    ? [process.env.EDGE_TTS_PYTHON]
    : ['py', 'python', 'python3'];

  for (const command of candidates) {
    try {
      execFileSync(command, ['-c', 'import edge_tts'], { stdio: 'ignore' });
      return command;
    } catch {
      // Try the next Python executable.
    }
  }

  throw new Error(
    'Python package edge-tts was not found. Install it with: py -m pip install edge-tts',
  );
}

function findPiperRuntime() {
  if (!fs.existsSync(piperModelPath) || !fs.existsSync(piperConfigPath)) {
    throw new Error(
      `Piper Vietnamese model was not found. Expected: ${piperModelPath} and ${piperConfigPath}`,
    );
  }

  const candidates = [
    { command: 'piper', argsPrefix: [] },
    { command: 'py', argsPrefix: ['-m', 'piper'] },
    { command: 'python', argsPrefix: ['-m', 'piper'] },
    { command: 'python3', argsPrefix: ['-m', 'piper'] },
  ];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate.command, [...candidate.argsPrefix, '--help'], { stdio: 'ignore' });
      return {
        ...candidate,
        chunkExtension: 'wav',
        label: `Piper local model=${path.basename(piperModelPath)}, lengthScale=${piperLengthScale}`,
        provider: 'piper',
      };
    } catch {
      // Try the next Piper executable.
    }
  }

  throw new Error('Piper was not found. Install it with: py -m pip install piper-tts');
}

function getTtsRuntime() {
  if (provider === 'piper') {
    return findPiperRuntime();
  }

  if (provider === 'edge') {
    return {
      chunkExtension: 'mp3',
      label: `Edge TTS voice=${edgeVoice}, rate=${edgeRate}, pitch=${edgePitch}, volume=${edgeVolume}`,
      provider: 'edge',
      pythonCommand: findPythonCommand(),
    };
  }

  throw new Error(`Unsupported TTS_PROVIDER: ${provider}. Use "piper" or "edge".`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, commandArgs, label, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    let settled = false;
    let timedOut = false;
    let timeoutId;
    let forceKillTimeoutId;

    const finish = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      clearTimeout(forceKillTimeoutId);

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    if (options.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill();
        forceKillTimeoutId = setTimeout(() => child.kill('SIGKILL'), 5000);
      }, options.timeoutMs);
    }

    child.stdout.on('data', (chunk) => {
      const output = chunk.toString().trim();
      if (output) {
        console.log(output);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', finish);
    child.on('close', (code) => {
      if (timedOut) {
        finish(new Error(`${label} timed out after ${options.timeoutMs}ms`));
        return;
      }

      if (code === 0) {
        finish();
        return;
      }

      const error = new Error(summarizeCommandError(label, code, stderr));
      if (label === 'edge-tts' && /WSServerHandshakeError: 403|NoAudioReceived/i.test(stderr)) {
        error.code = 'EDGE_UNAVAILABLE';
        error.retryable = true;
      }
      finish(error);
    });
  });
}

function summarizeCommandError(label, code, stderr) {
  const output = stderr.trim();
  const isEdgeAccessError =
    label === 'edge-tts' &&
    /WSServerHandshakeError: 403|NoAudioReceived|Invalid response status/i.test(output);

  if (isEdgeAccessError) {
    return [
      `${label} failed with exit code ${code}: Edge/Bing refused the request (HTTP 403 / NoAudioReceived).`,
      'The service rejected the connection or returned no audio; the exact cause is unknown.',
      'The voice will remain unchanged.',
    ].join(' ');
  }

  const tail = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-12)
    .join('\n');

  return `${label} failed with exit code ${code}${tail ? `: ${tail}` : ''}`;
}

async function runWithRetry(task, label, maxRetries = 7, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await task();
      return;
    } catch (error) {
      console.warn(`- Warning: ${label} failed on attempt ${attempt}/${maxRetries}: ${error.message}`);
      if (error.retryable === false || attempt === maxRetries) {
        throw error;
      }
      console.log(`- Waiting ${delayMs / 1000} seconds before retrying ${label}...`);
      await sleep(delayMs);
    }
  }
}

function readArticle(file) {
  const filePath = path.join(articlesDir, file);
  return {
    filePath,
    data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
  };
}

function getArticleFiles() {
  let files = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.json'));

  if (targetSlug) {
    const targetFile = `${targetSlug}.json`;
    if (!files.includes(targetFile)) {
      throw new Error(`Article not found: ${targetSlug}`);
    }
    files = [targetFile];
  }

  return files;
}

function updateAudioUrlIfNeeded(filePath, data) {
  if (data.audioUrl === `/audio/${data.slug}.mp3`) {
    return false;
  }

  data.audioUrl = `/audio/${data.slug}.mp3`;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return true;
}

async function synthesizeEdgeChunk(runtime, textPath, outputPath) {
  fs.rmSync(outputPath, { force: true });
  await runCommand(
    runtime.pythonCommand,
    [
      path.join(__dirname, 'edge_tts_runner.py'),
      '--voice',
      edgeVoice,
      `--rate=${edgeRate}`,
      `--pitch=${edgePitch}`,
      `--volume=${edgeVolume}`,
      '--file',
      textPath,
      '--write-media',
      outputPath,
    ],
    'edge-tts',
    { timeoutMs: edgeTtsTimeoutMs },
  );
}

async function synthesizePiperChunk(runtime, textPath, outputPath) {
  fs.rmSync(outputPath, { force: true });
  await runCommand(
    runtime.command,
    [
      ...runtime.argsPrefix,
      '--model',
      piperModelPath,
      '--config',
      piperConfigPath,
      '--input-file',
      textPath,
      '--output-file',
      outputPath,
      '--length-scale',
      piperLengthScale,
      '--sentence-silence',
      piperSentenceSilence,
      '--volume',
      piperVolume,
    ],
    'piper',
    { timeoutMs: piperTimeoutMs },
  );
}

async function synthesizeChunk(runtime, textPath, outputPath) {
  if (runtime.provider === 'edge') {
    await synthesizeEdgeChunk(runtime, textPath, outputPath);
  } else {
    await synthesizePiperChunk(runtime, textPath, outputPath);
  }

  const stats = fs.statSync(outputPath);
  if (stats.size === 0) {
    throw new Error(`${runtime.provider} wrote an empty audio file`);
  }
}

function buildConcatArgs(runtime, concatListPath, finalAudioPath) {
  const baseArgs = ['-y', '-f', 'concat', '-safe', '0', '-i', concatListPath];

  if (runtime.provider === 'piper') {
    return [...baseArgs, '-codec:a', 'libmp3lame', '-b:a', '128k', finalAudioPath];
  }

  return [...baseArgs, '-c', 'copy', finalAudioPath];
}

async function processArticle(file, runtime) {
  const { filePath, data } = readArticle(file);

  if (!data.content || !data.slug) {
    console.log(`Skip ${file}: missing content or slug.`);
    return false;
  }

  const finalAudioPath = path.join(audioDir, `${data.slug}.mp3`);
  if (fs.existsSync(finalAudioPath) && !force) {
    const updated = updateAudioUrlIfNeeded(filePath, data);
    console.log(`Skip ${file}: audio already exists${updated ? ', audioUrl updated' : ''}.`);
    return false;
  }

  console.log(`Processing ${file} with ${runtime.provider}...`);

  const plainText = htmlToPlainText(data.content);
  const chunks = splitIntoChunks(plainText);

  if (chunks.length === 0) {
    throw new Error(`No readable text found in ${file}`);
  }

  console.log(`- Text length: ${plainText.length.toLocaleString()} chars`);
  console.log(`- Chunks: ${chunks.length.toLocaleString()} (max ${maxChunkChars} chars each)`);

  const articleTempDir = path.join(tempDir, data.slug);
  fs.rmSync(articleTempDir, { recursive: true, force: true });
  fs.mkdirSync(articleTempDir, { recursive: true });

  try {
    const chunkFiles = [];

    for (let index = 0; index < chunks.length; index += 1) {
      const chunkNumber = String(index + 1).padStart(4, '0');
      const textPath = path.join(articleTempDir, `${chunkNumber}.txt`);
      const chunkPath = path.join(articleTempDir, `${chunkNumber}.${runtime.chunkExtension}`);

      fs.writeFileSync(textPath, chunks[index], 'utf8');
      console.log(`- Generating chunk ${index + 1}/${chunks.length}...`);
      await runWithRetry(
        () => synthesizeChunk(runtime, textPath, chunkPath),
        `chunk ${index + 1}`,
        7,
        runtime.provider === 'edge' ? retryDelayMs : 1500,
      );
      chunkFiles.push(chunkPath);

      if (runtime.provider === 'edge' && chunkDelayMs > 0 && index < chunks.length - 1) {
        await sleep(chunkDelayMs);
      }
    }

    const concatListPath = path.join(articleTempDir, 'concat.txt');
    const concatContent = chunkFiles
      .map((chunkPath) => `file '${chunkPath.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
      .join('\n');
    fs.writeFileSync(concatListPath, concatContent, 'utf8');

    console.log('- Concatenating audio chunks...');
    await runCommand(
      'ffmpeg',
      buildConcatArgs(runtime, concatListPath, finalAudioPath),
      'ffmpeg concat',
    );

    updateAudioUrlIfNeeded(filePath, data);
    console.log(`Saved: /audio/${data.slug}.mp3`);
    return true;
  } finally {
    fs.rmSync(articleTempDir, { recursive: true, force: true });
  }
}

async function processArticles() {
  const files = getArticleFiles();

  if (listMissingOnly) {
    for (const file of files) {
      const { data } = readArticle(file);
      if (data.slug && !fs.existsSync(path.join(audioDir, `${data.slug}.mp3`))) {
        console.log(data.slug);
      }
    }
    return;
  }

  const runtime = getTtsRuntime();
  console.log(`Using ${runtime.label}`);

  let generatedCount = 0;
  for (const file of files) {
    if (await processArticle(file, runtime)) {
      generatedCount += 1;
    }
  }

  console.log(`Done. Generated ${generatedCount} audio file(s).`);
}

if (require.main === module) {
  processArticles().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { runWithRetry, runCommand, processArticles };
