/**
 * 간소화된 다운로드 링크 발송 API
 * POST /api/send-download
 *
 * 이메일 주소를 받아서 PDF 다운로드 링크를 즉시 발송
 * 입금 확인 절차 없이 프로세스로 통제
 */

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    const { email, name } = req.body;

    // 이메일 검증
    if (!email || !email.includes('@')) {
        return res.status(400).json({
            success: false,
            error: '올바른 이메일 주소를 입력해주세요.'
        });
    }

    try {
        // PDF 다운로드 링크 (Google Drive 공유 링크)
        const downloadLink = process.env.PDF_DOWNLOAD_LINK || 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing';

        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // 이메일 내용
        const mailOptions = {
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🎉 Claude 완벽 가이드 구매 완료!',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <div style="font-size: 60px; margin-bottom: 20px;">🤖</div>
                        <h1 style="color: #2C3E50; margin-bottom: 10px;">${name || '고객'}님, 구매해주셔서 감사합니다!</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">Claude 완벽 가이드를 구매해주셔서 진심으로 감사드립니다.</p>
                    </div>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <h2 style="margin-bottom: 20px; font-size: 24px;">📥 PDF 다운로드</h2>
                        <a href="${downloadLink}" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px;">
                            PDF 다운로드하기
                        </a>
                        <div style="margin-top: 20px; font-size: 14px; opacity: 0.9;">
                            <p>⚠️ 이 링크를 북마크해두시면 언제든 다시 다운로드 가능합니다</p>
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 구매 내역</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>이메일:</strong> ${email}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩9,900</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>구매일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                    </div>

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #1976d2; margin-bottom: 15px;">💡 가이드 활용 팁</h3>
                        <ul style="color: #546E7A; line-height: 1.8; padding-left: 20px;">
                            <li>차례를 먼저 확인하고 필요한 부분부터 읽어보세요</li>
                            <li>설치 과정은 단계별로 천천히 따라해보세요</li>
                            <li>MCP 연결 가이드는 꼭 읽어보세요!</li>
                            <li>토큰 절약 노하우는 실전에서 큰 도움이 됩니다</li>
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

                    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-bottom: 15px;">⚠️ 환불 정책</h3>
                        <p style="color: #856404; line-height: 1.8;">
                            전자상거래법에 따라 구매일로부터 <strong>7일 이내</strong> 환불 요청 가능합니다.<br>
                            환불 요청은 카카오톡 채널로 문의해주세요.
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">문의사항이 있으시면 언제든 연락주세요!</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px;">
                            💬 카카오톡 채널로 문의하기
                        </a>
                    </div>

                    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                        <p>이 이메일은 구매 확인 및 다운로드 링크 제공을 위한 자동 발송 메일입니다.</p>
                        <p>받는 사람: ${email}</p>
                    </div>
                </div>
            `
        };

        // 이메일 발송
        await transporter.sendMail(mailOptions);

        // 성공 응답
        return res.status(200).json({
            success: true,
            message: '다운로드 링크가 이메일로 발송되었습니다.',
            email: email
        });

    } catch (error) {
        console.error('이메일 발송 오류:', error);

        return res.status(500).json({
            success: false,
            error: '이메일 발송 중 오류가 발생했습니다. 카카오톡 채널로 문의해주세요.'
        });
    }
}
