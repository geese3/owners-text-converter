import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Firebase Admin 초기화
if (!admin.apps.length) {
  try {
    // 환경 변수에서 서비스 계정 키 읽기
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.');
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin 초기화 실패:', error);
    throw error;
  }
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

