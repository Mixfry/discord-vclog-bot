// コマンドを追加したらここに追加しよう その1
// import { command as コマンド名 } from './commands/コマンド名.js';
import { command as help } from './commands/help.js';

import { Client, Events, GatewayIntentBits, Interaction } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
    console.log(`${c.user.tag}が飛び乗った！`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            // コマンドを追加したらここに追加しよう その2
            //    case コマンド名.data.name:
            //      await コマンド名.execute(interaction);
            //      break;
            case help.data.name:
                await help.execute(interaction);
                break;
            default:
                console.error(`${interaction.commandName}というコマンドには対応していません。`);
        }
    } catch (error) {
        console.error('コマンド実行中にエラーが発生しました:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
        } else {
            await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
        }
    }
});

const token = process.env.TOKEN;
if (!token) {
    throw new Error("TOKEN is not defined in environment variables");
}

client.login(token);
