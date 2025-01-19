const axios = require("axios");

module.exports = {
    config: {
        name: "pi",
        version: "1.2.0",
        author: "Priyanshi Kaur",
        countDown: 0,
        role: 0,
        shortDescription: {
            en: "AI interaction triggered by 'pi'."
        },
        longDescription: {
            en: "Automatically triggers when 'pi' is mentioned in a message, responding intelligently based on user input."
        },
        category: "utility",
        guide: {
            en: "Use the command by typing 'pi' followed by your query or reply to a message."
        },
        priority: 1,
    },

    langs: {
        en: {
            errorMessage: "❌ Something went wrong. Please try again.",
            successMessage: "✅ Successfully triggered the AI!"
        }
    },

    onStart: async function ({ api, message, args, event }) {
        const query = args.join(" ");
        const uid = event.senderID;

        if (!query) {
            return message.reply("❌ Please provide a query after 'pi' or reply to a specific message.");
        }

        api.setMessageReaction("⌛", event.messageID, () => {}, true);

        try {
            const response = await axios.get("https://priyansh-ai.onrender.com/pi.ai", {
                params: {
                    prompt: query,
                    apikey: "priyansh-here"
                },
            });

            const replyText = response?.data?.response || "No response available.";
            api.sendMessage(replyText, event.threadID, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: "pi",
                        messageID: info.messageID,
                        author: uid,
                    });
                }
            });

            api.setMessageReaction("✅", event.messageID, () => {}, true);
        } catch (error) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return message.reply("❌ Failed to fetch the AI response.");
        }
    },

    onReply: async function ({ api, message, event, Reply, args }) {
        const uid = event.senderID;
        const prompt = args.join(" ") || "";
        const { author, commandName } = Reply;

        if (uid !== author) return;

        api.setMessageReaction("⌛", event.messageID, () => {}, true);

        try {
            const response = await axios.get("https://priyansh-ai.onrender.com/pi.ai", {
                params: {
                    prompt: prompt || " ",
                    apikey: "priyansh-here"
                },
            });

            const replyText = response?.data?.response || "No response available.";
            api.sendMessage(replyText, event.threadID, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: commandName,
                        messageID: info.messageID,
                        author: uid,
                    });
                }
            });

            api.setMessageReaction("✅", event.messageID, () => {}, true);
        } catch (error) {
            message.reply("❌ Something went wrong while fetching the response.");
            api.setMessageReaction("❌", event.messageID, () => {}, true);
        }
    }
};