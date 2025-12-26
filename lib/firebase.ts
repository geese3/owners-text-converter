// Firebase 설정 및 초기화

import { initializeApp, getApps } from 'firebase/app'
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword
} from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'

// Firebase 설정 (환경 변수 사용)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "texttoexcel-af321.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "texttoexcel-af321",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "texttoexcel-af321.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
}

// Firebase 앱 초기화 (중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)

// 사용자 타입 정의
export interface UserData {
  uid: string
  userid: string
  email: string
  displayName: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  isFirstLogin?: boolean
}

// 변환 로그 타입
export interface ConversionLog {
  userId: string
  companyCount: number
  filename: string
  timestamp: string
}

// 로그인
export async function login(userid: string, password: string) {
  try {
    // userid를 이메일 형식으로 변환
    // @가 포함되어 있으면 그대로 사용, 없으면 @local.local 추가
    const email = userid.includes('@') ? userid : `${userid}@local.local`
    
    console.log('🔐 로그인 시도:', { userid, email: email.substring(0, 10) + '...' })
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Firestore에서 사용자 정보 가져오기
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.')
    }
    
    const userData = userDoc.data() as UserData
    
    // 활성 상태 확인
    if (!userData.isActive) {
      throw new Error('이용이 중지된 계정입니다. 관리자에게 문의하세요.')
    }
    
    // 마지막 로그인 시간 업데이트
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: new Date().toISOString()
    })
    
    console.log('✅ 로그인 성공:', userData.userid)
    
    return {
      success: true,
      user: userData
    }
  } catch (error) {
    console.error('❌ 로그인 실패:', error)
    
    const err = error as { code?: string; message?: string }
    
    // Firebase 에러 코드에 따른 사용자 친화적 메시지
    let errorMessage = '로그인에 실패했습니다'
    
    if (err.code) {
      switch (err.code) {
        case 'auth/invalid-credential':
          errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.\n\n확인 사항:\n- 아이디가 정확한지 확인하세요\n- 비밀번호가 정확한지 확인하세요\n- 계정이 생성되어 있는지 확인하세요'
          break
        case 'auth/user-not-found':
          errorMessage = '존재하지 않는 사용자입니다. 관리자에게 계정 생성을 요청하세요.'
          break
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.'
          break
        case 'auth/invalid-email':
          errorMessage = '올바르지 않은 이메일 형식입니다.'
          break
        case 'auth/user-disabled':
          errorMessage = '이용이 중지된 계정입니다. 관리자에게 문의하세요.'
          break
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도하세요.'
          break
        case 'auth/network-request-failed':
          errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하세요.'
          break
        default:
          errorMessage = err.message || `로그인에 실패했습니다. (오류 코드: ${err.code})`
      }
    } else if (err.message) {
      errorMessage = err.message
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

// 로그아웃
export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    const err = error as { message?: string }
    return { success: false, error: err.message || '로그아웃에 실패했습니다' }
  }
}

// 사용자 생성 (관리자만) - Admin SDK 사용하여 현재 세션 유지
export async function createUser(
  userid: string, 
  password: string, 
  displayName: string,
  role: 'admin' | 'user' = 'user'
) {
  try {
    // API 라우트를 통해 서버에서 생성 (현재 로그인 세션 유지)
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid, password, displayName, role })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('사용자 생성 실패:', error);
    const err = error as { message?: string };
    return {
      success: false,
      error: err.message || '사용자 생성에 실패했습니다'
    };
  }
}

// 모든 사용자 조회 (관리자만)
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users: UserData[] = []
    
    usersSnapshot.forEach((doc) => {
      users.push(doc.data() as UserData)
    })
    
    return users
  } catch (error) {
    console.error('사용자 조회 실패:', error)
    return []
  }
}

// 사용자 활성화/비활성화
export async function updateUserStatus(uid: string, isActive: boolean) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive: isActive
    })
    return { success: true }
  } catch (error) {
    const err = error as { message?: string }
    return { success: false, error: err.message || '상태 변경에 실패했습니다' }
  }
}

// 비밀번호 변경
export async function changePassword(userid: string, currentPassword: string, newPassword: string) {
  try {
    // @가 포함되어 있으면 그대로 사용, 없으면 @local.local 추가
    const email = userid.includes('@') ? userid : `${userid}@local.local`
    
    // 현재 비밀번호로 재인증
    const userCredential = await signInWithEmailAndPassword(auth, email, currentPassword)
    
    // 새 비밀번호 설정
    await updatePassword(userCredential.user, newPassword)
    
    return { success: true }
  } catch (error) {
    const err = error as { message?: string }
    return { success: false, error: err.message || '비밀번호 변경에 실패했습니다' }
  }
}

// 비밀번호 초기화 (관리자만, Admin SDK 필요)
export async function resetUserPassword(uid: string, newPassword: string = '1q2w3e4r5!') {
  try {
    // 클라이언트 SDK로는 다른 사용자의 비밀번호를 변경할 수 없으므로
    // API 라우트를 통해 서버에서 처리해야 함
    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, newPassword })
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    const err = error as { message?: string }
    return { success: false, error: err.message || '비밀번호 초기화에 실패했습니다' }
  }
}

// 변환 로그 저장
export async function saveConversionLog(log: ConversionLog) {
  try {
    await addDoc(collection(db, 'conversion_logs'), {
      userId: log.userId,
      companyCount: log.companyCount,
      filename: log.filename,
      timestamp: log.timestamp,
      createdAt: Timestamp.now()
    })
    
    return { success: true }
  } catch (error) {
    console.error('로그 저장 실패:', error)
    const err = error as { message?: string }
    return { success: false, error: err.message || '로그 저장에 실패했습니다' }
  }
}

// 사용자별 변환 로그 조회
export async function getUserConversionLogs(userId: string) {
  try {
    const q = query(
      collection(db, 'conversion_logs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const logs: Array<Record<string, unknown>> = []
    
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() })
    })
    
    return logs
  } catch (error) {
    console.error('로그 조회 실패:', error)
    return []
  }
}

// 모든 변환 로그 조회 (관리자만)
export async function getAllConversionLogs() {
  try {
    const q = query(
      collection(db, 'conversion_logs'),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const logs: Array<Record<string, unknown>> = []
    
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() })
    })
    
    return logs
  } catch (error) {
    console.error('로그 조회 실패:', error)
    return []
  }
}

