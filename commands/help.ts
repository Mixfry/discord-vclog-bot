import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, MessageFlags } from 'discord.js';

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
 \`/setting\`
> ランキングから自身を非表示にする設定を変更できます
> (trueで非表示、falseで表示)
\`/ranking\`
> サーバー内の滞在時間ランキング（トップ10）を確認できます
\`/globalranking\`
> 全サーバーの滞在時間ランキングを確認できます
> (他のサーバーのユーザーは「匿名」と表示されます)

両コマンド共に「公開する」オプションをTrueにすると、通常は非表示メッセージで送られるところをサーバー全体に公開することができます、共有する際にご活用ください。

- 仕組み
> vcに5分間滞在するごとに1XP獲得します(退室した際に付与)
> XPが一定量貯まるとレベルが上がります
> 
> 経験値テーブル \`[6 + Math.floor(level / 5) * 2]\` 
> (5レベルごとに要求XPが2ずつ増えていく)
`)
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};

export default command;
