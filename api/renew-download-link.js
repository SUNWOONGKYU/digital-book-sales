/**
 * 다운로드 링크 재발급 API
 * POST /api/renew-download-link
 *
 * 고객이 카카오톡 채널을 통해 링크 재발급 요청 시 사용
 * - 주문 정보 확인
 * - 환불 여부 확인
 * - 남은 다운로드 횟수 확인
 * - 새 JWT 토큰 생성
 * - 이메일 + 알림톡 발송
 */

import nodemailer from 'nodemailer';
import { getOrder, getDownloadCount, updateOrder } from './lib/sheets.js';
import { generateDownloadToken } from './lib/jwt.js';
import { sendDownloadLinkRenewal } from './lib/kakao-alimtalk.js';

export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    const { orderId, customerEmail } = req.body;

    // 입력 검증
    if (!orderId) {
        return res.status(400).json({
            success: false,
            error: '주문번호가 필요합니다.'
        });
    }

    try {
        // 1. 주문 정보 확인
        const order = await getOrder(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: '주문을 찾을 수 없습니다. 주문번호를 확인해주세요.'
            });
        }

        // 2. 이메일 확인 (보안을 위해)
        if (customerEmail && order.customerEmail !== customerEmail) {
            return res.status(403).json({
                success: false,
                error: '주문 정보가 일치하지 않습니다.'
            });
        }

        // 3. 환불 여부 확인
        if (order.status === 'REFUNDED') {
            return res.status(403).json({
                success: false,
                error: '환불된 주문은 링크 재발급이 불가능합니다.'
            });
        }

        // 4. 다운로드 횟수 확인
        const downloadCount = await getDownloadCount(orderId);
        const maxDownloads = parseInt(process.env.MAX_DOWNLOAD_COUNT) || 5;
        const remainingCount = maxDownloads - downloadCount;

        if (remainingCount <= 0) {
            return res.status(429).json({
                success: false,
                error: '다운로드 횟수를 모두 소진했습니다.',
                message: '카카오톡 채널로 문의하시면 추가 다운로드를 도와드립니다.',
                kakaoChannelUrl: 'http://pf.kakao.com/_WqSxcn/chat'
            });
        }

        // 5. 새 JWT 토큰 생성
        const newToken = generateDownloadToken({
            orderId: orderId,
            customerEmail: order.customerEmail
        });

        // 6. 새 다운로드 링크 생성
        const baseUrl = process.env.BASE_URL || 'https://your-domain.vercel.app';
        const newDownloadLink = `${baseUrl}/api/download/${newToken}`;

        // 7. 주문 정보 업데이트 (새 토큰 저장)
        await updateOrder(orderId, {
            downloadToken: newToken
        });

        // 8. 이메일 발송
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const expiryHours = parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS) || 24;

        await transporter.sendMail({
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: order.customerEmail,
            subject: '🔄 다운로드 링크가 재발급되었습니다',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <div style="font-size: 60px; margin-bottom: 20px;">🔄</div>
                        <h1 style="color: #2C3E50; margin-bottom: 10px;">다운로드 링크 재발급</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">새로운 다운로드 링크가 발급되었습니다.</p>
                    </div>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <h2 style="margin-bottom: 20px; font-size: 24px;">🔐 새 다운로드 링크</h2>
                        <a href="${newDownloadLink}" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px;">
                            📥 PDF 다운로드하기
                        </a>
                        <div style="margin-top: 20px; font-size: 14px; opacity: 0.9;">
                            <p>⏱️ 링크 유효기간: ${expiryHours}시간</p>
                            <p>🔢 남은 다운로드: ${remainingCount}회</p>
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 주문 정보</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>주문번호:</strong> ${orderId}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>재발급 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>남은 다운로드:</strong> ${remainingCount}회</p>
                    </div>

                    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-bottom: 15px;">⚠️ 안내사항</h3>
                        <ul style="color: #856404; line-height: 1.8; padding-left: 20px; margin: 0;">
                            <li>이전 링크는 더 이상 사용할 수 없습니다</li>
                            <li>새 링크는 ${expiryHours}시간 동안 유효합니다</li>
                            <li>남은 다운로드 횟수: ${remainingCount}회</li>
                            <li>추가 재발급이 필요하면 카카오톡으로 문의해주세요</li>
                        </ul>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">추가 문의사항이 있으시면 연락주세요!</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px;">
                            💬 카카오톡 문의하기
                        </a>
                    </div>
                </div>
            `
        });

        // 9. 알림톡 발송 (휴대폰 번호가 있는 경우)
        let alimtalkResult = null;
        if (order.customerPhone) {
            alimtalkResult = await sendDownloadLinkRenewal({
                phoneNumber: order.customerPhone,
                orderId: orderId,
                newDownloadLink: newDownloadLink,
                remainingCount: remainingCount
            });
        }

        // 10. 성공 응답
        return res.status(200).json({
            success: true,
            message: '다운로드 링크가 재발급되었습니다.',
            orderId: orderId,
            remainingCount: remainingCount,
            downloadLink: newDownloadLink,
            emailSent: true,
            alimtalkSent: alimtalkResult?.success || false
        });

    } catch (error) {
        console.error('링크 재발급 오류:', error);

        return res.status(500).json({
            success: false,
            error: '링크 재발급 중 오류가 발생했습니다.',
            message: '카카오톡 채널로 문의해주시면 수동으로 도와드립니다.',
            kakaoChannelUrl: 'http://pf.kakao.com/_WqSxcn/chat'
        });
    }
}
