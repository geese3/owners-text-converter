import { NextRequest, NextResponse } from 'next/server';

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  const serviceAccount = require('../../../../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');
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

