const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

const AUTOLINK_STORAGE_PATH = path.join(__dirname, "autolink_status.json");
const DOWNLOAD_API = "https://priyansh-ai.onrender.com/autodown?url=";

module.exports = {
  config: {
    name: "autolink",
    version: "1.0",
    author: "Priyanshi Kaur",
    role: 0,
    countDown: 5,
    shortDescription: "Auto-detect and download videos from supported links.",
    longDescription: {
      en: "Automatically detects social media video links (Instagram, Facebook, TikTok, Pinterest, X) and downloads them."
    },
    category: "media",
    guide: {
      en: "{prefix}autolink on - Enable auto-detection\n{prefix}autolink off - Disable auto-detection"
    }
  },

  checkStatus: function () {
    try {
      if (!fs.existsSync(AUTOLINK_STORAGE_PATH)) return { enabled: false };
      return JSON.parse(fs.readFileSync(AUTOLINK_STORAGE_PATH, "utf8"));
    } catch (e) {
      return { enabled: false };
    }
  },

  saveStatus: function (status) {
    fs.writeFileSync(AUTOLINK_STORAGE_PATH, JSON.stringify({ enabled: status }, null, 2));
  },

  onStart: async function ({ api, event, args }) {
    if (args.length === 0) {
      return api.sendMessage("Use `{prefix}autolink on` to enable or `{prefix}autolink off` to disable auto-detection.", event.threadID, event.messageID);
    }

    const action = args[0].toLowerCase();
    if (action === "on") {
      this.saveStatus(true);
      return api.sendMessage("✅ AutoLink is now enabled.", event.threadID, event.messageID);
    } else if (action === "off") {
      this.saveStatus(false);
      return api.sendMessage("❌ AutoLink is now disabled.", event.threadID, event.messageID);
    } else {
      return api.sendMessage("Invalid command. Use `{prefix}autolink on` or `{prefix}autolink off`.", event.threadID, event.messageID);
    }
  },

  onMessage: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const status = this.checkStatus();
    if (!status.enabled) return;

    const regex = /(https?:\/\/(?:www\.)?(instagram|facebook|tiktok|pinterest|twitter|x)\.com\/[^\s]+)/gi;
    const matches = body.match(regex);
    if (!matches) return;

    for (const link of matches) {
      try {
        api.sendMessage(`🔄 Downloading video from: ${link}`, threadID, messageID);

        const res = await axios.get(DOWNLOAD_API + encodeURIComponent(link));
        if (!res.data.success || !res.data.data.length) throw new Error("Download failed!");

        const videoData = res.data.data[0];
        const videoUrl = videoData.videoUrl || videoData.audioUrl;
        if (!videoUrl) throw new Error("No media found!");

        const cachePath = path.join(__dirname, "cache");
        await fs.ensureDir(cachePath);

        const videoPath = path.join(cachePath, `${Date.now()}-video.mp4`);
        const audioPath = path.join(cachePath, `${Date.now()}-audio.mp4`);
        const finalPath = path.join(cachePath, `${Date.now()}-final.mp4`);

        // Download video
        const videoRes = await axios({ url: videoUrl, responseType: "stream" });
        await new Promise((resolve, reject) => {
          const stream = videoRes.data.pipe(fs.createWriteStream(videoPath));
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

        if (videoData.audioUrl && videoData.videoUrl) {
          // Download audio
          const audioRes = await axios({ url: videoData.audioUrl, responseType: "stream" });
          await new Promise((resolve, reject) => {
            const stream = audioRes.data.pipe(fs.createWriteStream(audioPath));
            stream.on("finish", resolve);
            stream.on("error", reject);
          });

          // Merge video & audio
          await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac "${finalPath}"`, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          await fs.remove(videoPath);
          await fs.remove(audioPath);
        }

        const attachmentPath = videoData.audioUrl && videoData.videoUrl ? finalPath : videoPath;
        await api.sendMessage(
          {
            body: `🎥 Title: ${videoData.title || "Unknown"}\n📌 Source: ${videoData.extractor || "Unknown"}\n👍 Likes: ${videoData.like_count || "N/A"}\n💬 Comments: ${videoData.comment_count || "N/A"}`,
            attachment: fs.createReadStream(attachmentPath)
          },
          threadID,
          messageID
        );

        await fs.remove(attachmentPath);
      } catch (error) {
        console.error("Error:", error);
        api.sendMessage("❌ Failed to download the video.", threadID, messageID);
      }
    }
  }
};