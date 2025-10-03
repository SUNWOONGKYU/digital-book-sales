import os
import json

# Google Drive 파일의 웹 링크에서 파일 ID를 추출하는 방법 안내
print("=== Google Drive 파일 공유 설정 방법 ===\n")
print("1. Google Drive 웹에서 파일을 찾습니다:")
print("   경로: 내 드라이브/Content/ClaudeCC/Claude설치가이드/v2.0/판매용PDF/Claude_설치사용_완벽가이드.pdf\n")
print("2. 파일을 우클릭하고 '공유' 클릭\n")
print("3. '일반 액세스' 설정:")
print("   - '링크가 있는 모든 사용자'로 변경")
print("   - 권한: '뷰어' 선택\n")
print("4. '링크 복사' 클릭\n")
print("5. 복사된 링크 형식:")
print("   https://drive.google.com/file/d/FILE_ID/view?usp=sharing\n")
print("6. FILE_ID 부분을 복사하세요")
print("\n파일 ID를 입력하세요 (또는 전체 링크 입력): ", end='')

# 사용자 입력 받기 (스크립트 실행 시)
# user_input = input()

# 파일 ID 추출 예제
example_link = "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view?usp=sharing"
print(f"\n예시: {example_link}")
print("추출된 FILE_ID: 1a2b3c4d5e6f7g8h9i0j")
