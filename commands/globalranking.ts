import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { getGlobalLeaderboard } from '../db.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('globalranking')
        .setDescription('全サーバーの滞在時間ランキングを表示'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const leaderboard = await getGlobalLeaderboard(10);

        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`全サーバー滞在時間ランキング`)
            .setTimestamp();

        if (leaderboard.length === 0) {
            embed.setDescription('データがありません。');
        } else {
            for (let i = 0; i < leaderboard.length; i++) {
                const user = leaderboard[i];
                let memberName = '匿名';

                if (interaction.guild) {
                    try {
                        const member = await interaction.guild.members.fetch(user.user_id);
                        memberName = member.displayName;
                    } catch (e) { }
                }

                const rank = i + 1;
                let rankDisplay = `${rank}位`;
                if (rank === 1) rankDisplay = '🥇';
                else if (rank === 2) rankDisplay = '🥈';
                else if (rank === 3) rankDisplay = '🥉';

                const durationSec = user.total_duration;
                let durationString = "";
                if (durationSec < 3600) {
                    durationString = `${Math.floor(durationSec / 60)}分`;
                } else {
                    durationString = `${(durationSec / 3600).toFixed(1)}時間`;
                }

                embed.addFields({
                    name: `${rankDisplay} ${memberName}`,
                    value: `> レベル: \`${user.level}\` 総XP: \`${user.totalXp}\` 総滞在時間: \`${durationString}\``,
                    inline: false
                });
            }
        }

        await interaction.editReply({ embeds: [embed] });
    }
};

export default command;
