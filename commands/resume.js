module.exports = {
  name: "devam",
  description: "Müziği çalmaya devam ettirir.",
  execute(message) {
    const serverQueue = message.client.queue.get(message.guild.id);

    if (!message.member.voice.channel)
      return message.reply("Önce bir ses kanalına katılmanız gerekiyor!").catch(console.error);

    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      return serverQueue.textChannel.send(`${message.author} ▶ Başarıyla müziği devam ettirdi!`).catch(console.error);
    }
    return message.reply("Şuan çalan bir müzik bulunmamakta.").catch(console.error);
  }
};
