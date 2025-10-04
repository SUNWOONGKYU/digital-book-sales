/**
 * PDF 직접 첨부 발송 API
 * POST /api/send-download
 *
 * 이메일 주소를 받아서 PDF 파일을 직접 첨부하여 발송
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { saveEmailLog } from './lib/sheets.js';

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
        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // PDF 파일 경로
        const pdfPath = path.join(process.cwd(), '판매용PDF', 'Claude_설치와사용_완벽가이드_v1.0.pdf');

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
                        <h2 style="margin-bottom: 15px; font-size: 24px;">📎 PDF 파일 첨부</h2>
                        <p style="font-size: 16px; opacity: 0.95;">이 이메일에 PDF 파일이 첨부되어 있습니다.</p>
                        <p style="font-size: 14px; margin-top: 15px; opacity: 0.9;">📥 첨부파일을 다운로드하여 바로 이용하실 수 있습니다</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #2C3E50; margin-bottom: 15px;">📋 구매 내역</h3>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>이메일:</strong> ${email}</p>
                        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩5,000</p>
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
                            <li>GitHub를 통해서 지속적 업데이트 버전 제공</li>
                            <li>카카오톡 채널 "AI실전활용연구소"를 통한 챗봇 및 저자와의 소통</li>
                            <li>AI 활용 사업모델에 대한 무료 멘토링</li>
                        </ul>
                    </div>

                    <div style="text-align: center; padding: 20px; border-top: 2px solid #e0e0e0;">
                        <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">문의사항이 있으시면 언제든 연락주세요!</p>
                        <a href="http://pf.kakao.com/_WqSxcn/chat" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px;">
                            💬 카카오톡 채널 "AI실전활용연구소"로 문의하기
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
            `,
            attachments: [
                {
                    filename: 'Claude_설치와사용_완벽가이드_v1.0.pdf',
                    path: pdfPath
                }
            ]
        };

        // 이메일 발송
        await transporter.sendMail(mailOptions);

        // Google Sheets에 성공 로그 저장 (실패해도 무시)
        try {
            await saveEmailLog({
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
            error: '이메일 발송 중 오류가 발생했습니다. 카카오톡 채널 "AI실전활용연구소"로 문의해주세요.',
            kakaoLink: 'http://pf.kakao.com/_WqSxcn/chat'
        });
    }
}
