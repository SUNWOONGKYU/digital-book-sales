# ⚡ 빠른 배포 가이드 (토스페이먼츠 없이)

> 오늘 단 몇 시간 만에 판매 시스템 구축하기

## 🎯 간소화된 시스템 구조

```
고객 → 랜딩 페이지 → 카카오페이 송금 → Google Forms → 입금 확인 → 자동 이메일 발송
```

## ⏱️ 타임라인 (총 1-2시간)

### Step 1: PDF 준비 (5분)
1. `Claude_완벽가이드_통합본.pdf` Google Drive 업로드
2. 공유 설정: "링크가 있는 모든 사용자"
3. 파일 ID 복사 (URL에서 `/d/FILE_ID/view`)

### Step 2: Google Forms 생성 (10분)

**폼 제목**: Claude 완벽 가이드 구매 정보

**질문 구성**:
1. 이름 (단답형, 필수)
2. 이메일 (단답형, 필수)
3. 휴대폰 번호 (단답형, 선택)
4. 입금자명 (단답형, 필수)
5. 입금 시각 (날짜/시간, 필수)
6. 개인정보 수집 동의 (객관식, 필수)
   - 동의함 (환불 정책 및 개인정보 처리방침에 동의합니다)

**설정**:
- 응답 → Google Sheets에 연결
- 새 스프레드시트 생성: "Claude가이드_주문관리"

### Step 3: Google Sheets 설정 (5분)

**시트 구성**:
1. `폼 응답 1` (자동 생성됨)
2. `승인된 주문` (수동 생성)

**승인된 주문 시트 컬럼**:
```
A: 타임스탬프
B: 이름
C: 이메일
D: 휴대폰
E: 입금자명
F: 입금시각
G: 승인일시
H: 발송상태
I: 주문번호
```

### Step 4: Apps Script 자동화 (15분)

**Apps Script 열기**:
1. Google Sheets → 확장 프로그램 → Apps Script
2. 아래 코드 붙여넣기

**코드**:
```javascript
// 환경 설정
const CONFIG = {
  PDF_FILE_ID: 'YOUR_GOOGLE_DRIVE_FILE_ID', // Step 1에서 복사한 ID
  GMAIL_USER: 'your-email@gmail.com',
  PRODUCT_NAME: 'Claude 완벽 가이드',
  PRICE: 9900,
  KAKAO_CHANNEL: 'http://pf.kakao.com/_WqSxcn/chat'
};

// 주문 승인 및 이메일 발송
function approveOrder(rowNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName('폼 응답 1');
  const approvedSheet = ss.getSheetByName('승인된 주문');

  // 폼 응답 데이터 가져오기
  const formData = formSheet.getRange(rowNumber, 1, 1, 6).getValues()[0];
  const [timestamp, name, email, phone, depositor, depositTime] = formData;

  // 주문번호 생성
  const orderId = 'CLG' + new Date().getTime();

  // 승인된 주문 시트에 추가
  approvedSheet.appendRow([
    timestamp,
    name,
    email,
    phone,
    depositor,
    depositTime,
    new Date(),
    '발송완료',
    orderId
  ]);

  // 다운로드 링크 생성
  const downloadLink = `https://drive.google.com/uc?export=download&id=${CONFIG.PDF_FILE_ID}`;

  // 이메일 발송
  sendPurchaseEmail(email, name, orderId, downloadLink);

  // 상태 표시
  formSheet.getRange(rowNumber, 7).setValue('✅ 승인완료');

  Logger.log(`주문 승인 완료: ${orderId} - ${email}`);
  return orderId;
}

