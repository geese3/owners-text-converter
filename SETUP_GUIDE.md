# 🔥 Firebase 설정 가이드

## 1단계: Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. https://console.firebase.google.com 접속
2. Google 계정으로 로그인
3. **프로젝트 추가** 클릭

### 1.2 프로젝트 생성
1. 프로젝트 이름 입력: `texttoexcel` (또는 원하는 이름)
2. **계속** 클릭
3. Google Analytics 활성화 (선택 사항)
4. **프로젝트 만들기** 클릭

---

## 2단계: Firebase Authentication 설정

### 2.1 Authentication 활성화
1. 좌측 메뉴에서 **Authentication** 클릭
2. **시작하기** 버튼 클릭
3. **Sign-in method** 탭 선택

### 2.2 이메일/비밀번호 인증 활성화
1. **이메일/비밀번호** 클릭
2. **사용 설정** 토글을 켜기
3. **저장** 클릭

---

## 3단계: Firestore Database 설정

### 3.1 Firestore 생성
1. 좌측 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 (나중에 보안 규칙 수정)
4. 리전 선택: `asia-northeast3 (Seoul)` 권장
5. **사용 설정** 클릭

### 3.2 보안 규칙 설정
**Rules** 탭에서 다음과 같이 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 읽기/쓰기 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 사용자는 자신의 데이터만 수정 가능
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 변환 로그는 인증된 사용자만 쓰기 가능
    match /conversion_logs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

---

## 4단계: 웹 앱 추가 및 설정

### 4.1 웹 앱 추가
1. 프로젝트 설정 (⚙️ 아이콘) > **프로젝트 설정** 클릭
2. **앱 추가** > **웹(</>) 아이콘** 클릭
3. 앱 닉네임 입력: `text_converter_web`
4. **Firebase Hosting 설정** 체크 해제
5. **앱 등록** 클릭

### 4.2 Firebase SDK 설정 복사
다음과 같은 설정이 표시됩니다:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "texttoexcel-af321.firebaseapp.com",
  projectId: "texttoexcel-af321",
  storageBucket: "texttoexcel-af321.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 5단계: 환경 변수 설정

### 5.1 .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 생성하고 아래와 같이 작성:

```bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=texttoexcel-af321.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=texttoexcel-af321
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=texttoexcel-af321.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**중요:** `.env.local` 파일은 `.gitignore`에 자동으로 포함되어 Git에 커밋되지 않습니다.

---

## 6단계: 초기 관리자 계정 생성

### 6.1 Firebase Console에서 수동 생성

#### Authentication에서 사용자 추가
1. **Authentication** > **Users** 탭
2. **사용자 추가** 클릭
3. 이메일: `admin@local.local`
4. 비밀번호: 원하는 비밀번호 (최소 6자)
5. **사용자 추가** 클릭

#### Firestore에 사용자 정보 추가
1. **Firestore Database** > **데이터** 탭
2. **컬렉션 시작** 클릭
3. 컬렉션 ID: `users`
4. **다음** 클릭
5. 문서 ID: (Authentication에서 생성된 사용자의 UID 복사)
6. 필드 추가:
   - `uid` (string): 사용자의 UID
   - `userid` (string): `admin`
   - `email` (string): `admin@local.local`
   - `displayName` (string): `관리자`
   - `role` (string): `admin`
   - `isActive` (boolean): `true`
   - `createdAt` (string): `2025-10-17T00:00:00.000Z` (현재 날짜)
7. **저장** 클릭

---

## 7단계: 애플리케이션 실행

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` (또는 다른 포트) 접속

---

## 8단계: 로그인 테스트

1. 로그인 페이지에서 다음으로 로그인:
   - 아이디: `admin`
   - 비밀번호: (6단계에서 설정한 비밀번호)

2. 로그인 성공 시 메인 페이지로 이동
3. 우측 상단에 **관리자** 버튼이 표시됨

---

## 9단계: 추가 사용자 생성

### 관리자 페이지에서 생성
1. 우측 상단 **관리자** 버튼 클릭
2. **새 사용자 추가** 버튼 클릭
3. 사용자 정보 입력:
   - 아이디: 원하는 아이디
   - 비밀번호: 원하는 비밀번호
   - 이름: 표시될 이름
   - 역할: 일반 사용자 또는 관리자
4. **생성** 버튼 클릭

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
  createdAt: string,        // 생성 날짜 (ISO 8601)
  lastLogin?: string        // 마지막 로그인 (ISO 8601)
}
```

### `conversion_logs` 컬렉션
```typescript
{
  userId: string,           // 사용자 UID
  companyCount: number,     // 변환된 기업 수
  filename: string,         // 생성된 파일명
  timestamp: string,        // 변환 일시 (ISO 8601)
  createdAt: Timestamp      // Firestore Timestamp
}
```

---

## 🔒 보안 설정 (프로덕션)

### Firebase 보안 규칙 강화
프로덕션 배포 전에 Firestore 규칙을 더 엄격하게 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 컬렉션
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if false; // 관리자만 생성 가능
      allow update: if request.auth != null && 
                       (request.auth.uid == userId || 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if false;
    }
    
    // 변환 로그
    match /conversion_logs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

---

## 🚨 문제 해결

### 1. "Firebase config error"
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 모든 환경 변수가 `NEXT_PUBLIC_` 접두사로 시작하는지 확인
- 개발 서버를 재시작 (`npm run dev`)

### 2. "Permission denied"
- Firestore 보안 규칙을 확인
- Firebase Console > Firestore Database > Rules 탭
- 테스트 모드로 설정되어 있는지 확인

### 3. "User not found"
- Firestore에 `users` 컬렉션과 문서가 제대로 생성되었는지 확인
- 문서 ID가 Authentication의 UID와 일치하는지 확인

### 4. "Invalid email"
- 아이디는 `userid@local.local` 형식으로 자동 변환됩니다
- 아이디만 입력하면 됩니다 (이메일 형식 불필요)

---

## 📚 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firebase Authentication 가이드](https://firebase.google.com/docs/auth)
- [Firestore 가이드](https://firebase.google.com/docs/firestore)
- [Next.js 환경 변수](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] Authentication 활성화 (이메일/비밀번호)
- [ ] Firestore Database 생성
- [ ] 웹 앱 추가 및 설정 복사
- [ ] `.env.local` 파일 생성
- [ ] 초기 관리자 계정 생성
- [ ] 개발 서버 실행 및 로그인 테스트
- [ ] 추가 사용자 생성 테스트
- [ ] 변환 기능 테스트
- [ ] 관리자 페이지 테스트

모든 항목을 완료하면 애플리케이션을 사용할 준비가 완료됩니다! 🎉

