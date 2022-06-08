const url = require("url");
const path = require("path");

const Discord = require("discord.jsv2");
const dsc = require("discord.js");

const express = require("express");
const app = express();
const moment = require("moment");
require("moment-duration-format");

const passport = require("passport");
const db = require('quick.db')
const session = require("express-session");
const LevelStore = require("level-session-store")(session);
const Strategy = require("passport-discord").Strategy;
const btoa = require('btoa');

const helmet = require("helmet");

const superfetch = require('node-fetch');

const md = require("marked");

module.exports = (client, v2) => {

  const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`);

  const templateDir = path.resolve(`${dataDir}${path.sep}templates`);
  
  app.use("/public", express.static(path.resolve(`${dataDir}${path.sep}public`)));

  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  passport.use(new Strategy({
    clientID: client.user.id,
    clientSecret: client.config.dashboard.oauthSecret,
    callbackURL: client.config.dashboard.callbackURL,
    scope: ["identify", "guilds", "guilds.join"]
  },
  (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
  }));

  app.use(session({
    secret: client.config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false,
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(helmet());

  app.locals.domain = client.config.dashboard.domain;
  
  app.engine("html", require("ejs").renderFile);
  app.set("view engine", "html");

  var bodyParser = require("body-parser");
  app.use(bodyParser.json());       
  app.use(bodyParser.urlencoded({   
    extended: true
  })); 

  function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.session.backURL = req.url;
    res.redirect("/");
  }
  
  const renderTemplate = (res, req, template, data = {}) => {
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
    
  };

  app.get("/login", (req, res, next) => {
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL;
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === app.locals.domain) {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    next();
  },
  passport.authenticate("discord"));

  app.get("/callback", passport.authenticate("discord", { failureRedirect: "/autherror" }), async (req, res) => {
    if (req.user.id === client.config.ownerID) {
      req.session.isAdmin = true;
    } else {
      req.session.isAdmin = false;
    }
    if (req.session.backURL) {
      const url = req.session.backURL;
      req.session.backURL = null;
      res.redirect(url);
    } else {
      res.redirect("/");
    }
    
  });
//BU ALTYAPI SATILAMAZ 
  app.get("/autherror", (req, res) => {
    renderTemplate(res, req, "autherror.ejs");
    
    client.channels.get("498131796870037514").send("Web Panelinde bağlantı hatası oluştu! Kişi giriş yapamıyor tekrar denemeli! Büyük bir sorun değil.")
  });

  app.get("/logout", function(req, res) {
    req.session.destroy(() => {
      req.logout();
      res.redirect("/");
    });
    
  });
//BU ALTYAPI SATILAMAZ 

 app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs");
    
  });
//BU ALTYAPI SATILAMAZ 

  app.get("/commands", (req, res) => {
    renderTemplate(res, req, "commands.ejs", {md});
  });
  //BU ALTYAPI SATILAMAZ 

  app.get("/stats", (req, res) => {
    const duration = moment.duration(client.uptime).format(" D [gün], H [saat], m [dakika], s [saniye]");
    const members = client.guilds.reduce((p, c) => p + c.memberCount, 0);
    const channels = client.channels.size;
    const guilds = client.guilds.size;
    renderTemplate(res, req, "stats.ejs", {
      stats: {
        version: client.ayarlar.versiyon,
        servers: guilds,
        members: members,
        channels: channels,
        uptime: duration,
        memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        dVersion: Discord.version,
        nVersion: process.version
      }
    });
  });

  app.get("/dashboard", checkAuth, (req, res) => {
    const perms = Discord.EvaluatedPermissions;
    renderTemplate(res, req, "dashboard.ejs", {perms});
  });
  //BU ALTYAPI SATILAMAZ 

  app.get("/admin", checkAuth, (req, res) => {
    if (!req.session.isAdmin) return res.redirect("/");
    renderTemplate(res, req, "admin.ejs");
  });
//BU ALTYAPI SATILAMAZ 

  app.get("/dashboard/:guildID", checkAuth, (req, res) => {
    res.redirect(`/dashboard/${req.params.guildID}/manage`);
  });

//BU ALTYAPI SATILAMAZ 

  const managementRenderTemp = (res, req, template, data = {}) => {
    const baseData = {
      bot: v2,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
    
  };
  
  app.get("/dashboard/:guildID/manage", checkAuth, (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    if (!guild) return res.status(404);
    const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has("MANAGE_GUILD") : false;
    if (!isManaged && !req.session.isAdmin) res.redirect("/");
    managementRenderTemp(res, req, "guild/manage.ejs", {guild});
  });
  
  app.get("/dashboard/:guildID/manage/gec", checkAuth, (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    let serverQueue = v2.queue.get(guild.id);
    if (!guild) return res.status(404);
    const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has("MANAGE_GUILD") : false;
    if (!isManaged && !req.session.isAdmin) res.redirect("/");
    if (!serverQueue) {}
    
    serverQueue.connection.dispatcher.end();
    serverQueue.textChannel.send(`⏭ Başarıyla müzik atlatıldı.`).catch(console.error);
    
    res.redirect("/dashboard/"+req.params.guildID+"/manage");
  });


  app.post("/dashboard/:guildID/manage", checkAuth, async (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    let serverQueue = v2.queue.get(guild.id);
    if (!guild) return res.status(404);
    const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has("MANAGE_GUILD") : false;
    if (!isManaged && !req.session.isAdmin) res.redirect("/");
    let ayar = req.body
    if (ayar === {}) return;
    //if(!serverQueue) return res.redirect("/dashboard/"+req.params.guildID+"/manage");
    
    //-------------LOOP-------------
    if (!ayar['loop']) {
      if(!serverQueue) {}
      if(!serverQueue.loop) {}
      else {
        serverQueue.loop = false
        serverQueue.textChannel.send(`Döngü başarıyla ${serverQueue.loop ? "**açıldı**" : "**kapatıldı**"}.`)
      }
    } else {
      if(!serverQueue) {}
      if(serverQueue.loop) {}
      else {
        serverQueue.loop = true
        serverQueue.textChannel.send(`Döngü başarıyla ${serverQueue.loop ? "**açıldı**" : "**kapatıldı**"}.`)
      }
    }
    
    //-------------DURDUR-------------
    if (!ayar['durdur']) {
      if(!serverQueue) {}
      if(serverQueue.playing) {}
      else {
        serverQueue.playing = true
        serverQueue.connection.dispatcher.resume();
        serverQueue.textChannel.send(`Müzik başarıyla **devam ettirildi**.`)
      }
    } else {
      if(!serverQueue) {}
      if(!serverQueue.playing) {}
      else {
        serverQueue.playing = false
        serverQueue.connection.dispatcher.pause();
        serverQueue.textChannel.send(`Müzik başarıyla **durduruldu**.`)
      }
    }
    
    //-------------KALDİR-------------
    if(ayar['songremove1']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(1, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 1. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 1. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(1, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 1. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove2']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(2, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 2. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 2. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(2, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 2. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove3']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(3, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 3. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 3. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(3, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 3. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove4']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(4, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 4. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 4. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(4, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 4. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove5']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(5, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 5. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 5. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(5, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 5. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove6']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(6, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 6. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 6. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(6, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 6. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove7']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(7, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 7. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 7. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(7, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 7. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove8']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(8, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 8. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 8. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(8, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 8. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove9']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(9, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 9. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 9. Kuyruğundan Kaldırıldı.`));
     } catch (err) {
        serverQueue.songs.splice(9, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 9. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songremove10']) {
      if(!serverQueue) {}
      const song = serverQueue.songs.splice(10, 1);
      try {
        serverQueue.textChannel.send(`**${song[0].title}** Adlı Şarkı Listenin 10. Kuyruğundan Kaldırıldı.`).catch(err => serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 10. Kuyruğundan Kaldırıldı.`));
      } catch (err) {
        serverQueue.songs.splice(10, 1);
        serverQueue.textChannel.send(`**İSİMSİZ** Adlı Şarkı Listenin 10. Kuyruğundan Kaldırıldı.`)
      }
    }
    if(ayar['songsremoveall']) {
      if(!serverQueue) {}
      serverQueue.songs = [serverQueue.songs[0]];
      serverQueue.textChannel.send(`Müzik Listesi Temizlendi!`).catch(console.error);
    }
    
    //-------------ŞARKI AÇMA-------------
    if(ayar['sarki']) {
      if(!serverQueue) {}
      const { Util } = require("discord.js");
      const { play } = require("../include/play");
      const { YOUTUBE_API_KEY } = require("../config.json");
      const ytdl = require("ytdl-core");
      const YouTubeAPI = require("simple-youtube-api");
      const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
      let songInfo = null;
      let song = null;
      let search = ayar['sarki'];
    
      const results = await youtube.searchVideos(search, 1);
        songInfo = await ytdl.getInfo(results[0].url);
        song = {
          title: songInfo.title,
          url: songInfo.video_url,
          duration: songInfo.length_seconds
        };
      
      serverQueue.songs.push(song);
      serverQueue.textChannel.send(`**${song.title}** Şarkısı Kuyruğa Eklendi.`).catch(console.error);
      
    }
    //-------------SES-------------
    
    if(ayar['ses']) {
      if(!serverQueue) {}
      let x = ayar['ses'].toString()
      let x2 = serverQueue.volume.toString()
      if(x === x2) return res.redirect("/dashboard/"+req.params.guildID+"/manage");
      let sesseviyesi = ayar['ses']
      serverQueue.volume = sesseviyesi
      serverQueue.connection.dispatcher.setVolumeLogarithmic(sesseviyesi / 100);
      serverQueue.textChannel.send(`Şarkının Ses Seviyesi: **${sesseviyesi}** olarak ayarlandı.`)
    }
    
    
    res.redirect("/dashboard/"+req.params.guildID+"/manage");
  });
  

  app.get("/dashboard/:guildID/members", checkAuth, async (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    if (!guild) return res.status(404);
    renderTemplate(res, req, "guild/members.ejs", {
      guild: guild,
      members: guild.members.array()
    });
  });

  // This JSON endpoint retrieves a partial list of members. This list can
  // be filtered, sorted, and limited to a partial count (for pagination).
  // NOTE: This is the most complex endpoint simply because of this filtering
  // otherwise it would be on the client side and that would be horribly slow.
  app.get("/dashboard/:guildID/members/list", checkAuth, async (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    if (!guild) return res.status(404);
    if (req.query.fetch) {
      await guild.fetchMembers();
    }
    const totals = guild.members.size;
    const start = parseInt(req.query.start, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 50;
    let members = guild.members;
    
    if (req.query.filter && req.query.filter !== "null") {
    
      members = members.filter(m=> {
        m = req.query.filterUser ? m.user : m;
        return m["displayName"].toLowerCase().includes(req.query.filter.toLowerCase());
      });
    }
    
    if (req.query.sortby) {
      members = members.sort((a, b) => a[req.query.sortby] > b[req.query.sortby]);
    }
    const memberArray = members.array().slice(start, start+limit);
    
    const returnObject = [];
    for (let i = 0; i < memberArray.length; i++) {
      const m = memberArray[i];
      returnObject.push({
        id: m.id,
        status: m.user.presence.status,
        bot: m.user.bot,
        username: m.user.username,
        displayName: m.displayName,
        tag: m.user.tag,
        discriminator: m.user.discriminator,
        joinedAt: m.joinedTimestamp,
        createdAt: m.user.createdTimestamp,
        highestRole: {
          hexColor: m.highestRole.hexColor
        },
        memberFor: moment.duration(Date.now() - m.joinedAt).format(" D [gün], H [saat], m [dakika], s [saniye]"),
        roles: m.roles.map(r=>({
          name: r.name,
          id: r.id,
          hexColor: r.hexColor
        }))
      });
    }
    res.json({
      total: totals,
      page: (start/limit)+1,
      pageof: Math.ceil(members.size / limit),
      members: returnObject
    });
  });

  app.get("/dashboard/:guildID/stats", checkAuth, (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    if (!guild) return res.status(404);
    const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has("MANAGE_GUILD") : false;
    if (!isManaged && !req.session.isAdmin) res.redirect("/");
    renderTemplate(res, req, "guild/stats.ejs", {guild});
  });
  
  app.get("/dashboard/:guildID/leave", checkAuth, async (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    if (!guild) return res.status(404);
    const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has("MANAGE_GUILD") : false;
    if (!isManaged && !req.session.isAdmin) res.redirect("/");
    await guild.leave();
    res.redirect("/dashboard");
  });
  
  /* OKU!
  ayar silme kısmı bot.js de client.ayar ı db olarak tanımlamıştık yani quick.db burada db.delete kullandıgımızı varsayın 
  kendi ayarlarınızıda ekleyin*/
  app.get("/dashboard/:guildID/reset", checkAuth, async (req, res) => {
    const guild = client.guilds.get(req.params.guildID);
    if (!guild) return res.status(404);
    const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has("MANAGE_GUILD") : false;
    if (!isManaged && !req.session.isAdmin) res.redirect("/authorize-test");
    
    client.ayar.delete(`reklamengel_${guild.id}`)
    client.ayar.delete(`kufurengel_${guild.id}`)
    client.ayar.delete(`sayacK_${guild.id}`)
    client.ayar.delete(`sayac_${guild.id}`)
    
    res.redirect("/dashboard/"+req.params.guildID);
  });
  
  client.site = app.listen(process.env.PORT);
  
};