# 🔗 시스템 통합 가이드 - v2.0 + 카카오톡 연계

## 🎯 개요

**v2.0 판매 시스템**과 **카카오톡 채널**을 완전히 통합하여 자동화된 CRM 시스템을 구축합니다.

### 통합되는 시스템
1. **v2.0 판매 시스템**
   - Google Sheets 데이터베이스
   - JWT 보안 다운로드
   - 자동 환불 처리
   - 일일 분석 리포트

2. **카카오톡 채널 시스템**
   - 알림톡 자동 발송
   - 다운로드 링크 재발급
   - 챗봇 자동 응답

---

## 📊 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                         사용자                               │
└────────┬────────────────────────────────────────────────┬───┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                              ┌──────────────────┐
│   웹 결제 페이지  │                              │  카카오톡 채널    │
│  (landing.html) │                              │   (고객 문의)     │
└────────┬────────┘                              └────────┬─────────┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Functions               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ confirm-     │  │  refund/     │  │ renew-download-   │ │
│  │ payment.js   │  │  process.js  │  │ link.js           │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘ │
│         │                 │                     │           │
│         └─────────────────┴─────────────────────┘           │
│                           │                                 │
│                           ▼                                 │
│         ┌─────────────────────────────────────┐             │
│         │      lib/sheets.js (DB 헬퍼)        │             │
│         │      lib/jwt.js (보안)              │             │
│         │      lib/kakao-alimtalk.js (알림톡) │             │
│         └─────────────────────────────────────┘             │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│ Google      │  │  Gmail      │  │  Solapi         │
│ Sheets DB   │  │  SMTP       │  │  (알림톡)       │
└─────────────┘  └─────────────┘  └─────────────────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │  사용자   │
                    └──────────┘
```

---

## 🔄 통합 시나리오

### 시나리오 1: 결제 완료 (이메일 + 알림톡)

**흐름:**
```
1. 사용자 결제 완료
   ↓
2. confirm-payment.js 실행
   ↓
3. 토스페이먼츠 결제 승인
   ↓
4. JWT 다운로드 토큰 생성
   ↓
5. Google Sheets에 주문 저장 (휴대폰 번호 포함)
   ↓
6. Gmail로 이메일 발송 (보안 링크 포함)
   ↓
7. 알림톡 발송 (휴대폰 번호 있는 경우)
   ↓
8. 사용자에게 이메일 + 카톡 도착
```

**데이터 흐름:**
```javascript
// 토스페이먼츠 응답
{
  orderId: "ORDER_20251004_XXXXX",
  customerEmail: "user@example.com",
  customerMobilePhone: "01012345678",  // ← 중요!
  amount: 9990
}
   ↓
// Google Sheets 저장
{
  orderId: "ORDER_20251004_XXXXX",
  customerEmail: "user@example.com",
  customerPhone: "01012345678",        // ← DB 저장
  amount: 9990,
  downloadToken: "eyJhbGc..."
}
   ↓
// 이메일 발송
To: user@example.com
Subject: 🎉 구매 완료!
Body: 다운로드 링크: https://domain.com/api/download/TOKEN
   ↓
// 알림톡 발송 (if customerPhone exists)
To: 01012345678
Template: TEMPLATE_001
Message: [Claude 완벽 가이드] 구매 감사...
Button: [다운로드하기]
```

### 시나리오 2: 환불 요청 (이메일 + 알림톡)

**흐름:**
```
1. 사용자가 카카오톡 채널로 환불 요청
   ↓
2. 관리자가 주문번호 확인
   ↓
3. refund/process.js API 호출
   ↓
4. Google Sheets에서 주문 조회
   ↓
5. 7일 이내 확인
   ↓
6. 토스페이먼츠 환불 요청
   ↓
7. Google Sheets 상태 업데이트 (REFUNDED)
   ↓
8. Gmail로 환불 완료 이메일 발송
   ↓
9. 알림톡 환불 완료 발송
   ↓
10. 사용자에게 이메일 + 카톡 도착
```

### 시나리오 3: 다운로드 링크 재발급

**흐름:**
```
1. 사용자: 카카오톡 채널로 "링크가 안 열려요" 문의
   ↓
2. 챗봇: "주문번호를 입력해주세요"
   ↓
3. 사용자: "ORDER_20251004_XXXXX"
   ↓
4. 관리자 또는 자동화: renew-download-link.js API 호출
   ↓
5. Google Sheets에서 주문 조회
   ↓
6. 다운로드 횟수 확인 (5회 미만)
   ↓
7. 새 JWT 토큰 생성
   ↓
