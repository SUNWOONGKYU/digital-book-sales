/**
 * 환불 처리 API
 * POST /api/refund/process
 *
 * 전자상거래법에 따른 7일 이내 환불 처리
 * - 주문 정보 확인
 * - 토스페이먼츠 환불 요청
 * - 주문 상태 업데이트
 * - 환불 완료 이메일 발송
 */

import nodemailer from 'nodemailer';
import { getOrder, updateOrder } from '../lib/sheets.js';
import { sendRefundConfirmation } from '../lib/kakao-alimtalk.js';

export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    const { orderId, cancelReason } = req.body;

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
                error: '주문을 찾을 수 없습니다.'
            });
        }

        // 2. 이미 환불된 주문인지 확인
        if (order.status === 'REFUNDED') {
            return res.status(400).json({
                success: false,
                error: '이미 환불된 주문입니다.'
            });
        }

        // 3. 환불 가능 기간 확인 (7일)
        const paidDate = new Date(order.paidAt);
        const now = new Date();
        const daysSincePurchase = Math.floor((now - paidDate) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase > 7) {
            return res.status(400).json({
                success: false,
                error: '환불 가능 기간(7일)이 지났습니다.',
                daysSincePurchase: daysSincePurchase
            });
        }

        // 4. 토스페이먼츠 환불 요청
        const refundResponse = await fetch(
            `https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cancelReason: cancelReason || '고객 요청'
                })
            }
        );

        const refundResult = await refundResponse.json();

        if (!refundResponse.ok) {
            throw new Error(refundResult.message || '환불 처리에 실패했습니다.');
        }

        // 5. 주문 상태 업데이트
        await updateOrder(orderId, {
            status: 'REFUNDED',
            refundedAt: new Date().toISOString()
        });

        // 6. 환불 완료 이메일 발송
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: order.customerEmail,
            subject: '✅ 환불 처리 완료 안내',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                        <h1 style="color: #2C3E50; margin-bottom: 10px;">환불 처리가 완료되었습니다</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">환불 요청이 정상적으로 처리되었습니다.</p>
                    </div>

                    <div style="background: #e8f5e9; border: 2px solid #4caf50; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2e7d32; margin-bottom: 15px;">💳 환불 정보</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>주문번호:</strong> ${orderId}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>환불금액:</strong> ₩${order.amount.toLocaleString()}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>환불일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                        ${cancelReason ? `<p style="color: #546E7A; margin: 8px 0;"><strong>환불사유:</strong> ${cancelReason}</p>` : ''}
                    </div>

                    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-bottom: 15px;">⏱️ 환불 처리 일정</h3>
                        <ul style="color: #856404; line-height: 1.8; padding-left: 20px; margin: 0;">
                            <li>신용카드: 2-3 영업일 내 승인 취소</li>
                            <li>체크카드/계좌이체: 영업일 기준 3-5일 이내 입금</li>
                            <li>환불 금액은 결제하신 수단으로 반환됩니다</li>
                        </ul>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 원 구매 내역</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>구매일시:</strong> ${new Date(order.paidAt).toLocaleString('ko-KR')}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩${order.amount.toLocaleString()}</p>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">더 나은 서비스로 다시 찾아뵙겠습니다.</p>
                        <p style="color: #7f8c8d; font-size: 14px;">문의사항이 있으시면 카카오톡 채널로 연락주세요.</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 15px;">
                            💬 카카오톡 문의하기
                        </a>
                    </div>

                    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                        <p>환불 처리는 토스페이먼츠를 통해 안전하게 진행됩니다.</p>
                        <p>주문번호: ${orderId}</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // 7. 알림톡 발송 (휴대폰 번호가 있는 경우)
        let alimtalkResult = null;
        if (order.customerPhone) {
            alimtalkResult = await sendRefundConfirmation({
                phoneNumber: order.customerPhone,
                orderId: orderId,
                amount: order.amount,
                refundDate: new Date().toLocaleString('ko-KR')
            });
        }

        // 8. 성공 응답
        return res.status(200).json({
            success: true,
            message: '환불이 성공적으로 처리되었습니다.',
            orderId: orderId,
            refundAmount: order.amount,
            refundedAt: new Date().toISOString(),
            emailSent: true,
            alimtalkSent: alimtalkResult?.success || false
        });

    } catch (error) {
        console.error('환불 처리 오류:', error);

        return res.status(500).json({
            success: false,
            error: error.message || '환불 처리 중 오류가 발생했습니다.'
        });
    }
}
