/**
 * 이메일 발송 테스트 스크립트
 * 로컬에서 Gmail SMTP 설정이 정상적으로 작동하는지 테스트
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config();

async function testEmail() {
    console.log('📧 Gmail SMTP 설정 테스트 시작...\n');

    // 환경변수 확인
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ 오류: .env 파일에 Gmail 설정이 없습니다.');
        console.log('\n.env 파일에 다음 내용을 추가하세요:');
        console.log('GMAIL_USER=your-email@gmail.com');
        console.log('GMAIL_APP_PASSWORD=your-16-digit-app-password');
        process.exit(1);
    }

    console.log('✓ Gmail 사용자:', process.env.GMAIL_USER);
    console.log('✓ 앱 비밀번호:', process.env.GMAIL_APP_PASSWORD.substring(0, 4) + '************\n');

    try {
        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        console.log('📨 연결 테스트 중...');
        await transporter.verify();
        console.log('✓ Gmail SMTP 서버 연결 성공!\n');

        // PDF 파일 경로
        const pdfPath = path.join(__dirname, '판매용PDF', 'Claude_설치와사용_완벽가이드_v1.0.pdf');

        console.log('📄 PDF 파일 확인 중...');
        console.log('   경로:', pdfPath);

        const fs = await import('fs');
        if (!fs.existsSync(pdfPath)) {
            console.error('❌ PDF 파일을 찾을 수 없습니다.');
            console.log('   예상 경로:', pdfPath);
            process.exit(1);
        }
        console.log('✓ PDF 파일 존재 확인\n');

        // 테스트 이메일 발송
        const testEmail = process.env.GMAIL_USER; // 자기 자신에게 발송

        console.log('📧 테스트 이메일 발송 중...');
        console.log('   수신자:', testEmail);

        const mailOptions = {
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: testEmail,
            subject: '[테스트] Claude 완벽 가이드 - PDF 첨부 테스트',
            html: `
                <div style="font-family: -apple-system, sans-serif; padding: 20px;">
                    <h2 style="color: #D97757;">✅ 이메일 발송 테스트 성공!</h2>
                    <p>Gmail SMTP 설정이 정상적으로 작동합니다.</p>
                    <p>PDF 파일이 첨부되어 있는지 확인해주세요.</p>
                    <hr style="margin: 20px 0; border: 1px solid #eee;">
                    <p style="color: #7f8c8d; font-size: 14px;">
                        이 메일은 테스트용입니다.<br>
                        발송 시각: ${new Date().toLocaleString('ko-KR')}
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: 'Claude_설치와사용_완벽가이드_v1.0.pdf',
                    path: pdfPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('\n✅ 테스트 이메일 발송 완료!');
        console.log('   메시지 ID:', info.messageId);
        console.log('\n📬 받은편지함을 확인해주세요:');
        console.log('   - 메일이 도착했는지 확인');
        console.log('   - PDF 첨부파일이 있는지 확인');
        console.log('   - 스팸함도 확인해주세요\n');

    } catch (error) {
        console.error('\n❌ 오류 발생:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 인증 오류 해결 방법:');
            console.log('1. Gmail 앱 비밀번호가 올바른지 확인');
            console.log('2. 2단계 인증이 활성화되어 있는지 확인');
            console.log('3. 앱 비밀번호를 다시 생성해보세요');
        } else if (error.code === 'ENOTFOUND') {
            console.log('\n💡 네트워크 오류:');
            console.log('1. 인터넷 연결 확인');
            console.log('2. 방화벽 설정 확인');
        }

        process.exit(1);
    }
}

// 실행
testEmail();
