import { NextRequest, NextResponse } from 'next/server';

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  const serviceAccount = require('../../../../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');
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
  } catch (error: any) {
    console.error('비밀번호 재설정 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

