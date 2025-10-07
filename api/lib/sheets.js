/**
 * Google Sheets 데이터베이스 헬퍼 함수
 *
 * 스프레드시트 구조:
 * - Orders: 주문 정보
 * - DownloadLogs: 다운로드 기록
 * - Analytics: 분석 데이터
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

/**
 * 주문 정보 저장
 * Orders 시트 컬럼: orderId, paymentKey, amount, customerEmail, customerName,
 *                   customerPhone, status, createdAt, paidAt, refundedAt,
 *                   downloadToken, alimtalkSent, alimtalkMessageId
 */
export async function saveOrder(orderData) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const values = [[
        orderData.orderId,
        orderData.paymentKey,
        orderData.amount,
        orderData.customerEmail,
        orderData.customerName || '',
        orderData.customerPhone || '',
        orderData.status || 'PAID',
        new Date().toISOString(),
        orderData.paidAt || new Date().toISOString(),
        orderData.refundedAt || '',
        orderData.downloadToken || '',
        orderData.alimtalkSent || false,
        orderData.alimtalkMessageId || ''
    ]];

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Orders!A:M',
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return { success: true, data: response.data };
    } catch (error) {
        console.error('주문 저장 실패:', error);
        throw new Error('주문 정보를 저장하는데 실패했습니다.');
    }
}

/**
 * 주문 조회 (orderId로)
 */
export async function getOrder(orderId) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Orders!A:M'
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            return null;
        }

        // 헤더 제외하고 검색
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === orderId) {
                return {
                    rowIndex: i + 1,
                    orderId: rows[i][0],
                    paymentKey: rows[i][1],
                    amount: parseInt(rows[i][2]),
                    customerEmail: rows[i][3],
                    customerName: rows[i][4],
                    customerPhone: rows[i][5],
                    status: rows[i][6],
                    createdAt: rows[i][7],
                    paidAt: rows[i][8],
                    refundedAt: rows[i][9],
                    downloadToken: rows[i][10],
                    alimtalkSent: rows[i][11] === 'true',
                    alimtalkMessageId: rows[i][12]
                };
            }
        }

        return null;
    } catch (error) {
        console.error('주문 조회 실패:', error);
        throw new Error('주문 정보를 조회하는데 실패했습니다.');
    }
}

/**
 * 주문 정보 업데이트
 */
export async function updateOrder(orderId, updates) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        // 먼저 주문 찾기
        const order = await getOrder(orderId);
        if (!order) {
            throw new Error('주문을 찾을 수 없습니다.');
        }

        // 업데이트할 값 준비
        const updatedRow = [
            order.orderId,
            updates.paymentKey ?? order.paymentKey,
            updates.amount ?? order.amount,
            updates.customerEmail ?? order.customerEmail,
            updates.customerName ?? order.customerName,
            updates.customerPhone ?? order.customerPhone,
            updates.status ?? order.status,
            order.createdAt,
            updates.paidAt ?? order.paidAt,
            updates.refundedAt ?? order.refundedAt,
            updates.downloadToken ?? order.downloadToken,
            updates.alimtalkSent ?? order.alimtalkSent,
            updates.alimtalkMessageId ?? order.alimtalkMessageId
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Orders!A${order.rowIndex}:M${order.rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [updatedRow] }
        });

        return { success: true };
    } catch (error) {
        console.error('주문 업데이트 실패:', error);
        throw new Error('주문 정보를 업데이트하는데 실패했습니다.');
    }
}

/**
 * 다운로드 로그 저장
 * DownloadLogs 시트 컬럼: orderId, downloadedAt, ipAddress, userAgent
 */
export async function logDownload(downloadData) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const values = [[
        downloadData.orderId,
        new Date().toISOString(),
        downloadData.ipAddress || '',
        downloadData.userAgent || ''
    ]];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'DownloadLogs!A:D',
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return { success: true };
    } catch (error) {
        console.error('다운로드 로그 저장 실패:', error);
        // 로그 실패는 치명적이지 않으므로 에러를 던지지 않음
        return { success: false };
    }
}

/**
 * 다운로드 횟수 조회
 */
export async function getDownloadCount(orderId) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'DownloadLogs!A:D'
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            return 0;
        }

        // 해당 orderId의 다운로드 횟수 카운트
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === orderId) {
                count++;
            }
        }

        return count;
    } catch (error) {
        console.error('다운로드 횟수 조회 실패:', error);
        return 0;
    }
}

