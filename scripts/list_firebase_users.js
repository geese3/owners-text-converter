/**
 * Firebase Authentication 사용자 목록 조회 스크립트
 * 
 * 실행 방법:
 * node scripts/list_firebase_users.js
 */

const admin = require('firebase-admin');

// 서비스 계정 키 파일 경로
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

try {
  // Firebase Admin 초기화
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  console.log('✅ Firebase 연결 성공!\n');

  // Authentication 사용자 목록 가져오기
  admin.auth().listUsers(1000)
    .then((listUsersResult) => {
      console.log(`📊 총 ${listUsersResult.users.length}명의 사용자가 있습니다.\n`);
      console.log('=' .repeat(80));
      
      listUsersResult.users.forEach((userRecord, index) => {
        console.log(`\n${index + 1}. 사용자 정보:`);
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   이메일: ${userRecord.email || '없음'}`);
        console.log(`   생성일: ${userRecord.metadata.creationTime}`);
        console.log(`   마지막 로그인: ${userRecord.metadata.lastSignInTime || '로그인 기록 없음'}`);
        console.log(`   이메일 인증: ${userRecord.emailVerified ? '완료' : '미완료'}`);
        console.log(`   비활성화: ${userRecord.disabled ? '예' : '아니오'}`);
        console.log('-'.repeat(80));
      });

      console.log('\n\n🔍 Firestore에 users 문서가 있는지 확인 중...\n');

      // Firestore 확인
      const db = admin.firestore();
      return db.collection('users').get();
    })
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log('⚠️  Firestore에 users 컬렉션이 비어있습니다!');
        console.log('💡 각 사용자마다 Firestore 문서를 생성해야 합니다.\n');
      } else {
        console.log(`✅ Firestore에 ${snapshot.size}개의 사용자 문서가 있습니다.\n`);
        console.log('=' .repeat(80));
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`\n문서 ID: ${doc.id}`);
          console.log(`   아이디: ${data.userid || '없음'}`);
          console.log(`   이름: ${data.displayName || '없음'}`);
          console.log(`   역할: ${data.role || '없음'}`);
          console.log(`   활성: ${data.isActive ? '예' : '아니오'}`);
          console.log('-'.repeat(80));
        });
      }

      console.log('\n\n✨ 완료!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Firebase 초기화 실패:', error.message);
  console.error('\n💡 해결 방법:');
  console.error('1. Firebase Admin SDK 서비스 계정 키 파일이 있는지 확인');
  console.error('2. 파일 경로가 올바른지 확인');
  process.exit(1);
}

