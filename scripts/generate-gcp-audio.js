const fs = require('fs');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

const articlesDir = path.join(__dirname, '../data/articles');
const audioDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

async function processArticles() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../google-credentials.json');
  
  const tempDir = path.join(__dirname, '../temp_gcp_audio');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  let client;
  try {
    client = new textToSpeech.TextToSpeechClient();
  } catch (error) {
    console.error("Lỗi khởi tạo Google Cloud TTS Client:", error.message);
    return;
  }

  const targetSlug = process.argv[2];
  let files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

  if (targetSlug) {
    const targetFile = `${targetSlug}.json`;
    if (files.includes(targetFile)) {
      files = [targetFile];
    } else {
      console.error(`Không tìm thấy bài viết: ${targetSlug}`);
      return;
    }
  }

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.content) continue;
    
    const finalAudioPath = path.join(audioDir, `${data.slug}.mp3`);
    if (fs.existsSync(finalAudioPath)) {
      if (!data.audioUrl) {
        data.audioUrl = `/audio/${data.slug}.mp3`;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Cập nhật JSON cho ${file}: Đã có file mp3.`);
      } else {
        console.log(`Bỏ qua ${file}: Đã có audio.`);
      }
      continue;
    }
    
    console.log(`Đang xử lý: ${file}...`);

    const plainText = data.content
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Cắt text thành các chunk tối đa 1000 ký tự (bảo đảm an toàn dưới 5000 bytes)
    const chunks = [];
    let remaining = plainText;
    
    while (remaining.length > 0) {
      if (remaining.length <= 1000) {
        chunks.push(remaining);
        break;
      }
      
      let splitPos = remaining.lastIndexOf(' ', 1000);
      if (splitPos === -1) splitPos = 1000;
      
      chunks.push(remaining.substring(0, splitPos).trim());
      remaining = remaining.substring(splitPos).trim();
    }

    const tempDir = path.join(__dirname, '../temp_gcp_audio');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const chunkFiles = [];
    let hasError = false;

    for (let i = 0; i < chunks.length; i++) {
      console.log(`- Đang xử lý phần ${i + 1}/${chunks.length}...`);
      const request = {
        input: { text: chunks[i] },
        // ĐỔI SANG GIỌNG NAM (vi-VN-Neural2-D)
        voice: { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D' }, 
        audioConfig: { audioEncoding: 'MP3' },
      };

      try {
        const [response] = await client.synthesizeSpeech(request);
        const chunkPath = path.join(tempDir, `${data.slug}_${i}.mp3`);
        await util.promisify(fs.writeFile)(chunkPath, response.audioContent, 'binary');
        chunkFiles.push(chunkPath);
      } catch (err) {
        console.error(`Lỗi khi tạo audio phần ${i+1}:`, err.message);
        hasError = true;
        break;
      }
    }

    if (!hasError && chunkFiles.length > 0) {
      console.log(`- Đang ghép các phần âm thanh...`);
      const concatListPath = path.join(tempDir, `${data.slug}_concat.txt`);
      const concatContent = chunkFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
      fs.writeFileSync(concatListPath, concatContent);

      const finalAudioPath = path.join(audioDir, `${data.slug}.mp3`);
      const { execSync } = require('child_process');
      execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalAudioPath}"`);

      data.audioUrl = `/audio/${data.slug}.mp3`;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ Đã lưu audio tại: ${data.audioUrl}\n`);
    }

    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log("Hoàn tất test!");
}

processArticles();
