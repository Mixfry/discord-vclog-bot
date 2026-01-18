import { REST, Routes } from 'discord.js';
import help from './commands/help.ts';
import mytime from './commands/mytime.js';
import ranking from './commands/ranking.js';

const commands = [
    help.data.toJSON(),
    mytime.data.toJSON(),
    ranking.data.toJSON(),
];
const token = process.env.TOKEN;
const applicationId = process.env.APPLICATION_ID;

if (!token) {
    throw new Error("TOKEN is not defined in environment variables");
}
if (!applicationId) {
    throw new Error("APPLICATION_ID is not defined in environment variables");
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(applicationId),
            { body: commands },
        );
        console.log('デプロイ成功！');
    } catch (error) {
        console.error('デプロイ中にエラーが発生しました:', error);
    }
})();
