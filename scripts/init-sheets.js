/**
 * Google Sheets 초기화 스크립트
 *
 * 사용법: node scripts/init-sheets.js
 *
 * 이 스크립트는 Google Sheets에 필요한 시트와 헤더를 생성합니다.
 * 최초 1회만 실행하면 됩니다.
 */

import { initializeSpreadsheet } from '../api/lib/sheets.js';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

async function main() {
    console.log('🚀 Google Sheets 초기화 시작...\n');

    try {
        // 환경변수 확인
        if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT 환경변수가 설정되지 않았습니다.');
        }

        if (!process.env.SPREADSHEET_ID) {
            throw new Error('SPREADSHEET_ID 환경변수가 설정되지 않았습니다.');
        }

        console.log('✅ 환경변수 확인 완료');
        console.log(`📊 스프레드시트 ID: ${process.env.SPREADSHEET_ID}\n`);

        // 스프레드시트 초기화
        const result = await initializeSpreadsheet();

        console.log('✅ 초기화 완료!');
        console.log('\n📋 생성된 시트:');
        console.log('   1. Orders - 주문 정보');
        console.log('   2. DownloadLogs - 다운로드 기록');
        console.log('   3. Analytics - 분석 데이터');
        console.log('   4. EmailLogs - 이메일 발송 기록');
        console.log('\n💡 이제 판매 시스템을 사용할 수 있습니다!');

    } catch (error) {
        console.error('\n❌ 초기화 실패:', error.message);
        console.error('\n🔧 해결 방법:');
        console.error('   1. .env 파일에 GOOGLE_SERVICE_ACCOUNT와 SPREADSHEET_ID가 설정되어 있는지 확인');
        console.error('   2. Google Sheets API가 활성화되어 있는지 확인');
        console.error('   3. 서비스 계정에 스프레드시트 편집 권한이 있는지 확인');
        process.exit(1);
    }
}

main();
