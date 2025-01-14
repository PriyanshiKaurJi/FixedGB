const os = require("os");
const fs = require("fs-extra");
const process = require("process");
const speedTest = require("speedtest-net");

const startTime = new Date();

function getCPUUsage() {
  try {
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce(
      (acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b),
      0
    );

    const avgIdle = totalIdle / cpuCount;
    const avgTotal = totalTick / cpuCount;
    const usagePercent = 100 - (avgIdle / avgTotal) * 100;

    return usagePercent.toFixed(1);
  } catch (error) {
    return "N/A";
  }
}

function formatBytes(bytes) {
  try {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  } catch (error) {
    return "N/A";
  }
}

async function getNetworkSpeed() {
  try {
    const speed = await speedTest({ acceptLicense: true });
    return {
      download: formatBytes(speed.download.bandwidth * 8),
      upload: formatBytes(speed.upload.bandwidth * 8),
      ping: `${speed.ping.latency.toFixed(1)} ms`,
    };
  } catch (error) {
    console.error("Network speed test failed:", error);
    return { download: "N/A", upload: "N/A", ping: "N/A" };
  }
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "stats", "sysinfo"],
    author: "Priyanshi Kaur v1.14.20",
    countDown: 0,
    role: 0,
    category: "system",
    longDescription: {
      en: "Get detailed system metrics, including network speed and other system insights.",
    },
  },

  onStart: async function ({ api, event, args, threadsData, usersData }) {
    try {
      const checkingMessage = await api.sendMessage("⚙️ Fetching system info...", event.threadID);

      const uptimeInSeconds = process.uptime();
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeInSeconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

      const cpuModel = os.cpus()[0]?.model || "N/A";
      const cpuSpeed = `${os.cpus()[0]?.speed || "N/A"} MHz`;
      const platform = os.platform();
      const osRelease = os.release();
      const networkInterfaces = Object.values(os.networkInterfaces()).flat()
        .filter((iface) => iface.family === "IPv4" && !iface.internal);

      const allUsers = await usersData.getAll() || [];
      const allThreads = await threadsData.getAll() || [];
      const userCount = allUsers.length;
      const threadCount = allThreads.length;

      const ping = Date.now() - checkingMessage.timestamp;
      const networkSpeed = await getNetworkSpeed();
      const pingStatus = ping < 100 ? "🟢" : ping < 300 ? "🟡" : "🔴";

      const currentDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const systemInfo = `
╭───────── SYSTEM INFO ─────────╮

💻 System Stats
❯ CPU Usage: ${getCPUUsage()}%
❯ CPU Model: ${cpuModel}
❯ CPU Speed: ${cpuSpeed}
❯ RAM Usage: ${memoryUsagePercent}%
❯ Total RAM: ${formatBytes(totalMem)}
❯ Used RAM: ${formatBytes(usedMem)}
❯ Free RAM: ${formatBytes(freeMem)}

⚙️ OS Info
❯ Platform: ${platform}
❯ OS Release: ${osRelease}

🌐 Network Stats
❯ IPs: ${networkInterfaces.map((iface) => iface.address).join(", ") || "N/A"}
❯ Download Speed: ${networkSpeed.download}
❯ Upload Speed: ${networkSpeed.upload}
❯ Ping: ${networkSpeed.ping}

📊 Usage Stats
❯ Uptime: ${uptimeFormatted}
❯ Total Users: ${userCount}
❯ Total Threads: ${threadCount}
❯ Command Response Time: ${ping}ms ${pingStatus}

🕒 Current Time
❯ ${currentDate}

╰────────────────────────────╯`;

      await api.editMessage(systemInfo, checkingMessage.messageID);
    } catch (error) {
      console.error("Uptime Error:", error);
      api.sendMessage(`⚠️ Failed to fetch system info:\n${error.message}`, event.threadID);
    }
  },
};