8. Google Sheets 업데이트 (새 토큰)
   ↓
9. Gmail로 새 링크 발송
   ↓
10. 알림톡으로 새 링크 발송
   ↓
11. 사용자에게 이메일 + 카톡 도착
```

---

## 💾 Google Sheets 스키마 확장

### Orders 시트 (기존 + 추가)

**기존 필드:**
- orderId
- paymentKey
- amount
- customerEmail
- customerName
- status
- createdAt
- paidAt
- refundedAt
- downloadToken

**추가 필드:** ⭐
- **customerPhone** (휴대폰 번호)
- **alimtalkSent** (알림톡 발송 여부)
- **alimtalkMessageId** (알림톡 메시지 ID)

**전체 스키마:**
```
A: orderId
B: paymentKey
C: amount
D: customerEmail
E: customerName
F: customerPhone          ← 신규
G: status
H: createdAt
I: paidAt
J: refundedAt
K: downloadToken
L: alimtalkSent           ← 신규
M: alimtalkMessageId      ← 신규
```

---

## 🔧 코드 통합

### 1. Google Sheets 헬퍼 수정

**파일:** `api/lib/sheets.js` (수정)

```javascript
/**
 * 주문 정보 저장 - 휴대폰 번호 추가
 */
export async function saveOrder(orderData) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const values = [[
        orderData.orderId,
        orderData.paymentKey,
        orderData.amount,
        orderData.customerEmail,
        orderData.customerName || '',
        orderData.customerPhone || '',           // ← 추가
        orderData.status || 'PAID',
        new Date().toISOString(),
        orderData.paidAt || new Date().toISOString(),
        orderData.refundedAt || '',
        orderData.downloadToken || '',
        orderData.alimtalkSent || false,        // ← 추가
        orderData.alimtalkMessageId || ''       // ← 추가
    ]];

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Orders!A:M',  // J에서 M으로 확장
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return { success: true, data: response.data };
    } catch (error) {
        console.error('주문 저장 실패:', error);
        throw new Error('주문 정보를 저장하는데 실패했습니다.');
    }
}

/**
 * 주문 조회 - 휴대폰 번호 포함
 */
export async function getOrder(orderId) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Orders!A:M'  // 확장된 범위
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            return null;
        }

        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === orderId) {
                return {
                    rowIndex: i + 1,
                    orderId: rows[i][0],
                    paymentKey: rows[i][1],
                    amount: parseInt(rows[i][2]),
                    customerEmail: rows[i][3],
                    customerName: rows[i][4],
                    customerPhone: rows[i][5],        // ← 추가
                    status: rows[i][6],
                    createdAt: rows[i][7],
                    paidAt: rows[i][8],
                    refundedAt: rows[i][9],
                    downloadToken: rows[i][10],
                    alimtalkSent: rows[i][11] === 'true',  // ← 추가
                    alimtalkMessageId: rows[i][12]    // ← 추가
                };
            }
        }

        return null;
    } catch (error) {
        console.error('주문 조회 실패:', error);
        throw new Error('주문 정보를 조회하는데 실패했습니다.');
    }
}

/**
 * 스프레드시트 초기화 - 헤더 확장
 */
