/**
 * Firestore에서 waa88 사용자의 비밀번호 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkPassword() {
  try {
    console.log('🔍 waa88 비밀번호 확인 중...\n');

    const snapshot = await db.collection('users').where('userid', '==', 'waa88').get();
    
    if (snapshot.empty) {
      console.log('❌ waa88 사용자를 찾을 수 없습니다.');
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📋 waa88 사용자 정보:');
      console.log('=' .repeat(60));
      console.log(`UID: ${doc.id}`);
      console.log(`아이디: ${data.userid}`);
      console.log(`이메일: ${data.email}`);
      console.log(`비밀번호: ${data.password || '없음'}`);
      console.log(`역할: ${data.role}`);
      console.log(`활성: ${data.isActive}`);
      console.log('=' .repeat(60));
      
      if (data.password) {
        console.log(`\n💡 Firestore에 저장된 비밀번호: ${data.password}`);
        console.log('   이 비밀번호로 로그인 시도해보세요!\n');
      } else {
        console.log('\n⚠️  Firestore에 비밀번호가 저장되어 있지 않습니다.');
        console.log('   Firebase Console에서 비밀번호를 재설정해야 합니다.\n');
      }
    });

    // 모든 사용자의 비밀번호도 확인
    console.log('\n\n📋 모든 사용자의 Firestore 비밀번호:\n');
    console.log('=' .repeat(60));
    
    const allUsers = await db.collection('users').get();
    allUsers.forEach((doc) => {
      const data = doc.data();
      console.log(`${data.userid}: ${data.password || '없음'}`);
    });
    console.log('=' .repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkPassword();

