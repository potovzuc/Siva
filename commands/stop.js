module.exports = {
  name: "dur",
  description: "Müziği durdurursunuz.",
  execute(message) {
    const serverQueue = message.client.queue.get(message.guild.id);

    if (!message.member.voice)
      return message.reply("Önce bir ses kanalına katılmanız gerekiyor!").catch(console.error);
    if (!serverQueue) return message.reply("Şuan çalan bir müzik bulunmamakta.").catch(console.error);

    serverQueue.songs = [];
    serverQueue.connection.end();
  serverQueue.connection.disconnect() //durdurunca kanaldan çıkmasını istiyorsannız kullanabilirsiniz
    serverQueue.textChannel.send(`${message.author} ⏹ Müziği durdurdu!`).catch(console.error);
  }
};