export async function initializeSpreadsheet() {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        // Orders 시트 헤더 - 확장
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Orders!A1:M1',  // J1에서 M1로 확장
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    'orderId', 'paymentKey', 'amount', 'customerEmail', 'customerName',
                    'customerPhone', 'status', 'createdAt', 'paidAt', 'refundedAt',
                    'downloadToken', 'alimtalkSent', 'alimtalkMessageId'
                ]]
            }
        });

        // DownloadLogs, Analytics 시트는 동일
        // ...

        return { success: true, message: '스프레드시트가 초기화되었습니다.' };
    } catch (error) {
        console.error('스프레드시트 초기화 실패:', error);
        throw new Error('스프레드시트를 초기화하는데 실패했습니다.');
    }
}
```

### 2. confirm-payment.js 통합

**파일:** `api/confirm-payment.js` (수정)

```javascript
import nodemailer from 'nodemailer';
import { saveOrder, getOrder } from './lib/sheets.js';
import { generateDownloadToken } from './lib/jwt.js';
import { sendPaymentConfirmation } from './lib/kakao-alimtalk.js';  // ← 추가

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { paymentKey, orderId, amount } = req.body;

    try {
        // 1. 중복 주문 확인
        const existingOrder = await getOrder(orderId);
        if (existingOrder) {
            return res.status(200).json({
                success: true,
                email: existingOrder.customerEmail,
                orderId: orderId,
                message: '이미 처리된 주문입니다.'
            });
        }

        // 2. 토스페이먼츠 결제 승인
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paymentKey, orderId, amount })
        });

        const payment = await response.json();

        if (!response.ok) {
            throw new Error(payment.message || '결제 승인 실패');
        }

        // 3. 보안 다운로드 토큰 생성
        const downloadToken = generateDownloadToken({
            orderId: orderId,
            customerEmail: payment.customerEmail
        });

        // 4. Google Sheets에 주문 정보 저장 (휴대폰 번호 포함)
        const orderData = {
            orderId: orderId,
            paymentKey: paymentKey,
            amount: amount,
            customerEmail: payment.customerEmail,
            customerName: payment.customerName || '',
            customerPhone: payment.customerMobilePhone || '',  // ← 토스에서 받은 휴대폰 번호
            status: 'PAID',
            paidAt: payment.approvedAt || new Date().toISOString(),
            downloadToken: downloadToken
        };

        await saveOrder(orderData);

        // 5. 보안 다운로드 링크 생성
        const baseUrl = process.env.BASE_URL || 'https://your-domain.vercel.app';
        const secureDownloadLink = `${baseUrl}/api/download/${downloadToken}`;

        // 6. 이메일 발송
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const expiryHours = parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS) || 24;
        const maxDownloads = parseInt(process.env.MAX_DOWNLOAD_COUNT) || 5;

        const mailOptions = {
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: payment.customerEmail,
            subject: '🎉 Claude 완벽 가이드 구매 완료!',
            html: `
                <!-- 기존 이메일 템플릿 -->
            `
        };

        await transporter.sendMail(mailOptions);

        // 7. 알림톡 발송 (휴대폰 번호가 있는 경우) ← 추가
        let alimtalkResult = null;
        if (payment.customerMobilePhone) {
            alimtalkResult = await sendPaymentConfirmation({
                phoneNumber: payment.customerMobilePhone,
                orderId: orderId,
                amount: amount,
                downloadLink: secureDownloadLink
            });

            // 알림톡 발송 결과 Google Sheets 업데이트
            if (alimtalkResult.success) {
                await updateOrder(orderId, {
                    alimtalkSent: true,
                    alimtalkMessageId: alimtalkResult.messageId
                });
            }
        }

        // 8. 성공 응답
        return res.status(200).json({
            success: true,
            email: payment.customerEmail,
            orderId: orderId,
            downloadToken: downloadToken,
            emailSent: true,
            alimtalkSent: alimtalkResult?.success || false  // ← 추가
        });

    } catch (error) {
        console.error('결제 처리 오류:', error);

        return res.status(500).json({
            success: false,
            message: error.message || '결제 처리 중 오류가 발생했습니다.'
        });
    }
}
```

### 3. refund/process.js 통합

**파일:** `api/refund/process.js` (수정)

```javascript
import nodemailer from 'nodemailer';
import { getOrder, updateOrder } from '../lib/sheets.js';
import { sendRefundConfirmation } from '../lib/kakao-alimtalk.js';  // ← 추가

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    }

    const { orderId, cancelReason } = req.body;

    if (!orderId) {
        return res.status(400).json({
            success: false,
            error: '주문번호가 필요합니다.'
        });
    }

    try {
        // 1-3. 주문 확인, 환불 여부, 기간 확인 (기존 코드)
        const order = await getOrder(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: '주문을 찾을 수 없습니다.'
            });
        }

        if (order.status === 'REFUNDED') {
            return res.status(400).json({
                success: false,
                error: '이미 환불된 주문입니다.'
            });
        }

        const paidDate = new Date(order.paidAt);
        const now = new Date();
        const daysSincePurchase = Math.floor((now - paidDate) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase > 7) {
            return res.status(400).json({
                success: false,
                error: '환불 가능 기간(7일)이 지났습니다.',
                daysSincePurchase: daysSincePurchase
            });
        }

        // 4. 토스페이먼츠 환불 요청 (기존 코드)
        const refundResponse = await fetch(
            `https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cancelReason: cancelReason || '고객 요청'
                })
            }
        );

        const refundResult = await refundResponse.json();

        if (!refundResponse.ok) {
            throw new Error(refundResult.message || '환불 처리에 실패했습니다.');
        }

        // 5. 주문 상태 업데이트
        await updateOrder(orderId, {
            status: 'REFUNDED',
            refundedAt: new Date().toISOString()
        });

        // 6. 환불 완료 이메일 발송 (기존 코드)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"Claude 완벽 가이드" <${process.env.GMAIL_USER}>`,
            to: order.customerEmail,
            subject: '✅ 환불 처리 완료 안내',
            html: `
                <!-- 기존 이메일 템플릿 -->
            `
        };

        await transporter.sendMail(mailOptions);

        // 7. 알림톡 발송 (휴대폰 번호가 있는 경우) ← 추가
        let alimtalkResult = null;
        if (order.customerPhone) {
            alimtalkResult = await sendRefundConfirmation({
                phoneNumber: order.customerPhone,
                orderId: orderId,
                amount: order.amount,
                refundDate: new Date().toLocaleString('ko-KR')
            });
        }

        // 8. 성공 응답
        return res.status(200).json({
            success: true,
            message: '환불이 성공적으로 처리되었습니다.',
            orderId: orderId,
            refundAmount: order.amount,
            refundedAt: new Date().toISOString(),
            emailSent: true,
            alimtalkSent: alimtalkResult?.success || false  // ← 추가
        });

    } catch (error) {
        console.error('환불 처리 오류:', error);

        return res.status(500).json({
            success: false,
            error: error.message || '환불 처리 중 오류가 발생했습니다.'
        });
    }
}
```

---

## 🧪 통합 테스트 가이드

### 1. 결제 완료 테스트

**1단계: 환경변수 확인**
```env
# .env 파일
SOLAPI_API_KEY=실제_키
SOLAPI_API_SECRET=실제_시크릿
KAKAO_PFID=실제_채널_ID
KAKAO_TEMPLATE_PAYMENT=승인받은_템플릿_ID
```

**2단계: 테스트 결제 진행**
1. 랜딩 페이지 접속
2. "구매하기" 클릭
3. 테스트 카드 입력
   - 카드번호: 4242424242424242
   - 휴대폰: 01012345678 입력 ← 중요!

**3단계: 결과 확인**
- ✅ 이메일 수신 (Gmail)
- ✅ 알림톡 수신 (휴대폰)
- ✅ Google Sheets Orders 시트에 데이터 저장
  - customerPhone: 01012345678
  - alimtalkSent: true
  - alimtalkMessageId: SOLAPI_MESSAGE_ID

### 2. 환불 처리 테스트

**API 호출:**
```bash
curl -X POST https://your-domain.vercel.app/api/refund/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "테스트_주문번호",
    "cancelReason": "테스트 환불"
  }'
