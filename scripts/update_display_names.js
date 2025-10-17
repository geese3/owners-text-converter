/**
 * displayName을 실제 사용자 이름으로 업데이트
 * Firestore에 저장된 한글 이름 정보를 가져와서 displayName 필드에 반영
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateDisplayNames() {
  try {
    console.log('🔄 displayName 업데이트 중...\n');
    console.log('=' .repeat(70));

    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('❌ users 컬렉션이 비어있습니다.');
      return;
    }

    // 수동으로 이름 매핑 (필요시 수정)
    const nameMapping = {
      'rutin008': '전민혁 팀장',
      'geese3': '이설희 팀장',
      'financial.agape': '금융팀 관리자',
      'leekr4916': '이경림 팀장',
      'waa88': '왕상아 팀장'
    };

    const batch = db.batch();
    let updateCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const userid = data.userid;
      const userRef = db.collection('users').doc(doc.id);
      
      // 매핑된 이름이 있으면 사용
      if (nameMapping[userid]) {
        const newDisplayName = nameMapping[userid];
        
        console.log(`🔧 ${userid}`);
        console.log(`   기존: ${data.displayName || '없음'}`);
        console.log(`   변경: ${newDisplayName}`);
        
        batch.update(userRef, {
          displayName: newDisplayName,
          updatedAt: new Date().toISOString()
        });
        updateCount++;
      } else {
        console.log(`⚠️  ${userid}: 매핑된 이름 없음 (현재: ${data.displayName})`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✨ ${updateCount}명의 displayName이 업데이트되었습니다!`);
    } else {
      console.log('\n⚠️  업데이트할 사용자가 없습니다.');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 최종 사용자 목록:\n');

    // 최종 확인
    const finalSnapshot = await db.collection('users').get();
    finalSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`${data.userid}:`);
      console.log(`  이름: ${data.displayName}`);
      console.log(`  역할: ${data.role === 'admin' ? '관리자' : '일반 사용자'}`);
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('\n💡 이름을 수정하려면 스크립트의 nameMapping을 편집하세요.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

updateDisplayNames();

