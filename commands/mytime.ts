import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, AttachmentBuilder } from 'discord.js';
import { getUser, getUserRank, getGlobalUserRank } from '../db.js';
import { createCanvas, loadImage } from 'canvas';

// 角丸四角
function roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawIcon(ctx: any, type: string, x: number, y: number, size: number, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const center = size / 2;
    const padding = size * 0.15;

    switch (type) {
        case 'clock':
            ctx.arc(x + center, y + center, size / 2 - padding, 0, Math.PI * 2);
            ctx.moveTo(x + center, y + padding * 2);
            ctx.lineTo(x + center, y + center);
            ctx.lineTo(x + center + size * 0.2, y + center);
            break;
        case 'trending':
            ctx.moveTo(x + padding, y + size - padding);
            ctx.lineTo(x + size * 0.35, y + size * 0.55);
            ctx.lineTo(x + size * 0.55, y + size * 0.75);
            ctx.lineTo(x + size - padding, y + padding);
            ctx.moveTo(x + size - padding - size * 0.2, y + padding);
            ctx.lineTo(x + size - padding, y + padding);
            ctx.lineTo(x + size - padding, y + padding + size * 0.2);
            break;
        case 'hourglass': // 砂時計のつもり
            ctx.moveTo(x + padding, y + padding);
            ctx.lineTo(x + size - padding, y + padding);
            ctx.lineTo(x + center, y + center);
            ctx.lineTo(x + padding, y + padding);
            
            ctx.moveTo(x + center, y + center);
            ctx.lineTo(x + size - padding, y + size - padding);
            ctx.lineTo(x + padding, y + size - padding);
            ctx.lineTo(x + center, y + center);
            break;
        case 'door':
            ctx.moveTo(x + size * 0.25, y + padding);
            ctx.lineTo(x + size * 0.75, y + padding);
            ctx.lineTo(x + size * 0.75, y + size - padding);
            ctx.lineTo(x + size * 0.25, y + size - padding);
            ctx.closePath();
            ctx.moveTo(x + size * 0.65, y + size * 0.55);
            ctx.lineTo(x + size * 0.65 + 0.1, y + size * 0.55); 
            ctx.lineWidth = 3; 
            break;
    }
    ctx.stroke();
    ctx.restore();
}

