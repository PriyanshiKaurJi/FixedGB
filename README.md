<img src="https://i.imgur.com/wRUV5Sp.jpeg" alt="banner">
<h1 align="center"><img src="./dashboard/images/logo-non-bg.png" width="22px"> Queen Bot - Bot Chat Messenger</h1>

<p align="center">
        <a href="https://nodejs.org/dist/v16.20.0">
                <img src="https://img.shields.io/badge/Nodejs%20Support-16.x-brightgreen.svg?style=flat-square" alt="Nodejs Support v16.x">
        </a>
  <img alt="size" src="https://img.shields.io/github/repo-size/ItzPriyanshi/QueenBotV2.svg?style=flat-square&label=size">
  <img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=brightgreen&label=code%20version&prefix=v&query=%24.version&url=https://github.com/ItzPriyanshi/QueenBotV2/raw/main/package.json&style=flat-square">
  <img alt="visitors" src="https://visitor-badge.laobi.icu/badge?style=flat-square&page_id=ItzPriyanshi.QueenBotV2">
  <img alt="size" src="https://img.shields.io/badge/license-MIT-green?style=flat-square&color=brightgreen">
</p>

- [📝 **Note**](#-note)
- [🚧 **Requirement**](#-requirement)
- [📝 **Tutorial**](#-tutorial)
- [💡 **How it works?**](#-how-it-works)
- [🔔 **How to get notification when have new update?**](#-how-to-get-notification-when-have-new-update)
- [🆙 **How to Update**](#-how-to-update)
- [🛠️ **How to create new commands**](#️-how-to-create-new-commands)
- [💭 **Support**](#-support)
- [📚 **Support Languages in source code**](#-support-languages-in-source-code)
- [📌 **Common Problems**](#-common-problems)
- [❌ **DO NOT USE THE ORIGINAL UNDERGRADUATE VERSION**](#-do-not-use-the-original-undergraduate-version)
- [📸 **Screenshots**](#-screenshots)
- [✨ **Copyright (C)**](#-copyright-c)
- [📜 **License**](#-license)

<hr>

## FCA Fixed By Priyansh Rajput 
This version includes fixes by Priyansh Rajput to the FCA (Facebook Chat API) implementation.

### Key Modifications
- Updated files:
  1. `bot/login/login.js`
  2. `package.json`
  3. `package-lock.json`

## CREDIT
- The Fixed Version Of GoatBot By Priyansh Rajput [here](https://github.com/Priyansh-11/Goat-Bot-V2-Fix)
- You Can Follow [Priyansh Rajput](https://github.com/Priyansh-11)
Show Some Support For His Efforts ⭐

## 📝 **Note**
- This is a messenger chat bot using a personal account, using an [unofficial api](https://github.com/ItzPriyanshi/fb-chat-api/blob/master/DOCS.md) ([Origin here](https://github.com/Schmavery/facebook-chat-api)) and this may lead to facebook account being locked due to spam or other reasons. 
- So, I recommend using a clone account (one that you're willing to throw away at any time)
- ***I am not responsible for any problems that may arise from using this bot.***

## 🚧 **Requirement**
- Node.js 16.x [Download](https://nodejs.org/dist/v16.20.0) | [Home](https://nodejs.org/en/download/) | [Other versions](https://nodejs.org/en/download/releases/)
- Knowledge of **programming**, javascript, nodejs, unofficial facebook api

## 📝 **Tutorial**
Tutorial has been uploaded on YouTube
- For mobile phone: https://www.youtube.com/watch?v=grVeZ76HlgA
- For vps/windows: https://www.youtube.com/watch?v=uCbSYNQNEwY

Summary instructions:
- See [here](https://github.com/ItzPriyanshi/QueenBotV2/blob/main/STEP_INSTALL.md)

## 💡 **How it works?**
- The bot uses the unofficial facebook api to send and receive messages from the user.
- When having a `new event` (message, reaction, new user join, user leave chat box,...) the bot will emit an event to the `handlerEvents`.
- The `handlerEvents` will handle the event and execute the command:
  - `onStart`:
    - the handler will check if user `call a command or not`.
    - if yes, it will check if `user banned` or mode `admin box only is turned on` or not, if not, it will execute the command.
    - next, it will check the `permission` of the user.
    - next, it will check if the `countdown` of command is over or not.
    - finally, it will execute the command and `log` information to the console.

  - `onChat`:
    - the handler will run `when the user sends a message`.
    - it will check `permission` of the user.
    - the handler will `execute` the command, if it return a `function` or `async function` then it willl check `user banned` or mode `admin box only is turned on` or not, if not, it will call the function and `log` information to the console.

  - `onFirstChat`:
    - the handler will run `when get the first message` from the chat box since the bot started.
    - the way it works is like `onChat`.

  - `onReaction`:
    - the handler will run when the user `reacts` to a `message has messageID` is set in `GoatBot.onReaction` as follows:
                ```javascript
                // example:        
                global.GoatBot.onReaction.set(msg.messageID, {
                        messageID: msg.messageID,
                        commandName,
                        // ... and more
                });
                ```
    - the handler will automatically add method `delete`, if this method is called, it will delete the message from the set.
    - next, it will check `permission` of the user and `execute` if the user has permission and `log` information to the console.

  - `onReply`:
    - the handler will run when the user `replies` to a `message has messageID` is set in `GoatBot.onReply` as follows:
                ```javascript
                // example:
                global.GoatBot.onReply.set(msg.messageID, {
                        messageID: msg.messageID,
                        commandName,
                        // ... and more
                });
                ```
    - the handler will automatically add method `delete`, if this method is called, it will delete the message from the set.
    - next, it will check `permission` of the user and `execute` if the user has permission and `log` information to the console.  

  - `onEvent`:
    - the handler will run `when the user has a new event` type `event` (new user join, user leave chat box, change admin box,...)
                ```javascript
                // example:
                global.GoatBot.onEvent.set(msg.messageID, {
                        messageID: msg.messageID,
                        commandName,
                        // ... and more
                });
                ```
                - it will loop through all `onEvent` and get the command determined by the key `commandName` and execute the `onEvent` in that command.
                - if it return a `function` or `async function` then it will call the function and `log` information to the console.

  - `handlerEvent`:
    - the handler will run `when the user has a new event` type `event` (new user join, user leave chat box, change admin box,...)
    - it will get all the eventCommand set in `GoatBot.eventCommands` (scripts placed in the `scripts/events` folder)
    - it will loop through all `eventCommands` and run the `onStart` in that command.
    - if it return a `function` or `async function` then it will call the function and `log` information to the console.

## 🔔 **How to get notification when have new update?**
- Click on the `Watch` button in the upper right corner of the screen and select `Custom` and select `Pull requests` and `Releases` and click `Apply` to get notified when there is a new update.

## 🆙 **How to Update**
Tutorial has been uploaded on YouTube
- on phone/repl: https://youtu.be/grVeZ76HlgA?t=1342
- on vps/computer: https://youtu.be/uCbSYNQNEwY?t=508

## 🛠️ **How to create new commands**
- See [here](https://github.com/PriyanshiKaurJi/Goat-Bot-V2/blob/main/DOCS.md)

## 💭 **Support**
If you have major coding issues with this bot, please join and ask for help.
- https://discord.com/invite/DbyGwmkpVY (recommended)
- https://www.facebook.com/groups/goatbot
- https://m.me/j/Abbq0B-nmkGJUl2C
- ~~https://t.me/gatbottt~~ (no longer supported)
- ***Please do not inbox me, I do not respond to private messages, any questions please join the chat group for answers. ThankThanks!***

## 📚 **Support Languages in source code**
- Currently, the bot supports 2 languages:
- [x] `en: English`
- [x] `vi: Vietnamese`

- Change language in `config.json` file
- You can customize the language in the folder `languages/`, `languages/cmds/` and `languages/events/`

## 📌 **Common Problems**
<details>
        <summary>
                📌 Error 400: redirect_uri_mismatch
        </summary>
        <p><img src="https://i.ibb.co/6Fbjd4r/image.png" width="250px"></p> 
        <p>1. Enable Google Drive API: <a href="https://youtu.be/nTIT8OQeRnY?t=347">Tutorial</a></p>
        <p>2. Add uri <a href="https://developers.google.com/oauthplayground">https://developers.google.com/oauthplayground</a> (not <a href="https://developers.google.com/oauthplayground/">https://developers.google.com/oauthplayground/</a>) to <b>Authorized redirect URIs</b> in <b>OAuth consent screen:</b> <a href="https://youtu.be/nTIT8OQeRnY?t=491">Tutorial</a></p>  
        <p>3. Choose <b>https://www.googleapis.com/auth/drive</b> and <b>https://mail.google.com/</b> in <b>OAuth 2.0 Playground</b>: <a href="https://youtu.be/nTIT8OQeRnY?t=600">Tutorial</a></p>
</details>

<details>
        <summary>
                📌 Error for site owners: Invalid domain for site key
        </summary>
                <p><img src="https://i.ibb.co/2gZttY7/image.png" width="250px"></p>
                <p>1. Go to <a href="https://www.google.com/recaptcha/admin">https://www.google.com/recaptcha/admin</a></p>
                <p>2. Add domain <b>repl.co</b> (not <b>repl.com</b>) to <b>Domains</b> in <b>reCAPTCHA v2</b> <a href="https://youtu.be/nTIT8OQeRnY?t=698">Tutorial</a></p>
</details>

<details>
        <summary>
                📌 GaxiosError: invalid_grant, unauthorized_client 
        </summary>
                <p><img src="https://i.ibb.co/n7w9TkH/image.png" width="250px"></p>
                <p><img src="https://i.ibb.co/XFKKY9c/image.png" width="250px"></p>
                <p><img src="https://i.ibb.co/f4mc5Dp/image.png" width="250px"></p>
                <p>- If you don't publish the project in google console, the refresh token will expire after 1 week and you need to get it back. <a href="https://youtu.be/nTIT8OQeRnY?t=445">Tuatorial</a></p>
</details>

<details>
        <summary>
                📌 GaxiosError: invalid_client
        </summary>
                <p><img src="https://i.ibb.co/st3W6v4/Pics-Art-01-01-09-10-49.jpg" width="250px"></p>
                <p>- Check if you have entered your google project client_id correctly <a href="https://youtu.be/nTIT8OQeRnY?t=509">Tuatorial</a></p>
</details>

<details>
        <summary>
                📌 Error 403: access_denied
        </summary>
                <p><img src="https://i.ibb.co/dtrw5x3/image.png" width="250px"></p>
                <p>- If you don't publish the project in google console only the approved accounts added to the project can use it <a href="https://youtu.be/nTIT8OQeRnY?t=438">Tuatorial</a></p>
</details>

## ❌ **DO NOT USE THE ORIGINAL UNDERGRADUATE VERSION**
- The use of unknown source code can lead to the device being infected with viruses, malware, hacked social accounts, banks, ...
- Goat-Bot-V2 is only published at https://github.com/PriyanshiKaurJi/Goat-Bot-V2, all other sources, all forks from other github, replit,... are fake, violate policy
- If you use from other sources (whether accidentally or intentionally) it means that you are in violation and will be banned without notice

## 📸 **Screenshots**
- ### Bot
<details>
        <summary>
                 Rank system
        </summary>

  - Rank card:
  <p><img src="https://i.ibb.co/d0JDJxF/rank.png" width="399px"></p>

  - Rankup notification:
  <p><img src="https://i.ibb.co/WgZzthH/rankup.png" width="399px"></p>

  - Custom rank card:
  <p><img src="https://i.ibb.co/hLTThLW/customrankcard.png" width="399px"></p>
</details>

<details>
        <summary>
                 Weather
        </summary>
        <p><img src="https://i.ibb.co/2FwWVLv/weather.png" width="399px"></p>
</details>

<details>
        <summary>
                 Auto send notification when have user join or leave box chat (you can custom message)
        </summary>
        <p><img src="https://i.ibb.co/Jsb5Jxf/wcgb.png" width="399px"></p>
</details>

<details>
        <summary>
                 Openjourney
        </summary>
        <p><img src="https://i.ibb.co/XJfwj1X/Screenshot-2023-05-09-22-43-58-630-com-facebook-orca.jpg" width="399px"></p>
</details>

<details>
        <summary>
                 GPT
        </summary>
        <p><img src="https://i.ibb.co/D4wRbM3/Screenshot-2023-05-09-22-47-48-037-com-facebook-orca.jpg" width="399px"></p>
        <p><img src="https://i.ibb.co/z8HqPkH/Screenshot-2023-05-09-22-47-53-737-com-facebook-orca.jpg" width="399px"></p>
        <p><img src="https://i.ibb.co