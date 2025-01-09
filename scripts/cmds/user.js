const { getTime } = global.utils;

module.exports = {
	config: {
		name: "user",
		version: "1.6",
		author: "NTKhang || Priyanshi Kaur",
		countDown: 5,
		role: 2,
		description: {
			vi: "Quản lý người dùng trong hệ thống bot",
			en: "Manage users in bot system"
		},
		category: "owner",
		guide: {
			vi: `
   {pn} [find | -f | search | -s] <tên cần tìm>: tìm kiếm người dùng theo tên
   {pn} [ban | -b] [<uid> | @tag | reply tin nhắn] <reason>: cấm người dùng
   {pn} unban [<uid> | @tag | reply tin nhắn]: bỏ cấm người dùng
   {pn} warn [<uid> | @tag | reply tin nhắn] <reason>: cảnh báo người dùng (3 lần cấm)
   {pn} list: xem danh sách người dùng bị cấm
   {pn} status [<uid> | @tag | reply tin nhắn]: kiểm tra trạng thái của người dùng`,
			en: `
   {pn} [find | -f | search | -s] <name>: search for users by name
   {pn} [ban | -b] [<uid> | @tag | reply message] <reason>: ban a user
   {pn} unban [<uid> | @tag | reply message]: unban a user
   {pn} warn [<uid> | @tag | reply message] <reason>: warn a user (3 warnings = ban)
   {pn} list: view list of banned users
   {pn} status [<uid> | @tag | reply message]: check a user's status`
		}
	},

	langs: {
		vi: {
			noUserFound: "❌ Không tìm thấy người dùng nào có tên khớp với từ khóa: \"%1\" trong dữ liệu của bot",
			userFound: "🔎 Tìm thấy %1 người dùng:\n%2",
			uidRequired: "❌ UID của người dùng không được để trống",
			reasonRequired: "❌ Lý do không được để trống",
			userHasBanned: "⚠️ Người dùng [%1 | %2] đã bị cấm:\n» Lý do: %3\n» Ngày: %4",
			userBanned: "✅ Đã cấm người dùng [%1 | %2]:\n» Lý do: %3\n» Ngày: %4",
			userNotBanned: "🟢 Người dùng [%1 | %2] không bị cấm",
			userUnbanned: "✅ Đã bỏ cấm người dùng [%1 | %2]",
			listBannedUsers: "🚫 Danh sách người dùng bị cấm:\n%1",
			noBannedUsers: "✅ Hiện tại không có người dùng bị cấm",
			userStatus: "👤 Trạng thái người dùng [%1 | %2]:\n» Cấm: %3\n» Lý do: %4\n» Ngày: %5",
			userWarned: "⚠️ Đã cảnh báo người dùng [%1 | %2]. Tổng số cảnh báo: %3",
			userMaxWarn: "⚠️ Người dùng [%1 | %2] đã đạt 3 cảnh báo và bị cấm:\n» Lý do: Cảnh cáo tối đa\n» Ngày: %3"
		},
		en: {
			noUserFound: "❌ No user found matching the keyword: \"%1\"",
			userFound: "🔎 Found %1 user(s):\n%2",
			uidRequired: "❌ UID of the user cannot be empty",
			reasonRequired: "❌ Reason cannot be empty",
			userHasBanned: "⚠️ User [%1 | %2] is already banned:\n» Reason: %3\n» Date: %4",
			userBanned: "✅ User [%1 | %2] has been banned:\n» Reason: %3\n» Date: %4",
			userNotBanned: "🟢 User [%1 | %2] is not banned",
			userUnbanned: "✅ User [%1 | %2] has been unbanned",
			listBannedUsers: "🚫 List of banned users:\n%1",
			noBannedUsers: "✅ There are no banned users",
			userStatus: "👤 User Status [%1 | %2]:\n» Banned: %3\n» Reason: %4\n» Date: %5",
			userWarned: "⚠️ User [%1 | %2] has been warned. Total warnings: %3",
			userMaxWarn: "⚠️ User [%1 | %2] reached 3 warnings and was banned:\n» Reason: Max warnings\n» Date: %3"
		}
	},

	onStart: async function ({ args, usersData, message, event, prefix, getLang }) {
		const type = args[0];
		switch (type) {
			case "find":
			case "-f":
			case "search":
			case "-s": {
				const allUser = await usersData.getAll();
				const keyWord = args.slice(1).join(" ");
				const result = allUser.filter(item => (item.name || "").toLowerCase().includes(keyWord.toLowerCase()));
				const msg = result.reduce((i, user) => i += `\n╭ Name: ${user.name}\n╰ ID: ${user.userID}`, "");
				message.reply(result.length === 0 ? getLang("noUserFound", keyWord) : getLang("userFound", result.length, msg));
				break;
			}

			case "ban":
			case "-b": {
				let uid, reason;
				if (event.type === "message_reply") {
					uid = event.messageReply.senderID;
					reason = args.slice(1).join(" ");
				} else if (Object.keys(event.mentions).length > 0) {
					uid = Object.keys(event.mentions)[0];
					reason = args.slice(1).join(" ").replace(event.mentions[uid], "").trim();
				} else if (args[1]) {
					uid = args[1];
					reason = args.slice(2).join(" ");
				} else return message.SyntaxError();

				if (!uid) return message.reply(getLang("uidRequired"));
				if (!reason) return message.reply(getLang("reasonRequired"));

				const userData = await usersData.get(uid);
				if (userData?.banned?.status)
					return message.reply(getLang("userHasBanned", uid, userData.name, userData.banned.reason, userData.banned.date));
				
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				await usersData.set(uid, {
					banned: {
						status: true,
						reason,
						date: time,
					}
				});
				message.reply(getLang("userBanned", uid, userData?.name || "Unknown", reason, time));
				break;
			}

			case "unban":
			case "-u": {
				let uid;
				if (event.type === "message_reply") {
					uid = event.messageReply.senderID;
				} else if (Object.keys(event.mentions).length > 0) {
					uid = Object.keys(event.mentions)[0];
				} else if (args[1]) {
					uid = args[1];
				} else return message.SyntaxError();

				if (!uid) return message.reply(getLang("uidRequired"));

				const userData = await usersData.get(uid);
				if (!userData?.banned?.status)
					return message.reply(getLang("userNotBanned", uid, userData?.name || "Unknown"));

				await usersData.set(uid, { banned: {} });
				message.reply(getLang("userUnbanned", uid, userData?.name || "Unknown"));
				break;
			}

			case "list": {
				const allUsers = await usersData.getAll();
				const bannedUsers = allUsers.filter(user => user?.banned?.status);
				if (bannedUsers.length === 0) return message.reply(getLang("noBannedUsers"));

				const list = bannedUsers.map(user => `╭ Name: ${user.name}\n╰ ID: ${user.userID}\n» Reason: ${user.banned.reason}\n» Date: ${user.banned.date}`).join("\n\n");
				message.reply(getLang("listBannedUsers", list));
				break;
			}

			case "status": {
				let uid;
				if (event.type === "message_reply") {
					uid = event.messageReply.senderID;
				} else if (Object.keys(event.mentions).length > 0) {
					uid = Object.keys(event.mentions)[0];
				} else if (args[1]) {
					uid = args[1];
				} else return message.SyntaxError();

				if (!uid) return message.reply(getLang("uidRequired"));

				const userData = await usersData.get(uid);
				const status = userData?.banned?.status ? "Yes" : "No";
				const reason = userData?.banned?.reason || "N/A";
				const date = userData?.banned?.date || "N/A";

				message.reply(getLang("userStatus", uid, userData?.name || "Unknown", status, reason, date));
				break;
			}

			case "warn": {
				let uid, reason = args.slice(1).join(" ") || "Empty reason";
				if (event.type === "message_reply") {
					uid = event.messageReply.senderID;
				} else if (Object.keys(event.mentions).length > 0) {
					uid = Object.keys(event.mentions)[0];
				} else if (args[1]) {
					uid = args[1];
				} else return message.SyntaxError();

				if (!uid) return message.reply(getLang("uidRequired"));

				const userData = await usersData.get(uid);
				let warnings = userData?.warnings || 0;

				warnings++;
				if (warnings >= 3) {
					const time = getTime("DD/MM/YYYY HH:mm:ss");
					await usersData.set(uid, {
						banned: {
							status: true,
							reason: "Max warnings",
							date: time,
						},
						warnings: 0
					});
					return message.reply(getLang("userMaxWarn", uid, userData?.name || "Unknown", time));
				}

				await usersData.set(uid, { warnings });
				message.reply(getLang("userWarned", uid, userData?.name || "Unknown", warnings));
				break;
			}

			default: {
				message.reply(getLang("SyntaxError"));
			}
		}
	}
};
