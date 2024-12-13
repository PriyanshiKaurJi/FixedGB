const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
  config: {
    name: 'exec',
    aliases: ['$', '>'],
    version: '2.1',
    author: 'Yukinori ʚĭɞ | Priyanshi Kaur',
    role: 2,
    category: 'utility',
    shortDescription: {
      en: 'Executes terminal commands with advanced features.',
    },
    longDescription: {
      en: 'Executes terminal commands, supports shortcuts, and provides additional functionality.',
    },
    guide: {
      en: `
{pn} [command] - Executes the given terminal command.
Shortcuts:
- {pn} Ctrl+L - Clears the screen.
- {pn} Ctrl+A - Repeats the last executed command.
- {pn} Ctrl+D - Displays system date and time.
- {pn} Ctrl+U - Displays current user info.
Examples:
- {pn} ls - Lists files in the current directory.
- {pn} pwd - Prints the current working directory.
- {pn} Ctrl+L - Clears the terminal display.
      `,
    },
  },
  lastCommand: null,
  onStart: async function ({ api, args, message, event }) {
    if (args.length === 0) {
      message.reply('Usage: {pn} [command]\nUse shortcuts for advanced features.');
      return;
    }

    const commandInput = args.join(' ').trim();

    if (commandInput.toLowerCase() === 'ctrl+l') {
      message.send('[Terminal Cleared]');
      return;
    }

    if (commandInput.toLowerCase() === 'ctrl+a') {
      if (this.lastCommand) {
        await this.runCommandAndReply(message, this.lastCommand);
      } else {
        message.reply('No command to repeat.');
      }
      return;
    }

    if (commandInput.toLowerCase() === 'ctrl+d') {
      const date = new Date();
      message.send(`Current Date and Time: ${date.toLocaleString()}`);
      return;
    }

    if (commandInput.toLowerCase() === 'ctrl+u') {
      await this.runCommandAndReply(message, 'whoami');
      return;
    }

    if (!this.isCommandAllowed(commandInput)) {
      message.reply('This command is not allowed for security reasons.');
      return;
    }

    this.lastCommand = commandInput;

    await this.runCommandAndReply(message, commandInput);
  },
  onChat: async function ({ api, args, message, event }) {
    const messageContent = event.body.trim();

    if (!messageContent.startsWith(this.config.name) && !this.config.aliases.some(alias => messageContent.startsWith(alias))) {
      return;
    }

    const commandArgs = messageContent.split(/ +/);
    const commandName = commandArgs.shift().toLowerCase();

    if (commandName !== this.config.name && !this.config.aliases.includes(commandName)) return;

    if (commandArgs.length === 0) {
      message.reply('Usage: {pn} [command]\nUse shortcuts for advanced features.');
      return;
    }

    const commandInput = commandArgs.join(' ').trim();

    if (commandInput.toLowerCase() === 'ctrl+l') {
      message.send('[Terminal Cleared]');
      return;
    }

    if (commandInput.toLowerCase() === 'ctrl+a') {
      if (this.lastCommand) {
        await this.runCommandAndReply(message, this.lastCommand);
      } else {
        message.reply('No command to repeat.');
      }
      return;
    }

    if (commandInput.toLowerCase() === 'ctrl+d') {
      const date = new Date();
      message.send(`Current Date and Time: ${date.toLocaleString()}`);
      return;
    }

    if (commandInput.toLowerCase() === 'ctrl+u') {
      await this.runCommandAndReply(message, 'whoami');
      return;
    }

    if (!this.isCommandAllowed(commandInput)) {
      message.reply('This command is not allowed for security reasons.');
      return;
    }

    this.lastCommand = commandInput;

    await this.runCommandAndReply(message, commandInput);
  },
  onReply: async function ({ api, message, event }) {
    const replyContent = event.body.trim().toLowerCase();

    if (replyContent === 'repeat') {
      if (this.lastCommand) {
        await this.runCommandAndReply(message, this.lastCommand);
      } else {
        message.reply('No command to repeat.');
      }
      return;
    }

    if (replyContent.startsWith('exec ')) {
      const command = replyContent.replace('exec ', '').trim();

      if (this.isCommandAllowed(command)) {
        this.lastCommand = command;
        await this.runCommandAndReply(message, command);
      } else {
        message.reply('This command is not allowed for security reasons.');
      }
      return;
    }

    message.reply('Unrecognized input. Please type a valid command or use a shortcut.');
  },
  isCommandAllowed(command) {
    const blockedCommands = ['rm', 'shutdown', 'reboot', 'mkfs', ':(){ :|:& };:'];
    const sanitizedCommand = command.toLowerCase().replace(/[^a-z0-9\s\-\_]/g, '');
    return !blockedCommands.some(blocked => sanitizedCommand.includes(blocked));
  },
  async runCommandAndReply(message, command) {
    try {
      const { stdout, stderr } = await exec(command);

      if (stderr) {
        message.send(`Error Output:\n${stderr}`);
      } else if (stdout) {
        message.send(`Command Output:\n${stdout}`);
      } else {
        message.reply('Command executed successfully, but no output was produced.');
      }
    } catch (error) {
      message.reply(`Error executing command:\n${error.message}`);
    }
  },
};