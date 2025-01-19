const os = require("os");
const { execSync } = require("child_process");
const prettyBytes = require("pretty-bytes");

module.exports = {
    config: {
        name: "uptime",
        version: "1.0.0",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "View bot uptime and system details."
        },
        longDescription: {
            en: "Displays detailed information about the bot's uptime, runtime, system resources, and status."
        },
        category: "system",
        guide: {
            en: "{prefix}uptime"
        },
        priority: 1
    },

    langs: {
        en: {
            waitingMessage: "⏳ Gathering system uptime info, please wait...",
            template: `
♡   ∩_∩
 （„• ֊ •„)♡
╭─∪∪────────────⟡
│ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗜𝗡𝗙𝗢
├───────────────⟡
│ 🤖 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 
│ 𝙽𝙰𝙼𝙴: ꧁𝑸𝒖𝒆𝒆𝒏𝑩𝒐𝒕꧂
│ 𝙻𝙰𝙽𝙶: Node.js
│ 𝙿𝚁𝙵𝙸𝚇: %1
│ 𝙳𝙴𝚅𝚂: Team Priyanshi
├───────────────⟡
│ ⏰ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘
│  %2
├───────────────⟡
│ 👑 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢
│𝙾𝚂: %3
│𝙻𝙰𝙽𝙶 𝚅𝙴𝚁: %4
│𝙲𝙿𝚄 𝙼𝙾𝙳𝙴𝙻: %5
│𝚂𝚃𝙾𝚁𝙰𝙶𝙴: %6
│𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴: %7
├───────────────⟡
│ ✅ 𝗢𝗧𝗛𝗘𝗥 𝗜𝗡𝗙𝗢
│𝙳𝙰𝚃𝙴: %8
│𝚃𝙸𝙼𝙴: %9
│𝚄𝚂𝙴𝚁𝚂: %10
│𝚃𝙷𝚁𝙴𝙰𝙳𝚂: %11
│𝙿𝙸𝙽𝙶: %12
│𝚂𝚃𝙰𝚃𝚄𝚂: ✅ Good
╰───────────────⟡`
        }
    },

    onStart: async function ({ message, api, event, getLang }) {
        const prefix = global.utils.getPrefix(event.threadID);
        const users = global.data.allUserID.length;
        const threads = global.data.allThreadID.length;
        const botUptime = process.uptime();
        const uptime = formatUptime(botUptime);

        const osType = os.type();
        const osVersion = os.version();
        const osRelease = `${osType} ${osVersion}`;
        const langVersion = process.version;
        const cpuModel = os.cpus()[0].model;
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const storageUsage = getStorage();
        const ramUsage = `${prettyBytes(totalMemory - freeMemory)} / ${prettyBytes(totalMemory)}`;
        const dateNow = new Date();
        const formattedDate = dateNow.toLocaleDateString();
        const formattedTime = dateNow.toLocaleTimeString();

        const startPing = Date.now();

        // Send waiting message
        const waitingMessage = await api.sendMessage(getLang("waitingMessage"), event.threadID, event.messageID);

        // Simulate loading and collect system data
        setTimeout(() => {
            const endPing = Date.now();
            const ping = endPing - startPing;

            const response = getLang(
                "template",
                prefix,
                uptime,
                osRelease,
                langVersion,
                cpuModel,
                `${storageUsage.used} / ${storageUsage.total}`,
                ramUsage,
                formattedDate,
                formattedTime,
                users,
                threads,
                `${ping}ms`
            );

            // Edit waiting message to final info
            api.editMessage(response, waitingMessage.messageID, event.threadID);
        }, 1000); // Slight delay for user experience
    }
};

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

function getStorage() {
    const storageOutput = execSync("df -h --total | grep total", { encoding: "utf8" }).trim();
    const [totalSize, usedSize] = storageOutput.split(/\s+/).slice(1, 3);
    return {
        total: totalSize,
        used: usedSize
    };
}