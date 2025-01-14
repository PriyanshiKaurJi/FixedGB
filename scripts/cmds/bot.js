const axios = require('axios');

let isEnabled = true;
let currentLanguage = 'en';
let dialoguesCache = null;

const PASTEBIN_URL = 'https://pastebin.com/raw/9SU7xwaj';

async function loadDialogues() {
  if (dialoguesCache) return dialoguesCache;

  try {
    const response = await axios.get(PASTEBIN_URL);
    dialoguesCache = response.data.dialogues;
    return dialoguesCache;
  } catch (error) {
    console.error('Failed to load dialogues:', error);
    return null;
  }
}

async function translateText(text, langCode) {
  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
    );
    return res.data[0]?.map(item => item[0]).join('') || text;
  } catch (error) {
    console.error('Failed to translate text:', error);
    return text;
  }
}

module.exports = {
  config: {
    name: "bot",
    version: "1.5.0",
    author: "Priyanshi Kaur",
    countDown: 5,
    role: 0,
    shortDescription: "Random Priyanshi dialogues",
    longDescription: "Sends random Priyanshi dialogues in the current language, with optional translation.",
    category: "fun",
  },

  onStart: async function({ api, event, args }) {
    const command = args[0]?.toLowerCase();

    if (command === "off") {
      isEnabled = false;
      return api.sendMessage("Bot dialogues have been disabled", event.threadID);
    }

    if (command === "on") {
      isEnabled = true;
      return api.sendMessage("Bot dialogues have been enabled", event.threadID);
    }

    if (command === "status") {
      return api.sendMessage(
        `Bot status: ${isEnabled ? "enabled" : "disabled"}\nCurrent language code for translations: ${currentLanguage}`,
        event.threadID
      );
    }
  },

  onChat: async function({ api, event }) {
    if (!isEnabled) return;

    const messageParts = (event.body || "").toLowerCase().split(" ");
    if (messageParts[0] !== "bot") return;

    const langCode = messageParts[1] || currentLanguage;

    const dialogues = await loadDialogues();
    if (!dialogues) {
      return api.sendMessage('Failed to load dialogues', event.threadID);
    }

    const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];

    const translatedDialogue = await translateText(randomDialogue, langCode);
    return api.sendMessage(translatedDialogue, event.threadID);
  }
};