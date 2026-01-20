import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { setUserSetting } from '../db.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('setting')
        .setDescription('ユーザー設定')
        .addBooleanOption(option =>
            option.setName('ranking_visibility')
                .setDescription('ランキングから自身を非表示にする (True: 非表示, False: 表示)')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const hideRanking = interaction.options.getBoolean('ranking_visibility', true);

        await setUserSetting(interaction.user.id, hideRanking);

        const status = hideRanking ? '非表示' : '表示';
        await interaction.reply({
            content: `ランキング設定を「${status}」に更新しました。`,
            ephemeral: true
        });
    }
};

export default command;
