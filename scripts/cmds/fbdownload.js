const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fbdownload",
    aliases: ["fbvideo"],
    version: "1.0.0",
    author: "Priyanshi Kaur",
    role: 0,
    countDown: 5,
    shortDescription: "Automatically download Facebook videos",
    longDescription: "Detect Facebook video links in messages, download them, and send the video.",
    category: "utilities",
    guide: "{pn} [Facebook video link] or share a link in chat to trigger it automatically"
  },

  SnapSave: async function (facebookVideoUrl) {
    const headRaw = `
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: text/html
accept-language: en-US,en;q=0.9
cache-control: max-age=0
content-length: 64
content-type: application/x-www-form-urlencoded
origin: https://snapsave.app
referer: https://snapsave.app/
sec-ch-ua: "Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
sec-fetch-dest: iframe
sec-fetch-mode: navigate
sec-fetch-site: same-origin
sec-fetch-user: ?1
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36
`;

    const postData = { url: facebookVideoUrl };
    const headerLines = headRaw
      .trim()
      .split("\n")
      .reduce((acc, line) => {
        const [key, ...value] = line.split(": ");
        acc[key.trim()] = value.join(": ").trim();
        return acc;
      }, {});
    const snapsaveUrl = "https://snapsave.app/action.php";

    const rawResult = await axios.post(snapsaveUrl, postData, { headers: headerLines });
    const jsEncoded = rawResult.data.match(/javascript">(.*?)<\/script>/)?.[1];
    if (!jsEncoded) return null;

    const decodeUrl = jsEncoded.match(/href=\\"(http.*?)\\"/);
    return decodeUrl ? decodeUrl[1] : null;
  },

  ensureCacheFolder: async function () {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      await fs.mkdir(cacheDir, { recursive: true });
    }
    return cacheDir;
  },

  onMessage: async function ({ api, event }) {
    const fbLinkRegex = /(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+)/g;
    const messageText = event.body || "";
    const fbLinks = messageText.match(fbLinkRegex);

    if (!fbLinks) return;

    for (const fbLink of fbLinks) {
      try {
        const cacheDir = await this.ensureCacheFolder();
        const videoUrl = await this.SnapSave(fbLink);

        if (!videoUrl) {
          api.sendMessage("Failed to fetch the video. Make sure the link is valid and public.", event.threadID, event.messageID);
          continue;
        }

        const videoName = `facebook-video-${Date.now()}.mp4`;
        const videoPath = path.join(cacheDir, videoName);

        const videoStream = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream"
        });

        videoStream.data.pipe(fs.createWriteStream(videoPath)).on("finish", async () => {
          await api.sendMessage(
            {
              attachment: fs.createReadStream(videoPath),
              body: `Here is your downloaded Facebook video: ${fbLink}`
            },
            event.threadID,
            event.messageID
          );
          await fs.remove(videoPath);
        });
      } catch (error) {
        api.sendMessage(`An error occurred while processing the video link: ${fbLink}`, event.threadID, event.messageID);
      }
    }
  },

  onStart: async function ({ api, event, args }) {
    const fbLinkRegex = /(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+)/g;
    const input = args.join(" ").trim();

    if (!input) {
      return api.sendMessage(
        "Please provide a Facebook video link or share a valid video link in the chat.",
        event.threadID,
        event.messageID
      );
    }

    const fbLinks = input.match(fbLinkRegex);
    if (!fbLinks) {
      return api.sendMessage("No valid Facebook link detected. Please try again.", event.threadID, event.messageID);
    }

    for (const fbLink of fbLinks) {
      try {
        const cacheDir = await this.ensureCacheFolder();
        const videoUrl = await this.SnapSave(fbLink);

        if (!videoUrl) {
          api.sendMessage("Failed to fetch the video. Make sure the link is valid and public.", event.threadID, event.messageID);
          continue;
        }

        const videoName = `facebook-video-${Date.now()}.mp4`;
        const videoPath = path.join(cacheDir, videoName);

        const videoStream = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream"
        });

        videoStream.data.pipe(fs.createWriteStream(videoPath)).on("finish", async () => {
          await api.sendMessage(
            {
              attachment: fs.createReadStream(videoPath),
              body: `Here is your downloaded Facebook video: ${fbLink}`
            },
            event.threadID,
            event.messageID
          );
          await fs.remove(videoPath);
        });
      } catch (error) {
        api.sendMessage(`An error occurred while processing the video link: ${fbLink}`, event.threadID, event.messageID);
      }
    }
  }
};