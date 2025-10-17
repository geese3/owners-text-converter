/**
 * geese3 계정의 isFirstLogin 상태 확인 및 수정
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAndFix() {
  try {
    console.log('🔍 geese3 계정 확인 중...\n');

    const snapshot = await db.collection('users').where('userid', '==', 'geese3').get();
    
    if (snapshot.empty) {
      console.log('❌ geese3 사용자를 찾을 수 없습니다.');
      return;
    }

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      console.log('📋 현재 geese3 데이터:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n');
      
      console.log(`isFirstLogin 값: ${data.isFirstLogin}`);
      console.log(`타입: ${typeof data.isFirstLogin}`);
      console.log(`=== true 체크: ${data.isFirstLogin === true}`);
      console.log(`=== false 체크: ${data.isFirstLogin === false}`);
      console.log(`=== undefined 체크: ${data.isFirstLogin === undefined}`);
      
      // 명시적으로 false로 설정
      if (data.isFirstLogin !== false) {
        console.log('\n🔧 isFirstLogin을 false로 설정 중...');
        await doc.ref.update({
          isFirstLogin: false,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ 완료!');
      } else {
        console.log('\n✅ 이미 false로 설정되어 있습니다.');
      }
    });

    setTimeout(() => {
      console.log('\n재확인 중...\n');
      db.collection('users').where('userid', '==', 'geese3').get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log('최종 isFirstLogin 값:', data.isFirstLogin);
            console.log('타입:', typeof data.isFirstLogin);
          });
          process.exit(0);
        });
    }, 1000);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkAndFix();

