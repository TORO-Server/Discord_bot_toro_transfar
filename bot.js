
const { Client, Intents, MessageEmbed, MessageAttachment } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

var request = require('request');

const Config = require("./Config.json");

client.login(Config.TOKEN);

client.on('ready', () => {
  const data = [{
    name: "map",
    description: "サーバーの路線検索",
    options: [{
      type: "STRING",
      name: "from",
      description: "出発地点",
      required: true
    },
    {
      type: "STRING",
      name: "to",
      description: "到着地点",
      required: true
    }]
  }];
  client.application.commands.set(data, Config.ServerID);
  console.log(`login!!(${client.user.tag})`);
});

client.on("interactionCreate", interaction => {
  if (!interaction.isCommand()) { return; }
  if (interaction.commandName === `map`) {
    const from = interaction.options.getString(`from`);
    const to = interaction.options.getString(`to`);

    if (from == to) {//エラー
      const embed = new MessageEmbed()
        .setColor('#ff00ff')
        .setTitle("エラー")
        .setDescription("出発地点と到着地点を同じ場所にはできません")
      interaction.reply({ embeds: [embed] });
      return;
    }

    let to_parameter = "";
    if (to != null) {
      to_parameter = `&to=${encodeURI(to)}`;
    }
    interaction.deferReply();

    let options = {
      url: `${Config.API_URL}?from=${encodeURI(from)}${to_parameter}`,
      method: 'GET'
    }
    request(options, function (error, response, body) {
      let data = JSON.parse(body);
      if (data.type == "AllData") {//エラーじゃない

        const embed = new MessageEmbed()
          .setColor('#ffffff')
          .setTitle(`${from}から行けるすべてのルートを表示します`)
        interaction.editReply({ embeds: [embed] });

      } else if (data.type == "ToData") {//エラーじゃない

        let stations = `${data.main[0][0]}`;
        let lines = `${data.main[0][1]}から乗車`;
        let search = data.main[0][1];
        for (let loop = 1; loop < data.main.length; loop++) {
          if (search == data.main[loop][1]) {
            stations = `${stations}\n${data.main[loop][0]}`
            search = data.main[loop][1];
            if (loop == data.main.length - 1) {
              lines = `${lines}\n到着`
            } else {
              lines = `${lines}\n|`
            }
          } else {
            stations = `${stations}\n${data.main[loop][0]}`
            search = data.main[loop][1];
            lines = `${lines}\n${data.main[loop][1]}に乗り換え`
          }
        }
        const embed = new MessageEmbed()
          .setColor('#ff8c00')
          .setDescription(`${from}から${to}まで行くルートを表示します\n移動ブロック数:${data.length}`)
          .setTitle(`乗り換え案内`)
          .addFields(
            { name: `駅名`, value: `${stations}`, inline: true },
            { name: `路線`, value: `${lines}`, inline: true },
            { name: `\u200B`, value: `\u200B`, inline: true }
          )
        interaction.editReply({ embeds: [embed] });

      } else if (data.type == "NothingToData") {//エラー
        const embed = new MessageEmbed()
          .setColor('#ff00ff')
          .setTitle("エラー")
          .setDescription("到着地点の場所がない またはその場所へ行くルートが登録されていません")
        interaction.editReply({ embeds: [embed] });
      } else if (data.type == "NothingFromData") {//エラー
        const embed = new MessageEmbed()
          .setColor('#ff00ff')
          .setTitle("エラー")
          .setDescription("出発地点の場所がない またはその場所が登録されていません")
        interaction.editReply({ embeds: [embed] });
      } else {//エラー
        const embed = new MessageEmbed()
          .setColor('#ff00ff')
          .setTitle("エラー")
          .setDescription(data.type)
        interaction.editReply({ embeds: [embed] });
      }
      console.log(data);
    })
  }
})