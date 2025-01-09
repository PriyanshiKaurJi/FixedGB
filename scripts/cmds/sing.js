const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const SPOTIFY_CLIENT_ID = "41dd52e608ee4c4ba8b196b943db9f73";
const SPOTIFY_CLIENT_SECRET = "5c7b438712b04d0a9fe2eaae6072fa16";

module.exports = {
  config: {
    name: "spotify",
    aliases: ["sing"],
    version: "2.2.0",
    author: "Priyanshi Kaur",
    role: 0,
    countDown: 5,
    shortDescription: {
      en: "Search for songs or artists on Spotify"
    },
    longDescription: {
      en: "Search and download songs or find artist information using Spotify API."
    },
    category: "music",
    guide: {
      en: "{pn} trackName\n{pn} trackLink\n{pn} artist ArtistName"
    }
  },

  getSpotifyToken: async function () {
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials"
      }).toString(),
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
    if (tracks.length === 0) throw new Error("Track not found. Try a different name.");
    return tracks[0];
  },

  searchSpotifyArtist: async function (artistName, token) {
    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: artistName, type: "artist", limit: 1 }
    });
    const artists = searchRes.data.artists.items;
    if (artists.length === 0) throw new Error("Artist not found.");
    return artists[0];
  },

  onStart: async function ({ api, event, args }) {
    try {
      if (args.length === 0) {
        return api.sendMessage("Please provide a track name, link, or artist name.", event.threadID, event.messageID);
      }

      const spotifyToken = await this.getSpotifyToken();

      if (args[0].toLowerCase() === "artist") {
        const artistName = args.slice(1).join(" ").trim();
        if (!artistName) return api.sendMessage("Please provide an artist name.", event.threadID, event.messageID);

        const artist = await this.searchSpotifyArtist(artistName, spotifyToken);
        const artistInfo = `
🎤 Artist: ${artist.name}
👥 Followers: ${artist.followers.total.toLocaleString()}
🎵 Genres: ${artist.genres.join(", ") || "N/A"}
🔥 Popularity: ${artist.popularity}%
🔗 Spotify URL: ${artist.external_urls.spotify}
        `.trim();

        if (artist.images && artist.images.length > 0) {
          const imageResponse = await axios.get(artist.images[0].url, { responseType: "arraybuffer" });
          const imagePath = path.join(__dirname, "cache", `${artist.id}.jpg`);
          await fs.outputFile(imagePath, imageResponse.data);

          await api.sendMessage(
            {
              attachment: fs.createReadStream(imagePath),
              body: artistInfo
            },
            event.threadID,
            event.messageID
          );

          await fs.remove(imagePath);
        } else {
          await api.sendMessage(artistInfo, event.threadID, event.messageID);
        }

        return;
      }

      // Handling Track by Name or Link
      const trackQuery = args.join(" ").trim();
      const track = trackQuery.startsWith("https://")
        ? { external_urls: { spotify: trackQuery } } // Direct link, use as is
        : await this.searchSpotifyTrack(trackQuery, spotifyToken); // Search Spotify API

      const downloadApiUrl = `https://kaiz-apis.gleeze.com/api/spotifydl?url=${encodeURIComponent(track.external_urls.spotify)}`;
      const response = await axios.get(downloadApiUrl);
      const songData = response.data;

      const musicPath = path.join(__dirname, "cache", `${Date.now()}-${songData.title}.mp3`);
      const musicStream = await axios({
        url: songData.url,
        method: "GET",
        responseType: "stream"
      });

      musicStream.data.pipe(fs.createWriteStream(musicPath)).on("finish", async () => {
        await api.sendMessage(
          {
            attachment: fs.createReadStream(musicPath),
            body: `🎵 Title: ${songData.title}\n👤 Artist: ${songData.artist}\n🔗 Spotify URL: ${track.external_urls.spotify}`
          },
          event.threadID,
          event.messageID
        );

        await fs.remove(musicPath); // Clean up the file after sending
      });
    } catch (error) {
      console.error(error);
      api.sendMessage(`An error occurred: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
