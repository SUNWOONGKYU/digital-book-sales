/**
 * 보안 다운로드 API
 * GET /api/download/[token]
 *
 * 토큰 검증 후 PDF 다운로드 제공
 * - 토큰 유효성 검증
 * - 다운로드 횟수 제한 (5회)
 * - 다운로드 로그 기록
 * - Google Drive 파일로 리다이렉트
 */

import { verifyDownloadToken } from '../lib/jwt.js';
import { getOrder, getDownloadCount, logDownload } from '../lib/sheets.js';

export default async function handler(req, res) {
    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    const { token } = req.query;

    try {
        // 1. 토큰 검증
        let decoded;
        try {
            decoded = verifyDownloadToken(token);
        } catch (error) {
            return res.status(401).send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>다운로드 링크 만료</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #e74c3c; margin-bottom: 20px; }
                        p { color: #666; line-height: 1.6; margin-bottom: 30px; }
                        .btn {
                            display: inline-block;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>⚠️ ${error.message}</h1>
                        <p>다운로드 링크가 만료되었거나 유효하지 않습니다.<br>
                        카카오톡 채널로 문의하시면 새로운 링크를 보내드립니다.</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" class="btn" target="_blank">
                            💬 카카오톡 문의하기
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

        const { orderId, customerEmail } = decoded;

        // 2. 주문 정보 확인
        const order = await getOrder(orderId);
        if (!order) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>주문을 찾을 수 없음</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #e74c3c; margin-bottom: 20px; }
                        p { color: #666; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ 주문을 찾을 수 없습니다</h1>
                        <p>주문 정보를 확인할 수 없습니다.<br>
                        카카오톡 채널로 문의해주세요.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // 3. 주문 상태 확인 (환불된 주문은 다운로드 불가)
        if (order.status === 'REFUNDED') {
            return res.status(403).send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>다운로드 불가</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #e74c3c; margin-bottom: 20px; }
                        p { color: #666; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚫 환불된 주문입니다</h1>
                        <p>이 주문은 환불 처리되어 다운로드할 수 없습니다.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // 4. 다운로드 횟수 확인
        const downloadCount = await getDownloadCount(orderId);
        const maxDownloads = parseInt(process.env.MAX_DOWNLOAD_COUNT) || 5;

        if (downloadCount >= maxDownloads) {
            return res.status(429).send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>다운로드 횟수 초과</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #e74c3c; margin-bottom: 20px; }
                        p { color: #666; line-height: 1.6; margin-bottom: 30px; }
                        .btn {
                            display: inline-block;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 50px;
                            font-weight: 700;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>⚠️ 다운로드 횟수 초과</h1>
                        <p>최대 다운로드 횟수(${maxDownloads}회)를 초과했습니다.<br>
                        추가 다운로드가 필요하시면 카카오톡 채널로 문의해주세요.</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" class="btn" target="_blank">
                            💬 카카오톡 문의하기
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

        // 5. 다운로드 로그 기록
        await logDownload({
            orderId,
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        // 6. Google Drive 파일로 리다이렉트
        const fileId = process.env.PDF_FILE_ID;
        if (!fileId) {
            throw new Error('PDF_FILE_ID 환경변수가 설정되지 않았습니다.');
        }

        // Google Drive 직접 다운로드 링크
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        // 다운로드 시작 페이지 표시
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="refresh" content="2;url=${downloadUrl}">
                <title>다운로드 시작</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 500px;
                    }
                    h1 { color: #27ae60; margin-bottom: 20px; }
                    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
                    .info {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin-top: 20px;
                        font-size: 14px;
                        color: #666;
                    }
                    .btn {
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 40px;
                        text-decoration: none;
                        border-radius: 50px;
                        font-weight: 700;
                        margin-top: 20px;
                    }
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ 다운로드 준비 완료!</h1>
                    <div class="spinner"></div>
                    <p>잠시 후 다운로드가 자동으로 시작됩니다...</p>
                    <p style="font-size: 14px; color: #999;">
                        자동으로 시작되지 않으면 아래 버튼을 클릭하세요.
                    </p>
                    <a href="${downloadUrl}" class="btn">📥 수동 다운로드</a>
                    <div class="info">
                        <strong>📊 다운로드 정보</strong><br>
                        남은 다운로드 횟수: <strong>${maxDownloads - downloadCount - 1}</strong>회<br>
                        주문번호: ${orderId}
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('다운로드 처리 오류:', error);

        return res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>오류 발생</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 500px;
                    }
                    h1 { color: #e74c3c; margin-bottom: 20px; }
                    p { color: #666; line-height: 1.6; margin-bottom: 30px; }
                    .btn {
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 40px;
                        text-decoration: none;
                        border-radius: 50px;
                        font-weight: 700;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ 오류가 발생했습니다</h1>
                    <p>다운로드 처리 중 오류가 발생했습니다.<br>
                    카카오톡 채널로 문의해주세요.</p>
                    <a href="http://pf.kakao.com/_WqSxcn/chat" class="btn" target="_blank">
                        💬 카카오톡 문의하기
                    </a>
                </div>
            </body>
            </html>
        `);
    }
}
