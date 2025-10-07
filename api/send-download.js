/**
 * PDF 다운로드 링크 발송 API
 * POST /api/send-download
 *
 * 이메일 주소를 받아서 Google Drive PDF 다운로드 링크를 발송
 */

import nodemailer from 'nodemailer';
import { saveEmailLog } from './lib/sheets.js';

export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    const { email, name, paymentMethod } = req.body;

    // 이메일 검증
    if (!email || !email.includes('@')) {
        return res.status(400).json({
            success: false,
            error: '올바른 이메일 주소를 입력해주세요.'
        });
    }

    try {
        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Google Drive PDF 링크 (환경 변수에서 가져오거나 직접 설정)
        const pdfDownloadLink = process.env.PDF_DOWNLOAD_LINK || 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing';

        // 이메일 내용
        const mailOptions = {
            from: `"Claude 설치부터 기본 사용까지 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🎉 Claude 설치부터 기본 사용까지 완벽 가이드 구매 완료!',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <div style="margin-bottom: 20px;">
                            <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                                <rect width="200" height="200" rx="20" fill="#D97757"/>
                                <path d="M100 60C85.86 60 74.29 71.57 74.29 85.71V114.29C74.29 128.43 85.86 140 100 140C114.14 140 125.71 128.43 125.71 114.29V85.71C125.71 71.57 114.14 60 100 60Z" fill="white"/>
                                <circle cx="100" cy="85" r="8" fill="#D97757"/>
                                <circle cx="100" cy="115" r="8" fill="#D97757"/>
                            </svg>
                        </div>
                        <h1 style="color: #2C3E50; margin-bottom: 10px;">${name || '고객'}님, 구매해주셔서 감사합니다!</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">Claude 설치부터 기본 사용까지 완벽 가이드를 구매해주셔서 진심으로 감사드립니다.</p>
                    </div>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <a href="${pdfDownloadLink}" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px;">
                            📄 PDF 다운로드하기
                        </a>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 구매 내역</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>이메일:</strong> ${email}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩5,000</p>
                    </div>

                    <div style="background: #e3f2fd; padding: 25px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
                        <p style="color: #546E7A; line-height: 1.8; font-size: 16px; margin-bottom: 15px;">
                            Claude 4종과 VS Code를 설치해서 능숙하게 사용하는 사람이 되세요.
                        </p>
                        <p style="color: #546E7A; line-height: 1.8; font-size: 16px; margin-bottom: 15px;">
                            자기 전문 분야에 AI를 활용하여 업무를 혁신하는 시스템을 개발하세요.
                        </p>
                        <p style="color: #546E7A; line-height: 1.8; font-size: 16px; margin-bottom: 15px;">
                            ChatGPT 등 여러 AI를 API로 연결해서 활용하고, 개발 주도권을 확실하게 본인이 가져가세요.
                        </p>
                        <p style="color: #546E7A; line-height: 1.8; font-size: 16px; margin-bottom: 15px;">
                            이제 더 이상 Claude 4종 세트의 설치와 사용을 미루지 마세요.
                        </p>
                        <p style="color: #1976d2; line-height: 1.8; font-size: 18px; font-weight: 700;">
                            Claude와 함께, 당신만의 AI 혁명을 시작하세요.
                        </p>
                    </div>

                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2e7d32; margin-bottom: 15px;">🎁 구매자 특별 혜택</h3>
                        <ul style="color: #546E7A; line-height: 1.8; padding-left: 20px;">
                            <li>GitHub를 통해서 지속적 업데이트 버전 제공</li>
                            <li>카카오톡 채널 "Claude World"를 통한 챗봇 및 저자와의 소통</li>
                            <li>AI 활용 사업모델에 대한 무료 멘토링</li>
                        </ul>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">문의사항이 있으시면 언제든 연락주세요!</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px;">
                            💬 카카오톡 채널 "Claude World"로 문의하기
                        </a>
                        <p style="color: #999; font-size: 12px; margin-top: 15px;">
                            링크: <a href="http://pf.kakao.com/_WqSxcn/chat" style="color: #1976d2;">http://pf.kakao.com/_WqSxcn/chat</a>
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                        <p>이 이메일은 구매 확인 및 PDF 제공을 위한 자동 발송 메일입니다.</p>
                        <p>받는 사람: ${email}</p>
                    </div>
                </div>
            `
        };

        // 이메일 발송
        await transporter.sendMail(mailOptions);

        // Google Sheets에 성공 로그 저장 (실패해도 무시)
        try {
            await saveEmailLog({
                paymentMethod: paymentMethod,
                email: email,
                name: name,
                success: true
            });
        } catch (sheetError) {
            console.error('Sheets 로그 저장 실패 (무시):', sheetError.message);
        }

        // 성공 응답
        return res.status(200).json({
            success: true,
            message: 'PDF 파일이 이메일로 발송되었습니다.',
            email: email
        });

    } catch (error) {
        console.error('이메일 발송 오류:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });

        // Google Sheets에 실패 로그 저장 (실패해도 무시)
        try {
            await saveEmailLog({
                paymentMethod: paymentMethod,
                email: email,
                name: name,
                success: false,
                errorMessage: error.message
            });
        } catch (sheetError) {
            console.error('Sheets 로그 저장 실패 (무시):', sheetError.message);
        }

        return res.status(500).json({
            success: false,
            error: '이메일 발송 중 오류가 발생했습니다. 카카오톡 채널 "Claude World"로 문의해주세요.',
            kakaoLink: 'http://pf.kakao.com/_WqSxcn/chat'
        });
    }
}
