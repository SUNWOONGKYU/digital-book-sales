/**
 * Google Sheets 연결 테스트 API
 * GET /api/test-sheets
 */

import { saveEmailLog } from './lib/sheets.js';

export default async function handler(req, res) {
    try {
        // 테스트 데이터 저장
        const result = await saveEmailLog({
            paymentMethod: '카카오페이',
            email: 'test@example.com',
            name: '테스트',
            success: true,
            errorMessage: ''
        });

        return res.status(200).json({
            success: true,
            message: '구글 시트 연결 성공!',
            result: result,
            env: {
                hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT,
                hasSpreadsheetId: !!process.env.SPREADSHEET_ID,
                spreadsheetId: process.env.SPREADSHEET_ID
            }
        });

    } catch (error) {
        console.error('구글 시트 테스트 실패:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            env: {
                hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT,
                hasSpreadsheetId: !!process.env.SPREADSHEET_ID,
                spreadsheetId: process.env.SPREADSHEET_ID
            }
        });
    }
}
