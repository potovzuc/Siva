const ytdlDiscord = require("ytdl-core-discord");

module.exports = {
  async play(song, message) {
    const queue = message.client.queue.get(message.guild.id);

    if (!song) {
      queue.channel.leave();
      message.client.queue.delete(message.guild.id);
      return queue.textChannel.send("🚫 Müzik sırası sona erdi.").catch(console.error);
    }

    try {
      var stream = await ytdlDiscord(song.url, { filter: "audioonly", quality: "highestaudio" });
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }

      if (error.message.includes("copyright")) {
        return message.channel
          .send("⛔ Telif hakkı koruması nedeniyle video oynatılamadı ⛔")
          .catch(console.error);
      } else {
        console.error(error);
      }
    }

    const dispatcher = queue.connection
      .play(stream, { type: "opus", passes: 3 })
      .on("end", () => {
        if (queue.loop) {
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          
          module.exports.play(queue.songs[0], message);
        } else {
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", console.error);
    dispatcher.setVolumeLogarithmic(queue.volume / 100);
    message.client.dispatcher = dispatcher

    try {
      var playingMessage = await queue.textChannel.send(`🎶 Oynatılmaya Başlandı: **${song.title}** ${song.url}`);
      await playingMessage.react("⏭");
      await playingMessage.react("⏸");
      await playingMessage.react("▶");
      await playingMessage.react("⏹");
      await playingMessage.react("🔁");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id && user.id == message.author.id;
    const collector = playingMessage.createReactionCollector(filter, { time: 1800000 });

    collector.on("collect", (reaction, user) => {
      if (!queue) return;

      switch (reaction.emoji.name) {
        case "⏭":
          queue.connection.dispatcher.end();
          queue.textChannel.send(`${user} ⏩ şarkıyı atladı`).catch(console.error);
          collector.stop();
          playingMessage.reactions.removeAll();
          break;

        case "⏸":
          if (!queue.playing) break;
          queue.playing = false;
          queue.connection.dispatcher.pause();
          queue.textChannel.send(`${user} ⏸ müziği duraklattı.`).catch(console.error);
          break;

        case "▶":
          if (queue.playing) break;
          queue.playing = true;
          queue.connection.dispatcher.resume();
          queue.textChannel.send(`${user} ▶ müziği devam ettirdi!`).catch(console.error);
          break;

        case "⏹":
          queue.songs = [];
          queue.connection.dispatcher.end();
          queue.textChannel.send(`${user} ⏹ müziği durdurdu!`).catch(console.error);
          collector.stop();
          playingMessage.reactions.removeAll();
          break;
        case "🔁"://EMİRHANSARAÇ/CODARE
          queue.loop = !queue.loop;
          queue.textChannel.send(`${user} 🔁 Döngü Başarıyla ${queue.loop ? "**Aktif**" : "**Devredışı**"} Hale Getirildi!`).catch(console.error);

        default:
          break;
      }
    });
//EMİRHANSARAÇ/CODARE
    collector.on("end", () => {
      playingMessage.reactions.removeAll();
    });
  }
};
