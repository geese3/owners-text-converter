/**
 * waa88 비밀번호를 Firestore에 저장된 값으로 재설정
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function resetPassword() {
  try {
    console.log('🔄 waa88 비밀번호 재설정 중...\n');

    const uid = 'usgDc3cc94MaRum3q3Eoiv8BJGw2';
    const newPassword = 'chang615!';

    // Firebase Authentication 비밀번호 업데이트
    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!\n');
    console.log('=' .repeat(60));
    console.log('📋 로그인 정보:');
    console.log(`   아이디: waa88`);
    console.log(`   비밀번호: ${newPassword}`);
    console.log('=' .repeat(60));
    console.log('\n💡 이제 로그인해보세요!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

resetPassword();

