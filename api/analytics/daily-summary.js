/**
 * 일일 분석 요약 Cron Job
 * GET /api/analytics/daily-summary
 *
 * Vercel Cron으로 매일 자정에 실행
 * - 전날 판매/환불/다운로드 통계 수집
 * - Google Sheets Analytics 시트에 저장
 * - 관리자 이메일로 일일 리포트 발송
 */

import nodemailer from 'nodemailer';
import { getDailyStats, saveAnalytics } from '../lib/sheets.js';

export default async function handler(req, res) {
    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    // Vercel Cron Secret 검증 (선택사항)
    const authHeader = req.headers['authorization'];
    if (process.env.CRON_SECRET) {
        if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
        }
    }

    try {
        // 어제 날짜 (YYYY-MM-DD 형식)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        // 일일 통계 수집
        const stats = await getDailyStats(dateString);

        // Analytics 시트에 저장
        await saveAnalytics({
            date: dateString,
            totalSales: stats.totalSales,
            revenue: stats.revenue,
            refundCount: stats.refundCount,
            downloadCount: stats.downloadCount
        });

        // 관리자 이메일로 리포트 발송
        if (process.env.GMAIL_USER) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });

            const mailOptions = {
                from: `"Claude 완벽 가이드 시스템" <${process.env.GMAIL_USER}>`,
                to: process.env.GMAIL_USER, // 관리자 이메일
                subject: `📊 일일 판매 리포트 - ${dateString}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <div style="text-align: center; margin-bottom: 40px;">
                            <div style="font-size: 60px; margin-bottom: 20px;">📊</div>
                            <h1 style="color: #2C3E50; margin-bottom: 10px;">일일 판매 리포트</h1>
                            <p style="color: #7f8c8d; font-size: 16px;">${dateString}</p>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">총 판매</div>
                                <div style="font-size: 32px; font-weight: 700;">${stats.totalSales}</div>
                                <div style="font-size: 12px; opacity: 0.8;">건</div>
                            </div>

                            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">총 매출</div>
                                <div style="font-size: 32px; font-weight: 700;">₩${stats.revenue.toLocaleString()}</div>
                                <div style="font-size: 12px; opacity: 0.8;">원</div>
                            </div>

                            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">환불</div>
                                <div style="font-size: 32px; font-weight: 700;">${stats.refundCount}</div>
                                <div style="font-size: 12px; opacity: 0.8;">건</div>
                            </div>

                            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">다운로드</div>
                                <div style="font-size: 32px; font-weight: 700;">${stats.downloadCount}</div>
                                <div style="font-size: 12px; opacity: 0.8;">회</div>
                            </div>
                        </div>

                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h3 style="color: #2C3E50; margin-bottom: 15px;">📈 주요 지표</h3>
                            <p style="color: #546E7A; margin: 8px 0;">
                                <strong>평균 주문 금액:</strong>
                                ₩${stats.totalSales > 0 ? Math.round(stats.revenue / stats.totalSales).toLocaleString() : 0}
                            </p>
                            <p style="color: #546E7A; margin: 8px 0;">
                                <strong>환불율:</strong>
                                ${stats.totalSales > 0 ? ((stats.refundCount / stats.totalSales) * 100).toFixed(1) : 0}%
                            </p>
                            <p style="color: #546E7A; margin: 8px 0;">
                                <strong>주문당 다운로드:</strong>
                                ${stats.totalSales > 0 ? (stats.downloadCount / stats.totalSales).toFixed(1) : 0}회
                            </p>
                        </div>

                        ${stats.totalSales === 0 ? `
                        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; text-align: center;">
                            <p style="color: #856404; margin: 0;">어제는 판매가 없었습니다.</p>
                        </div>
                        ` : ''}

                        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                            <p>이 리포트는 매일 자정에 자동으로 생성됩니다.</p>
                            <p>데이터는 Google Sheets Analytics 시트에 저장됩니다.</p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        return res.status(200).json({
            success: true,
            date: dateString,
            stats: stats,
            message: '일일 통계가 성공적으로 저장되었습니다.'
        });

    } catch (error) {
        console.error('일일 통계 처리 오류:', error);

        return res.status(500).json({
            success: false,
            error: error.message || '통계 처리 중 오류가 발생했습니다.'
        });
    }
}
