import { command as help } from './commands/help.js';
import { command as mytime } from './commands/mytime.js';
import { command as ranking } from './commands/ranking.js';

import { updateStats, initDb } from './db.js';
import express from 'express';

import { Client, Events, GatewayIntentBits, Interaction, EmbedBuilder, Colors } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Discord Bot is active!');
});

app.listen(PORT, () => {
    console.log(`Web Server running on port ${PORT}`);
});

client.once(Events.ClientReady, async c => {
    console.log(`${c.user.tag}が飛び乗った！`);
    await initDb();
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            case help.data.name:
                await help.execute(interaction);
                break;
            case mytime.data.name:
                await mytime.execute(interaction);
                break;
            case ranking.data.name:
                await ranking.execute(interaction);
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

const joinTimes = new Map<string, number>();

/***************
*** 入退室検知 ***
****************/
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    // 入室
    if (oldState.channelId === null && newState.channelId !== null) {
        if (newState.member) {
            joinTimes.set(newState.member.id, Date.now());
        }
    }
    // 退室
    else if (oldState.channelId !== null && newState.channelId === null) {
        if (oldState.member) {
            const joinTime = joinTimes.get(oldState.member.id);
            if (joinTime) {
                const duration = Date.now() - joinTime;

                try {
                    await updateStats(oldState.guild.id, oldState.member.id, duration);
                } catch (e) {
                    console.error('Failed to update stats:', e);
                }

                joinTimes.delete(oldState.member.id);
            }
        }
    }
    // 移動した時用 
    else if (oldState.channelId !== null && newState.channelId !== null && oldState.channelId !== newState.channelId) {
        const oldChannel = oldState.channel;
        if (oldChannel && oldChannel.isVoiceBased()) {
            if (oldState.member) {
                const joinTime = joinTimes.get(oldState.member.id);
                if (joinTime) {
                    const duration = Date.now() - joinTime;

                    try {
                        await updateStats(oldState.guild.id, oldState.member.id, duration);
                    } catch (e) {
                        console.error('Failed to update stats:', e);
                    }

                    joinTimes.delete(oldState.member.id);
                }
            }
        }

        if (newState.member) {
            joinTimes.set(newState.member.id, Date.now());
        }
    }
});
const token = process.env.TOKEN;
if (!token) {
    throw new Error("TOKEN is not defined in environment variables");
}

client.login(token);
