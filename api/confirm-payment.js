const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { paymentKey, orderId, amount } = req.body;

    try {
        // 1. 토스페이먼츠 결제 승인
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

        // 2. 이메일 발송
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

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
                        <h2 style="margin-bottom: 20px; font-size: 24px;">PDF 다운로드</h2>
                        <a href="${process.env.PDF_DOWNLOAD_LINK}" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px;">
                            📥 PDF 다운로드하기
                        </a>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 구매 내역</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>주문번호:</strong> ${orderId}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩${amount.toLocaleString()}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                    </div>

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #1976d2; margin-bottom: 15px;">💡 가이드 활용 팁</h3>
                        <ul style="color: #546E7A; line-height: 1.8; padding-left: 20px;">
                            <li>차례를 먼저 확인하고 필요한 부분부터 읽어보세요</li>
                            <li>설치 과정은 단계별로 천천히 따라해보세요</li>
                            <li>토큰 절약 노하우는 꼭 읽어보세요!</li>
                            <li>궁금한 점은 카카오톡 채널로 문의주세요</li>
                        </ul>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">문의사항이 있으시면 언제든 연락주세요!</p>
                        <p style="color: #667eea; font-weight: 700;">📱 카카오톡 채널: @claude</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // 3. 성공 응답
        return res.status(200).json({
            success: true,
            email: payment.customerEmail,
            orderId: orderId
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
