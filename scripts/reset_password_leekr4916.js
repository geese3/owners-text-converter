/**
 * leekr4916 비밀번호를 Firestore에 저장된 값으로 재설정
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function resetPassword() {
  try {
    console.log('🔍 leekr4916 정보 확인 중...\n');

    // Firestore에서 leekr4916 찾기
    const snapshot = await db.collection('users').where('userid', '==', 'leekr4916').get();
    
    if (snapshot.empty) {
      console.log('❌ leekr4916 사용자를 찾을 수 없습니다.');
      return;
    }

    let uid, password, email;
    snapshot.forEach((doc) => {
      const data = doc.data();
      uid = doc.id;
      password = data.password;
      email = data.email;
      
      console.log('📋 Firestore 정보:');
      console.log(`   UID: ${uid}`);
      console.log(`   아이디: ${data.userid}`);
      console.log(`   이메일: ${email}`);
      console.log(`   비밀번호: ${password || '없음'}\n`);
    });

    // Authentication 정보 확인
    const authUser = await admin.auth().getUser(uid);
    console.log('📋 Authentication 정보:');
    console.log(`   이메일: ${authUser.email}`);
    console.log(`   생성일: ${authUser.metadata.creationTime}`);
    console.log(`   마지막 로그인: ${authUser.metadata.lastSignInTime || '없음'}\n`);

    if (email !== authUser.email) {
      console.log(`⚠️  이메일 불일치!`);
      console.log(`   Firestore: ${email}`);
      console.log(`   Auth: ${authUser.email}\n`);
    }

    if (!password) {
      console.log('❌ Firestore에 비밀번호가 없습니다.');
      return;
    }

    console.log('🔄 비밀번호 재설정 중...\n');

    // Firebase Authentication 비밀번호 업데이트
    await admin.auth().updateUser(uid, {
      password: password
    });

    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!\n');
    console.log('=' .repeat(60));
    console.log('📋 로그인 정보:');
    console.log(`   아이디: leekr4916`);
    console.log(`   비밀번호: ${password}`);
    console.log('=' .repeat(60));
    console.log('\n💡 이제 로그인해보세요!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

resetPassword();

