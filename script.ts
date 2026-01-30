import { command as help } from './commands/help.js';
import { command as mytime } from './commands/mytime.js';
import { command as ranking } from './commands/ranking.js';
import { command as setting } from './commands/setting.js';
import { command as global_ranking } from './commands/globalranking.js';

import { updateStats, initDb, setUserSetting } from './db.js';
import express from 'express';

import { Client, Events, GatewayIntentBits, Interaction, EmbedBuilder, Colors, MessageFlags } from 'discord.js';

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
            case setting.data.name:
                await setting.execute(interaction);
                break;
            case global_ranking.data.name:
                await global_ranking.execute(interaction);
                break;
            default:
                console.error(`${interaction.commandName}というコマンドには対応していません。`);
        }
    } catch (error) {
        console.error('コマンド実行中にエラーが発生しました:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral });
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
        if (newState.member && !newState.member.user.bot) {
            joinTimes.set(newState.member.id, Date.now());
        }
    }
    // 退室
    else if (oldState.channelId !== null && newState.channelId === null) {
        if (oldState.member) {
            if (oldState.member.user.bot) {
                await setUserSetting(oldState.member.id, true);
                return;
            }
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
            if (oldState.member && !oldState.member.user.bot) {
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

        if (newState.member && !newState.member.user.bot) {
            joinTimes.set(newState.member.id, Date.now());
        }
    }
});
const token = process.env.TOKEN;
if (!token) {
    throw new Error("TOKEN is not defined in environment variables");
}

client.login(token);
