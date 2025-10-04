# 📦 배포 가이드 - Claude 완벽 가이드 판매 시스템 v2.0

## 🎯 개요

이 가이드는 보안이 강화된 v2.0 판매 시스템을 Vercel에 배포하는 전체 과정을 안내합니다.

**주요 개선 사항:**
- ✅ Google Sheets 데이터베이스 연동
- ✅ JWT 기반 보안 다운로드 시스템
- ✅ 다운로드 횟수 제한 (5회)
- ✅ 다운로드 링크 만료 (24시간)
- ✅ 자동 환불 처리
- ✅ 일일 분석 리포트 자동 발송

---

## 📋 사전 준비사항

### 1. Google Cloud Platform 설정

#### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (예: `claude-guide-sales`)

#### 1.2 Google Sheets API 활성화
1. API 및 서비스 > 라이브러리
2. "Google Sheets API" 검색 후 활성화

#### 1.3 서비스 계정 생성
1. API 및 서비스 > 사용자 인증 정보
2. "사용자 인증 정보 만들기" > "서비스 계정"
3. 서비스 계정 이름 입력 (예: `sheets-service`)
4. 역할 선택 안함 (기본 권한으로 충분)
5. 완료 클릭

#### 1.4 서비스 계정 키 생성
1. 생성한 서비스 계정 클릭
2. "키" 탭 > "키 추가" > "새 키 만들기"
3. JSON 형식 선택
4. 다운로드된 JSON 파일 안전하게 보관

#### 1.5 Google Sheets 생성 및 권한 부여
1. [Google Sheets](https://sheets.google.com/) 접속
2. 새 스프레드시트 생성 (이름: `Claude 가이드 판매 데이터`)
3. 스프레드시트 ID 복사 (URL의 `/d/` 다음 문자열)
   ```
   https://docs.google.com/spreadsheets/d/[이_부분이_SPREADSHEET_ID]/edit
   ```
4. 우측 상단 "공유" 클릭
5. 서비스 계정 이메일 추가 (JSON 파일의 `client_email` 값)
6. 권한: "편집자" 선택
7. 완료

### 2. 토스페이먼츠 설정
1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) 가입
2. 테스트 API 키 발급받기
3. 실제 판매 시작 시 실제 API 키로 교체

### 3. Gmail SMTP 설정
1. Google 계정 보안 설정
2. 2단계 인증 활성화
3. 앱 비밀번호 생성 (16자리)
   - 계정 관리 > 보안 > 2단계 인증 > 앱 비밀번호
   - "앱 선택" > 기타
   - 이름 입력 (예: `Claude 가이드 판매`)

### 4. Google Drive PDF 업로드
1. Google Drive에 PDF 파일 업로드
2. 파일 우클릭 > "공유" > "링크가 있는 모든 사용자"
3. 파일 ID 복사 (URL의 `/d/` 다음 문자열)
   ```
   https://drive.google.com/file/d/[이_부분이_FILE_ID]/view
   ```

---

## 🚀 배포 단계

### Step 1: GitHub Repository 생성

```bash
# 프로젝트 디렉토리로 이동
cd sales-system

# Git 초기화
git init

# .gitignore 생성
echo "node_modules/
.env
.vercel
.DS_Store" > .gitignore

# 첫 커밋
git add .
git commit -m "Initial commit: Claude 완벽 가이드 판매 시스템 v2.0"

# GitHub에 푸시 (사전에 GitHub에서 repository 생성)
git remote add origin https://github.com/your-username/claude-guide-sales.git
git branch -M main
git push -u origin main
```

### Step 2: Vercel 프로젝트 생성

