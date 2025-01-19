const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
    config: {
        name: "help",
        version: "2.5.0",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "View available commands."
        },
        longDescription: {
            en: "Displays detailed information about bot commands, their usage, and categories."
        },
        category: "system",
        guide: {
            en: "{prefix}help [page | all]\n{prefix}help <command>: Details about a specific command"
        },
        priority: 1
    },

    langs: {
        en: {
            commandListHeader: "╭─── COMMANDS ───",
            commandEntry: "│ ○ %1 - %2",
            commandFooter: "╰───────────────\n👤 Requested by: %1\n📖 Page: (%2/%3)\n📦 Total commands: %4\nⓘ For assistance, contact the developer.",
            noDescription: "No description available",
            allCommandsHeader: "📜 All available commands:",
            invalidCommand: "❌ Command '%1' not found.",
            allCommandsFooter: "📦 Total commands: %1",
            commandDetailsHeader: "╭── COMMAND INFO ────⭓",
            commandDetails: "│ 📝 Name: %1\n│ 📚 Description: %2\n│ 🔧 Version: %3\n│ 👑 Role: %4\n│ ⏰ Cooldown: %5s\n│ ✍️ Author: %6",
            usageHeader: "├── USAGE ────⭔",
            commandUsage: "%1",
            commandDetailsFooter: "╰──────────⭓"
        }
    },

    onStart: async function ({ message, args, event, getLang, role }) {
        const prefix = getPrefix(event.threadID);
        const userName = event.senderName || "User";

        const availableCommands = Array.from(commands.values())
            .filter(cmd => cmd.config.role <= role);

        if (args.length === 1 && isNaN(args[0])) {
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName) || aliases.get(commandName);

            if (!command || command.config.role > role) {
                return message.reply(getLang("invalidCommand", commandName));
            }

            const cmdConfig = command.config;
            const description = cmdConfig.shortDescription?.en || cmdConfig.longDescription?.en || getLang("noDescription");
            const guide = cmdConfig.guide?.en.replace(/{prefix}/g, prefix).replace(/{pn}/g, `${prefix}${cmdConfig.name}`) || "";

            let msg = `${getLang("commandDetailsHeader")}\n`;
            msg += `${getLang(
                "commandDetails",
                cmdConfig.name,
                description,
                cmdConfig.version,
                cmdConfig.role,
                cmdConfig.countDown,
                cmdConfig.author
            )}\n`;
            msg += `${getLang("usageHeader")}\n${getLang("commandUsage", guide)}`;
            msg += `\n${getLang("commandDetailsFooter")}`;

            return message.reply(msg);
        }

        if (args[0] === "all") {
            const commandList = availableCommands.map(cmd => cmd.config.name).join(", ");
            return message.reply(
                `${getLang("allCommandsHeader")}\n${commandList}\n\n${getLang("allCommandsFooter", availableCommands.length)}`
            );
        }

        const commandsPerPage = 10;
        const page = parseInt(args[0]) || 1;
        const totalPages = Math.ceil(availableCommands.length / commandsPerPage);

        if (page < 1 || page > totalPages) {
            return message.reply(`❌ Invalid page number. Total pages: ${totalPages}`);
        }

        const startIndex = (page - 1) * commandsPerPage;
        const pageCommands = availableCommands.slice(startIndex, startIndex + commandsPerPage);

        let msg = getLang("commandListHeader");
        pageCommands.forEach(cmd => {
            const description = cmd.config.shortDescription?.en || cmd.config.longDescription?.en || getLang("noDescription");
            msg += `\n${getLang("commandEntry", cmd.config.name, description)}`;
        });
        msg += `\n${getLang("commandFooter", userName, page, totalPages, availableCommands.length)}`;

        return message.reply(msg);
    }
};