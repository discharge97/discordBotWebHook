const {Client, WebhookClient} = require('discord.js');
const fs = require('fs');
const http = require('http');

const client = new Client({
    partials: ['MESSAGE', 'REACTION']
});

let config = {
    webhookChannelID: "",
    webhookChannelToken: "",
    prefix: "!",
    botToken: "TOKEN",
    server: {
        port: 8888
    }
}

const server = http.createServer(function (request, response) {
    if (request.method === 'POST') {
        let body = '';
        request.on('github', function (data) {
            body += data;
        });
        request.on('end', function () {
            try {
                const post = JSON.parse(body);
                console.log(post);
                if (post?.object_kind === 'push') {
                    const msg = exampleEmbed;
                    const commit = post?.commits?.slice(-1);
                    msg.author.name = post?.user_username;
                    msg.author.icon_url = post?.user_avatar;
                    msg.author.url = post?.repository?.homepage;
                    msg.title = post?.title;
                    msg.description = post?.message;
                    msg.url = post?.url;
                    msg.fields[0].value = commit?.added.join("\n");
                    msg.fields[1].value = commit?.modified.join("\n");
                    msg.fields[2].value = commit?.removed.join("\n");
                    msg.timestamp = new Date(commit?.timestamp).toLocaleString();
                    msg.footer.text = commit?.id;
                    msg.footer.icon_url = post?.user_avatar;
                    webhookClient.send({embeds: [exampleEmbed]});
                }
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.end();
            } catch (err) {
                console.error(err.message)
            }
        });
    }
});

if (fs.existsSync("config.json")) {
    updateConfig();
} else {
    writeConfig();
}

const webhookClient = new WebhookClient(
    config.webhookChannelID,
    config.webhookChannelToken,
);


const exampleEmbed = {
    color: 0xa70532,
    title: 'Some title',
    url: 'https://discord.js.org',
    author: {
        name: 'Repository',
        icon_url: 'https://i.ibb.co/9rBQftW/2021-02-19-22-52.png',
        url: 'https://discord.js.org',
    },
    description: '',
    thumbnail: {
        url: 'https://i.ibb.co/9rBQftW/2021-02-19-22-52.png',
    },
    fields: [
        {
            name: 'Added',
            // color: 0x00b300,
            value: 'Some value here',
            inline: true,
        },
        {
            name: 'Modified',
            // color: 0xe5fc00,
            value: 'Some value here',
            inline: true,
        },
        {
            name: 'Removed',
            // color: 0xa70532,
            value: 'Some value here',
            inline: true,
        }
    ],
    timestamp: new Date().toLocaleString(),
    footer: {
        text: 'Some footer text here',
        icon_url: 'https://i.imgur.com/wSTFkRM.png',
    },
};


client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`);
});

client.on('message', async (message) => {
    try {
        if (message.author.bot) return;
        if (message.content.startsWith(config.prefix)) {
            const [CMD_NAME, ...args] = message.content
                .trim()
                .substring(config.prefix.length)
                .split(/\s+/);

            switch (CMD_NAME) {
                case 'marko':
                    message.channel.send('Polo');
                    webhookClient.send({embeds: [exampleEmbed]});
                    break;

                case 'webhook':
                    if (args[0].toLowerCase() === 'channel') {
                        if (args[1].toLowerCase() === 'id') {
                            config.webhookChannelID = args[2];
                            writeConfig();
                        } else if (args[1].toLowerCase() === 'token') {
                            config.webhookChannelToken = args[2];
                            writeConfig();
                        }
                    } else if (args[0].toLowerCase() === 'url') {
                        const parts = args[1].split('/').slice(-2);
                        config.webhookChannelID = parts[0];
                        config.webhookChannelToken = parts[1];
                        writeConfig();
                        message.reply(`**Channel updated:**\n\`\`\`ID: ${config.webhookChannelID}\nToken: ${config.webhookChannelToken}\`\`\``);
                    }
                    break;

                case 'prefix':
                    if (args.length > 0) {
                        config.prefix = args[0];
                    } else {
                        message.reply(`Prefix is not provided. Please use \`${config.prefix}prefix (char)\``);
                    }
                    break;
            }
        }
    } catch (err) {
        console.error("Client: on message: ", err.message);
    }
});

function writeConfig() {
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
}

function updateConfig() {
    config = JSON.parse(fs.readFileSync('config.json'));
}

// client.on('messageReactionAdd', (reaction, user) => {
//     const {name} = reaction.emoji;
//     const member = reaction.message.guild.members.cache.get(user.id);
//     if (reaction.message.id === '738666523408990258') {
//         switch (name) {
//             case '🍎':
//                 member.roles.add('738664659103776818');
//                 break;
//             case '🍌':
//                 member.roles.add('738664632838782998');
//                 break;
//             case '🍇':
//                 member.roles.add('738664618511171634');
//                 break;
//             case '🍑':
//                 member.roles.add('738664590178779167');
//                 break;
//         }
//     }
// });
//
// client.on('messageReactionRemove', (reaction, user) => {
//     const {name} = reaction.emoji;
//     const member = reaction.message.guild.members.cache.get(user.id);
//     if (reaction.message.id === '738666523408990258') {
//         switch (name) {
//             case '🍎':
//                 member.roles.remove('738664659103776818');
//                 break;
//             case '🍌':
//                 member.roles.remove('738664632838782998');
//                 break;
//             case '🍇':
//                 member.roles.remove('738664618511171634');
//                 break;
//             case '🍑':
//                 member.roles.remove('738664590178779167');
//                 break;
//         }
//     }
// });

server.listen(config.server.port, () => {
    console.log(`GitHub webhook listener started on port: ${config.server.port}`)
});
client.login(config.botToken);
