import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function initDb() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        guild_id TEXT,
        user_id TEXT,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        total_duration INTEGER DEFAULT 0,
        join_count INTEGER DEFAULT 0,
        max_duration INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);
    console.log("Database initialized.");
}

export async function getUser(guildId: string, userId: string) {
    const res = await pool.query('SELECT * FROM user_stats WHERE guild_id = $1 AND user_id = $2', [guildId, userId]);

    if (res.rows.length === 0) {
        const newUser = { xp: 0, level: 1, total_duration: 0, join_count: 0, max_duration: 0 };
        await pool.query(
            'INSERT INTO user_stats (guild_id, user_id, xp, level, total_duration, join_count, max_duration) VALUES ($1, $2, 0, 1, 0, 0, 0)',
            [guildId, userId]
        );
        return newUser;
    }
    return res.rows[0];
}

export function getXpForLevel(level: number): number {
    return 6 + Math.floor(level / 5) * 2;
}

export async function getUserRank(guildId: string, userId: string): Promise<number> {
    const user = await getUser(guildId, userId);
    const res = await pool.query(
        'SELECT COUNT(*) as count FROM user_stats WHERE guild_id = $1 AND (level > $2 OR (level = $2 AND xp > $3))',
        [guildId, user.level, user.xp]
    );
    return parseInt(res.rows[0].count) + 1;
}

export async function getLeaderboard(guildId: string, limit: number) {
    const res = await pool.query(
        'SELECT * FROM user_stats WHERE guild_id = $1 ORDER BY level DESC, xp DESC LIMIT $2',
        [guildId, limit]
    );
    return res.rows;
}

export async function updateStats(guildId: string, userId: string, durationMs: number) {
    const durationSec = Math.floor(durationMs / 1000);
    const durationMin = Math.floor(durationSec / 60);
    const xpGain = durationMin * 5;

    let user = await getUser(guildId, userId);

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

    await pool.query(
        `UPDATE user_stats SET xp = $1, level = $2, total_duration = $3, join_count = $4, max_duration = $5 
         WHERE guild_id = $6 AND user_id = $7`,
        [newXp, newLevel, newTotalDuration, newJoinCount, newMaxDuration, guildId, userId]
    );
}