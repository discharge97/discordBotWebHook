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
    botToken: "",
    server: {
        port: 8888
    }
}

let gitChannelNotif = new Map();

const server = http.createServer(function (request, response) {
    if (request.method === 'POST') {
        let body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.end();
            try {
                const post = JSON.parse(body);

                if (post?.object_kind === 'push' &&
                    (gitChannelNotif.has(post?.repository?.git_ssh_url)
                        || gitChannelNotif.has(post?.repository?.git_http_url))) {

                    const msg = exampleEmbed;
                    const commit = post?.commits[0];
                    post?.commits.forEach(el => {
                        commit?.added.concat(el.added);
                        commit?.modified.concat(el.modified);
                        commit?.removed.concat(el.removed);
                    });
                    msg.author.name = `${post?.repository?.name}@${post?.ref.split("/").splice(-1)[0]}`;
                    msg.thumbnail = post?.project?.avatar_url;
                    msg.author.url = post?.repository?.homepage;
                    msg.title = commit?.title;
                    msg.description = post.repository.url;
                    msg.url = post?.url;
                    msg.fields[0].value = `✅    ${commit?.added.length}`;
                    msg.fields[1].value = `📝    ${commit?.modified.length}`;
                    msg.fields[2].value = `❌    ${commit?.removed.length}`;
                    msg.fields[3].value = commit?.id;
                    msg.timestamp = new Date(commit?.timestamp).toLocaleString();
                    msg.footer.text = post?.user_username;
                    msg.footer.icon_url = post?.user_avatar;
                    const channel = gitChannelNotif.get(post?.repository?.git_ssh_url) || gitChannelNotif.get(post?.repository?.git_http_url);
                    client.channels.cache.get(channel).send({embeds: [commit]});
                }
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
            value: 'Some value here',
            inline: true,
        },
        {
            name: 'Modified',
            value: 'Some value here',
            inline: true,
        },
        {
            name: 'Removed',
            value: 'Some value here',
            inline: true,
        },
        {
            name: 'Last commit ID',
            value: '75362097562306212100',
            inline: false,
        }
    ],
    timestamp: new Date().toLocaleString(),
    footer: {
        text: 'Some footer text here',
        icon_url: 'https://i.ibb.co/9rBQftW/2021-02-19-22-52.png',
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
                    message.reply('**Polo**');
                    message.react('👀');
                    break;

                case 'yessir':
                case 'isum':
                    message.channel.send('https://i.ibb.co/wWjdS8N/marina-yes-sir.gif');
                    break;

                case 'git':
                    if (args[0].toLocaleLowerCase() === 'add') {
                        if (!gitChannelNotif.has(args[1])) {
                            gitChannelNotif.set(args[1], message.channel.id);
                            message.react('✅');
                            message.reply(`**Added** tracking\n\`\`\`\nGitLab: ${args[1]}\nID: ${message.channel.id}\`\`\``);
                        }
                    } else if (args[0].toLocaleLowerCase() === 'rm' || args[0].toLocaleLowerCase() === 'remove') {
                        if (gitChannelNotif.has(args[1])) {
                            gitChannelNotif.delete(args[1]);
                            message.react('❌');
                            message.reply(`**Removed** tracking for ***${args[1]}***❗`);
                        }
                    }
                    writeConfig();
                    break;

                case 'test':
                    if (gitChannelNotif.has(args[0])) {
                        client.channels.cache.get(gitChannelNotif.get(args[0])).send("Channel is setup and is working❗");
                    } else {
                        message.react('😢');
                        message.reply(`**Rip** ${args[0]} channel isn't setup❗`);
                    }
                    break;

                case 'prefix':
                    if (args.length > 0) {
                        config.prefix = args[0];
                    } else {
                        message.reply(`Prefix is not provided. Please use \`${config.prefix}prefix (string)\``);
                    }
                    break;

                default:
                    message.reply(`Unknown command❗❓`);
                    break;
            }
        }
    } catch (err) {
        console.error("Client: on message: ", err.message);
    }
});

function writeConfig() {
    try {
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        fs.writeFileSync('channelNotif.json', JSON.stringify(Array.from(gitChannelNotif.entries()), null, 2));

    } catch (err) {
        console.error(err.message);
    }

}

function updateConfig() {
    try {
        config = JSON.parse(fs.readFileSync('config.json'));
        gitChannelNotif = new Map(JSON.parse(fs.readFileSync('channelNotif.json')));
    } catch (err) {
        console.error(err.message);
    }
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
