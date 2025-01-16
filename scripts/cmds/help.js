const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
    config: {
        name: "help",
        version: "2.1",
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
            en: "{prefix}help [page | all]\n{prefix}help <command>: Details about a command"
        },
        priority: 1
    },

    langs: {
        en: {
            commandListHeader: "╭─── 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 ───",
            commandEntry: "│ ○ %1 - %2",
            commandFooter: "╰───────────────\n👤 Requested by: %1\n📖 Page: (%2/%3)\n📦 Total commands: %4\nⓘ If you have any questions or need assistance, please contact the developer.",
            noDescription: "No description available",
            allCommandsHeader: "📜 All available commands:",
            invalidCommand: "❌ Command '%1' not found.",
            noPermission: "⚠️ You don't have permission to view this command.",
            allCommandsFooter: "📦 Total commands: %1"
        }
    },

    onStart: async function ({ message, args, event, getLang, role }) {
        const prefix = getPrefix(event.threadID);
        const userName = event.senderName || "User";

        // Get filtered commands based on user's role
        const availableCommands = Array.from(commands.values())
            .filter(cmd => cmd.config.role <= role);

        // If "all" argument is provided, list all commands without descriptions
        if (args[0] === "all") {
            const commandList = availableCommands.map(cmd => cmd.config.name).join(", ");
            return message.reply(
                `${getLang("allCommandsHeader")}\n${commandList}\n\n${getLang("allCommandsFooter", availableCommands.length)}`
            );
        }

        // Paginated display of commands
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