```

**결과 확인:**
- ✅ 이메일 수신
- ✅ 알림톡 수신
- ✅ Google Sheets 상태: REFUNDED

### 3. 링크 재발급 테스트

**API 호출:**
```bash
curl -X POST https://your-domain.vercel.app/api/renew-download-link \
  -H "Content-Type: application/json" \
  -d '{"orderId": "테스트_주문번호"}'
```

**결과 확인:**
- ✅ 새 JWT 토큰 생성
- ✅ 이메일 수신
- ✅ 알림톡 수신
- ✅ Google Sheets downloadToken 업데이트

---

## 📱 카카오톡 채널 시나리오 통합

### 자동 응답 설정 (채널 관리자센터)

**첫 채팅 메시지:**
```
안녕하세요! Claude 완벽 가이드입니다 🤖

무엇을 도와드릴까요?

1️⃣ 다운로드 링크 문제
2️⃣ 환불 문의
3️⃣ 업데이트 문의
4️⃣ 기타 문의

숫자를 입력해주세요!
```

**"1" 입력 시:**
```
다운로드 링크 재발급을 도와드릴게요.

주문번호를 입력해주세요.
(예: ORDER_20251004_XXXXX)

주문번호는 구매 완료 이메일에서 확인하실 수 있습니다.
```

**주문번호 입력 시 (관리자 처리):**
1. 주문번호 복사
2. API 호출 (Postman 또는 curl)
   ```bash
   curl -X POST https://domain.com/api/renew-download-link \
     -d '{"orderId":"복사한_주문번호"}'
   ```
3. 자동으로 고객에게 이메일 + 알림톡 발송
4. 카카오톡으로 안내
   ```
   ✅ 새로운 다운로드 링크가 발송되었습니다!

   이메일과 카카오톡 알림을 확인해주세요.
   (보통 1-2분 내 도착합니다)
   ```

**"2" 입력 시 (환불):**
```
환불 신청을 도와드릴게요.

📌 환불 가능 기간: 구매 후 7일 이내
📌 환불 방법: 전액 환불

주문번호와 환불 사유를 알려주세요.

