const { play } = require("../include/play");
const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE } = require("../config.json");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
  name: "playlist",
  description: "Youtube'dan bir oynatma listesi oynatın",
  async execute(message, args) {
    const { channel } = message.member.voice;
//EMİRHANSARAÇ/CODARE
    if (!args.length)
      return message.reply("Kullanım: /playlist <YouTube Oynatma Listesi URL'si | Oynatma Listesi Adı>").catch(console.error);
    if (!channel) return message.reply("Önce bir ses kanalına katılmanız gerekiyor!").catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply("Ses kanalına bağlanamıyor, Bağlan izini eksik");
    if (!permissions.has("SPEAK"))
      return message.reply("Bu ses kanalında konuşamıyorum, uygun izinlere sahip olduğumdan emin olun!");

    const search = args.join(" ");
    const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = pattern.test(args[0]);

    const serverQueue = message.client.queue.get(message.guild.id);
    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };//EMİRHANSARAÇ/CODARE

    let song = null;
    let playlist = null;
    let videos = [];

    if (urlValid) {
      try {
        playlist = await youtube.getPlaylist(url, { part: "snippet" });
        videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const results = await youtube.searchPlaylists(search, 1, { part: "snippet" });
        playlist = results[0];
        videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
      } catch (error) {
        console.error(error);
      }
    }//EMİRHANSARAÇ/CODARE

    videos.forEach(video => {
      song = {
        title: video.title,
        url: video.url,
        duration: video.durationSeconds
      };

      if (serverQueue) {
        serverQueue.songs.push(song);
        message.channel
          .send(`${message.author} tarafından **${song.title}** kuyruğa eklendi`)
          .catch(console.error);
      } else {
        queueConstruct.songs.push(song);
      }
    });

    message.channel
      .send(
        `${message.author} 📃 Playlist ekledi - **${playlist.title}** <${playlist.url}>

${queueConstruct.songs.map((song, index) => index + 1 + ". " + song.title).join("\n")}
    `,
        { split: true }
      )
      .catch(console.error);
//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
    if (!serverQueue) message.client.queue.set(message.guild.id, queueConstruct);

    if (!serverQueue) {
      try {
        const connection = await channel.join();
        queueConstruct.connection = connection;
        play(queueConstruct.songs[0], message);
      } catch (error) {
        console.error(`Ses kanalına katılamadım: ${error}`);
        message.client.queue.delete(message.guild.id);
        await channel.leave();
        return message.channel.send(`Kanala katılamadım: ${error}`).catch(console.error);
      }
    }
  }
};
