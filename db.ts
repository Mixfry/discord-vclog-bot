import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const db = new Database('voice_stats.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS user_stats (
    guild_id TEXT,
    user_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    join_count INTEGER DEFAULT 0,
    max_duration INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  )
`);

const getUserQuery = db.prepare('SELECT * FROM user_stats WHERE guild_id = ? AND user_id = ?');
const insertUser = db.prepare('INSERT INTO user_stats (guild_id, user_id, xp, level, total_duration, join_count, max_duration) VALUES (?, ?, 0, 1, 0, 0, 0)');
const updateUser = db.prepare('UPDATE user_stats SET xp = ?, level = ?, total_duration = ?, join_count = ?, max_duration = ? WHERE guild_id = ? AND user_id = ?');
const getRankQuery = db.prepare('SELECT COUNT(*) + 1 as rank FROM user_stats WHERE guild_id = ? AND (level > ? OR (level = ? AND xp > ?))');
const getLeaderboardQuery = db.prepare('SELECT * FROM user_stats WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?');

export function getUser(guildId: string, userId: string): any {
    let user = getUserQuery.get(guildId, userId) as any;
    if (!user) {
        insertUser.run(guildId, userId);
        user = { xp: 0, level: 1, total_duration: 0, join_count: 0, max_duration: 0 };
    }
    return user;
}

export function getXpForLevel(level: number): number {
    return 6 + Math.floor(level / 5) * 2;
}

export function getUserRank(guildId: string, userId: string): number {
    const user = getUser(guildId, userId);
    const result = getRankQuery.get(guildId, user.level, user.level, user.xp) as any;
    return result.rank;
}

export function getLeaderboard(guildId: string, limit: number): any[] {
    return getLeaderboardQuery.all(guildId, limit) as any[];
}

export function updateStats(guildId: string, userId: string, durationMs: number) {
    const durationSec = Math.floor(durationMs / 1000);
    const durationMin = Math.floor(durationSec / 60);

    const xpGain = durationMin * 5;

    let user = getUserQuery.get(guildId, userId) as any;
    if (!user) {
        insertUser.run(guildId, userId);
        user = { xp: 0, level: 1, total_duration: 0, join_count: 0, max_duration: 0 };
    }

    let newXp = user.xp + xpGain;
    let newLevel = user.level;
    let nextLevelCost = getXpForLevel(newLevel);

    while (newXp >= nextLevelCost) {
        newXp -= nextLevelCost;
        newLevel++;
        nextLevelCost = getXpForLevel(newLevel);
    }

    const newTotalDuration = user.total_duration + durationSec;
    const newJoinCount = user.join_count + 1;
    const newMaxDuration = Math.max(user.max_duration, durationSec);

    updateUser.run(newXp, newLevel, newTotalDuration, newJoinCount, newMaxDuration, guildId, userId);
}
