import nodemailer from 'nodemailer';
import { saveOrder, getOrder, updateOrder } from './lib/sheets.js';
import { generateDownloadToken } from './lib/jwt.js';
import { sendPaymentConfirmation } from './lib/kakao-alimtalk.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { paymentKey, orderId, amount } = req.body;

    try {
        // 1. 중복 주문 확인
        const existingOrder = await getOrder(orderId);
        if (existingOrder) {
            // 이미 처리된 주문
            return res.status(200).json({
                success: true,
                email: existingOrder.customerEmail,
                orderId: orderId,
                message: '이미 처리된 주문입니다.'
            });
        }

        // 2. 토스페이먼츠 결제 승인
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount
            })
        });

        const payment = await response.json();

        if (!response.ok) {
            throw new Error(payment.message || '결제 승인 실패');
        }

        // 3. 보안 다운로드 토큰 생성
        const downloadToken = generateDownloadToken({
            orderId: orderId,
            customerEmail: payment.customerEmail
        });

        // 4. Google Sheets에 주문 정보 저장 (휴대폰 번호 포함)
        await saveOrder({
            orderId: orderId,
            paymentKey: paymentKey,
            amount: amount,
            customerEmail: payment.customerEmail,
            customerName: payment.customerName || '',
            customerPhone: payment.customerMobilePhone || '',
            status: 'PAID',
            paidAt: payment.approvedAt || new Date().toISOString(),
            downloadToken: downloadToken
        });

        // 5. 보안 다운로드 링크 생성
        const baseUrl = process.env.BASE_URL || 'https://your-domain.vercel.app';
        const secureDownloadLink = `${baseUrl}/api/download/${downloadToken}`;

        // 6. 이메일 발송
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const expiryHours = parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS) || 24;
        const maxDownloads = parseInt(process.env.MAX_DOWNLOAD_COUNT) || 5;

        const mailOptions = {
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: payment.customerEmail,
            subject: '🎉 Claude 완벽 가이드 구매 완료!',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <div style="font-size: 60px; margin-bottom: 20px;">🤖</div>
                        <h1 style="color: #2C3E50; margin-bottom: 10px;">구매해주셔서 감사합니다!</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">Claude 완벽 가이드를 구매해주셔서 진심으로 감사드립니다.</p>
                    </div>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <h2 style="margin-bottom: 20px; font-size: 24px;">🔐 보안 다운로드 링크</h2>
                        <a href="${secureDownloadLink}" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px;">
                            📥 PDF 다운로드하기
                        </a>
                        <div style="margin-top: 20px; font-size: 14px; opacity: 0.9;">
                            <p>⏱️ 링크 유효기간: ${expiryHours}시간</p>
                            <p>🔢 최대 다운로드: ${maxDownloads}회</p>
                        </div>
                    </div>

                    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-bottom: 15px;">⚠️ 중요 안내</h3>
                        <ul style="color: #856404; line-height: 1.8; padding-left: 20px; margin: 0;">
                            <li>다운로드 링크는 <strong>${expiryHours}시간 동안</strong> 유효합니다</li>
                            <li>최대 <strong>${maxDownloads}회</strong>까지 다운로드 가능합니다</li>
                            <li>링크가 만료되면 카카오톡 채널로 문의해주세요</li>
                            <li>보안을 위해 링크를 타인과 공유하지 마세요</li>
                        </ul>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 구매 내역</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>주문번호:</strong> ${orderId}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩${amount.toLocaleString()}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제일시:</strong> ${new Date(payment.approvedAt || new Date()).toLocaleString('ko-KR')}</p>
                    </div>

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #1976d2; margin-bottom: 15px;">💡 가이드 활용 팁</h3>
                        <ul style="color: #546E7A; line-height: 1.8; padding-left: 20px;">
                            <li>차례를 먼저 확인하고 필요한 부분부터 읽어보세요</li>
                            <li>설치 과정은 단계별로 천천히 따라해보세요</li>
                            <li>MCP 연결 가이드는 꼭 읽어보세요!</li>
                            <li>토큰 절약 노하우는 실전에서 큰 도움이 됩니다</li>
                            <li>궁금한 점은 카카오톡 채널로 문의주세요</li>
                        </ul>
                    </div>

                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2e7d32; margin-bottom: 15px;">🎁 구매자 특별 혜택</h3>
                        <ul style="color: #546E7A; line-height: 1.8; padding-left: 20px;">
                            <li>평생 무료 업데이트 (새 버전 출시 시 자동 제공)</li>
                            <li>카카오톡 채널 1:1 지원</li>
                            <li>AI 활용 노하우 무료 멘토링</li>
                        </ul>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">문의사항이 있으시면 언제든 연락주세요!</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px;">
                            💬 카카오톡 채널로 문의하기
                        </a>
                    </div>

                    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                        <p>이 이메일은 구매 확인 및 다운로드 링크 제공을 위한 자동 발송 메일입니다.</p>
                        <p>주문번호: ${orderId}</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // 7. 알림톡 발송 (휴대폰 번호가 있는 경우)
        let alimtalkResult = null;
        if (payment.customerMobilePhone) {
            alimtalkResult = await sendPaymentConfirmation({
                phoneNumber: payment.customerMobilePhone,
                orderId: orderId,
                amount: amount,
                downloadLink: secureDownloadLink
            });

            // 알림톡 발송 결과 Google Sheets 업데이트
            if (alimtalkResult.success) {
                await updateOrder(orderId, {
                    alimtalkSent: true,
                    alimtalkMessageId: alimtalkResult.messageId
                });
            }
        }

        // 8. 성공 응답
        return res.status(200).json({
            success: true,
            email: payment.customerEmail,
            orderId: orderId,
            downloadToken: downloadToken,
            emailSent: true,
            alimtalkSent: alimtalkResult?.success || false
        });

    } catch (error) {
        console.error('결제 처리 오류:', error);

        return res.status(500).json({
            success: false,
            message: error.message || '결제 처리 중 오류가 발생했습니다.'
        });
    }
}
