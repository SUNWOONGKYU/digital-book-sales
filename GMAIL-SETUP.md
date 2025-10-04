# Gmail SMTP 설정 가이드

## 📧 Gmail 앱 비밀번호 발급 방법

### 1단계: Google 계정 보안 페이지 접속

https://myaccount.google.com/security

### 2단계: 2단계 인증 활성화

1. "Google에 로그인" 섹션 선택
2. "2단계 인증" 클릭
3. 안내에 따라 2단계 인증 활성화
   - 휴대전화 번호 입력
   - 인증 코드 확인
   - 완료

### 3단계: 앱 비밀번호 생성

1. 다시 보안 페이지로 이동
2. "Google에 로그인" → "앱 비밀번호" 클릭
3. "앱 선택" → **메일** 선택
4. "기기 선택" → **Windows 컴퓨터** 또는 **기타** 선택
5. **생성** 버튼 클릭
6. **16자리 비밀번호** 복사 (예: `abcd efgh ijkl mnop`)

### 4단계: .env 파일에 입력

```env
GMAIL_USER=실제Gmail주소@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

⚠️ **주의사항:**
- 16자리 비밀번호에서 **공백은 제거**하고 입력
- 예: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### 5단계: 테스트

```bash
cd "G:/내 드라이브/Content/ClaudeCC/Claude설치가이드/v2.0/sales-system"
npm install
npm run test-email
```

## 🔒 보안 주의사항

1. **.env 파일은 절대 GitHub에 업로드하지 마세요**
   - `.gitignore`에 `.env` 추가 확인

2. **앱 비밀번호는 안전하게 보관**
   - 다른 사람과 공유 금지
   - 유출 시 즉시 재발급

3. **Vercel 배포 시**
   - Vercel 대시보드에서 환경변수 별도 설정
   - .env 파일을 업로드하지 않음

## 📝 트러블슈팅

### "인증 실패" 오류 발생 시

1. Gmail 주소 확인
2. 앱 비밀번호 재발급
3. 공백 제거 확인
4. 2단계 인증 활성화 확인

### "연결 거부" 오류 발생 시

1. 방화벽 확인
2. 네트워크 연결 확인
3. Gmail SMTP 포트(587) 차단 여부 확인

### 이메일이 스팸함으로 가는 경우

1. Gmail 설정 → 필터 및 차단된 주소
2. 발신자 주소를 허용 목록에 추가
3. SPF/DKIM 레코드 설정 (도메인 사용 시)
