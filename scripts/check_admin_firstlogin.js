/**
 * 관리자 계정들의 isFirstLogin 상태 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFirstLogin() {
  try {
    console.log('🔍 모든 사용자의 isFirstLogin 상태 확인...\n');
    console.log('=' .repeat(70));

    const snapshot = await db.collection('users').get();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n${data.userid}:`);
      console.log(`  이름: ${data.displayName}`);
      console.log(`  역할: ${data.role}`);
      console.log(`  isFirstLogin: ${data.isFirstLogin !== undefined ? data.isFirstLogin : '(없음)'}`);
      console.log(`  활성: ${data.isActive}`);
    });

    console.log('\n' + '=' .repeat(70));
    console.log('\n💡 isFirstLogin이 true인 사용자는 로그인 시 비밀번호 변경이 필요합니다.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkFirstLogin();

