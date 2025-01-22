const os = require("os");

const startTime = new Date();

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "stats"],
    author: "Priyanshi Kaur",
    category: "system",
    version: "1.0.0",
    shortDescription: "Displays uptime and system info.",
    longDescription: "Provides information on system uptime and hardware details, including memory and CPU usage.",
  },

  onStart: async function ({ api, event, threadsData, usersData }) {
    try {
      const waitingMessage = await api.sendMessage("⏳ Gathering system information, please wait...", event.threadID);

      const uptimeInSeconds = (new Date() - startTime) / 1000;
      const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
      };
      const formattedUptime = formatUptime(uptimeInSeconds);

      const totalMemoryGB = os.totalmem() / (1024 ** 3);
      const freeMemoryGB = os.freemem() / (1024 ** 3);
      const usedMemoryGB = totalMemoryGB - freeMemoryGB;

      const cpuUsage = os.loadavg()[0].toFixed(2);
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();

      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
      const formattedTime = currentDate.toLocaleTimeString("en-US", { hour12: true });

      const timeStart = Date.now();
      const ping = Date.now() - timeStart;
      const pingStatus = ping < 1000 ? "✅ Smooth System" : "⛔ High Latency";

      const cpuModel = os.cpus()[0].model;
      const platform = `${os.platform()} ${os.arch()}`;
      const nodeVersion = process.version;
      const threadsCount = os.cpus().length;
      const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

      const systemInfo = `
♡   ∩_∩
 （„• ֊ •„)♡
╭─∪∪────────────⟡
│ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗜𝗡𝗙𝗢
├───────────────⟡
│ 🤖 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢
│ 𝙽𝙰𝙼𝙴: ꧁𝑸𝒖𝒆𝒆𝒏𝑩𝒐𝒕꧂
│ 𝙻𝙰𝙽𝙶: Node.js
│ 𝙿𝚁𝙵𝙸𝚇: .
│ 𝙳𝙴𝚅𝚂: Team Priyanshi
├───────────────⟡
│ ⏰ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘
│ ${formattedUptime}
├───────────────⟡
│ 👑 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢
│ OS: ${platform}
│ LANG VER: ${nodeVersion}
│ CPU MODEL: ${cpuModel}
│ STORAGE: ${usedMemoryGB.toFixed(2)} GB / ${totalMemoryGB.toFixed(2)} GB
│ CPU USAGE: ${cpuUsage} (1-min avg)
│ RAM USAGE: ${ramUsage} MB
│ THREADS: ${threadsCount}
├───────────────⟡
│ ✅ 𝗢𝗧𝗛𝗘𝗥 𝗜𝗡𝗙𝗢
│ DATE: ${formattedDate}
│ TIME: ${formattedTime}
│ USERS: ${allUsers.length}
│ THREADS: ${allThreads.length}
│ PING: ${ping} ms
│ STATUS: ${pingStatus}
╰───────────────⟡
`;

      await api.editMessage(systemInfo, waitingMessage.messageID);
    } catch (error) {
      console.error("Error retrieving system information:", error);
      await api.editMessage("❌ Unable to retrieve system information.", waitingMessage.messageID);
    }
  },
};