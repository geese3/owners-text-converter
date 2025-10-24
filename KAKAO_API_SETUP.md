# 카카오 주소 검색 API 설정 가이드

## 1. 카카오 개발자 계정 생성

1. **카카오 개발자 사이트 접속**
   - URL: https://developers.kakao.com/

2. **로그인**
   - 카카오 계정으로 로그인
   - 없으면 회원가입 (무료)

## 2. 애플리케이션 생성

1. **내 애플리케이션 메뉴 클릭**
   - 상단 메뉴 → "내 애플리케이션"

2. **애플리케이션 추가하기**
   - "애플리케이션 추가하기" 버튼 클릭
   - 앱 이름: `크레탑 데이터 변환기` (또는 원하는 이름)
   - 사업자명: 개인 또는 회사명
   - "저장" 클릭

3. **REST API 키 복사**
   - 생성된 앱 클릭
   - "앱 키" 탭에서 **REST API 키** 복사
   - 예: `1234567890abcdef1234567890abcdef`

## 3. 플랫폼 설정 (선택사항)

1. **플랫폼 추가**
   - 왼쪽 메뉴 → "플랫폼"
   - "Web 플랫폼 등록"
   - 사이트 도메인: `http://localhost:3000` (개발용)
   - 배포 후: `https://your-domain.vercel.app` 추가

## 4. 환경 변수 설정

1. **로컬 개발 환경**
   - `.env.local` 파일에 추가:
   ```
   KAKAO_REST_API_KEY=발급받은_REST_API_키
   ```

2. **Vercel 배포 환경**
   - Vercel 대시보드 → Settings → Environment Variables
   - Name: `KAKAO_REST_API_KEY`
   - Value: 발급받은 REST API 키
   - Environment: Production, Preview, Development 모두 체크

## 5. 테스트

1. 개발 서버 재시작
   ```bash
   npm run dev
   ```

2. 브라우저에서 테스트
   - 텍스트 입력 → 미리보기 클릭
   - 터미널에서 `✅ 우편번호 찾음:` 확인

## API 사용량

- **무료 할당량**: 일 300,000건
- **초과 시**: 유료 전환 가능
- **현재 사용 예상**: 하루 100~1000건 (충분)

## 참고

- 카카오 주소 검색 API 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide#address-coord
- REST API 가이드: https://developers.kakao.com/docs/latest/ko/getting-started/rest-api

