/**
 * 시간대별 분석 API
 * GET /api/analytics/time-trends
 *
 * 시간대별, 요일별 판매 패턴 분석
 */

import { google } from 'googleapis';

function getGoogleAuth() {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    return new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
}

async function getSheetsClient() {
    const auth = getGoogleAuth();
    return google.sheets({ version: 'v4', auth });
}

export default async function handler(req, res) {
    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.SPREADSHEET_ID;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'EmailLogs!A:F'
        });

        const rows = response.data.values;

        if (!rows || rows.length <= 1) {
            return res.status(200).json({
                success: true,
                message: '데이터가 없습니다.',
                hourly: Array(24).fill(0),
                weekly: Array(7).fill(0)
            });
        }

        const data = rows.slice(1).filter(row => row[3] && row[3].trim() !== '');

        // 시간대별 집계 (0-23시)
        const hourlyStats = Array(24).fill(0);

        // 요일별 집계 (0=일요일, 6=토요일)
        const weeklyStats = Array(7).fill(0);
        const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

        // 4시간 단위 집계
        const timePeriods = {
            '새벽 (0-6시)': 0,
            '오전 (6-12시)': 0,
            '오후 (12-18시)': 0,
            '저녁 (18-24시)': 0
        };

        data.forEach(row => {
            if (row[3]) {
                const sentAt = new Date(row[3]);
                const hour = sentAt.getHours();
                const day = sentAt.getDay();

                if (!isNaN(hour)) {
                    hourlyStats[hour]++;

                    // 시간대별 분류
                    if (hour >= 0 && hour < 6) timePeriods['새벽 (0-6시)']++;
                    else if (hour >= 6 && hour < 12) timePeriods['오전 (6-12시)']++;
                    else if (hour >= 12 && hour < 18) timePeriods['오후 (12-18시)']++;
                    else timePeriods['저녁 (18-24시)']++;
                }

                if (!isNaN(day)) {
                    weeklyStats[day]++;
                }
            }
        });

        // 피크 시간대
        const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));
        const peakHourCount = hourlyStats[peakHour];

        // 피크 요일
        const peakDay = weeklyStats.indexOf(Math.max(...weeklyStats));
        const peakDayCount = weeklyStats[peakDay];

        // 시간대 분포
        const timePeriodStats = Object.entries(timePeriods).map(([period, count]) => ({
            period,
            count,
            percentage: ((count / data.length) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);

        // 요일별 통계
        const weekdayStats = weeklyStats.map((count, index) => ({
            day: weekdayNames[index],
            dayIndex: index,
            count,
            percentage: ((count / data.length) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);

        // 인사이트
        const insights = [];

        insights.push(`가장 활발한 시간은 ${peakHour}시 (${peakHourCount}건)`);
        insights.push(`가장 활발한 요일은 ${weekdayNames[peakDay]} (${peakDayCount}건)`);

        const topPeriod = timePeriodStats[0];
        insights.push(`${topPeriod.period} 시간대가 ${topPeriod.percentage}%로 가장 활발합니다`);

        // 야간 판매 비율
        const nightSales = timePeriods['새벽 (0-6시)'] + timePeriods['저녁 (18-24시)'];
        const nightPercentage = ((nightSales / data.length) * 100).toFixed(1);
        if (nightPercentage > 30) {
            insights.push(`야간 시간대(18시-6시) 판매가 ${nightPercentage}%로 높습니다`);
        }

        // 평일 vs 주말
        const weekdaySales = weeklyStats.slice(1, 6).reduce((a, b) => a + b, 0); // 월-금
        const weekendSales = weeklyStats[0] + weeklyStats[6]; // 일, 토
        const weekdayPercentage = ((weekdaySales / data.length) * 100).toFixed(1);
        insights.push(`평일 판매가 ${weekdayPercentage}%입니다`);

        // 권장사항
        const recommendations = [];

        if (peakHour >= 20 || peakHour <= 6) {
            recommendations.push('야간 시간대 구매가 많으므로 24시간 자동화 시스템 필수');
        }

        if (weekendSales > weekdaySales) {
            recommendations.push('주말 판매가 많으므로 주말 마케팅 강화 고려');
        } else {
            recommendations.push('평일 판매가 많으므로 평일 출근 시간대 SNS 게시 효과적');
        }

        recommendations.push(`${peakHour}시 전후로 프로모션 게시하면 전환율 향상 예상`);

        return res.status(200).json({
            success: true,
            generatedAt: new Date().toISOString(),

            hourly: {
                data: hourlyStats,
                peakHour,
                peakCount: peakHourCount,
                labels: Array.from({ length: 24 }, (_, i) => `${i}시`)
            },

            weekly: {
                data: weeklyStats,
                peakDay: weekdayNames[peakDay],
                peakDayIndex: peakDay,
                peakCount: peakDayCount,
                labels: weekdayNames,
                stats: weekdayStats
            },

            periods: timePeriodStats,

            summary: {
                totalSales: data.length,
                nightPercentage: parseFloat(nightPercentage),
                weekdayPercentage: parseFloat(weekdayPercentage),
                weekendPercentage: ((weekendSales / data.length) * 100).toFixed(1)
            },

            insights,
            recommendations
        });

    } catch (error) {
        console.error('시간대 분석 실패:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
