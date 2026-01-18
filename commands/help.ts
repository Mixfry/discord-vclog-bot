import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('使い方を表示'),
    async execute(interaction: CommandInteraction) {
        const embed = new EmbedBuilder()
            .setTitle('使い方')
            .setDescription(`
- コマンド
\`/mytime\`
> 自分のレベルや滞在時間、順位を確認できます
\`/ranking\`
> サーバー内の滞在時間ランキング（トップ10）を確認できます

両コマンド共に「公開する」オプションをTrueにすると、通常は非表示メッセージで送られるところをサーバー全体に公開することができます、共有する際にご活用ください。

- 仕組み
> vcに5分間滞在するごとに1XP獲得します(退室した際に付与)
> XPが一定量貯まるとレベルが上がります
> 
> 経験値テーブル \`[6 + Math.floor(level / 5) * 2]\` 
> (5レベルごとに要求XPが2ずつ増えていく)
`)
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

export default command;