예)
주문번호: ORDER_20251004_XXXXX
사유: 기대와 달라서
```

---

## 🔍 모니터링 및 디버깅

### 1. Google Sheets 대시보드

**실시간 모니터링:**
```
Orders 시트에서 확인:
- 총 주문 건수
- 알림톡 발송률 (alimtalkSent = true 비율)
- 휴대폰 번호 수집률 (customerPhone 비율)
```

**쿼리 예시 (Google Sheets 함수):**
```
// 알림톡 발송률
=COUNTIF(L:L, "true") / COUNTA(A:A) * 100

// 휴대폰 번호 수집률
=COUNTIF(F:F, "<>") / COUNTA(A:A) * 100
```

### 2. Vercel Logs 확인

**알림톡 발송 로그:**
```
# 성공 로그
✅ 알림톡 발송 성공: {
  messageId: "SOLAPI_MSG_12345",
  to: "01012345678",
  orderId: "ORDER_XXXXX"
}

# 실패 로그
❌ 알림톡 발송 실패: {
  error: "잔액 부족",
  to: "01012345678",
  orderId: "ORDER_XXXXX"
}
```

### 3. Solapi 대시보드

**확인 항목:**
- 발송 성공률
- 실패 원인 분석
- 잔액 확인
- 템플릿 승인 상태

---

## ⚠️ 주의사항 및 제한사항

### 1. 휴대폰 번호 수집

**문제:** 토스페이먼츠 결제 시 휴대폰 번호를 항상 받는 것은 아님

**해결 방안:**
- **옵션 A:** 결제 전 입력 폼에서 휴대폰 번호 수집
- **옵션 B:** 이메일만으로도 시스템 작동 (알림톡은 선택사항)
- **현재 구현:** 휴대폰 번호 있으면 알림톡 발송, 없으면 이메일만

### 2. 알림톡 비용

**월별 예상:**
- 100건: 1,500원
- 1,000건: 15,000원
- 10,000건: 100,000원 (단가 10원)

**절감 방안:**
- 중요 알림만 알림톡 발송
- 나머지는 이메일만
- 발송량 증가 시 딜러사와 단가 협상

### 3. 템플릿 승인

**주의사항:**
- 광고성 문구 금지
- 변수 매칭 정확히
- 승인 후 수정 시 재승인 필요

---

## 🎯 체크리스트

### 배포 전 확인사항

- [ ] Google Sheets 스키마 업데이트 (customerPhone 필드 추가)
- [ ] 환경변수 설정 (Solapi, 카카오 템플릿 ID)
- [ ] 템플릿 3종 승인 완료
- [ ] lib/sheets.js 수정 (휴대폰 번호 필드)
- [ ] confirm-payment.js 수정 (알림톡 연동)
- [ ] refund/process.js 수정 (알림톡 연동)
- [ ] 의존성 설치 (npm install solapi)
- [ ] 테스트 결제 진행
- [ ] 이메일 + 알림톡 수신 확인

### 운영 시작 후

- [ ] 일일 알림톡 발송률 확인
- [ ] 주간 비용 모니터링
- [ ] 월간 ROI 분석
- [ ] 고객 피드백 수집
- [ ] 템플릿 개선

---

## 🚀 배포 순서

### 1단계: 데이터베이스 업데이트
```bash
# Google Sheets 초기화 (헤더 업데이트)
npm run init-sheets
```

### 2단계: 코드 배포
```bash
git add .
git commit -m "카카오톡 알림톡 시스템 통합"
git push origin main
```

### 3단계: Vercel 환경변수 설정
- SOLAPI_API_KEY
- SOLAPI_API_SECRET
- KAKAO_PFID
- KAKAO_SENDER_KEY
- KAKAO_TEMPLATE_PAYMENT
- KAKAO_TEMPLATE_REFUND
- KAKAO_TEMPLATE_RENEWAL

### 4단계: 재배포
- Vercel 자동 배포 대기
- 또는 수동: `vercel --prod`

### 5단계: 테스트
1. 테스트 결제
2. 이메일 + 알림톡 확인
3. Google Sheets 데이터 확인

---

## 📊 통합 효과 예측

### Before (v2.0 단독)
- 이메일만 발송
- 이메일 미확인 시 고객 불편
- 수동 링크 재발급
- 고객 응대 시간: 월 5시간

### After (v2.0 + 카카오톡)
- 이메일 + 알림톡 발송
- 카카오톡으로 즉시 확인
- 자동 링크 재발급
- 고객 응대 시간: 월 2.5시간

### ROI
- 비용: 1,500원/월 (100건)
- 절감: 75,000원/월
- **투자 대비 수익: 5,000%**

---

**작성일:** 2025년 10월 4일
**버전:** v2.1 (통합)
**다음 단계:** 실제 배포 및 운영
