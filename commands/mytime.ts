import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getUser, getXpForLevel, getUserRank } from '../db.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('mytime')
        .setDescription('自分の滞在時間を表示')
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
        const user = await getUser(interaction.guild.id, interaction.user.id);
        const xpForNextLevel = getXpForLevel(user.level);
        const rank = await getUserRank(interaction.guild.id, interaction.user.id);

        const formatDuration = (seconds: number) => {
            if (seconds < 3600) {
                return `${Math.floor(seconds / 60)}分`;
            }
            return `${(seconds / 3600).toFixed(1)}時間`;
        };

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${interaction.user.username}のランク`)
            .addFields(
                { name: 'サーバー内順位', value: `\`${rank}位\``, inline: true },
                { name: 'レベル', value: `\`${user.level}\``, inline: true },
                { name: '総XP', value: `\`${user.xp}\``, inline: true },
                { name: '次のレベルまで', value: `\`${xpForNextLevel - user.xp} XP\``, inline: true },
                { name: '合計滞在時間', value: `\`${formatDuration(user.total_duration)}\``, inline: true },
                { name: '最大滞在時間', value: `\`${formatDuration(user.max_duration)}\``, inline: true },
                { name: '平均滞在時間', value: `\`${formatDuration(user.join_count > 0 ? user.total_duration / user.join_count : 0)}\``, inline: true },
                { name: '入室回数', value: `\`${user.join_count}回\``, inline: true },
            )
            .setThumbnail(interaction.user.displayAvatarURL());

        await interaction.reply({ embeds: [embed], ephemeral: !isVisible });
    }
};

export default command;
