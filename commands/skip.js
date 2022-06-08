module.exports = {
  name: "geç",
  description: "Çalmakta olan şarkıyı atlar",
  async execute(message) {
    const serverQueue = message.client.queue.get(message.guild.id);

    if (!message.member.voice.channel)
      return message.reply("Önce bir ses kanalına katılmanız gerekiyor!").catch(console.error);
    if (!serverQueue)
      return message.channel.send("Şarkı atlayamazsın çünkü müzik çalmıyor.").catch(console.error);

    serverQueue.connection.dispatcher.pause("Geç komutu kullanıldı!");
    serverQueue.textChannel.send(`${message.author} ⏭ Başarıyla müziği atlattı.`).catch(console.error);
  }
};
