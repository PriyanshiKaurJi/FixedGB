const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const settingsPath = path.join(__dirname, "autolink_settings.json");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json");
  return base.data.api;
};

module.exports = {
  config: {
    name: "autolink",
    version: "1.1.0",
    author: "Priyanshi Kaur",
    countDown: 2,
    role: 0,
    description: {
      en: "Automatically download videos from Instagram, Facebook, TikTok, Pinterest, and X (Twitter).",
    },
    category: "MEDIA",
    guide: {
      en: "{prefix}autolink on/off to enable or disable auto-detection.",
    },
  },

  onStart: async function ({ api, args, event }) {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify({ enabled: false }));
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath));

    if (args[0] === "on") {
      settings.enabled = true;
      fs.writeFileSync(settingsPath, JSON.stringify(settings));
      return api.sendMessage("✅ Auto-download is now enabled.", event.threadID, event.messageID);
    } else if (args[0] === "off") {
      settings.enabled = false;
      fs.writeFileSync(settingsPath, JSON.stringify(settings));
      return api.sendMessage("❌ Auto-download is now disabled.", event.threadID, event.messageID);
    }
  },

  onChat: async function ({ api, event }) {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify({ enabled: false }));
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath));
    if (!settings.enabled) return;

    const linkRegex = /(https?:\/\/(?:www\.)?(?:instagram\.com|facebook\.com|tiktok\.com|pinterest\.com|x\.com)\/[^\s]+)/g;
    const matches = event.body?.match(linkRegex);

    if (!matches) return;

    const videoUrl = matches[0];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const { data } = await axios.get(`${await baseApiUrl()}/alldl?url=${encodeURIComponent(videoUrl)}`);
      const filePath = path.join(__dirname, "cache", "video.mp4");

      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      const videoBuffer = (await axios.get(data.result, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(videoBuffer, "utf-8"));

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage(
        {
          body: `🎥 Downloaded Video:\n${data.cp || "No Caption"}\n🔗 Link: ${videoUrl}`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (error) {
      api.setMessageReaction("❎", event.messageID, () => {}, true);
      api.sendMessage(`❌ Failed to download: ${error.message}`, event.threadID, event.messageID);
    }
  },
};