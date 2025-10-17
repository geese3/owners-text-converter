/**
 * 모든 Firebase 사용자 활성화 및 정보 업데이트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function activateAllUsers() {
  try {
    console.log('🔄 사용자 활성화 시작...\n');

    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('❌ users 컬렉션이 비어있습니다.');
      return;
    }

    let count = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const userRef = db.collection('users').doc(doc.id);
      
      // 업데이트할 데이터
      const updates = {
        isActive: true,
        displayName: data.displayName || data.userid || '사용자',
        email: data.email || `${data.userid}@local.local`,
        updatedAt: new Date().toISOString()
      };

      console.log(`✅ ${data.userid} 활성화 및 업데이트`);
      batch.update(userRef, updates);
      count++;
    });

    await batch.commit();
    
    console.log(`\n✨ 총 ${count}명의 사용자가 활성화되었습니다!`);
    console.log('\n이제 다음 계정으로 로그인할 수 있습니다:');
    console.log('=' .repeat(60));
    
    const updatedSnapshot = await db.collection('users').get();
    updatedSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n아이디: ${data.userid}`);
      console.log(`이메일: ${data.email}`);
      console.log(`역할: ${data.role === 'admin' ? '관리자' : '일반 사용자'}`);
      console.log(`상태: ${data.isActive ? '✅ 활성' : '❌ 비활성'}`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n💡 로그인 방법:');
    console.log('   - @local.local 사용자: 아이디만 입력 (예: rutin00)');
    console.log('   - 기타 이메일: 전체 이메일 입력 (예: geese3@naver.com)');
    console.log('   - 비밀번호: 각 사용자의 기존 비밀번호\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

activateAllUsers();

