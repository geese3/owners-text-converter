/**
 * leekr4916의 이메일을 Authentication과 일치시키기
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixEmail() {
  try {
    console.log('🔄 leekr4916 이메일 수정 중...\n');

    const uid = 'sKeCyp4JZyZcGPPDnbmkL4H3BHo2';
    
    // Authentication의 실제 이메일 가져오기
    const authUser = await admin.auth().getUser(uid);
    const authEmail = authUser.email;
    
    console.log(`Authentication 이메일: ${authEmail}\n`);

    // Firestore 업데이트
    await db.collection('users').doc(uid).update({
      email: authEmail,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ 이메일이 수정되었습니다!\n');
    console.log('=' .repeat(60));
    console.log('📋 최종 로그인 정보:');
    console.log(`   아이디: leekr4916`);
    console.log(`   이메일: ${authEmail}`);
    console.log(`   비밀번호: 1q2w3e4r5!`);
    console.log('=' .repeat(60));
    console.log('\n💡 로그인 방법:');
    console.log('   아이디: leekr4916 입력');
    console.log('   → 자동으로 leekr4916@local.local로 변환됩니다\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

fixEmail();

