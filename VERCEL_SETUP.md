# 🚀 Vercel 배포 가이드

## 필수 환경 변수 설정

Vercel Dashboard > 프로젝트 > Settings > Environment Variables에서 다음 변수들을 추가하세요.

---

## 📋 환경 변수 목록

### **1. Firebase Client SDK (클라이언트용)**

| 변수명 | 값 | 예시 |
|--------|-----|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyCulOsSze-lYKCJEtbT30tJwBHgoaZcFdw` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth Domain | `texttoexcel-af321.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | `texttoexcel-af321` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `texttoexcel-af321.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `713119485681` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:713119485681:web:3846653e09b3627b8d6350` |

---

### **2. Firebase Admin SDK (서버용) - 옵션 A: 전체 JSON**

**추천 방법**: 서비스 계정 키 파일 전체를 JSON 문자열로 저장

| 변수명 | 값 |
|--------|-----|
| `FIREBASE_SERVICE_ACCOUNT` | 전체 JSON 문자열 (아래 참조) |

**서비스 계정 키 파일 준비:**
```bash
# 파일 내용을 한 줄로 압축
cat texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json | jq -c .
```

**결과 예시:**
```json
{"type":"service_account","project_id":"texttoexcel-af321","private_key_id":"d123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"firebase-adminsdk-fbsvc@texttoexcel-af321.iam.gserviceaccount.com",...}
```

이 전체 JSON 문자열을 `FIREBASE_SERVICE_ACCOUNT` 환경 변수에 복사하세요.

---

### **2-B. Firebase Admin SDK - 옵션 B: 개별 필드**

또는 각 필드를 개별적으로 설정:

| 변수명 | 값 위치 | 예시 |
|--------|---------|------|
| `FIREBASE_PRIVATE_KEY_ID` | `private_key_id` | `d123064bb3...` |
| `FIREBASE_PRIVATE_KEY` | `private_key` | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` | `firebase-adminsdk-fbsvc@texttoexcel-af321.iam.gserviceaccount.com` |
| `FIREBASE_CLIENT_ID` | `client_id` | `123456789...` |
| `FIREBASE_CLIENT_X509_CERT_URL` | `client_x509_cert_url` | `https://www.googleapis.com/robot/v1/metadata/x509/...` |

**⚠️ 주의**: `FIREBASE_PRIVATE_KEY`는 여러 줄이므로 `\n`을 실제 줄바꿈으로 입력하거나 `\\n`으로 이스케이프하세요.

---

## 🔧 Vercel 환경 변수 설정 방법

### **1. Vercel Dashboard 접속**
```
https://vercel.com/dashboard
```

### **2. 프로젝트 선택**
- `owners-text-converter` 프로젝트 클릭

### **3. Settings > Environment Variables**

### **4. 변수 추가**

각 변수마다:
1. **Key**: 변수명 입력
2. **Value**: 값 입력 (민감 정보는 "Sensitive" 체크)
3. **Environment**: Production, Preview, Development 모두 선택
4. **Save** 클릭

---

## 📝 빠른 설정 (옵션 A 추천)

### **서비스 계정 키 파일에서 복사:**

로컬에서 실행:
```bash
cd /Users/seolhee/Documents/00_project/text_to_excel_converter
cat texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json | jq -c .
```

출력된 JSON 문자열을 복사해서 Vercel의 `FIREBASE_SERVICE_ACCOUNT` 환경 변수에 붙여넣기

---

## ✅ 환경 변수 설정 후

1. Vercel Dashboard에서 **Redeploy** 클릭
2. 또는 새로운 커밋을 푸시하면 자동 재배포

---

## 🔍 환경 변수 확인

배포 후 로그에서 다음과 같은 에러가 없어야 함:
```
✅ Module not found 에러 해결
✅ Firebase Admin 초기화 성공
```

---

## 💡 보안 팁

1. **Sensitive 체크**: 모든 Firebase 관련 변수는 "Sensitive"로 체크
2. **Private Key**: 특히 `FIREBASE_PRIVATE_KEY`는 절대 공개하지 마세요
3. **Git**: `.env.local`은 `.gitignore`에 포함되어 있으므로 안전

---

**환경 변수 설정 후 재배포하세요!** 🚀

