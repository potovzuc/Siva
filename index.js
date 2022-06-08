const discord = require("discord.js");//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
const client = new discord.Client({ disableEveryone: true, disabledEvents: ["TYPING_START"] });//EMİRHANSARAÇ/CODARE
const { readdirSync } = require("fs");//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
const { join } = require("path");//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
const { TOKEN, PREFIX } = require("./config.json");//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
const db = require("quick.db")//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
client.login(TOKEN);//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
client.commands = new discord.Collection();//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
client.prefix = PREFIX;//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
client.queue = new Map();//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
client.dispatcher;//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE

client.on("ready", () => {//EMİRHANSARAÇ/CODARE
	console.log(`${client.user.username} ready!`);//EMİRHANSARAÇ/CODARE
   const link = "https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot&permissions=8";//EMİRHANSARAÇ/CODARE

   console.log(`Davet : [${link}]!!`)
});//EMİRHANSARAÇ/CODARE
//EMİRHANSARAÇ/CODARE

client.on("warn", info => console.log(info));//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
client.on("error", console.error);
//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE


const commandFiles = readdirSync(join(__dirname, "commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

const talkedRecently = new Set();
client.on("message", async message => {
  
  if (message.author.bot) return;
  if (!message.guild) return;
//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
if (message.content.startsWith(PREFIX)) {
    const args = message.content
      .slice(PREFIX.length)//EMİRHANSARAÇ/CODARE//EMİRHANSARAÇ/CODARE
      .trim()
      .split(/ +/);
    const command = args.shift().toLowerCase();//EMİRHANSARAÇ/CODARE

    if (!client.commands.has(command)) return;

    try {
      if (talkedRecently.has(message.author.id)) {//EMİRHANSARAÇ/CODARE
        return message.channel.send("`4.5` Saniye de Bir Komut Kullanabilirsin");
      } else {
        talkedRecently.add(message.author.id);//EMİRHANSARAÇ/CODARE
        setTimeout(() => {
          talkedRecently.delete(message.author.id);
        }, 4500);//EMİRHANSARAÇ///EMİRHANSARAÇ/CODARE
      }
      client.commands.get(command).execute(message, args);
    } catch (error) {//EMİRHANSARAÇ/CODARE
      console.error(error);
      message.reply("Bu komut yürütülürken bir hata oluştu.").catch(console.error);
    }
  }
});
//EMİRHANSARAÇ/CODARE
const dc = require("discord.jsv2");
const dcc = new dc.Client();
//EMİRHANSARAÇ/CODARE

client.ayar = db;
client.config = require("./config.js");
client.ayarlar = require("./config.js")
//EMİRHANSARAÇ/CODARE

dcc.ayar = db;
dcc.config = require("./config.js");
dcc.ayarlar = require("./config.js")
//EMİRHANSARAÇ/CODARE


require("./modules/functions.js")(dcc);
//EMİRHANSARAÇ/CODARE

client.on("ready", async () => {
  client.appInfo = await client.fetchApplication();
  dcc.appInfo = await client.fetchApplication();
  setInterval( async () => {
    client.appInfo = await client.fetchApplication();
    dcc.appInfo = await client.fetchApplication();
  }, 60000);
  require("./modules/dashboard.js")(dcc, client);
});
//EMİRHANSARAÇ/CODARE

dcc.login(TOKEN);