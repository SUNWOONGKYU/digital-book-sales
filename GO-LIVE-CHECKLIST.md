# 🚀 실전 배포 체크리스트 - Claude 완벽 가이드 판매 시스템

## 🎯 개요

PDF 파일이 완성되었으니 이제 실제로 판매를 시작합니다!
이 문서는 배포 전 확인사항부터 실제 운영까지 단계별 가이드입니다.

**현재 상태:** PDF 완성 ✅
**다음 단계:** 시스템 배포 및 판매 시작

---

## 📋 Phase 1: 배포 전 준비 (1-2일)

### 1. PDF 파일 준비 ✅

**위치 확인:**
```
G:\내 드라이브\Content\ClaudeCC\Claude설치가이드\v2.0\backup_20251002_1445\Claude_완벽가이드_통합본.html
```

**PDF 변환:**
- [ ] HTML을 PDF로 변환 완료
- [ ] 페이지 수 확인 (200페이지 내외)
- [ ] 목차 동작 확인
- [ ] 이미지 품질 확인
- [ ] 파일 크기 확인 (권장: 10MB 이하)

**PDF 파일명:**
```
Claude_완벽가이드_v1.0.pdf
```

### 2. Google Drive 업로드

**단계:**

1. **Google Drive 접속**
   - [drive.google.com](https://drive.google.com/) 접속
   - 새 폴더 생성: "Claude 완벽 가이드 판매용"

2. **PDF 업로드**
   - PDF 파일 업로드
   - 파일 우클릭 → "공유"
   - "링크가 있는 모든 사용자" 선택
   - 권한: "뷰어" (다운로드 가능)

3. **파일 ID 복사**
   ```
   URL: https://drive.google.com/file/d/1bGI3-ojeN0dMkHMVvZ00cx_wsKkVHyFn/view
                                         ↑ 이 부분이 FILE_ID
   ```

   **저장할 값:**
   ```
   PDF_FILE_ID=1bGI3-ojeN0dMkHMVvZ00cx_wsKkVHyFn
   ```

### 3. Google Cloud Platform 설정

#### 3.1 프로젝트 생성

- [ ] [Google Cloud Console](https://console.cloud.google.com/) 접속
- [ ] 새 프로젝트 생성: "claude-guide-sales"
- [ ] 프로젝트 ID 기록

#### 3.2 Google Sheets API 활성화

- [ ] API 및 서비스 → 라이브러리
- [ ] "Google Sheets API" 검색
- [ ] "사용 설정" 클릭

#### 3.3 서비스 계정 생성

1. **서비스 계정 만들기**
   - [ ] API 및 서비스 → 사용자 인증 정보
   - [ ] "사용자 인증 정보 만들기" → "서비스 계정"
   - [ ] 이름: `claude-sales-service`
   - [ ] 역할: 없음 (기본)
   - [ ] 완료 클릭

2. **키 생성**
   - [ ] 생성한 서비스 계정 클릭
   - [ ] "키" 탭 → "키 추가" → "새 키 만들기"
   - [ ] JSON 형식 선택
   - [ ] 다운로드된 JSON 파일 안전하게 보관

3. **JSON 파일 내용 확인**
   ```json
   {
     "type": "service_account",
     "project_id": "claude-guide-sales",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "claude-sales-service@claude-guide-sales.iam.gserviceaccount.com",
     ...
   }
   ```

#### 3.4 Google Sheets 생성

1. **스프레드시트 생성**
   - [ ] [Google Sheets](https://sheets.google.com/) 접속
   - [ ] 새 스프레드시트 생성
   - [ ] 이름: "Claude 가이드 판매 데이터"

2. **스프레드시트 ID 복사**
   ```
   URL: https://docs.google.com/spreadsheets/d/1AbC_XyZ.../edit
                                               ↑ 이 부분이 SPREADSHEET_ID
   ```

3. **서비스 계정에 권한 부여**
   - [ ] 우측 상단 "공유" 클릭
   - [ ] JSON 파일의 `client_email` 추가
   - [ ] 예: `claude-sales-service@claude-guide-sales.iam.gserviceaccount.com`
   - [ ] 권한: "편집자"
   - [ ] "알림 보내지 않음" 체크
   - [ ] 완료

### 4. 토스페이먼츠 설정

#### 4.1 가맹점 가입

- [ ] [토스페이먼츠](https://www.tosspayments.com/) 접속
- [ ] "시작하기" 클릭
- [ ] 사업자 정보 입력
- [ ] 심사 대기 (2-3일)

**참고:** 심사 전까지는 테스트 키로 개발 가능

#### 4.2 API 키 발급

**테스트 환경:**
```
TOSS_CLIENT_KEY=test_gck_docs_OaPz8L5KdmQXkzRz3y47BMw6
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
```

**실제 환경 (심사 승인 후):**
- [ ] 토스페이먼츠 대시보드 → 개발자센터 → API 키
- [ ] 라이브 키 발급
- [ ] 안전하게 보관

### 5. Gmail SMTP 설정

#### 5.1 Google 계정 2단계 인증 활성화

- [ ] [Google 계정 관리](https://myaccount.google.com/) 접속
- [ ] 보안 → 2단계 인증
- [ ] 활성화 및 설정 완료

#### 5.2 앱 비밀번호 생성

- [ ] 보안 → 2단계 인증 → 앱 비밀번호
- [ ] 앱 선택: "기타"
- [ ] 이름 입력: "Claude 가이드 판매"
- [ ] "생성" 클릭
- [ ] **16자리 비밀번호 복사 및 보관**

**예시:**
```
abcd efgh ijkl mnop
```

**환경변수:**
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop  (공백 제거)
```

### 6. 카카오톡 채널 설정

#### 6.1 채널 개설

- [ ] [카카오톡 채널 관리자센터](https://center-pf.kakao.com/) 접속
- [ ] "새 채널 만들기"
- [ ] 채널명: `Claude 완벽 가이드`
- [ ] 검색용 ID: `@claude` (사용 가능한 ID)
- [ ] 카테고리: IT/기술
- [ ] 프로필 이미지 업로드

#### 6.2 채널 URL 확인

```
http://pf.kakao.com/_WqSxcn
```

**환경변수:**
```
KAKAO_CHANNEL_ID=_WqSxcn
```

#### 6.3 자동 응답 설정

**경로:** 채널 관리 → 채팅 → 자동 응답

**첫 채팅 메시지:**
```
안녕하세요! Claude 완벽 가이드입니다 🤖

무엇을 도와드릴까요?

1️⃣ 다운로드 링크 문제
2️⃣ 환불 문의
3️⃣ 업데이트 문의
4️⃣ 기타 문의

숫자를 입력해주세요!

💡 주문번호가 있으면 더 빠른 도움이 가능합니다.
```

**부재중 메시지:**
```
현재 상담 시간이 아닙니다.

⏰ 상담 시간: 평일 09:00-18:00

급하신 경우 이메일로 문의해주세요.
📧 your-email@gmail.com

[이메일 문의하기]
```

### 7. 알림톡 설정 (선택사항)

**필요성 판단:**
- 월 100건 미만: ❌ 필요 없음 (이메일만으로 충분)
- 월 100건 이상: ✅ 추천 (고객 경험 향상)

**설정 시:**
- [ ] 카카오톡 채널 비즈니스 인증 (3-5일)
- [ ] [Solapi](https://solapi.com/) 가입
- [ ] API 키 발급
- [ ] 템플릿 3종 등록 및 승인 (1-2일)

---

## 📋 Phase 2: GitHub 및 Vercel 배포 (1일)

### 1. GitHub Repository 생성

#### 1.1 로컬 Git 초기화

```bash
# sales-system 디렉토리로 이동
cd "G:\내 드라이브\Content\ClaudeCC\Claude설치가이드\v2.0\sales-system"

# Git 초기화
git init

# .gitignore 생성
cat > .gitignore << EOF
node_modules/
.env
.vercel
.DS_Store
*.log
EOF

# 첫 커밋
git add .
git commit -m "Initial commit: Claude 완벽 가이드 판매 시스템 v2.1"
```

#### 1.2 GitHub에 Repository 생성

- [ ] [GitHub](https://github.com/) 접속
- [ ] "New repository" 클릭
- [ ] Repository 이름: `claude-guide-sales`
- [ ] 설명: `Claude 완벽 가이드 자동 판매 시스템`
- [ ] Private 선택 (중요!)
- [ ] README 추가 안함 (이미 있음)
- [ ] Create repository

#### 1.3 로컬과 GitHub 연결

```bash
# GitHub Repository URL 복사 (예시)
git remote add origin https://github.com/your-username/claude-guide-sales.git

# main 브랜치로 변경
git branch -M main

# 푸시
git push -u origin main
```

### 2. Vercel 프로젝트 생성

#### 2.1 Vercel 가입 및 연결

- [ ] [Vercel](https://vercel.com/) 접속
- [ ] "Sign up" 또는 GitHub 계정으로 로그인
- [ ] "Add New Project" 클릭

#### 2.2 GitHub Repository 연결

- [ ] "Import Git Repository" 선택
- [ ] `claude-guide-sales` 선택
- [ ] "Import" 클릭

#### 2.3 프로젝트 설정

**Framework Preset:** Other
**Root Directory:** ./
**Build Command:** (비워둠)
**Output Directory:** (비워둠)

- [ ] "Deploy" 클릭 (첫 배포는 환경변수 없이)

### 3. 환경변수 설정

#### 3.1 Vercel 대시보드

**경로:** Vercel 프로젝트 → Settings → Environment Variables

#### 3.2 필수 환경변수 입력

**토스페이먼츠:**
```
TOSS_CLIENT_KEY=test_gck_docs_OaPz8L5KdmQXkzRz3y47BMw6
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
```

**Gmail SMTP:**
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=발급받은_16자리_비밀번호
```

**Google Drive:**
```
PDF_FILE_ID=1bGI3-ojeN0dMkHMVvZ00cx_wsKkVHyFn
PDF_DOWNLOAD_LINK=https://drive.google.com/file/d/1bGI3-ojeN0dMkHMVvZ00cx_wsKkVHyFn/view
```

**Google Sheets:**
```
GOOGLE_SERVICE_ACCOUNT=전체_JSON_내용_한줄로
SPREADSHEET_ID=복사한_스프레드시트_ID
```

**Google Sheets JSON 한 줄로 만들기:**
```bash
# Windows PowerShell
(Get-Content service-account.json -Raw) -replace '\s+', ' '

# Mac/Linux
cat service-account.json | tr -d '\n'
```

**보안:**
```bash
# JWT Secret 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
```
JWT_SECRET=생성된_64자리_문자열
DOWNLOAD_TOKEN_EXPIRY_HOURS=24
MAX_DOWNLOAD_COUNT=5
```

**카카오톡:**
```
KAKAO_CHANNEL_ID=_WqSxcn
KAKAO_PFID=실제_채널_ID
```

**환경:**
```
NODE_ENV=production
BASE_URL=https://프로젝트명.vercel.app
```

**알림톡 (선택):**
```
SOLAPI_API_KEY=발급받은_키
SOLAPI_API_SECRET=발급받은_시크릿
KAKAO_SENDER_KEY=발신번호
KAKAO_TEMPLATE_PAYMENT=템플릿_ID
KAKAO_TEMPLATE_REFUND=템플릿_ID
KAKAO_TEMPLATE_RENEWAL=템플릿_ID
```

#### 3.3 환경변수 적용

- [ ] 모든 환경변수 입력 완료
- [ ] "Save" 클릭
- [ ] Deployments → "Redeploy" 클릭

### 4. 도메인 설정 (선택)

**Vercel 기본 도메인:**
```
https://claude-guide-sales.vercel.app
```

**커스텀 도메인 (선택):**
- [ ] Vercel 프로젝트 → Settings → Domains
- [ ] 도메인 추가 (예: claude-guide.com)
- [ ] DNS 설정 (도메인 등록 업체에서)
- [ ] 인증서 자동 발급 대기

---

## 📋 Phase 3: 시스템 초기화 및 테스트 (1일)

### 1. Google Sheets 초기화

#### 1.1 로컬에서 초기화 스크립트 실행

```bash
# 프로젝트 디렉토리
cd sales-system

# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (실제 값 입력)
# Windows: notepad .env
# Mac: nano .env

# 초기화 스크립트 실행
npm run init-sheets
```

**예상 출력:**
```
🚀 Google Sheets 초기화 시작...

✅ 환경변수 확인 완료
📊 스프레드시트 ID: 1AbC_XyZ...

✅ 초기화 완료!

📋 생성된 시트:
   1. Orders - 주문 정보
   2. DownloadLogs - 다운로드 기록
   3. Analytics - 분석 데이터

💡 이제 판매 시스템을 사용할 수 있습니다!
```

#### 1.2 Google Sheets 확인

- [ ] Google Sheets 열기
- [ ] 3개 시트 생성 확인: Orders, DownloadLogs, Analytics
- [ ] 헤더 행 확인

**Orders 시트 헤더:**
```
A: orderId
B: paymentKey
C: amount
D: customerEmail
E: customerName
F: customerPhone
G: status
H: createdAt
I: paidAt
J: refundedAt
K: downloadToken
L: alimtalkSent
M: alimtalkMessageId
```

### 2. 테스트 결제

#### 2.1 랜딩 페이지 접속

```
https://your-domain.vercel.app/
```

- [ ] 페이지 정상 로딩 확인
- [ ] 가격 표시 확인: ₩9,990
- [ ] 카카오페이 버튼 확인
- [ ] 계좌이체 버튼 확인

#### 2.2 테스트 결제 진행

**"구매하기" 버튼 클릭**

- [ ] 토스페이먼츠 결제창 표시
- [ ] 테스트 카드 입력:
  - 카드번호: `4242424242424242`
  - 유효기간: 미래 날짜 (예: 12/25)
  - CVC: 임의 3자리 (예: 123)
  - 비밀번호 앞 2자리: 임의 (예: 12)
  - 생년월일: YYMMDD (예: 901225)
- [ ] 결제 완료

#### 2.3 결과 확인

**1. 리다이렉트 확인**
- [ ] `success.html` 페이지로 이동
- [ ] "결제가 완료되었습니다" 메시지 표시
- [ ] 이메일 확인 안내 표시

**2. 이메일 수신 확인**
- [ ] Gmail 받은편지함 확인
- [ ] "🎉 Claude 완벽 가이드 구매 완료!" 제목
- [ ] 보안 다운로드 링크 포함
- [ ] 유효기간 24시간 표시
- [ ] 최대 5회 다운로드 안내

**3. Google Sheets 데이터 확인**
- [ ] Orders 시트에 주문 데이터 추가
- [ ] orderId, customerEmail, amount 확인
- [ ] downloadToken 생성 확인
- [ ] status: PAID 확인

**4. 다운로드 테스트**
- [ ] 이메일의 다운로드 링크 클릭
- [ ] "다운로드 준비 완료" 페이지 표시
- [ ] 자동으로 PDF 다운로드 시작
- [ ] PDF 파일 정상 열림 확인
- [ ] DownloadLogs 시트에 기록 확인

### 3. 환불 테스트

#### 3.1 환불 API 호출

```bash
curl -X POST https://your-domain.vercel.app/api/refund/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "테스트_주문번호",
    "cancelReason": "테스트 환불"
  }'
```

#### 3.2 결과 확인

- [ ] 환불 성공 응답
- [ ] Google Sheets status: REFUNDED
- [ ] 환불 완료 이메일 수신
- [ ] 토스페이먼츠 대시보드에서 환불 확인

### 4. 링크 재발급 테스트

```bash
curl -X POST https://your-domain.vercel.app/api/renew-download-link \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "테스트_주문번호"
  }'
```

- [ ] 새 링크 발급 성공
- [ ] 이메일 수신
- [ ] 새 링크로 다운로드 가능

---

## 📋 Phase 4: 실제 운영 시작 (즉시)

### 1. 실제 결제 활성화

#### 1.1 토스페이먼츠 심사 완료 확인

- [ ] 토스페이먼츠 가맹점 심사 완료
- [ ] 라이브 API 키 발급

#### 1.2 환경변수 업데이트

**Vercel 환경변수:**
```
TOSS_CLIENT_KEY=실제_라이브_키
TOSS_SECRET_KEY=실제_라이브_시크릿_키
```

- [ ] 저장 후 재배포

### 2. 가격 및 내용 최종 확인

#### 2.1 landing.html 확인

- [ ] 가격: ₩9,990
- [ ] 할인율: 50% (정가 ₩19,900)
- [ ] 페이지 수: 200페이지
- [ ] 저자: 써니 (선웅규)
- [ ] 버전: v1.0

#### 2.2 index.html 확인

- [ ] 동일한 가격 정보
- [ ] 결제 버튼 작동

### 3. 마케팅 준비

#### 3.1 카카오톡 채널 홍보

**프로필 업데이트:**
```
📚 Claude 완벽 가이드
저자: 써니 (선웅규)

💰 특별가: ₩9,990 (50% 할인)
📄 200페이지 PDF

🛒 구매하기
https://your-domain.vercel.app

💬 문의: 카카오톡 메시지
```

#### 3.2 소셜 미디어 준비

**공유용 텍스트:**
```
🤖 5개월 만에 완전히 다른 사람이 되었습니다

Claude Desktop 설치부터 실전 활용까지!
공인회계사가 직접 쓴 200페이지 완벽 가이드

✅ 특허출원서 5건 작성
✅ 시스템 설계서 6개 완성
✅ 책 3권 동시 집필

📚 Claude 완벽 가이드
저자: 써니 (선웅규, 연세대 경영학과, 공인회계사)

💰 오늘만 특별가: ₩9,990 (50% 할인)
📄 200페이지 PDF + 평생 무료 업데이트

🛒 지금 구매하기
https://your-domain.vercel.app

#Claude #AI활용 #업무자동화
```

### 4. 모니터링 설정

#### 4.1 Google Sheets 대시보드

**실시간 확인 항목:**
- 총 주문 건수: `=COUNTA(Orders!A:A)-1`
- 총 매출: `=SUM(Orders!C:C)`
- 환불 건수: `=COUNTIF(Orders!G:G,"REFUNDED")`
- 환불율: `=COUNTIF(Orders!G:G,"REFUNDED")/COUNTA(Orders!A:A)*100`

#### 4.2 일일 체크리스트

**매일 오전:**
- [ ] Gmail 일일 리포트 확인
- [ ] Google Sheets 주문 현황 확인
- [ ] 카카오톡 채널 문의 응대
- [ ] 토스페이먼츠 대시보드 확인

**매일 오후:**
- [ ] 수동 결제 처리 (카카오페이/계좌이체)
- [ ] 고객 문의 응대
- [ ] 환불 요청 처리

---

## 🎯 최종 점검

### 시스템 준비 상태

- [ ] ✅ PDF 파일 Google Drive 업로드
- [ ] ✅ Google Cloud Platform 설정 완료
- [ ] ✅ Google Sheets 초기화 완료
- [ ] ✅ 토스페이먼츠 설정 완료
- [ ] ✅ Gmail SMTP 설정 완료
- [ ] ✅ 카카오톡 채널 개설 완료
- [ ] ✅ GitHub Repository 생성 완료
- [ ] ✅ Vercel 배포 완료
- [ ] ✅ 환경변수 설정 완료
- [ ] ✅ 테스트 결제 성공
- [ ] ✅ 이메일 발송 성공
- [ ] ✅ 다운로드 성공
- [ ] ✅ 환불 테스트 성공

### 운영 준비 상태

- [ ] ✅ 실제 API 키 적용 (토스페이먼츠)
- [ ] ✅ 가격 및 내용 최종 확인
- [ ] ✅ 마케팅 자료 준비
- [ ] ✅ 소셜 미디어 공유 준비
- [ ] ✅ 모니터링 대시보드 설정

---

## 🚀 Go Live!

모든 체크리스트가 완료되었다면:

### 1. 최종 배포
```bash
git add .
git commit -m "Go Live: 실제 판매 시작"
git push origin main
```

### 2. 판매 시작 선언
- 카카오톡 채널 공지
- 소셜 미디어 공유
- 지인들에게 공유

### 3. 첫 주문 대기
- Gmail 알림 대기
- Google Sheets 모니터링
- 카카오톡 채널 확인

---

## 📞 긴급 상황 대응

### 이메일이 발송되지 않을 때
1. Vercel Logs 확인
2. GMAIL_APP_PASSWORD 재확인
3. Gmail 계정 2단계 인증 확인

### 결제가 실패할 때
1. 토스페이먼츠 API 키 확인
2. 테스트/라이브 키 구분 확인
3. 토스페이먼츠 대시보드 확인

### PDF가 다운로드되지 않을 때
1. Google Drive 공유 설정 확인
2. PDF_FILE_ID 재확인
3. 파일 권한 "뷰어" 확인

---

## 📊 첫 달 목표

### 판매 목표
- Week 1: 5-10건
- Week 2: 10-20건
- Week 3: 20-30건
- Week 4: 30-50건
- **월 목표: 100건 (₩999,000 매출)**

### 고객 만족도 목표
- 환불율: <5%
- 다운로드 성공률: >95%
- 평균 응대 시간: <1시간

### 시스템 안정성 목표
- 가동률: >99%
- 이메일 발송 성공률: >95%
- API 응답 시간: <2초

---

**배포 준비 완료!** 🎉

이제 실제로 판매를 시작할 수 있습니다!

**작성일:** 2025년 10월 4일
**버전:** v2.1 (통합)
**다음 단계:** 실제 배포 실행
