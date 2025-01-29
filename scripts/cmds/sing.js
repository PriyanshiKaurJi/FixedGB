const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");

const SPOTIFY_CLIENT_ID = "41dd52e608ee4c4ba8b196b943db9f73";
const SPOTIFY_CLIENT_SECRET = "5c7b438712b04d0a9fe2eaae6072fa16";

module.exports = {
  config: {
    name: "spotify",
    aliases: ["sing"],
    version: "3.1.0",
    author: "Priyanshi Kaur",
    role: 0,
    countDown: 5,
    shortDescription: { en: "Search and download Spotify & YouTube music" },
    longDescription: {
      en: "Search Spotify and YouTube for tracks or artists, and download songs as MP3."
    },
    category: "music",
    guide: {
      en: "{pn} trackName\n{pn} artist ArtistName\n{pn} yt trackName"
    }
  },

  ensureCacheFolder: async function () {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) await fs.mkdir(cacheDir, { recursive: true });
    return cacheDir;
  },

  getSpotifyToken: async function () {
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    return tokenRes.data.access_token;
  },

  searchSpotifyTrack: async function (trackName, token) {
    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: trackName, type: "track", limit: 1 }
    });
    const tracks = searchRes.data.tracks.items;
    if (!tracks.length) throw new Error("Track not found.");
    return tracks[0];
  },

  searchSpotifyArtist: async function (artistName, token) {
    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: artistName, type: "artist", limit: 1 }
    });
    const artists = searchRes.data.artists.items;
    if (!artists.length) throw new Error("Artist not found.");
    return artists[0];
  },

  downloadFromHungDev: async function (url) {
    const apiKey = "YdXxx4rIT0"; // Replace with your HungDev API key
    const apiUrl = `https://hungdev.id.vn/medias/down-aio?url=${encodeURIComponent(url)}&apikey=${apiKey}`;
    
    const response = await axios.get(apiUrl);
    if (!response.data.success) throw new Error("Failed to download.");
    return response.data.data.medias.find(media => media.extension === "mp4");
  },

  convertMp4ToMp3: async function (mp4Path, mp3Path) {
    return new Promise((resolve, reject) => {
      ffmpeg(mp4Path)
        .toFormat("mp3")
        .on("end", () => resolve(mp3Path))
        .on("error", (err) => reject(err))
        .save(mp3Path);
    });
  },

  searchYouTubeTrack: async function (query) {
    const result = await ytSearch(query);
    if (!result.videos.length) throw new Error("YouTube video not found.");
    return result.videos[0];
  },

  onStart: async function ({ api, event, args }) {
    try {
      if (!args.length) return api.sendMessage("Please provide a song name or artist name.", event.threadID, event.messageID);

      const cacheDir = await this.ensureCacheFolder();
      const spotifyToken = await this.getSpotifyToken();

      // **Handle YouTube Search & Download**
      if (args[0].toLowerCase() === "yt") {
        const searchQuery = args.slice(1).join(" ");
        if (!searchQuery) return api.sendMessage("Please provide a song name for YouTube.", event.threadID, event.messageID);

        const video = await this.searchYouTubeTrack(searchQuery);
        const mp4Data = await this.downloadFromHungDev(video.url);

        if (!mp4Data) return api.sendMessage("Failed to fetch YouTube video.", event.threadID, event.messageID);
        
        const mp4Path = path.join(cacheDir, `${Date.now()}.mp4`);
        const mp3Path = mp4Path.replace(".mp4", ".mp3");

        const downloadStream = await axios({
          url: mp4Data.url,
          method: "GET",
          responseType: "stream"
        });

        downloadStream.data.pipe(fs.createWriteStream(mp4Path)).on("finish", async () => {
          await this.convertMp4ToMp3(mp4Path, mp3Path);
          
          await api.sendMessage(
            {
              attachment: fs.createReadStream(mp3Path),
              body: `🎵 YouTube Song: ${video.title}\n👤 Artist: ${video.author}\n🔗 YouTube Link: ${video.url}`
            },
            event.threadID,
            event.messageID
          );

          await fs.remove(mp4Path);
          await fs.remove(mp3Path);
        });

        return;
      }

      // **Handle Spotify Artist Information**
      if (args[0].toLowerCase() === "artist") {
        const artistName = args.slice(1).join(" ").trim();
        if (!artistName) return api.sendMessage("Please provide an artist name.", event.threadID, event.messageID);

        const artist = await this.searchSpotifyArtist(artistName, spotifyToken);
        const artistInfo = `
🎤 Artist: ${artist.name}
👥 Followers: ${artist.followers.total.toLocaleString()}
🎵 Genres: ${artist.genres.join(", ") || "N/A"}
🔥 Popularity: ${artist.popularity}%
🔗 Spotify URL: ${artist.external_urls.spotify}`.trim();

        return api.sendMessage(artistInfo, event.threadID, event.messageID);
      }

      // **Handle Spotify Track Download**
      const trackQuery = args.join(" ");
      const track = await this.searchSpotifyTrack(trackQuery, spotifyToken);

      const downloadInfo = await this.downloadFromHungDev(track.external_urls.spotify);
      if (!downloadInfo) return api.sendMessage("Spotify track download failed.", event.threadID, event.messageID);

      const mp4Path = path.join(cacheDir, `${Date.now()}.mp4`);
      const mp3Path = mp4Path.replace(".mp4", ".mp3");

      const downloadStream = await axios({
        url: downloadInfo.url,
        method: "GET",
        responseType: "stream"
      });

      downloadStream.data.pipe(fs.createWriteStream(mp4Path)).on("finish", async () => {
        await this.convertMp4ToMp3(mp4Path, mp3Path);

        await api.sendMessage(
          {
            attachment: fs.createReadStream(mp3Path),
            body: `🎵 Spotify Song: ${track.name}\n👤 Artist: ${track.artists.map(a => a.name).join(", ")}\n🔗 Spotify Link: ${track.external_urls.spotify}`
          },
          event.threadID,
          event.messageID
        );

        await fs.remove(mp4Path);
        await fs.remove(mp3Path);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};