// 구매 확인 이메일 발송
function sendPurchaseEmail(email, name, orderId, downloadLink) {
  const subject = '🎉 Claude 완벽 가이드 구매 완료!';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="font-size: 60px; margin-bottom: 20px;">🤖</div>
        <h1 style="color: #2C3E50; margin-bottom: 10px;">${name}님, 구매해주셔서 감사합니다!</h1>
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
        <p style="color: #546E7A; margin: 8px 0;"><strong>주문번호:</strong> ${orderId}</p>
        <p style="color: #546E7A; margin: 8px 0;"><strong>결제금액:</strong> ₩${CONFIG.PRICE.toLocaleString()}</p>
        <p style="color: #546E7A; margin: 8px 0;"><strong>결제일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
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
        <a href="${CONFIG.KAKAO_CHANNEL}" style="display: inline-block; background: #FEE500; color: #3C1E1E; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px;">
          💬 카카오톡 채널로 문의하기
        </a>
      </div>

      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        <p>이 이메일은 구매 확인 및 다운로드 링크 제공을 위한 자동 발송 메일입니다.</p>
        <p>주문번호: ${orderId}</p>
      </div>
    </div>
  `;

  GmailApp.sendEmail(email, subject, '', {
    htmlBody: htmlBody,
    name: CONFIG.PRODUCT_NAME
  });
}

// 메뉴 추가
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 주문 관리')
    .addItem('선택한 행 승인', 'approveSelectedOrder')
    .addSeparator()
    .addItem('테스트 이메일 발송', 'sendTestEmail')
    .addToUi();
}

// 선택한 주문 승인
function approveSelectedOrder() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveCell().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert('주문 행을 선택해주세요.');
    return;
  }

  const orderId = approveOrder(row);
  SpreadsheetApp.getUi().alert(`주문 승인 완료!\n주문번호: ${orderId}`);
}

// 테스트 이메일 발송
function sendTestEmail() {
  const testEmail = CONFIG.GMAIL_USER;
  const testOrderId = 'CLG_TEST_' + new Date().getTime();
  const downloadLink = `https://drive.google.com/uc?export=download&id=${CONFIG.PDF_FILE_ID}`;

  sendPurchaseEmail(testEmail, '테스트 고객', testOrderId, downloadLink);
  SpreadsheetApp.getUi().alert('테스트 이메일이 발송되었습니다!\n받는 사람: ' + testEmail);
}
```

**설정**:
1. `CONFIG` 객체의 `PDF_FILE_ID` 수정
2. `GMAIL_USER` 수정
3. 저장 후 `onOpen` 함수 실행 (▶️ 버튼)
4. 권한 승인

### Step 5: 랜딩 페이지 수정 (10분)

**landing.html 수정 필요**:
- "구매하기" 버튼을 두 단계로 변경
  1. 카카오페이 송금 버튼
  2. 주문 정보 입력 버튼 (Google Forms)

### Step 6: GitHub Pages 배포 (10분)

**옵션 A: GitHub Pages (더 빠름)**
```bash
cd sales-system
git init
git add .
git commit -m "Initial commit: Quick launch version"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/claude-guide-sales.git
git push -u origin main
```

GitHub 설정:
- Settings → Pages → Source: main branch
- URL: https://YOUR_USERNAME.github.io/claude-guide-sales/

**옵션 B: Vercel (더 빠른 배포)**
```bash
npm install -g vercel
vercel
```

## 📋 운영 프로세스

### 매일 해야 할 일

1. **입금 확인** (하루 2-3회)
   - 카카오페이 → 지갑 → 입출금 내역 확인
   - 입금자명과 Google Forms 응답 매칭

2. **주문 승인** (확인 즉시)
   - Google Sheets → 폼 응답 1 시트
   - 입금 확인된 행 선택
   - 메뉴: 🤖 주문 관리 → 선택한 행 승인
   - 자동으로 이메일 발송됨

3. **고객 문의 응답** (카카오톡 채널)
   - 환불 요청: 카카오페이로 송금 → 주문번호 확인
   - 링크 문의: 이메일 재발송 또는 직접 전달

### 환불 처리 (7일 이내)

1. 고객이 카카오톡 채널로 환불 요청
2. 주문번호 확인 → Google Sheets에서 확인
3. 카카오페이로 ₩9,900 송금
4. Google Sheets 상태 업데이트: "환불완료"

## 🎯 체크리스트

### 배포 전 (30분)
- [ ] PDF Google Drive 업로드 및 공유 링크 생성
- [ ] Google Forms 생성 및 Sheets 연결
- [ ] Apps Script 코드 붙여넣기 및 설정
- [ ] `승인된 주문` 시트 생성
- [ ] 테스트 이메일 발송 확인
- [ ] landing.html에 Forms 링크 추가

### 배포 (10분)
- [ ] GitHub 저장소 생성
- [ ] 코드 푸시
- [ ] GitHub Pages 또는 Vercel 배포
- [ ] 배포된 URL 접속 테스트

### 테스트 (10분)
- [ ] 카카오페이 송금 테스트 (₩9,900)
- [ ] Google Forms 제출 테스트
- [ ] 주문 승인 및 이메일 수신 확인
- [ ] PDF 다운로드 테스트

### Go Live! 🚀
- [ ] 카카오톡 채널에 링크 공유
- [ ] 지인들에게 테스트 구매 요청
- [ ] 첫 실제 주문 대기

## 💡 운영 팁

### 효율적인 주문 관리
- 스마트폰에 Google Sheets 앱 설치
- 카카오페이 알림 ON → 입금 즉시 확인
- 주문 승인은 PC에서 (Apps Script 메뉴 사용)

### 고객 만족도 향상
- 입금 확인 후 30분 이내 발송
- 친절한 카카오톡 응대
- 추가 질문에 빠른 답변

### 마케팅
- 카카오톡 채널 게시글에 랜딩 페이지 링크
- 후기 요청 (구매 3일 후)
- 업데이트 시 재구매자에게 무료 제공

## 🔄 나중에 업그레이드

**현재 시스템이 안정화되면**:
1. Toss Payments 연동 → 자동 결제
2. JWT 보안 다운로드 → 횟수 제한
3. 카카오 알림톡 → 자동 발송
4. 분석 대시보드 → 매출 통계

**지금은 이것만으로 충분합니다!** ✨
