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
        total_duration INTEGER DEFAULT 0,
        join_count INTEGER DEFAULT 0,
        max_duration INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            hide_ranking BOOLEAN DEFAULT FALSE
        )
    `);
    console.log("Database initialized.");
}

export function getXpForLevel(level: number): number {
    return 6 + Math.floor(level / 5) * 2;
}

export function calculateStatsFromDuration(totalSeconds: number) {
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalXp = Math.floor(totalMinutes / 5);

    let level = 1;
    let currentXp = totalXp;
    let cost = getXpForLevel(level);

    while (currentXp >= cost) {
        currentXp -= cost;
        level++;
        cost = getXpForLevel(level);
    }

    return {
        level,
        xp: currentXp,
        totalXp: totalXp,
        xpToNext: cost - currentXp
    };
}

export async function getUser(guildId: string, userId: string) {
    const res = await pool.query('SELECT * FROM user_stats WHERE guild_id = $1 AND user_id = $2', [guildId, userId]);

    let data;
    if (res.rows.length === 0) {
        data = { total_duration: 0, join_count: 0, max_duration: 0 };
    } else {
        data = res.rows[0];
    }

    const stats = calculateStatsFromDuration(data.total_duration);
    return {
        ...data,
        ...stats,
        user_id: userId,
        guild_id: guildId
    };
}

export async function getUserRank(guildId: string, userId: string): Promise<number> {
    const user = await getUser(guildId, userId);

    const res = await pool.query(`
        SELECT COUNT(*) as count 
        FROM user_stats us
        LEFT JOIN user_settings set ON us.user_id = set.user_id
        WHERE us.guild_id = $1 
          AND us.total_duration > $2
          AND (set.hide_ranking IS NULL OR set.hide_ranking = FALSE)
    `, [guildId, user.total_duration]);

    return parseInt(res.rows[0].count) + 1;
}

export async function getLeaderboard(guildId: string, limit: number) {
    const res = await pool.query(`
        SELECT us.* 
        FROM user_stats us
        LEFT JOIN user_settings set ON us.user_id = set.user_id
        WHERE us.guild_id = $1 
          AND (set.hide_ranking IS NULL OR set.hide_ranking = FALSE)
        ORDER BY us.total_duration DESC 
        LIMIT $2
    `, [guildId, limit]);

    return res.rows.map(row => {
        const stats = calculateStatsFromDuration(row.total_duration);
        return {
            ...row,
            ...stats
        };
    });
}

export async function getGlobalLeaderboard(limit: number) {
    const res = await pool.query(`
        SELECT us.user_id, SUM(us.total_duration) as total_duration
        FROM user_stats us
        LEFT JOIN user_settings set ON us.user_id = set.user_id
        WHERE (set.hide_ranking IS NULL OR set.hide_ranking = FALSE)
        GROUP BY us.user_id
        ORDER BY total_duration DESC
        LIMIT $1
    `, [limit]);

    return res.rows.map(row => {
        const stats = calculateStatsFromDuration(parseInt(row.total_duration));
        return {
            ...row,
            ...stats
        };
    });
}

export async function setUserSetting(userId: string, hideRanking: boolean) {
    await pool.query(
        `INSERT INTO user_settings (user_id, hide_ranking) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET hide_ranking = $2`,
        [userId, hideRanking]
    );
}

export async function updateStats(guildId: string, userId: string, durationMs: number) {
    const durationSec = Math.floor(durationMs / 1000);

    const res = await pool.query('SELECT * FROM user_stats WHERE guild_id = $1 AND user_id = $2', [guildId, userId]);

    if (res.rows.length === 0) {
        await pool.query(
            'INSERT INTO user_stats (guild_id, user_id, total_duration, join_count, max_duration) VALUES ($1, $2, $3, 1, $4)',
            [guildId, userId, durationSec, durationSec]
        );
    } else {
        const user = res.rows[0];
        const newTotalDuration = user.total_duration + durationSec;
        const newJoinCount = user.join_count + 1;
        const newMaxDuration = Math.max(user.max_duration, durationSec);

        await pool.query(
            `UPDATE user_stats SET total_duration = $1, join_count = $2, max_duration = $3 
             WHERE guild_id = $4 AND user_id = $5`,
            [newTotalDuration, newJoinCount, newMaxDuration, guildId, userId]
        );
    }
}