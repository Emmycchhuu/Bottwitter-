import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const USERNAME = process.env.TWITTER_USERNAME;
const BEARER = process.env.BEARER_TOKEN;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const POLL_INTERVAL = 60 * 1000; // every 60 seconds
const LAST_FILE = "last_tweet_id.txt";

async function getUserId(username) {
  const url = `https://api.twitter.com/2/users/by/username/${username}`;
  const r = await axios.get(url, { headers: { Authorization: `Bearer ${BEARER}` } });
  return r.data.data.id;
}

async function getLatestTweet(userId) {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&exclude=replies,retweets`;
  const r = await axios.get(url, { headers: { Authorization: `Bearer ${BEARER}` } });
  return r.data.data && r.data.data.length ? r.data.data[0].id : null;
}

async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  await axios.post(url, { chat_id: TG_CHAT, text, disable_web_page_preview: false });
}

function readLast() {
  try {
    return fs.readFileSync(LAST_FILE, "utf8").trim();
  } catch {
    return null;
  }
}

function writeLast(id) {
  fs.writeFileSync(LAST_FILE, id);
}

(async () => {
  console.log("Starting Twitter → Telegram bot…");
  const userId = await getUserId(USERNAME);
  let last = readLast();

  setInterval(async () => {
    try {
      const latest = await getLatestTweet(userId);
      if (latest && latest !== last) {
        const url = `https://twitter.com/${USERNAME}/status/${latest}`;
        await sendTelegram(`🐦 New tweet: ${url}`);
        writeLast(latest);
        last = latest;
        console.log("Tweet sent:", url);
      }
    } catch (e) {
      console.error("Error:", e.message || e);
    }
  }, POLL_INTERVAL);
})();
