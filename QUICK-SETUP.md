# ⚡ 빠른 설정 가이드 (30분 완성)

> 토스페이먼츠 없이 카카오페이 송금 + 이메일 자동 발송으로 간소화

## 🎯 시스템 구조

```
고객 → 카카오페이 송금 → 이메일 입력 → API 호출 → Gmail 자동 발송
```

## ✅ 준비물

1. **PDF 파일**: Claude_완벽가이드_통합본.pdf
2. **Google 계정**: Gmail (이메일 발송용)
3. **Google Drive**: PDF 저장소
4. **GitHub 계정**: 코드 저장
5. **Vercel 계정**: 무료 호스팅

## 📝 Step 1: PDF Google Drive 업로드 (5분)

### 1.1 PDF 업로드
1. Google Drive 열기 (https://drive.google.com)
2. `Claude_완벽가이드_통합본.pdf` 업로드
3. 파일 우클릭 → "공유" 클릭

### 1.2 공유 설정
```
액세스 권한: 링크가 있는 모든 사용자
권한: 뷰어
```

### 1.3 링크 복사
```
https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view?usp=sharing
                              ^^^^^^^^^^^^^^^^
                              이 부분이 FILE_ID
```

**FILE_ID 메모**: `1a2b3c4d5e6f7g8h9i0j`

---

## 📧 Step 2: Gmail 앱 비밀번호 생성 (5분)

### 2.1 Google 계정 보안 설정
1. https://myaccount.google.com/security 접속
2. "2단계 인증" 활성화 (아직 안했다면)

### 2.2 앱 비밀번호 생성
1. https://myaccount.google.com/apppasswords 접속
2. 앱 선택: "메일"
3. 기기 선택: "기타 (맞춤 이름)" → "Claude 가이드 판매"
4. "생성" 클릭
5. **16자리 비밀번호 복사** (예: `abcd efgh ijkl mnop`)

**앱 비밀번호 메모**: `abcdefghijklmnop` (공백 제거)

---

## 🚀 Step 3: Vercel 배포 (10분)

### 3.1 GitHub 저장소 생성
```bash
cd sales-system
git init
git add .
git commit -m "Initial: Simplified sales system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/claude-guide-sales.git
git push -u origin main
```

### 3.2 Vercel 프로젝트 생성
1. https://vercel.com 로그인
2. "Add New Project" 클릭
3. "Import Git Repository" → 방금 만든 저장소 선택
4. "Import" 클릭

### 3.3 환경 변수 설정
Vercel 대시보드에서 "Environment Variables" 탭:

```env
GMAIL_USER = your-email@gmail.com
GMAIL_APP_PASSWORD = abcdefghijklmnop
PDF_DOWNLOAD_LINK = https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view?usp=sharing
```

**중요**:
- `GMAIL_USER`: 실제 Gmail 주소 입력
- `GMAIL_APP_PASSWORD`: Step 2.2에서 복사한 16자리 비밀번호 (공백 없이)
- `PDF_DOWNLOAD_LINK`: Step 1.3에서 복사한 Google Drive 공유 링크

### 3.4 배포
"Deploy" 버튼 클릭 → 약 1분 대기

**배포 완료 URL**: `https://your-project.vercel.app`

---

## ✅ Step 4: 테스트 (5분)

### 4.1 페이지 접속
1. `https://your-project.vercel.app` 접속
2. 페이지 로딩 확인

### 4.2 전체 플로우 테스트
1. "₩9,900 구매하기" 버튼 클릭
2. "카카오페이로 ₩9,900 송금하기" 클릭 → 새 탭 열림
3. 카카오페이에서 ₩9,900 송금 (본인 계정으로 테스트)
4. "송금 완료! 이메일 입력하기" 클릭
5. 이메일 주소 입력 (본인 이메일)
6. "다운로드 링크 받기" 클릭
7. 약 10초 후 이메일 수신 확인
8. 이메일의 "PDF 다운로드하기" 버튼 클릭
9. Google Drive에서 PDF 다운로드 확인

---

## 🎯 Go Live! (즉시)

### 모든 테스트 통과 시

1. **카카오톡 채널 프로필에 링크 추가**
   - 링크: `https://your-project.vercel.app`
   - 버튼 텍스트: "Claude 가이드 구매하기"

2. **첫 고객 대기**
   - 스마트폰에 Gmail 앱 설치 → 알림 ON
   - 카카오페이 앱 → 알림 ON
   - 입금 확인 즉시 대응 준비

---

## 📊 일일 운영 루틴

### 아침 (1회)
- [ ] 카카오페이 입금 내역 확인
- [ ] 미발송 이메일 있는지 확인 (카카오톡 문의)

### 저녁 (1회)
- [ ] 하루 판매 건수 확인
- [ ] 카카오톡 문의 응답

### 주간 (1회)
- [ ] 매출 정리
- [ ] 후기 요청 (구매 3일 후)

---

## 💡 트러블슈팅

### 이메일이 발송되지 않을 때

**원인 1**: Gmail 앱 비밀번호 오류
```bash
# Vercel 환경 변수 재확인
GMAIL_APP_PASSWORD=abcdefghijklmnop (공백 없이, 소문자로)
```

**원인 2**: Google Drive 링크 권한 오류
```
Google Drive → 파일 → 공유 → "링크가 있는 모든 사용자" 확인
```

**원인 3**: Vercel 함수 오류
```bash
# Vercel 로그 확인
vercel logs [PROJECT_URL]
```

### 고객이 "이메일 안 왔어요"

1. 스팸함 확인 요청
2. 다른 이메일로 재발송 (Vercel Functions → send-download 재실행)
3. 카카오톡으로 PDF 직접 전송 (Google Drive 링크)

---

## 🔧 고급 설정 (나중에)

현재 시스템이 안정화되면:

1. **토스페이먼츠 자동 결제** 추가
2. **Google Sheets 주문 관리** 자동화
3. **카카오 알림톡** 연동
4. **JWT 보안 다운로드** (횟수 제한)
5. **분석 대시보드** 구축

---

## 📞 지원

- **Vercel 오류**: https://vercel.com/docs
- **Gmail SMTP 오류**: https://support.google.com
- **기타 문의**: GitHub Issues

---

## ✨ 완료 체크리스트

- [ ] PDF Google Drive 업로드 완료
- [ ] Gmail 앱 비밀번호 생성 완료
- [ ] GitHub 저장소 생성 완료
- [ ] Vercel 프로젝트 배포 완료
- [ ] 환경 변수 설정 완료
- [ ] 테스트 이메일 수신 확인
- [ ] 카카오톡 채널 링크 추가 완료

**모두 체크되었다면 판매 시작!** 🎉
