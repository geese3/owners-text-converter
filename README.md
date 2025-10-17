# 🔄 크레탑 데이터 엑셀 변환기 (웹 버전)

크레탑에서 복사한 텍스트 데이터를 자동으로 파싱하여 엑셀 파일(`.xlsx`)로 변환하는 웹 애플리케이션입니다.

**🔒 로그인 기반 시스템으로 사용자 관리 및 변환 이력을 추적합니다.**

---

## ✨ 주요 기능

### 🔐 인증 시스템
- **로그인/로그아웃**: Firebase Authentication 기반
- **사용자 역할**: 일반 사용자 / 관리자
- **세션 유지**: 브라우저 새로고침 시에도 로그인 상태 유지

### 📝 텍스트 변환
- **텍스트 파싱**: 크레탑 형식의 텍스트 자동 파싱
- **미리보기**: 변환 전 데이터 확인
- **엑셀 생성**: 자동 파일명(`cretop_data_YYMMDDHHMM.xlsx`)으로 다운로드
- **클립보드 지원**: 버튼 클릭으로 간편하게 붙여넣기
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원

### 👥 관리자 기능
- **사용자 관리**: 계정 생성, 활성화/비활성화
- **통계 대시보드**: 전체 사용자 수, 활성 사용자 수, 총 변환 횟수
- **변환 로그**: 모든 사용자의 변환 이력 조회

---

## 🛠️ 기술 스택

- **Next.js 15**: React 프레임워크
- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 현대적인 UI 스타일링
- **Firebase**:
  - Authentication (사용자 인증)
  - Firestore (데이터베이스)
- **xlsx**: 엑셀 파일 생성
- **lucide-react**: 아이콘

---

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

**상세 가이드**: `SETUP_GUIDE.md` 참조

1. Firebase Console에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호)
3. Firestore Database 생성
4. 웹 앱 추가 및 설정 복사
5. `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 초기 관리자 계정 생성

Firebase Console에서 수동으로 생성 (자세한 내용은 `SETUP_GUIDE.md` 참조)

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 📝 사용 방법

### 일반 사용자

1. **로그인**: 아이디와 비밀번호 입력
2. **데이터 입력**: 크레탑에서 복사한 텍스트 붙여넣기
3. **미리보기**: 파싱 결과 확인
4. **다운로드**: 엑셀 파일 저장

### 관리자

1. **로그인**: 관리자 계정으로 로그인
2. **관리자 페이지**: 우측 상단 **관리자** 버튼 클릭
3. **사용자 관리**:
   - 새 사용자 추가
   - 사용자 활성화/비활성화
4. **통계 확인**: 대시보드에서 전체 통계 조회
5. **로그 확인**: 모든 변환 이력 조회

---

## 📦 출력 형식

| 기업명 | 대표자명 | 주소 |
|--------|----------|------|
| (주)예시기업 | 홍길동 | 서울시 강남구... |

---

## 📄 프로젝트 구조

```
text_converter_web/
├── app/
│   ├── page.tsx              # 메인 페이지 (변환기)
│   ├── login/
│   │   └── page.tsx          # 로그인 페이지
│   ├── admin/
│   │   └── page.tsx          # 관리자 페이지
│   ├── layout.tsx            # 루트 레이아웃 (AuthProvider)
│   └── globals.css           # 글로벌 스타일
├── contexts/
│   └── AuthContext.tsx       # 인증 컨텍스트
├── lib/
│   └── firebase.ts           # Firebase 설정 및 함수
├── public/
│   └── sample.txt            # 샘플 데이터
├── .env.local                # 환경 변수 (Git 제외)
├── package.json
├── README.md                 # 프로젝트 개요 (현재 파일)
├── SETUP_GUIDE.md            # Firebase 설정 가이드
├── FEATURES.md               # 전체 기능 목록
├── USER_GUIDE.md             # 사용 설명서
└── COMPARISON.md             # 데스크톱 vs 웹 비교
```

---

## 🔒 보안

### 인증
- Firebase Authentication 사용
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 해싱 (Firebase 자동)

### 데이터베이스
- Firestore 보안 규칙 적용
- 사용자별 데이터 격리
- 인증된 사용자만 읽기/쓰기 가능

### 환경 변수
- `.env.local`로 민감 정보 관리
- Git에 커밋되지 않음

---

## 📊 데이터베이스 구조

### `users` 컬렉션
```typescript
{
  uid: string,              // Firebase Auth UID
  userid: string,           // 로그인 아이디
  email: string,            // 이메일 (userid@local.local)
  displayName: string,      // 표시 이름
  role: 'admin' | 'user',   // 역할
  isActive: boolean,        // 활성 상태
  createdAt: string,        // 생성 날짜
  lastLogin?: string        // 마지막 로그인
}
```

### `conversion_logs` 컬렉션
```typescript
{
  userId: string,           // 사용자 UID
  companyCount: number,     // 변환된 기업 수
  filename: string,         // 파일명
  timestamp: string,        // 변환 일시
  createdAt: Timestamp      // Firestore Timestamp
}
```

---

## 📚 문서

- **`README.md`**: 프로젝트 개요 (현재 파일)
- **`SETUP_GUIDE.md`**: Firebase 설정 단계별 가이드
- **`FEATURES.md`**: 전체 기능 목록 및 기술 스택
- **`USER_GUIDE.md`**: 사용자를 위한 상세 설명서
- **`COMPARISON.md`**: 데스크톱 vs 웹 버전 비교

---

## 🔗 관련 프로젝트

- **데스크톱 버전**: `text_to_excel_converter/` (Python + CustomTkinter + Firebase)

---

## 🚨 문제 해결

### Firebase 설정 오류
1. `.env.local` 파일 확인
2. 환경 변수 형식 확인 (`NEXT_PUBLIC_` 접두사)
3. 개발 서버 재시작

### 로그인 실패
1. Firebase Console > Authentication에서 사용자 확인
2. Firestore에 `users` 문서가 있는지 확인
3. 사용자 `isActive` 상태 확인

### 권한 오류
1. Firestore 보안 규칙 확인
2. 테스트 모드로 설정되어 있는지 확인

자세한 내용은 `SETUP_GUIDE.md`의 **문제 해결** 섹션을 참조하세요.

---

## 📈 향후 계획

- [ ] 비밀번호 변경 기능
- [ ] 사용자별 통계
- [ ] 다양한 입력 형식 지원
- [ ] 다크 모드
- [ ] 다국어 지원

전체 기능 및 향후 계획은 `FEATURES.md`를 참조하세요.

---

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우:
1. `SETUP_GUIDE.md` 확인
2. Firebase Console에서 로그 확인
3. 브라우저 개발자 도구 (F12) 콘솔 확인

---

**개발 날짜**: 2025-10-17  
**버전**: 2.0 (로그인 기능 추가)
