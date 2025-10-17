/**
 * Authentication의 실제 이메일에 맞게 Firestore 업데이트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixUserEmails() {
  try {
    console.log('🔄 사용자 이메일 수정 중...\n');

    // 1. Authentication에서 모든 사용자 가져오기
    const authUsers = await admin.auth().listUsers(1000);
    
    // 2. UID를 키로, 이메일을 값으로 하는 맵 생성
    const authEmailMap = {};
    authUsers.users.forEach(user => {
      authEmailMap[user.uid] = user.email;
    });

    // 3. Firestore의 users 컬렉션 가져오기
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('❌ Firestore users 컬렉션이 비어있습니다.');
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    console.log('=' .repeat(70));
    
    snapshot.forEach((doc) => {
      const firestoreData = doc.data();
      const uid = doc.id;
      const authEmail = authEmailMap[uid];
      
      if (!authEmail) {
        console.log(`⚠️  UID ${uid}: Authentication에 사용자 없음`);
        return;
      }

      // Authentication의 이메일과 Firestore의 이메일이 다르면 수정
      if (firestoreData.email !== authEmail) {
        console.log(`\n🔧 ${firestoreData.userid || 'Unknown'}`);
        console.log(`   기존: ${firestoreData.email || '없음'}`);
        console.log(`   수정: ${authEmail}`);
        
        const userRef = db.collection('users').doc(uid);
        batch.update(userRef, {
          email: authEmail,
          updatedAt: new Date().toISOString()
        });
        updateCount++;
      } else {
        console.log(`✅ ${firestoreData.userid}: 이메일 일치 (${authEmail})`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✨ ${updateCount}명의 이메일이 수정되었습니다!`);
    } else {
      console.log('\n✅ 모든 이메일이 이미 일치합니다!');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 최종 사용자 목록:\n');

    // 최종 확인
    const finalSnapshot = await db.collection('users').get();
    finalSnapshot.forEach((doc) => {
      const data = doc.data();
      const authEmail = authEmailMap[doc.id];
      console.log(`${data.userid}:`);
      console.log(`  이메일: ${data.email}`);
      console.log(`  Auth 이메일: ${authEmail}`);
      console.log(`  일치: ${data.email === authEmail ? '✅' : '❌'}`);
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('\n💡 로그인 방법:');
    console.log('  - @local.local 사용자: 아이디만 입력');
    console.log('  - 다른 도메인: 전체 이메일 입력\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

fixUserEmails();

