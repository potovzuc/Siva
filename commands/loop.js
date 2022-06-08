module.exports = {
  name: "loop",
  description: "Müzik tekrarını açıp kapatmanızı sağlar.",
  async execute(message) {
    const sira = message.client.queue.get(message.guild.id);
    if (!sira) return message.reply("Şuan çalan bir müzik bulunmamakta.").catch(console.error);

    sira.loop = !sira.loop;
    return sira.textChannel.send(`Döngü başarıyla ${sira.loop ? "**açıldı**" : "**kapatıldı**"}.`)
    .catch(console.error);
  }
};
//EMİRHANSARAÇ/CODARE