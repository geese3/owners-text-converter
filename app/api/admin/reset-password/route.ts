import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

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

export async function POST(request: NextRequest) {
  try {
    const { uid, newPassword } = await request.json();

    if (!uid || !newPassword) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 없습니다' },
        { status: 400 }
      );
    }

    // Firebase Admin SDK로 비밀번호 업데이트
    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('비밀번호 재설정 실패:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || '비밀번호 재설정에 실패했습니다' },
      { status: 500 }
    );
  }
}

