import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getLeaderboard } from '../db.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('滞在時間ランキングを表示')
        .addBooleanOption(option =>
            option.setName('公開する')
                .setDescription('結果を全員に表示するかどうか (デフォルト: False)')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
            return;
        }

        const isVisible = interaction.options.getBoolean('公開する') ?? false;
        const leaderboard = getLeaderboard(interaction.guild.id, 10);

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`滞在時間ランキング`)
            .setTimestamp();

        if (leaderboard.length === 0) {
            embed.setDescription('データがありません。');
        } else {
            for (let i = 0; i < leaderboard.length; i++) {
                const user = leaderboard[i];
                let memberName = user.user_id;

                try {
                    const member = await interaction.guild.members.fetch(user.user_id);
                    memberName = member.displayName;
                } catch (e) { }

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
                    value: `> **レベル**: \`${user.level}\` **総XP**: \`${user.xp}\` *総滞在時間*: \`${durationString}\``,
                    inline: false
                });
            }
        }

        await interaction.reply({ embeds: [embed], ephemeral: !isVisible });
    }
};

export default command;
