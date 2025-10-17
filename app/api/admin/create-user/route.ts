import { NextRequest, NextResponse } from 'next/server';

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  // 환경 변수에서 서비스 계정 키 읽기
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        type: "service_account",
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
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

  } catch (error: any) {
    console.error('사용자 생성 실패:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 아이디입니다' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

