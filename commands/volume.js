module.exports = {
  name: "ses",
  description: "Çalan müziğin ses seviyesini ayarlarsınız.",
  execute(message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);

    if (!message.member.voice.channel)
      return message.reply("Önce bir ses kanalına katılmanız gerekiyor!").catch(console.error);
    if (!serverQueue) return message.reply("Şuan çalan bir müzik bulunmamakta.").catch(console.error);
//EMİRHANSARAÇ/CODARE
    if (!args[0])
      return message.reply(`🔊 Şuanki Ses Seviyesi: **%${serverQueue.volume}**`).catch(console.error);
    if (isNaN(args[0])) return message.reply("Ses seviyesini ayarlamak için lütfen bir sayı kullanın.").catch(console.error);
    if (parseInt(args[0]) > 100 || parseInt(args[0]) < 0)
      return message.reply("0-100 Arasında Bir Sayı Söyleyiniz.").catch(console.error);

    serverQueue.volume = args[0];
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);

    return serverQueue.textChannel.send(`Ses Seviyesi **%${args[0]}** Olarak Ayarlandı`).catch(console.error);
  }
};
