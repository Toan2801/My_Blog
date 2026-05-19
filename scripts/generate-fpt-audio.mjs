import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import axios from 'axios';
import striptags from 'striptags';
import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';

const execAsync = promisify(exec);

// ==========================================
// CẤU HÌNH FPT AI
// ==========================================
// Thay API Key của bạn vào đây (hoặc để trong file .env biến FPT_AI_KEY)
const FPT_API_KEY = process.env.FPT_AI_KEY || 'pRGM0og0Yr6vWrBvcySsB5kFtCZyR7Tv';
const VOICE = 'banmai'; // Các giọng khác: lannhi, leminh, myan, thuminh
const SPEED = 0; // -3 đến 3
const CHUNK_SIZE = 2000; // Giới hạn ký tự mỗi lần gọi (FPT thường cho tối đa 5000)

// Thư mục
const ARTICLES_DIR = path.join(process.cwd(), 'data', 'articles');
const AUDIO_OUTPUT_DIR = path.join(process.cwd(), 'public', 'audio');
const TEMP_DIR = path.join(process.cwd(), 'temp_audio');

// Hàm tạo delay để chờ FPT render xong audio
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hàm gửi text lên FPT AI và đợi lấy link file MP3
 */
async function textToSpeechFPT(text) {
  try {
    const response = await axios.post('https://api.fpt.ai/hmi/tts/v5', text, {
      headers: {
        'api-key': FPT_API_KEY,
        'voice': VOICE,
        'speed': SPEED,
        'Content-Type': 'application/x-www-form-urlencoded' // FPT yêu cầu header này dù gửi text
      }
    });

    if (response.data && response.data.error === 0) {
      const audioUrl = response.data.async;
      // Trả về async url, chúng ta phải đợi file sẵn sàng
      return audioUrl;
    } else {
      throw new Error(`Lỗi từ FPT: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Lỗi khi gọi API FPT:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Tải file Audio về ổ cứng
 */
async function downloadAudio(url, outputPath) {
  let isReady = false;
  let attempts = 0;

  // Polling liên tục chờ file audio render xong
  while (!isReady && attempts < 20) {
    try {
      const headRes = await axios.head(url);
      if (headRes.status === 200) isReady = true;
    } catch (e) {
      attempts++;
      await delay(2000); // Đợi 2s rồi thử lại
    }
  }

  if (!isReady) throw new Error('Timeout chờ FPT render audio.');

  // Tải file về
  const writer = createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * Chạy xử lý một bài viết
 */
async function processArticle(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.json`);
  const fileData = await fs.readFile(filePath, 'utf-8');
  const article = JSON.parse(fileData);

  if (article.audioUrl) {
    console.log(`Bài viết ${slug} đã có audio, bỏ qua...`);
    return;
  }

  console.log(`Đang xử lý bài: ${article.title}...`);

  // 1. Dọn dẹp text (Loại bỏ HTML, Base64)
  let cleanText = striptags(article.content);
  cleanText = cleanText.replace(/data:image\/[^;]+;base64,[^\s]+/g, ''); // Bỏ chuỗi base64
  cleanText = cleanText.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  // 2. Chia nhỏ thành các chunk ~2000 ký tự (Không cắt ngang câu)
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(AUDIO_OUTPUT_DIR, { recursive: true });

  const chunkFiles = [];

  // 3. Gọi TTS cho từng chunk
  for (let i = 0; i < chunks.length; i++) {
    console.log(`- Đang thu âm phần ${i + 1}/${chunks.length}...`);
    const asyncUrl = await textToSpeechFPT(chunks[i]);
    const chunkPath = path.join(TEMP_DIR, `${slug}_chunk_${i}.mp3`);
    await downloadAudio(asyncUrl, chunkPath);
    chunkFiles.push(chunkPath);
    await delay(1000); // Nghỉ 1s tránh spam API
  }

  // 4. Ghép các file MP3 lại bằng ffmpeg
  console.log('- Đang ghép các đoạn âm thanh lại...');
  const concatListPath = path.join(TEMP_DIR, `${slug}_concat.txt`);
  const concatContent = chunkFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
  await fs.writeFile(concatListPath, concatContent);

  const finalAudioPath = path.join(AUDIO_OUTPUT_DIR, `${slug}.mp3`);
  
  // Dùng lệnh ffmpeg để ghép file (yêu cầu máy cài sẵn ffmpeg)
  await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalAudioPath}"`);

  // 5. Lưu đường dẫn vào JSON
  article.audioUrl = `/audio/${slug}.mp3`;
  await fs.writeFile(filePath, JSON.stringify(article, null, 2));

  // 6. Dọn dẹp file tạm
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
  
  console.log(`✅ Đã hoàn thành! File lưu tại: ${finalAudioPath}`);
}

// Chạy thử với 1 bài viết (ví dụ 'thachdatkhaitruyen')
// Chạy thử
const targetSlug = process.argv[2] || 'thachdatkhaitruyen';
processArticle(targetSlug).catch(console.error);
