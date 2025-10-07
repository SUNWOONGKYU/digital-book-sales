/**
 * 결제 방법별 통계 API
 * GET /api/analytics/payment-stats
 *
 * 각 결제 수단별 건수, 비율, 성공률 분석
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
                data: []
            });
        }

        // 헤더 제외하고 유효한 데이터만
        const data = rows.slice(1).filter(row => row[3] && row[3].trim() !== '');
        const totalSales = data.length;

        // 결제방법별 집계
        const paymentStats = {};
        data.forEach(row => {
            const method = row[0] || '미기재';
            if (!paymentStats[method]) {
                paymentStats[method] = { total: 0, success: 0, fail: 0 };
            }
            paymentStats[method].total++;
            if (row[4] === 'SUCCESS') {
                paymentStats[method].success++;
            } else {
                paymentStats[method].fail++;
            }
        });

        // 통계 계산
        const paymentMethods = Object.entries(paymentStats).map(([method, stats]) => {
            const percentage = ((stats.total / totalSales) * 100).toFixed(1);
            const successRate = ((stats.success / stats.total) * 100).toFixed(1);
            const revenue = stats.success * 5000;

            return {
                method,
                count: stats.total,
                percentage: parseFloat(percentage),
                success: stats.success,
                fail: stats.fail,
                successRate: parseFloat(successRate),
                revenue
            };
        }).sort((a, b) => b.count - a.count);

        // 인사이트
        const topPayment = paymentMethods[0];
        const insights = [];

        insights.push(`${topPayment.method}가 전체의 ${topPayment.percentage}%로 가장 많이 사용됩니다`);

        if (paymentMethods.length > 1) {
            const secondPayment = paymentMethods[1];
            const gap = topPayment.count - secondPayment.count;
            insights.push(`${topPayment.method}와 ${secondPayment.method}의 격차는 ${gap}건입니다`);
        }

        // 성공률 분석
        const avgSuccessRate = paymentMethods.reduce((sum, p) => sum + parseFloat(p.successRate), 0) / paymentMethods.length;
        if (avgSuccessRate >= 95) {
            insights.push(`전체 평균 성공률 ${avgSuccessRate.toFixed(1)}% - 매우 안정적`);
        } else {
            insights.push(`전체 평균 성공률 ${avgSuccessRate.toFixed(1)}% - 개선 필요`);
        }

        // 권장사항
        const recommendations = [];
        recommendations.push(`${topPayment.method} 결제를 메인으로 강조하여 UX 최적화`);

        if (paymentMethods.some(p => parseFloat(p.successRate) < 90)) {
            const lowSuccessPayments = paymentMethods.filter(p => parseFloat(p.successRate) < 90);
            lowSuccessPayments.forEach(p => {
                recommendations.push(`${p.method} 성공률 ${p.successRate}% - 프로세스 점검 필요`);
            });
        }

        return res.status(200).json({
            success: true,
            generatedAt: new Date().toISOString(),
            totalSales,
            paymentMethods,
            insights,
            recommendations
        });

    } catch (error) {
        console.error('결제 방법 분석 실패:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
