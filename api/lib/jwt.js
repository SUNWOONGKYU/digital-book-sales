/**
 * JWT 토큰 유틸리티
 * 보안 다운로드 링크 생성 및 검증
 */

import jwt from 'jsonwebtoken';

/**
 * 다운로드 토큰 생성
 * @param {Object} payload - 토큰에 포함할 데이터
 * @param {string} payload.orderId - 주문 ID
 * @param {string} payload.customerEmail - 고객 이메일
 * @returns {string} JWT 토큰
 */
export function generateDownloadToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
    }

    const expiryHours = parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS) || 24;

    return jwt.sign(
        {
            orderId: payload.orderId,
            customerEmail: payload.customerEmail,
            type: 'download'
        },
        secret,
        {
            expiresIn: `${expiryHours}h`
        }
    );
}

/**
 * 다운로드 토큰 검증
 * @param {string} token - JWT 토큰
 * @returns {Object} 디코딩된 페이로드
 * @throws {Error} 토큰이 유효하지 않거나 만료된 경우
 */
export function verifyDownloadToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
    }

    try {
        const decoded = jwt.verify(token, secret);

        // 다운로드 토큰인지 확인
        if (decoded.type !== 'download') {
            throw new Error('유효하지 않은 토큰 타입입니다.');
        }

        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('다운로드 링크가 만료되었습니다. 카카오톡 채널로 문의해주세요.');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('유효하지 않은 다운로드 링크입니다.');
        } else {
            throw error;
        }
    }
}

/**
 * 토큰에서 주문 ID 추출
 * @param {string} token - JWT 토큰
 * @returns {string|null} 주문 ID
 */
export function extractOrderId(token) {
    try {
        const decoded = verifyDownloadToken(token);
        return decoded.orderId;
    } catch (error) {
        return null;
    }
}
