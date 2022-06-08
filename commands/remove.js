module.exports = {
  name: "kaldır",
  description: "Şarkıyı kuyruktan kaldırır.",
  async execute(message, args) {
    if (!args.length) return message.reply("Kullanım: !kaldır <Sıra Numarası>");
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return message.channel.send("Sıra yok.").catch(console.error);

    const song = serverQueue.songs.splice(args[0] - 1, 1);
    serverQueue.textChannel.send(`${message.author} Tarafından **${song[0].videoDetails.title}** Kuyruktan Kaldırıldı.`);
  }
};
