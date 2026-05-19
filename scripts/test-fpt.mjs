import axios from 'axios';
import 'dotenv/config';

const FPT_API_KEY = process.env.FPT_AI_KEY || 'pRGM0og0Yr6vWrBvcySsB5kFtCZyR7Tv';

async function test() {
  console.log('Sending TTS request...');
  const res = await axios.post('https://api.fpt.ai/hmi/tts/v5', 'Hello world, đây là câu nói test.', {
    headers: {
      'api-key': FPT_API_KEY,
      'voice': 'banmai',
      'speed': 0,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  console.log('FPT response:', res.data);
  const url = res.data.async;

  console.log('Polling URL:', url);
  
  for (let i = 0; i < 5; i++) {
    try {
      console.log(`Attempt ${i+1}: HEAD...`);
      const headRes = await axios.head(url);
      console.log('HEAD status:', headRes.status);
      break;
    } catch (e) {
      console.log('HEAD Error:', e.response?.status, e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

test().catch(console.error);
