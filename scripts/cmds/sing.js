const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
    config: {
        name: "sing",
        version: "1.0",
        author: "Priyanshi Kaur",
        description: {
            en: "Download music from YouTube with advanced search"
        },
        category: "media",
        guide: { 
            en: "{pn} <song name> [audio/video]" 
        },
        role: 0,
        countDown: 5
    },

    onStart: async function ({ api, message, event, args }) {
        const uid = event.senderID;
        let songName = args.join(" ");
        let type = "audio";

        if (args[args.length - 1] === "video") {
            type = "video";
            songName = args.slice(0, -1).join(" ");
        }

        try {
            api.setMessageReaction("⌛", event.messageID, () => {}, true);

            const searchResults = await ytSearch(songName);
            if (!searchResults.videos.length) {
                return message.reply("No music found for your request.");
            }

            const topResult = searchResults.videos[0];
            const videoId = topResult.videoId;
            const apiKey = "priyansh-here";
            const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

            const processingMessage = await message.reply(`🔍 Searching for: ${topResult.title}`);

            const downloadResponse = await fetch(apiUrl);
            
            if (!downloadResponse.ok) {
                throw new Error("Download failed");
            }

            const responseData = await downloadResponse.json();
            const downloadUrl = responseData.downloadUrl;

            const mediaResponse = await fetch(downloadUrl);
            
            if (!mediaResponse.ok) {
                throw new Error("Media download failed");
            }

            const downloadPath = path.join(__dirname, `music_${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`);
            const audioBuffer = await mediaResponse.buffer();
            fs.writeFileSync(downloadPath, audioBuffer);

            await message.reply({
                body: `🎵 Title: ${topResult.title}\nDuration: ${topResult.duration.timestamp}`,
                attachment: fs.createReadStream(downloadPath)
            }, () => {
                fs.unlinkSync(downloadPath);
                api.unsendMessage(processingMessage.messageID);
            });

            api.setMessageReaction("✅", event.messageID, () => {}, true);

        } catch (error) {
            console.error("Music download error:", error);
            message.reply(`❌ Download failed: ${error.message}`);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
        }
    },

    onReply: async function ({ api, message, event, Reply, args }) {
        const { author, messageID } = Reply;

        if (event.senderID !== author) return;

        try {
            const additionalQuery = args.join(" ");
            const searchResults = await ytSearch(additionalQuery);

            if (!searchResults.videos.length) {
                return message.reply("No additional results found.");
            }

            const selectedResult = searchResults.videos[0];
            const videoId = selectedResult.videoId;
            const apiKey = "priyansh-here";
            const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=audio&apikey=${apiKey}`;

            const downloadResponse = await fetch(apiUrl);
            
            if (!downloadResponse.ok) {
                throw new Error("Download failed");
            }

            const responseData = await downloadResponse.json();
            const downloadUrl = responseData.downloadUrl;

            const mediaResponse = await fetch(downloadUrl);
            
            if (!mediaResponse.ok) {
                throw new Error("Media download failed");
            }

            const downloadPath = path.join(__dirname, `music_${Date.now()}.mp3`);
            const audioBuffer = await mediaResponse.buffer();
            fs.writeFileSync(downloadPath, audioBuffer);

            await message.reply({
                body: `🎵 Next Track: ${selectedResult.title}`,
                attachment: fs.createReadStream(downloadPath)
            }, () => {
                fs.unlinkSync(downloadPath);
            });

        } catch (error) {
            console.error("Additional music download error:", error);
            message.reply(`❌ Download failed: ${error.message}`);
        }
    }
};