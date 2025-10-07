/**
 * 성장 리포트 API
 * GET /api/analytics/growth-report
 *
 * 일별 판매 추이, 성장률, 목표 달성 예측
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
                daily: { dates: [], counts: [] }
            });
        }

        const data = rows.slice(1).filter(row => row[3] && row[3].trim() !== '');

        // 날짜별 그룹화
        const dailyStats = {};
        data.forEach(row => {
            if (row[3]) {
                const date = row[3].split('T')[0];
                dailyStats[date] = (dailyStats[date] || 0) + 1;
            }
        });

        // 날짜 정렬
        const dates = Object.keys(dailyStats).sort();
        const counts = dates.map(d => dailyStats[d]);

        // 성장률 계산
        const growthRates = [];
        for (let i = 1; i < counts.length; i++) {
            if (counts[i - 1] > 0) {
                const rate = ((counts[i] - counts[i - 1]) / counts[i - 1] * 100).toFixed(1);
                growthRates.push(parseFloat(rate));
            } else {
                growthRates.push(0);
            }
        }

        // 누적 판매량
        const cumulativeCounts = [];
        let cumulative = 0;
        counts.forEach(count => {
            cumulative += count;
            cumulativeCounts.push(cumulative);
        });

        // 통계
        const totalSales = data.length;
        const successCount = data.filter(row => row[4] === 'SUCCESS').length;
        const avgDailySales = totalSales / dates.length;
        const maxDailySales = Math.max(...counts);
        const minDailySales = Math.min(...counts);

        // 최근 7일 평균
        const recent7Days = counts.slice(-7);
        const recent7DaysAvg = recent7Days.reduce((a, b) => a + b, 0) / recent7Days.length;

        // 최근 3일 평균
        const recent3Days = counts.slice(-3);
        const recent3DaysAvg = recent3Days.reduce((a, b) => a + b, 0) / recent3Days.length;

        // 트렌드 판단
        let trend = '보합';
        if (recent3DaysAvg > recent7DaysAvg * 1.2) {
            trend = '급성장';
        } else if (recent3DaysAvg > recent7DaysAvg) {
            trend = '상승';
        } else if (recent3DaysAvg < recent7DaysAvg * 0.8) {
            trend = '하락';
        }

        // 목표 달성 예측
        const targetCustomers = 50000;
        const remaining = targetCustomers - successCount;

        // 3가지 시나리오
        const currentSpeedDays = Math.ceil(remaining / avgDailySales);
        const optimisticSpeedDays = Math.ceil(remaining / (avgDailySales * 2)); // 2배 성장
        const pessimisticSpeedDays = Math.ceil(remaining / (avgDailySales * 0.5)); // 절반 성장

        const today = new Date();

        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() + currentSpeedDays);

        const optimisticDate = new Date(today);
        optimisticDate.setDate(optimisticDate.getDate() + optimisticSpeedDays);

        const pessimisticDate = new Date(today);
        pessimisticDate.setDate(pessimisticDate.getDate() + pessimisticSpeedDays);

        // 매출 계산
        const totalRevenue = successCount * 5000;
        const avgDailyRevenue = totalRevenue / dates.length;
        const projectedMonthlyRevenue = avgDailyRevenue * 30;

        // 인사이트
        const insights = [];

        insights.push(`현재 총 ${totalSales}건 판매, 평균 일 ${avgDailySales.toFixed(1)}건`);
        insights.push(`최근 트렌드: ${trend}`);

        if (trend === '급성장' || trend === '상승') {
            insights.push(`최근 7일 평균 ${recent7DaysAvg.toFixed(1)}건에서 최근 3일 ${recent3DaysAvg.toFixed(1)}건으로 증가`);
        } else if (trend === '하락') {
            insights.push(`최근 판매 속도 감소 - 마케팅 점검 필요`);
        }

        insights.push(`현재 속도로 50,000명 목표까지 약 ${(currentSpeedDays / 365).toFixed(1)}년 소요`);

        if (avgDailySales < 10) {
            insights.push('목표 달성을 위해 일 평균 판매량 10배 이상 증가 필요');
        }

        // 권장사항
        const recommendations = [];

        if (currentSpeedDays > 365) {
            recommendations.push('현재 속도로는 목표 달성 어려움 - 마케팅 전략 대폭 강화 필요');
            recommendations.push('SNS 광고, 인플루언서 협업, 바이럴 마케팅 병행 추천');
        }

        if (trend === '하락') {
            recommendations.push('최근 판매 감소세 - 할인 종료 임박 등의 긴급성 강조 필요');
        }

        if (maxDailySales > avgDailySales * 3) {
            recommendations.push(`최대 일 판매 ${maxDailySales}건 달성 경험 있음 - 그날의 마케팅 전략 분석 및 재현`);
        }

        recommendations.push('일 평균 100건 이상 달성 시 약 1.4년 내 목표 도달 가능');

        return res.status(200).json({
            success: true,
            generatedAt: new Date().toISOString(),

            daily: {
                dates,
                counts,
                cumulative: cumulativeCounts,
                growthRates
            },

            statistics: {
                totalSales,
                successCount,
                avgDailySales: parseFloat(avgDailySales.toFixed(1)),
                maxDailySales,
                minDailySales,
                recent7DaysAvg: parseFloat(recent7DaysAvg.toFixed(1)),
                recent3DaysAvg: parseFloat(recent3DaysAvg.toFixed(1)),
                trend,
                activeDays: dates.length,
                firstSale: dates[0],
                lastSale: dates[dates.length - 1]
            },

            revenue: {
                total: totalRevenue,
                avgDaily: Math.round(avgDailyRevenue),
                projectedMonthly: Math.round(projectedMonthlyRevenue),
                projectedYearly: Math.round(avgDailyRevenue * 365)
            },

            goalProjection: {
                target: targetCustomers,
                current: successCount,
                remaining,
                progressPercentage: ((successCount / targetCustomers) * 100).toFixed(3),

                scenarios: {
                    current: {
                        days: currentSpeedDays,
                        years: (currentSpeedDays / 365).toFixed(1),
                        estimatedDate: currentDate.toISOString().split('T')[0],
                        description: '현재 속도 유지'
                    },
                    optimistic: {
                        days: optimisticSpeedDays,
                        years: (optimisticSpeedDays / 365).toFixed(1),
                        estimatedDate: optimisticDate.toISOString().split('T')[0],
                        description: '판매 속도 2배 증가'
                    },
                    pessimistic: {
                        days: pessimisticSpeedDays,
                        years: (pessimisticSpeedDays / 365).toFixed(1),
                        estimatedDate: pessimisticDate.toISOString().split('T')[0],
                        description: '판매 속도 절반으로 감소'
                    }
                }
            },

            insights,
            recommendations
        });

    } catch (error) {
        console.error('성장 리포트 생성 실패:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
