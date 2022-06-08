  const { Util } = require("discord.js");
const { play } = require("../include/play");
const { YOUTUBE_API_KEY } = require("../config.json");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
  name: "çal",
  description: "YouTube'dan ses çalar",
  async execute(message, args) {
    const { channel } = message.member.voice;

    if (!args.length) return message.reply("Kullanım: !çal <YouTube URL'si | Video Adı>").catch(console.error);
    if (!channel) return message.reply("Önce bir ses kanalına katılmanız gerekiyor!").catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply("Ses kanalına bağlanamıyor, Bağlan izini eksik");
    if (!permissions.has("SPEAK"))
      return message.reply("Bu ses kanalında konuşamıyorum, uygun izinlere sahip olduğumdan emin olun!");

    const search = args.join(" ");
    const videoPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const playlistPattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    const serverQueue = message.client.queue.get(message.guild.id);
    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.title,
          url: songInfo.video_url,
          duration: songInfo.length_seconds
        };
      } catch (error) {
        if (error.message.includes("copyright")) {
          return message
            .reply("⛔ Bu Video, telif hakkı koruması nedeniyle oynatılamadı ⛔")
            .catch(console.error);
        } else {
          console.error(error);
        }
      }
    } else {
      try {
        const results = await youtube.searchVideos(search, 1);
        songInfo = await ytdl.getInfo(results[0].url);
        song = {
          title: songInfo.title,
          url: songInfo.video_url,
          duration: songInfo.length_seconds
        };
      } catch (error) {
        console.error(error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
          .send(`${message.author} tarafından **${song.title}** kuyruğa eklendi`)
        .catch(console.error);
    } else {
      queueConstruct.songs.push(song);
    }

    if (!serverQueue) message.client.queue.set(message.guild.id, queueConstruct);

    if (!serverQueue) {
      try {
        queueConstruct.connection = await channel.join();
        play(queueConstruct.songs[0], message);
      } catch (error) {
        console.error(`Ses Kanala katılamadım: ${error}`);
        message.client.queue.delete(message.guild.id);
        await channel.leave();
        return message.channel.send(`Kanala katılamadım: ${error}`).catch(console.error);
      }
    }
  }
};
