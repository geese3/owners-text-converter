/**
 * userid를 Authentication 이메일과 일치시키기
 * rutin00 -> rutin008
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function syncUserIds() {
  try {
    console.log('🔄 userid 동기화 중...\n');

    // Authentication 사용자 목록
    const authUsers = await admin.auth().listUsers(1000);
    const authMap = {};
    authUsers.users.forEach(user => {
      authMap[user.uid] = user.email;
    });

    // Firestore 사용자들
    const snapshot = await db.collection('users').get();
    
    const batch = db.batch();
    let updateCount = 0;

    console.log('=' .repeat(70));
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const authEmail = authMap[doc.id];
      
      if (!authEmail) return;
      
      // 이메일에서 @ 앞부분 추출
      const correctUserid = authEmail.split('@')[0];
      
      if (data.userid !== correctUserid) {
        console.log(`\n🔧 UID: ${doc.id}`);
        console.log(`   기존 userid: ${data.userid}`);
        console.log(`   수정 userid: ${correctUserid}`);
        console.log(`   이메일: ${authEmail}`);
        
        const userRef = db.collection('users').doc(doc.id);
        batch.update(userRef, {
          userid: correctUserid,
          updatedAt: new Date().toISOString()
        });
        updateCount++;
      } else {
        console.log(`✅ ${data.userid}: 이미 일치`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✨ ${updateCount}명의 userid가 수정되었습니다!`);
    } else {
      console.log('\n✅ 모든 userid가 이미 일치합니다!');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 최종 로그인 정보:\n');

    // 최종 확인
    const finalSnapshot = await db.collection('users').get();
    finalSnapshot.forEach((doc) => {
      const data = doc.data();
      const authEmail = authMap[doc.id];
      console.log(`로그인 아이디: ${data.userid}`);
      console.log(`  이메일: ${authEmail}`);
      console.log(`  역할: ${data.role}`);
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('\n💡 이제 다음 아이디로 로그인하세요:\n');
    
    finalSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.userid}`);
    });
    
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

syncUserIds();