/**
 * 분석 데이터 저장
 * Analytics 시트 컬럼: date, totalSales, revenue, refundCount, downloadCount
 */
export async function saveAnalytics(analyticsData) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const values = [[
        analyticsData.date,
        analyticsData.totalSales || 0,
        analyticsData.revenue || 0,
        analyticsData.refundCount || 0,
        analyticsData.downloadCount || 0
    ]];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Analytics!A:E',
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return { success: true };
    } catch (error) {
        console.error('분석 데이터 저장 실패:', error);
        throw new Error('분석 데이터를 저장하는데 실패했습니다.');
    }
}

/**
 * 일일 통계 조회
 */
export async function getDailyStats(date) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        // Orders 시트에서 해당 날짜의 주문 조회
        const ordersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Orders!A:J'
        });

        const rows = ordersResponse.data.values;
        if (!rows || rows.length <= 1) {
            return {
                totalSales: 0,
                revenue: 0,
                refundCount: 0,
                downloadCount: 0
            };
        }

        let totalSales = 0;
        let revenue = 0;
        let refundCount = 0;

        for (let i = 1; i < rows.length; i++) {
            const paidAt = rows[i][7];
            if (paidAt && paidAt.startsWith(date)) {
                totalSales++;
                const amount = parseInt(rows[i][2]) || 0;
                revenue += amount;
            }

            const refundedAt = rows[i][8];
            if (refundedAt && refundedAt.startsWith(date)) {
                refundCount++;
            }
        }

        // DownloadLogs에서 다운로드 횟수 조회
        const logsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'DownloadLogs!A:D'
        });

        const logRows = logsResponse.data.values;
        let downloadCount = 0;

        if (logRows && logRows.length > 1) {
            for (let i = 1; i < logRows.length; i++) {
                const downloadedAt = logRows[i][1];
                if (downloadedAt && downloadedAt.startsWith(date)) {
                    downloadCount++;
                }
            }
        }

        return {
            totalSales,
            revenue,
            refundCount,
            downloadCount
        };
    } catch (error) {
        console.error('일일 통계 조회 실패:', error);
        throw new Error('통계 데이터를 조회하는데 실패했습니다.');
    }
}

/**
 * 이메일 발송 로그 저장
 * EmailLogs 시트 컬럼: paymentMethod, email, name, sentAt, success, errorMessage
 */
export async function saveEmailLog(emailData) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const values = [[
        emailData.paymentMethod || '',
        emailData.email,
        emailData.name || '',
        new Date().toISOString(),
        emailData.success ? 'SUCCESS' : 'FAILED',
        emailData.errorMessage || ''
    ]];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'EmailLogs!A:F',
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return { success: true };
    } catch (error) {
        console.error('이메일 로그 저장 실패:', error);
        // 로그 실패는 치명적이지 않으므로 에러를 던지지 않음
        return { success: false };
    }
}

/**
 * 스프레드시트 초기화 (최초 1회 실행)
 * Orders, DownloadLogs, Analytics, EmailLogs 시트 생성 및 헤더 설정
 */
export async function initializeSpreadsheet() {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        // Orders 시트 헤더 (확장)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Orders!A1:M1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    'orderId', 'paymentKey', 'amount', 'customerEmail', 'customerName',
                    'customerPhone', 'status', 'createdAt', 'paidAt', 'refundedAt',
                    'downloadToken', 'alimtalkSent', 'alimtalkMessageId'
                ]]
            }
        });

        // DownloadLogs 시트 헤더
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'DownloadLogs!A1:D1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['orderId', 'downloadedAt', 'ipAddress', 'userAgent']]
            }
        });

        // Analytics 시트 헤더
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Analytics!A1:E1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['date', 'totalSales', 'revenue', 'refundCount', 'downloadCount']]
            }
        });

        // EmailLogs 시트 헤더
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'EmailLogs!A1:F1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['paymentMethod', 'email', 'name', 'sentAt', 'success', 'errorMessage']]
            }
        });

        return { success: true, message: '스프레드시트가 초기화되었습니다.' };
    } catch (error) {
        console.error('스프레드시트 초기화 실패:', error);
        throw new Error('스프레드시트를 초기화하는데 실패했습니다.');
    }
}
