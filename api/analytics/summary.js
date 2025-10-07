/**
 * 판매 데이터 종합 분석 API
 * GET /api/analytics/summary
 *
 * 데이터분석_에이전트 역할:
 * - 결제방법별 통계
 * - 시간대별 판매 패턴
 * - 성공률 분석
 * - 성장 추이
 * - 비즈니스 인사이트 도출
 */

import { google } from 'googleapis';

// Google Sheets 인증 설정
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
                summary: {
                    totalSales: 0,
                    totalRevenue: 0,
                    successRate: 0
                }
            });
        }

        // 헤더 제외하고 유효한 데이터만 필터링 (sentAt이 있는 것만)
        const data = rows.slice(1).filter(row => row[3] && row[3].trim() !== '');

        // === 1. 전체 요약 통계 ===
        const totalSales = data.length;
        const successCount = data.filter(row => row[4] === 'SUCCESS').length;
        const failCount = totalSales - successCount;
        const successRate = ((successCount / totalSales) * 100).toFixed(1);
        const totalRevenue = successCount * 5000;

        // === 2. 결제방법별 통계 ===
        const paymentStats = {};
        data.forEach(row => {
            const method = row[0] || '미기재';
            if (!paymentStats[method]) {
                paymentStats[method] = { total: 0, success: 0 };
            }
            paymentStats[method].total++;
            if (row[4] === 'SUCCESS') {
                paymentStats[method].success++;
            }
        });

        const paymentMethods = Object.entries(paymentStats).map(([method, stats]) => ({
            method,
            count: stats.total,
            percentage: ((stats.total / totalSales) * 100).toFixed(1),
            successRate: ((stats.success / stats.total) * 100).toFixed(1),
            revenue: stats.success * 5000
        })).sort((a, b) => b.count - a.count);

        // === 3. 시간대별 분석 ===
        const hourlyStats = Array(24).fill(0);
        const dailyStats = {};

        data.forEach(row => {
            if (row[3]) {
                const sentAt = new Date(row[3]);
                const hour = sentAt.getHours();
                if (!isNaN(hour)) {
                    hourlyStats[hour]++;
                }

                const date = row[3].split('T')[0];
                dailyStats[date] = (dailyStats[date] || 0) + 1;
            }
        });

        const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));
        const dates = Object.keys(dailyStats).sort();
        const avgDailySales = totalSales / dates.length;

        // === 4. 고객 분석 ===
        const emailDomains = {};
        const hasNameCount = data.filter(row => row[2] && row[2].trim() !== '').length;

        data.forEach(row => {
            const email = row[1];
            if (email && email.includes('@')) {
                const domain = email.split('@')[1];
                emailDomains[domain] = (emailDomains[domain] || 0) + 1;
            }
        });

        const topDomains = Object.entries(emailDomains)
            .map(([domain, count]) => ({
                domain,
                count,
                percentage: ((count / totalSales) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // === 5. 성장 분석 ===
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        const daysSinceStart = dates.length;

        // 목표 달성 예측
        const targetCustomers = 50000;
        const remaining = targetCustomers - successCount;
        const daysToTarget = Math.ceil(remaining / avgDailySales);
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + daysToTarget);

        // === 6. 인사이트 도출 ===
        const insights = [];

        // 결제 방법 인사이트
        const topPayment = paymentMethods[0];
        insights.push(`${topPayment.method}가 ${topPayment.percentage}%로 가장 선호되는 결제 수단입니다`);

        // 성공률 인사이트
        if (parseFloat(successRate) >= 95) {
            insights.push(`이메일 발송 성공률 ${successRate}% - 매우 안정적입니다`);
        } else if (parseFloat(successRate) >= 80) {
            insights.push(`이메일 발송 성공률 ${successRate}% - 양호합니다`);
        } else {
            insights.push(`이메일 발송 성공률 ${successRate}% - 개선이 필요합니다`);
        }

        // 판매 속도 인사이트
        insights.push(`평균 일 판매량은 ${avgDailySales.toFixed(1)}건입니다`);

        // 목표 달성 인사이트
        if (daysToTarget > 1000) {
            insights.push(`현재 속도로는 50,000명 목표까지 약 ${(daysToTarget / 365).toFixed(1)}년 소요 예상 - 마케팅 강화 필요`);
        } else {
            insights.push(`현재 속도로 50,000명 목표까지 약 ${daysToTarget}일 소요 예상`);
        }

        // 시간대 인사이트
        if (peakHour >= 9 && peakHour <= 18) {
            insights.push(`가장 활발한 구매 시간은 ${peakHour}시 (업무 시간대)`);
        } else {
            insights.push(`가장 활발한 구매 시간은 ${peakHour}시`);
        }

        // === 7. 개선 권장사항 ===
        const recommendations = [];

        // 결제 방법 권장사항
        recommendations.push(`${topPayment.method} 결제 프로세스를 더욱 강조하여 전환율 향상`);

        if (paymentMethods.length > 1) {
            const secondPayment = paymentMethods[1];
            recommendations.push(`${secondPayment.method} 사용자를 위한 가이드 개선 (현재 ${secondPayment.percentage}%)`);
        }

        // 성장 권장사항
        if (avgDailySales < 10) {
            recommendations.push('SNS 마케팅으로 일 평균 판매량 10건 이상으로 증대 필요');
        }

        if (hasNameCount / totalSales < 0.5) {
            recommendations.push('이름 입력을 선택사항으로 유지하여 구매 장벽 최소화 (현재 잘 운영 중)');
        }

        // 시간대 권장사항
        if (peakHour >= 20 || peakHour <= 6) {
            recommendations.push('야간 시간대 구매가 많으므로 24시간 자동화 시스템 유지 중요');
        }

        // === 최종 응답 ===
        return res.status(200).json({
            success: true,
            generatedAt: new Date().toISOString(),

            summary: {
                totalSales,
                successCount,
                failCount,
                successRate: parseFloat(successRate),
                totalRevenue,
                avgDailySales: parseFloat(avgDailySales.toFixed(1)),
                activeDays: daysSinceStart,
                firstSale: firstDate,
                lastSale: lastDate
            },

            paymentMethods,

            timeline: {
                dates,
                dailySales: dates.map(date => dailyStats[date]),
                peakHour,
                hourlyDistribution: hourlyStats
            },

            customers: {
                hasNameRate: ((hasNameCount / totalSales) * 100).toFixed(1),
                topEmailDomains: topDomains,
                uniqueEmails: data.filter((row, index, self) =>
                    index === self.findIndex(r => r[1] === row[1])
                ).length
            },

            goals: {
                target: targetCustomers,
                current: successCount,
                remaining,
                progressPercentage: ((successCount / targetCustomers) * 100).toFixed(3),
                estimatedDaysToTarget: daysToTarget,
                estimatedCompletionDate: estimatedDate.toISOString().split('T')[0]
            },

            insights,
            recommendations
        });

    } catch (error) {
        console.error('데이터 분석 실패:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
