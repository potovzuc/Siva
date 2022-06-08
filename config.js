const config = {
  "ownerID": "692790523424931932",//Bu kısıma, kendi ID'niz. 
  "sahip": ["692790523424931932"],
  "admins": [""],//Yetkili eklemek isterseniz, o kişinin ID'si.
  "support": [""],//Destek ekibi eklemek isterseniz, o kişinin ID'si.
  "token": "",//Botun, tokeni.
  "dashboard" : {
    "oauthSecret": "",//Client secret.
    "callbackURL": `https://v12muzik.glitch.me/callback`,//oAuth2 kısmında bulunan kutucuğa, bu bağlantıyı ekleyiniz.
    "sessionSecret": "Codare",//Bu kısımı, değiştirmeyiniz.
    "domain": "https://v12muzik.glitch.me"//Sitenin, adresi.
  }
};

module.exports = config;