1. [Vercel](https://vercel.com/) 가입/로그인
2. "Add New Project" 클릭
3. GitHub repository 연결
4. Framework Preset: "Other" 선택
5. "Deploy" 클릭 (아직 환경변수 설정 안 함)

### Step 3: 환경변수 설정

Vercel 프로젝트 > Settings > Environment Variables

다음 환경변수 추가:

#### 토스페이먼츠
```env
TOSS_CLIENT_KEY=test_gck_docs_OaPz8L5KdmQXkzRz3y47BMw6
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
```
*실제 판매 시 실제 키로 교체 필요*

#### Gmail SMTP
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=앱_비밀번호_16자리
```

#### Google Drive
```env
PDF_FILE_ID=복사한_파일_ID
PDF_DOWNLOAD_LINK=https://drive.google.com/file/d/복사한_파일_ID/view
```

#### Google Sheets
```env
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...전체_JSON_내용..."}
SPREADSHEET_ID=복사한_스프레드시트_ID
```
*JSON 파일 내용을 한 줄로 압축해서 입력*

#### 보안 설정
```env
JWT_SECRET=최소_32자_이상의_랜덤_문자열
DOWNLOAD_TOKEN_EXPIRY_HOURS=24
MAX_DOWNLOAD_COUNT=5
```

JWT_SECRET 생성 방법:
```bash
# Node.js로 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 카카오톡 (선택사항)
```env
KAKAO_CHANNEL_ID=_WqSxcn
```

#### 환경 설정
```env
NODE_ENV=production
BASE_URL=https://your-domain.vercel.app
```
*BASE_URL은 Vercel 배포 후 실제 도메인으로 교체*

### Step 4: Google Sheets 초기화

로컬 환경에서:

```bash
# 의존성 설치
npm install

# dotenv 설치 (개발용)
npm install --save-dev dotenv

# .env 파일 생성 (환경변수 복사)
cp .env.example .env
# .env 파일 편집하여 실제 값 입력

# Google Sheets 초기화
npm run init-sheets
```

성공 메시지 확인:
```
✅ 초기화 완료!

📋 생성된 시트:
   1. Orders - 주문 정보
   2. DownloadLogs - 다운로드 기록
   3. Analytics - 분석 데이터

💡 이제 판매 시스템을 사용할 수 있습니다!
```

### Step 5: 재배포

환경변수 설정 후 Vercel에서 재배포:

```bash
# Vercel CLI로 배포 (선택사항)
npx vercel --prod

# 또는 Vercel 대시보드에서
# Deployments > ... > Redeploy
```

### Step 6: 도메인 설정

1. Vercel 프로젝트 > Settings > Domains
2. 커스텀 도메인 추가 (선택사항)
3. 또는 Vercel 기본 도메인 사용
4. `.env`의 `BASE_URL` 업데이트 후 재배포

---

## ✅ 배포 검증

### 1. 랜딩 페이지 접속
```
https://your-domain.vercel.app/
```
→ landing.html이 표시되어야 함

### 2. 테스트 결제 진행
1. 랜딩 페이지에서 "구매하기" 클릭
2. 테스트 카드로 결제:
   - 카드번호: `4242424242424242`
   - 유효기간: 미래 날짜
   - CVC: 임의의 3자리

### 3. 이메일 수신 확인
- 보안 다운로드 링크가 포함된 이메일 수신

### 4. 다운로드 테스트
- 이메일의 다운로드 링크 클릭
- PDF 다운로드 진행
- 다운로드 횟수 표시 확인

### 5. Google Sheets 확인
1. 스프레드시트 열기
2. Orders 시트에 주문 정보 저장 확인
3. DownloadLogs 시트에 다운로드 기록 확인

### 6. 환불 테스트 (선택사항)
```bash
# API 호출 테스트
curl -X POST https://your-domain.vercel.app/api/refund/process \
  -H "Content-Type: application/json" \
  -d '{"orderId":"테스트_주문번호","cancelReason":"테스트"}'
```

### 7. Cron Job 테스트
```bash
# 수동으로 일일 요약 실행
curl https://your-domain.vercel.app/api/analytics/daily-summary
```

---

## 📊 운영 가이드

### 일일 체크리스트
- [ ] Gmail 받은편지함에서 일일 리포트 확인
- [ ] Google Sheets Analytics 시트에서 통계 확인
- [ ] 환불 요청 카카오톡 메시지 확인

### 주간 체크리스트
- [ ] 총 매출 확인
- [ ] 환불율 확인 (5% 미만 유지)
- [ ] 다운로드 패턴 분석

### 월간 체크리스트
- [ ] Google Drive 용량 확인
- [ ] Gmail 용량 확인
- [ ] Vercel 사용량 확인 (Function 실행 횟수)

### 고객 지원
**카카오톡 채널로 문의 시 대응:**

1. **다운로드 링크 만료**
   - Google Sheets에서 주문 확인
   - 새 토큰 생성 (수동)
   - 새 링크 이메일 발송

2. **환불 요청**
   - 7일 이내인지 확인
   - `/api/refund/process` API 호출
   - 환불 완료 확인

3. **업데이트 제공**
   - Google Drive에 새 버전 업로드
   - 기존 파일 ID 유지 (자동으로 새 버전 다운로드)
   - 또는 구매자 이메일 목록으로 공지

---

## 🔒 보안 권장사항

### 1. JWT Secret 관리
- 최소 32자 이상의 랜덤 문자열 사용
- 주기적으로 변경 (3개월마다)
- GitHub에 절대 커밋하지 않기

### 2. 서비스 계정 키 관리
- JSON 키 파일 안전하게 보관
- GitHub에 절대 커밋하지 않기
- 필요 시 키 재생성 및 교체

### 3. API 키 보호
- 환경변수로만 관리
- 프론트엔드에 노출 금지
- 테스트 키 / 실제 키 구분

### 4. CORS 설정
- `vercel.json`의 `Access-Control-Allow-Origin`을 필요시 특정 도메인으로 제한
- 현재: `*` (모든 도메인 허용)

### 5. 다운로드 보안
- 토큰 기반 인증 유지
- 다운로드 횟수 제한 유지
- 토큰 만료 시간 준수

---

## 🐛 문제 해결

### 문제: 결제 후 이메일이 오지 않음
**원인:** Gmail SMTP 설정 오류
**해결:**
1. `GMAIL_APP_PASSWORD` 확인
2. 2단계 인증 활성화 확인
3. Vercel Logs에서 오류 메시지 확인

### 문제: Google Sheets에 데이터가 저장되지 않음
**원인:** 서비스 계정 권한 부족
**해결:**
1. 스프레드시트 공유 설정 확인
2. 서비스 계정 이메일에 "편집자" 권한 부여
3. `SPREADSHEET_ID` 확인

### 문제: 다운로드 링크 클릭 시 404 오류
**원인:** 라우팅 설정 문제
**해결:**
1. `/api/download/[token].js` 파일 존재 확인
2. Vercel 배포 로그 확인
3. 재배포

### 문제: Cron Job이 실행되지 않음
**원인:** Vercel Pro 플랜 필요
**해결:**
1. Vercel Hobby 플랜은 Cron 미지원
2. Pro 플랜 업그레이드 ($20/월)
3. 또는 수동으로 `/api/analytics/daily-summary` 호출

---

## 💰 비용 분석

### 무료 티어 사용 시
- **Vercel Hobby:** 무료 (Cron 제외)
- **Google Sheets:** 무료
- **Google Drive:** 15GB 무료
- **Gmail:** 무료 (일 500통 제한)
- **Google Cloud:** 무료 (API 호출량 제한 내)

**월 예상 비용:** ₩0

### Pro 플랜 사용 시 (Cron 포함)
- **Vercel Pro:** $20/월
- **나머지:** 무료

**월 예상 비용:** ₩26,000

### 매출 1,000만원 시 예상 수익
- 판매가: ₩9,990
- 판매 건수: ~1,000건
- 토스 수수료 (3.3%): ₩330,000
- 운영비 (Vercel Pro): ₩26,000
- **순수익:** ₩9,644,000

---

## 📚 추가 자료

### API 문서
- [토스페이먼츠 API](https://docs.tosspayments.com/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Vercel Functions](https://vercel.com/docs/functions)

### 참고 링크
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [JWT 공식 사이트](https://jwt.io/)
- [nodemailer 문서](https://nodemailer.com/)

---

## 🆘 지원

문제가 발생하면:
1. Vercel Logs 확인
2. Google Sheets 권한 확인
3. 환경변수 설정 재확인
4. GitHub Issues에 문의

**Good luck! 🚀**
