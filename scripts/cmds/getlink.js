module.exports = {
  config: {
    name: "getlink",
    version: "1.0.0",
    author: "Priyanshi Kaur",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get direct links of images, videos, and audio from messages."
    },
    longDescription: {
      en: "Reply to an image, video, or audio file, and this command will fetch the direct URL(s)."
    },
    category: "media",
    guide: {
      en: "{prefix} <reply with an image, video, or audio file>"
    }
  },

  onStart: async function ({ api, event }) {
    const { messageReply } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("❌ Please reply to an image, video, or audio file to get its link.", event.threadID, event.messageID);
    }

    let response = "🔗 **Attachment Links:**\n";

    for (let i = 0; i < messageReply.attachments.length; i++) {
      const attachment = messageReply.attachments[i];
      let type = "Unknown";

      if (attachment.type === "photo") type = "🖼 Image";
      else if (attachment.type === "video") type = "🎥 Video";
      else if (attachment.type === "audio") type = "🎵 Audio";
      else if (attachment.type === "sticker") type = "🔖 Sticker";
      else if (attachment.type === "animated_image") type = "🖼 GIF";

      response += `\n${type} ${i + 1}: ${attachment.url}`;
    }

    return api.sendMessage(response, event.threadID, event.messageID);
  }
};