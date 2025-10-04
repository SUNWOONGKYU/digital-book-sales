/**
 * 카카오 알림톡 API 헬퍼 (Solapi 기준)
 *
 * 사용 전 준비사항:
 * 1. Solapi 가입 및 API 키 발급
 * 2. 카카오톡 채널 비즈니스 인증
 * 3. 알림톡 템플릿 등록 및 승인
 * 4. 환경변수 설정 (SOLAPI_API_KEY, SOLAPI_API_SECRET, KAKAO_PFID, KAKAO_SENDER_KEY)
 */

import { SolapiMessageService } from 'solapi';

// Solapi 클라이언트 초기화
function getSolapiClient() {
    if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_API_SECRET) {
        console.warn('Solapi API 키가 설정되지 않았습니다. 알림톡을 건너뜁니다.');
        return null;
    }

    return new SolapiMessageService(
        process.env.SOLAPI_API_KEY,
        process.env.SOLAPI_API_SECRET
    );
}

/**
 * 휴대폰 번호 포맷 정리
 * @param {string} phone - 휴대폰 번호
 * @returns {string} 숫자만 있는 형식 (01012345678)
 */
function formatPhoneNumber(phone) {
    if (!phone) return null;
    return phone.replace(/[^0-9]/g, '');
}

/**
 * 결제 완료 알림톡 발송
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - 수신자 휴대폰 번호
 * @param {string} params.orderId - 주문번호
 * @param {number} params.amount - 결제금액
 * @param {string} params.downloadLink - 다운로드 링크
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendPaymentConfirmation({
    phoneNumber,
    orderId,
    amount,
    downloadLink
}) {
    const client = getSolapiClient();
    if (!client) {
        return { success: false, error: 'Solapi 클라이언트가 초기화되지 않았습니다.' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        return { success: false, error: '유효하지 않은 휴대폰 번호입니다.' };
    }

    try {
        const result = await client.sendOne({
            to: formattedPhone,
            from: process.env.KAKAO_SENDER_KEY,
            type: 'ATA', // 알림톡
            text: `[Claude 완벽 가이드] 구매해주셔서 감사합니다!

주문번호: ${orderId}
결제금액: ${amount.toLocaleString()}원

🔐 보안 다운로드 링크
${downloadLink}

⏱️ 유효기간: 24시간
🔢 다운로드: 최대 5회

📌 링크가 만료되면 카카오톡 채널로 문의해주세요.`,
            kakaoOptions: {
                pfId: process.env.KAKAO_PFID,
                templateId: process.env.KAKAO_TEMPLATE_PAYMENT || 'TEMPLATE_001',
                buttons: [
                    {
                        buttonType: 'WL',
                        buttonName: '다운로드하기',
                        linkMo: downloadLink,
                        linkPc: downloadLink
                    },
                    {
                        buttonType: 'WL',
                        buttonName: '카카오톡 문의',
                        linkMo: 'http://pf.kakao.com/_WqSxcn/chat',
                        linkPc: 'http://pf.kakao.com/_WqSxcn/chat'
                    }
                ]
            }
        });

        console.log('알림톡 발송 성공:', {
            messageId: result.messageId,
            to: formattedPhone,
            orderId: orderId
        });

        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error('알림톡 발송 실패:', {
            error: error.message,
            to: formattedPhone,
            orderId: orderId
        });

        // 알림톡 실패는 치명적이지 않으므로 에러를 던지지 않음
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 환불 완료 알림톡 발송
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - 수신자 휴대폰 번호
 * @param {string} params.orderId - 주문번호
 * @param {number} params.amount - 환불금액
 * @param {string} params.refundDate - 환불 처리일시
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendRefundConfirmation({
    phoneNumber,
    orderId,
    amount,
    refundDate
}) {
    const client = getSolapiClient();
    if (!client) {
        return { success: false, error: 'Solapi 클라이언트가 초기화되지 않았습니다.' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        return { success: false, error: '유효하지 않은 휴대폰 번호입니다.' };
    }

    try {
        const result = await client.sendOne({
            to: formattedPhone,
            from: process.env.KAKAO_SENDER_KEY,
            type: 'ATA',
            text: `[Claude 완벽 가이드] 환불이 완료되었습니다.

주문번호: ${orderId}
환불금액: ${amount.toLocaleString()}원
처리일시: ${refundDate}

💳 환불 처리 일정
- 신용카드: 2-3영업일 내 승인취소
- 계좌이체: 3-5영업일 내 입금

더 나은 서비스로 다시 찾아뵙겠습니다.`,
            kakaoOptions: {
                pfId: process.env.KAKAO_PFID,
                templateId: process.env.KAKAO_TEMPLATE_REFUND || 'TEMPLATE_002',
                buttons: [
                    {
                        buttonType: 'WL',
                        buttonName: '문의하기',
                        linkMo: 'http://pf.kakao.com/_WqSxcn/chat',
                        linkPc: 'http://pf.kakao.com/_WqSxcn/chat'
                    }
                ]
            }
        });

        console.log('환불 알림톡 발송 성공:', {
            messageId: result.messageId,
            to: formattedPhone,
            orderId: orderId
        });

        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error('환불 알림톡 발송 실패:', {
            error: error.message,
            to: formattedPhone,
            orderId: orderId
        });

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 다운로드 링크 재발급 알림톡 발송
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - 수신자 휴대폰 번호
 * @param {string} params.orderId - 주문번호
 * @param {string} params.newDownloadLink - 새 다운로드 링크
 * @param {number} params.remainingCount - 남은 다운로드 횟수
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendDownloadLinkRenewal({
    phoneNumber,
    orderId,
    newDownloadLink,
    remainingCount
}) {
    const client = getSolapiClient();
    if (!client) {
        return { success: false, error: 'Solapi 클라이언트가 초기화되지 않았습니다.' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        return { success: false, error: '유효하지 않은 휴대폰 번호입니다.' };
    }

    try {
        const result = await client.sendOne({
            to: formattedPhone,
            from: process.env.KAKAO_SENDER_KEY,
            type: 'ATA',
            text: `[Claude 완벽 가이드] 다운로드 링크가 재발급되었습니다.

주문번호: ${orderId}

🔐 새로운 다운로드 링크
${newDownloadLink}

⏱️ 유효기간: 24시간
🔢 남은 다운로드: ${remainingCount}회`,
            kakaoOptions: {
                pfId: process.env.KAKAO_PFID,
                templateId: process.env.KAKAO_TEMPLATE_RENEWAL || 'TEMPLATE_003',
                buttons: [
                    {
                        buttonType: 'WL',
                        buttonName: '다운로드하기',
                        linkMo: newDownloadLink,
                        linkPc: newDownloadLink
                    }
                ]
            }
        });

        console.log('재발급 알림톡 발송 성공:', {
            messageId: result.messageId,
            to: formattedPhone,
            orderId: orderId
        });

        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error('재발급 알림톡 발송 실패:', {
            error: error.message,
            to: formattedPhone,
            orderId: orderId
        });

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 일반 친구톡 발송 (채널 친구에게만)
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - 수신자 휴대폰 번호
 * @param {string} params.message - 메시지 내용
 * @param {Array} params.buttons - 버튼 배열 (선택사항)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendFriendtalk({
    phoneNumber,
    message,
    buttons = []
}) {
    const client = getSolapiClient();
    if (!client) {
        return { success: false, error: 'Solapi 클라이언트가 초기화되지 않았습니다.' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        return { success: false, error: '유효하지 않은 휴대폰 번호입니다.' };
    }

    try {
        const result = await client.sendOne({
            to: formattedPhone,
            from: process.env.KAKAO_SENDER_KEY,
            type: 'CTA', // 친구톡
            text: message,
            kakaoOptions: {
                pfId: process.env.KAKAO_PFID,
                buttons: buttons
            }
        });

        console.log('친구톡 발송 성공:', {
            messageId: result.messageId,
            to: formattedPhone
        });

        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error('친구톡 발송 실패:', {
            error: error.message,
            to: formattedPhone
        });

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 대량 알림톡 발송 (업데이트 공지 등)
 *
 * @param {Array} recipients - 수신자 배열 [{phoneNumber, orderId, ...}]
 * @param {string} templateId - 템플릿 ID
 * @param {Function} messageBuilder - 메시지 생성 함수
 * @returns {Promise<{successCount: number, failCount: number}>}
 */
export async function sendBulkAlimtalk(recipients, templateId, messageBuilder) {
    const client = getSolapiClient();
    if (!client) {
        return { successCount: 0, failCount: recipients.length };
    }

    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
        try {
            const formattedPhone = formatPhoneNumber(recipient.phoneNumber);
            if (!formattedPhone) {
                failCount++;
                continue;
            }

            const message = messageBuilder(recipient);

            await client.sendOne({
                to: formattedPhone,
                from: process.env.KAKAO_SENDER_KEY,
                type: 'ATA',
                text: message.text,
                kakaoOptions: {
                    pfId: process.env.KAKAO_PFID,
                    templateId: templateId,
                    buttons: message.buttons || []
                }
            });

            successCount++;

            // API Rate Limit 방지 (초당 5건)
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error('대량 발송 중 오류:', {
                error: error.message,
                recipient: recipient
            });
            failCount++;
        }
    }

    console.log('대량 발송 완료:', {
        total: recipients.length,
        success: successCount,
        fail: failCount
    });

    return { successCount, failCount };
}