export const command = {
    data: new SlashCommandBuilder()
        .setName('mytime')
        .setDescription('自分の滞在時間ステータスカードを表示')
        .addBooleanOption(option =>
            option.setName('公開する')
                .setDescription('結果を全員に表示するかどうか (デフォルト: False)')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', flags: MessageFlags.Ephemeral });
            return;
        }

        const isVisible = interaction.options.getBoolean('公開する') ?? false;
        await interaction.deferReply({ flags: !isVisible ? MessageFlags.Ephemeral : undefined });

        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            
            const user = await getUser(guildId, userId);
            const rank = await getUserRank(guildId, userId);
            const globalRank = await getGlobalUserRank(userId);

            const currentXp = user.xp;
            const requiredXp = user.reqXp; 
            const avgTime = user.join_count > 0 ? user.total_duration / user.join_count : 0;

            const formatDuration = (seconds: number) => {
                if (seconds < 3600) {
                    return `${Math.floor(seconds / 60).toLocaleString()}分`;
                }
                return `${(seconds / 3600).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}時間`;
            };

            const width = 700;
            const height = 450;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#55798B';
            ctx.fillRect(0, 0, width, height);

            const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
            const avatarSize = 80;
            const avatarX = 40;
            const avatarY = 40;

            try {
                const avatar = await loadImage(avatarUrl);
                
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 4;
                
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
                ctx.shadowColor = 'transparent';
                
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                // ランクバッジ
                const badgeX = avatarX + avatarSize - 25; 
                const badgeY = avatarY + avatarSize - 25;
                
                ctx.save();
                ctx.fillStyle = '#FFD700'; 
                ctx.strokeStyle = '#1F2937'; 
                ctx.lineWidth = 2;
                
                const rankText = `#${rank.toLocaleString()}`;
                ctx.font = 'bold 14px sans-serif';
                const rankTextWidth = ctx.measureText(rankText).width;
                const badgePadding = 10;
                const badgeWidth = Math.max(32, rankTextWidth + badgePadding * 2);
                const badgeHeight = 26;

                roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 13);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#111827'; 
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rankText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 1);
                ctx.restore();

            } catch (e) {
                console.error("アバター画像のロードに失敗:", e);
                ctx.beginPath();
                ctx.arc(80, 80, 40, 0, Math.PI * 2);
                ctx.fillStyle = '#ccc';
                ctx.fill();
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 42px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(interaction.user.username, 140, 40);

            // 順位表示
            const drawRankPill = (text: string, x: number, y: number, rankValue: number) => {
                const pillHeight = 24;
                ctx.font = 'bold 12px sans-serif';
                const textWidth = ctx.measureText(text).width;
                const paddingH = 12;
                const pillWidth = textWidth + (paddingH * 2);

                let borderColor = 'rgba(255, 255, 255, 0.1)';
                let textColor = 'rgba(255, 255, 255, 0.9)';
                let borderWidth = 1;

                if (rankValue === 1) {
                    borderColor = '#FFD700';
                    textColor = '#FFD700';
                    borderWidth = 2;
                } else if (rankValue === 2) {
                    borderColor = '#C0C0C0';
                    textColor = '#C0C0C0';
                    borderWidth = 2;
                } else if (rankValue === 3) {
                    borderColor = '#CD7F32';
                    textColor = '#CD7F32';
                    borderWidth = 2;
                }

                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
                roundRect(ctx, x, y, pillWidth, pillHeight, 12);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = textColor; 
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'left'; 
                ctx.textBaseline = 'middle';
                ctx.fillText(text, x + paddingH, y + pillHeight / 2 + 1);
                ctx.restore();
                
                return x + pillWidth + 10; 
            };

            let currentX = 140;
            currentX = drawRankPill(`サーバー内: ${rank.toLocaleString()}位`, currentX, 95, rank); 
            
            // グローバルランクはTOP10のみ
            if (globalRank > 0 && globalRank <= 10) {
                drawRankPill(`グローバル: ${globalRank.toLocaleString()}位`, currentX, 95, globalRank);
            }

            // レベル
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText('LEVEL', width - 40, 45);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'italic bold 72px sans-serif';
            ctx.fillText(user.level.toLocaleString(), width - 35, 55);


            const barX = 40;
            const barY = 150;
            const barWidth = width - 80;
            const barHeight = 28;
            const progress = Math.min(1, Math.max(0, currentXp / requiredXp));

            ctx.save();
            roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.stroke();
            ctx.clip();

            const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            gradient.addColorStop(0, '#93c5fd'); 
            gradient.addColorStop(1, '#cffafe'); 
            
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);

            const glossGradient = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
            glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            glossGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
            glossGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = glossGradient;
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(barX, barY, barWidth, barHeight / 2);

            ctx.restore();

            // 経験値バー
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px sans-serif'; 
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 2;
            const percentText = (progress * 100).toFixed(1);
            ctx.fillText(`${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()} XP (${percentText}%)`, barX + barWidth - 15, barY + barHeight / 2);
            ctx.shadowBlur = 0; 


            // 統計エリア
            const cardBgColor = 'rgba(0, 0, 0, 0.15)';
            const cardBorderColor = 'rgba(255, 255, 255, 0.1)';
            
            const drawStatBox = (iconType: string, label: string, value: string, x: number, y: number, w: number, h: number) => {
                ctx.save();
                roundRect(ctx, x, y, w, h, 16);
                ctx.fillStyle = cardBgColor;
                ctx.fill();
                ctx.strokeStyle = cardBorderColor;
                ctx.stroke();

                let labelX = x + 20;
                
                if (iconType) {
                    const iconColor = 'rgba(255, 255, 255, 0.6)'; 
                    drawIcon(ctx, iconType, x + 15, y + 18, 16, iconColor); 
                    labelX = x + 38; 
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = 'bold 15px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(label, labelX, y + 20); 

                // 値
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(value, x + w - 20, y + h - 15);
                ctx.restore();
            };

            const gridY1 = 210;
            const gridH = 80;
            const gap = 15;
            const gridW2 = (width - 80 - gap) / 2;

            drawStatBox('clock', '合計', formatDuration(user.total_duration), 40, gridY1, gridW2, gridH);
            drawStatBox('', '総XP', `${user.totalXp.toLocaleString()} XP`, 40 + gridW2 + gap, gridY1, gridW2, gridH);

            const gridY2 = 310;
            const gridW3 = (width - 80 - (gap * 2)) / 3; 

            drawStatBox('hourglass', '最大滞在', formatDuration(user.max_duration), 40, gridY2, gridW3, gridH);
            drawStatBox('trending', '平均滞在', formatDuration(avgTime), 40 + gridW3 + gap, gridY2, gridW3, gridH);
            drawStatBox('door', '入室回数', `${user.join_count.toLocaleString()} 回`, 40 + (gridW3 + gap) * 2, gridY2, gridW3, gridH);

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'stats.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '画像の生成中にエラーが発生しました。' });
        }
    }
};

export default command;