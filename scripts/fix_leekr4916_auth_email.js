/**
 * leekr4916의 Authentication 이메일을 leekr4916@local.local로 변경
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function fixAuthEmail() {
  try {
    console.log('🔄 leekr4916 Authentication 이메일 수정 중...\n');

    const uid = 'sKeCyp4JZyZcGPPDnbmkL4H3BHo2';
    const newEmail = 'leekr4916@local.local';
    const password = '1q2w3e4r5!';
    
    console.log('📋 변경 내용:');
    console.log(`   기존: geese4@local.local`);
    console.log(`   변경: ${newEmail}\n`);

    // Authentication 이메일 및 비밀번호 업데이트
    await admin.auth().updateUser(uid, {
      email: newEmail,
      password: password
    });

    console.log('✅ Authentication이 성공적으로 업데이트되었습니다!\n');
    console.log('=' .repeat(60));
    console.log('📋 최종 로그인 정보:');
    console.log(`   아이디: leekr4916`);
    console.log(`   비밀번호: ${password}`);
    console.log('=' .repeat(60));
    console.log('\n💡 이제 "leekr4916"만 입력하면 로그인 가능합니다!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  leekr4916@local.local 이메일이 이미 사용 중입니다.');
      console.log('   다른 사용자가 이 이메일을 사용하고 있을 수 있습니다.\n');
    }
    
    process.exit(1);
  }
}

fixAuthEmail();

