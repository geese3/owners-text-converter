import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Firebase Admin 초기화 함수 (런타임에 실행)
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // 환경 변수에서 서비스 계정 키 읽기
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.');
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  return admin.firestore();
}

export async function POST(request: NextRequest) {
  try {
    // Firebase Admin 초기화 (런타임)
    const db = initializeFirebaseAdmin();
    
    const { userid, password, displayName, role } = await request.json();

    if (!userid || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 없습니다' },
        { status: 400 }
      );
    }

    // 이메일 형식 생성
    const email = userid.includes('@') ? userid : `${userid}@local.local`;

    // 1. Firebase Auth에 사용자 생성 (Admin SDK 사용 - 자동 로그인 안 됨!)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName
    });

    // 2. Firestore에 사용자 정보 저장
    const userData = {
      uid: userRecord.uid,
      userid: userid,
      email: email,
      displayName: displayName,
      role: role || 'user',
      isActive: true,
      isFirstLogin: true,
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json({ 
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('사용자 생성 실패:', error);
    
    const err = error as { code?: string; message?: string };
    
    if (err.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 아이디입니다' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: err.message || '사용자 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}

