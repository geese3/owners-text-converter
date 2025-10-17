/**
 * 기존 사용자들의 isFirstLogin을 false로 설정
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function setFirstLoginFalse() {
  try {
    console.log('🔄 기존 사용자들의 isFirstLogin을 false로 설정 중...\n');

    const snapshot = await db.collection('users').get();
    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // test 사용자는 제외 (실제 최초 로그인 테스트용)
      if (data.userid === 'test') {
        console.log(`⏭️  ${data.userid}: 건너뜀 (테스트용)`);
        return;
      }
      
      // isFirstLogin이 없거나 true인 경우만 업데이트
      if (data.isFirstLogin === undefined || data.isFirstLogin === true) {
        console.log(`✅ ${data.userid}: isFirstLogin을 false로 설정`);
        batch.update(doc.ref, {
          isFirstLogin: false,
          updatedAt: new Date().toISOString()
        });
        count++;
      } else {
        console.log(`✓ ${data.userid}: 이미 false`);
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`\n✨ ${count}명의 사용자가 업데이트되었습니다!`);
    } else {
      console.log('\n✅ 모든 사용자가 이미 설정되어 있습니다.');
    }

    console.log('\n최종 확인:\n');
    const final = await db.collection('users').get();
    final.forEach((doc) => {
      const data = doc.data();
      console.log(`${data.userid}: isFirstLogin = ${data.isFirstLogin}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

setFirstLoginFalse();

