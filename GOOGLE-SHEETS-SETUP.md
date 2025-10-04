# 📊 Google Sheets 설정 가이드

이메일 발송 기록을 Google Sheets에 자동으로 저장합니다.

---

## 🎯 목표

구매자 이메일 주소와 발송 기록을 Google Sheets에 자동 저장

---

## ✅ 체크리스트

- [ ] 1단계: Google Sheets 생성
- [ ] 2단계: Google Cloud 서비스 계정 생성
- [ ] 3단계: 서비스 계정 JSON 키 다운로드
- [ ] 4단계: Google Sheets 권한 부여
- [ ] 5단계: 환경변수 설정
- [ ] 6단계: Google Sheets 초기화
- [ ] 7단계: 테스트

---

## 1단계: Google Sheets 생성

1. **Google Sheets 접속**
   https://sheets.google.com

2. **새 스프레드시트 만들기**
   - "빈 스프레드시트" 클릭
   - 이름: "Claude 가이드 판매 데이터"

3. **스프레드시트 ID 복사**
   - URL에서 ID 복사
   - 예: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - SPREADSHEET_ID 부분을 복사

---

## 2단계: Google Cloud 서비스 계정 생성

1. **Google Cloud Console 접속**
   https://console.cloud.google.com

2. **프로젝트 선택 또는 생성**
   - 상단의 프로젝트 선택 드롭다운 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름: "claude-guide-sales"

3. **Google Sheets API 활성화**
   - 왼쪽 메뉴 → "API 및 서비스" → "라이브러리"
   - "Google Sheets API" 검색
   - "사용 설정" 클릭

4. **서비스 계정 만들기**
   - 왼쪽 메뉴 → "API 및 서비스" → "사용자 인증 정보"
   - "사용자 인증 정보 만들기" → "서비스 계정" 클릭
   - 서비스 계정 이름: "claude-guide-email-logger"
   - "만들기 및 계속하기" 클릭
   - 역할: "편집자" 선택
   - "완료" 클릭

---

## 3단계: 서비스 계정 JSON 키 다운로드

1. **서비스 계정 목록에서 방금 만든 계정 클릭**

2. **"키" 탭 클릭**

3. **"키 추가" → "새 키 만들기"**
   - 키 유형: JSON
   - "만들기" 클릭
   - JSON 파일 자동 다운로드됨

4. **JSON 파일 내용 확인**
   ```json
   {
     "type": "service_account",
     "project_id": "...",
     "private_key_id": "...",
     "private_key": "...",
     "client_email": "...@...iam.gserviceaccount.com",
     "client_id": "...",
     ...
   }
   ```

---

## 4단계: Google Sheets 권한 부여

1. **JSON 파일에서 `client_email` 복사**
   - 예: `claude-guide-email-logger@...iam.gserviceaccount.com`

2. **Google Sheets로 돌아가기**
   - 1단계에서 만든 스프레드시트 열기

3. **공유 버튼 클릭**
   - 복사한 이메일 주소 붙여넣기
   - 권한: "편집자"
   - "보내기" 클릭

---

## 5단계: 환경변수 설정

### 로컬 환경 (.env 파일)

```env
# Google Sheets 설정
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...전체 JSON 내용..."}
SPREADSHEET_ID=복사한스프레드시트ID
```

⚠️ **중요**:
- `GOOGLE_SERVICE_ACCOUNT`는 JSON 파일의 **전체 내용**을 한 줄로 입력
- 줄바꿈 없이, 따옴표로 감싸지 말고 그대로 입력

### Vercel 환경변수

1. **Vercel 대시보드** → 프로젝트 → **Settings** → **Environment Variables**

2. **추가할 변수**:
   - `GOOGLE_SERVICE_ACCOUNT` = JSON 파일 전체 내용 (한 줄로)
   - `SPREADSHEET_ID` = 스프레드시트 ID

3. **Save** 클릭

---

## 6단계: Google Sheets 초기화

로컬에서 초기화 스크립트 실행:

```bash
cd "G:/내 드라이브/Content/ClaudeCC/Claude설치가이드/v2.0/sales-system"
npm run init-sheets
```

### 예상 결과:

```
🚀 Google Sheets 초기화 시작...

✅ 환경변수 확인 완료
📊 스프레드시트 ID: ...

✅ 초기화 완료!

📋 생성된 시트:
   1. Orders - 주문 정보
   2. DownloadLogs - 다운로드 기록
   3. Analytics - 분석 데이터
   4. EmailLogs - 이메일 발송 기록

💡 이제 판매 시스템을 사용할 수 있습니다!
```

---

## 7단계: 테스트

1. **배포된 사이트에서 이메일 발송 테스트**

2. **Google Sheets 확인**
   - "EmailLogs" 시트 열기
   - 발송 기록 확인:
     - email: 이메일 주소
     - name: 이름
     - sentAt: 발송 시각
     - success: SUCCESS/FAILED
     - errorMessage: 에러 메시지 (실패 시)

---

## 🔧 트러블슈팅

### ❌ "GOOGLE_SERVICE_ACCOUNT 환경변수가 설정되지 않았습니다"

**원인:** 환경변수 설정 오류

**해결:**
1. .env 파일에 JSON 전체 내용이 들어있는지 확인
2. 줄바꿈 없이 한 줄로 입력했는지 확인
3. Vercel 환경변수가 정확히 입력되었는지 확인

### ❌ "Sheets API 호출 실패"

**원인:**
- API가 활성화되지 않음
- 권한 문제

**해결:**
1. Google Cloud Console → API 및 서비스 → "Google Sheets API" 확인
2. Google Sheets 공유 설정에서 서비스 계정 이메일이 "편집자" 권한인지 확인

### ❌ "스프레드시트를 찾을 수 없습니다"

**원인:** SPREADSHEET_ID 오류

**해결:**
1. Google Sheets URL에서 ID를 정확히 복사
2. 환경변수에 올바르게 입력되었는지 확인

---

## ✨ 완료 후 확인사항

- [x] Google Sheets에 EmailLogs 시트 생성됨
- [x] 이메일 발송 시 자동으로 기록됨
- [x] 발송 성공/실패 상태가 기록됨
- [x] 에러 메시지가 기록됨 (실패 시)

---

## 📞 문의

문제가 계속되면 카카오톡 채널로 연락주세요:
- 채널: AI실전활용연구소
- 링크: http://pf.kakao.com/_WqSxcn/chat
