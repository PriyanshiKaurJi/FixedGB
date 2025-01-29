const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const SPOTIFY_CLIENT_ID = "41dd52e608ee4c4ba8b196b943db9f73";
const SPOTIFY_CLIENT_SECRET = "5c7b438712b04d0a9fe2eaae6072fa16";
const HUNGDEV_API_KEY = "YdXxx4rIT0";

module.exports = {
  config: {
    name: "spotify",
    aliases: ["sing"],
    version: "3.2.0",
    author: "Priyanshi Kaur",
    role: 0,
    countDown: 5,
    shortDescription: { en: "Search and download Spotify music" },
    longDescription: {
      en: "Search for songs using Spotify and download them directly as MP3."
    },
    category: "music",
    guide: {
      en: "{pn} trackName\n{pn} artist ArtistName"
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
    const apiUrl = `https://hungdev.id.vn/medias/down-aio?url=${encodeURIComponent(url)}&apikey=${HUNGDEV_API_KEY}`;
    
    const response = await axios.get(apiUrl);
    if (!response.data.success) throw new Error("Failed to download.");
    return response.data.data.medias.find(media => media.extension === "mp3");
  },

  onStart: async function ({ api, event, args }) {
    try {
      if (!args.length) return api.sendMessage("Please provide a song name or artist name.", event.threadID, event.messageID);

      const cacheDir = await this.ensureCacheFolder();
      const spotifyToken = await this.getSpotifyToken();

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

      // Stream and send the MP3 file
      const filePath = path.join(cacheDir, `${Date.now()}.mp3`);
      const downloadStream = await axios({
        url: downloadInfo.url,
        method: "GET",
        responseType: "stream"
      });

      downloadStream.data.pipe(fs.createWriteStream(filePath)).on("finish", async () => {
        await api.sendMessage(
          {
            attachment: fs.createReadStream(filePath),
            body: `🎵 Spotify Song: ${track.name}\n👤 Artist: ${track.artists.map(a => a.name).join(", ")}\n🔗 Spotify Link: ${track.external_urls.spotify}`
          },
          event.threadID,
          event.messageID
        );

        await fs.remove(filePath);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};