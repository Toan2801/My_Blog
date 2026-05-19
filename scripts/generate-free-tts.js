const fs = require('fs');
const path = require('path');
const googleTTS = require('google-tts-api');
const https = require('https');

const articlesDir = path.join(__dirname, '../data/articles');
const audioDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
const tempDir = path.join(__dirname, '../temp_audio_free');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function processArticle(slug) {
  const filePath = path.join(articlesDir, `${slug}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Đang xử lý: ${data.title}...`);

  let cleanText = data.content
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  try {
    // google-tts-api has a 200 chars limit per request, but getAllAudioUrls handles chunking
    const results = googleTTS.getAllAudioUrls(cleanText, {
      lang: 'vi',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?!',
    });

    const chunkFiles = [];
    for (let i = 0; i < results.length; i++) {
      console.log(`- Tải phần ${i + 1}/${results.length}...`);
      const chunkPath = path.join(tempDir, `${slug}_${i}.mp3`);
      await downloadFile(results[i].url, chunkPath);
      chunkFiles.push(chunkPath);
      await new Promise(r => setTimeout(r, 500)); // anti-spam
    }

    // Merge files using ffmpeg
    console.log(`- Đang ghép các phần...`);
    const concatListPath = path.join(tempDir, `${slug}_concat.txt`);
    const concatContent = chunkFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    const finalAudioPath = path.join(audioDir, `${slug}.mp3`);
    const { execSync } = require('child_process');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalAudioPath}"`);

    data.audioUrl = `/audio/${slug}.mp3`;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`✅ Hoàn thành bài ${slug}! Audio đã lưu tại: ${data.audioUrl}`);
  } catch (error) {
    console.error(`Lỗi:`, error.message);
  }
}

// Process argument
const slug = process.argv[2] || 'ngoalongkhuc';
processArticle(slug);
