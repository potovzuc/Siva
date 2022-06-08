module.exports = {
  name: "kuyruk",
  description: "Müzik sırasını gösterir ve şimdi çalınan müziği gösterir.",
  execute(message) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return message.reply("Şuan çalan bir müzik bulunmamakta.").catch(console.error);
    return message
      .reply(
        `📃 **Şarkı sırası**

${serverQueue.songs.map((song, index) => index + 1 + ". " + song.title).join("\n")}

Şimdi oynuyor: **${serverQueue.songs[0].title}**
		`,
        { split: true }
      )
      .catch(console.error);
  }
};
//EMİRHANSARAÇ/CODARE