/**
 * EmailLogs 데이터 조회 API
 * GET /api/analytics/get-email-logs
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

// Sheets API 클라이언트 생성
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

        if (!rows || rows.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0
            });
        }

        // 헤더 제외
        const headers = rows[0];
        const data = rows.slice(1).map(row => ({
            paymentMethod: row[0] || '',
            email: row[1] || '',
            name: row[2] || '',
            sentAt: row[3] || '',
            success: row[4] || '',
            errorMessage: row[5] || ''
        }));

        return res.status(200).json({
            success: true,
            headers: headers,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('EmailLogs 조회 실패:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
