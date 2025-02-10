const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
    config: {
        name: "sing",
        version: "1.0",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        description: {
            en: "Download YouTube songs from keyword search"
        },
        category: "media",
        guide: { en: "{pn} <song name> [audio/video]" },
    },

    onStart: async function ({ api, message, event, args }) {
        let songName, type;

        if (args.length > 1 && (args[args.length - 1] === "audio" || args[args.length - 1] === "video")) {
            type = args.pop();
            songName = args.join(" ");
        } else {
            songName = args.join(" ");
            type = "audio";
        }

        if (!songName) {
            return message.reply("Please provide a song name!");
        }

        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
            const processingMessage = await message.reply("✅ Processing your request. Please wait...");

            const searchResults = await ytSearch(songName);
            if (!searchResults || !searchResults.videos.length) {
                throw new Error("No results found for your search query.");
            }

            const topResult = searchResults.videos[0];
            const videoId = topResult.videoId;

            const apiKey = "priyansh-here";
            const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

            const downloadResponse = await axios.get(apiUrl);
            const downloadUrl = downloadResponse.data.downloadUrl;

            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch song. Status code: ${response.status}`);
            }

            const filename = `${topResult.title}.${type === "audio" ? "mp3" : "mp4"}`;
            const downloadPath = path.join(__dirname, filename);

            const songBuffer = await response.buffer();
            fs.writeFileSync(downloadPath, songBuffer);

            await message.reply({
                body: `🎵 Title: ${topResult.title}\n\nHere is your ${type === "audio" ? "audio" : "video"} 🎧`,
                attachment: fs.createReadStream(downloadPath)
            });

            fs.unlinkSync(downloadPath);
            api.unsendMessage(processingMessage.messageID);
            api.setMessageReaction("✅", event.messageID, () => { }, true);

        } catch (error) {
            console.error(`Failed to download and send song:`, error);
            message.reply(`❌ Error: ${error.message}`);
            api.setMessageReaction("❌", event.messageID, () => { }, true);
        }
    },

    onReply: async function ({ api, message, event, Reply, args }) {
    }
};