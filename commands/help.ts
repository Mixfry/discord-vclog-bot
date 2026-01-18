import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
// embed等の機能を使う場合はインポートを忘れずに！

//ここに関数を書くこともあるが、多分まだ使わない

export const command = {
    data: new SlashCommandBuilder()
        .setName('help') // コマンド名はスラッシュコマンドの名前になる、必ず小文字で
        .setDescription('使い方を説明します'), // コマンドの説明短く簡潔に
    async execute(interaction: CommandInteraction) {
        // ここの下に処理を書いていく感じ
        // 変数を使う場合は、constやletで宣言しておく
        // 変数は、constで宣言したものは再代入できないので注意(定数)
        // letで宣言したものは再代入できるので、変数の値を変えたい場合はletを使う(変数)
        // なるべくconstを使うようにしよう
        const test = "変数";

        const embed = new EmbedBuilder()
            .setTitle('title')
            .setDescription(`
          これは"embed"っていうものを使ってメッセージを送るやつ
ちなみに文字列を打つ時、""←このダブルクォーテーションを使うのが一般的なんだけど、
\`\`←このバッククォートを使うと、以下のように$マークを使って変数を組み込むことができる！
${test}
`)
            .addFields(
                { name: 'field1', value: 'value1' },
                { name: 'field2', value: 'value2' },
                { name: 'field3', value: 'value3' },
                { name: 'field4', value: 'value4' },
            )
            .setFooter({ text: 'footer' })
            .setColor('#00ff00');
        await interaction.reply({ embeds: [embed] });
    }
};

export default command;
