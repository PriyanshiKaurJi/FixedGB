const axios = require("axios");
const FormData = require("form-data");

const IMGUR_ACCESS_TOKEN = "053d1e88a4339a154bbeadbfaa4fe6b654e2ef44";

module.exports = {
  config: {
    name: "imgur",
    version: "1.2",
    author: "Priyanshi Kaur",
    countDown: 1,
    role: 0,
    longDescription: "Upload image to Imgur and get the link",
    category: "utility",
    guide: {
      en: "${pn} reply to an image",
    },
  },

  onStart: async function ({ message, api, event }) {
    const imageUrl = event.messageReply?.attachments[0]?.url;

    if (!imageUrl) {
      return message.reply("⚠️ Please reply to an image to upload it to Imgur.");
    }

    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    try {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

      const form = new FormData();
      form.append("image", Buffer.from(imageResponse.data).toString("base64"));
      form.append("type", "base64");

      const imgurResponse = await axios.post("https://api.imgur.com/3/upload", form, {
        headers: {
          Authorization: `Bearer ${IMGUR_ACCESS_TOKEN}`,
          ...form.getHeaders(),
        },
      });

      const imgurLink = imgurResponse.data.data.link;

      api.sendMessage("✅ Successfully Uploaded:\n" + imgurLink, event.threadID, async () => {
        await api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      });
    } catch (error) {
      console.error("Imgur upload failed:", error.response?.data || error.message);
      await message.reply("❌ Oops! Something went wrong while uploading the image.");
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    }
  },
};