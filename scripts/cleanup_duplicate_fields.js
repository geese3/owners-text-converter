/**
 * 중복 필드 정리 (스네이크 케이스 → 카멜 케이스)
 * 데스크톱 버전의 snake_case 필드를 삭제하고 웹 버전의 camelCase만 유지
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../text_to_excel_converter/texttoexcel-af321-firebase-adminsdk-fbsvc-d123064bb3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const { FieldValue } = require('firebase-admin/firestore');

async function cleanupFields() {
  try {
    console.log('🔄 중복 필드 정리 중...\n');
    console.log('=' .repeat(70));

    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('❌ users 컬렉션이 비어있습니다.');
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    // 삭제할 필드 목록 (스네이크 케이스)
    const fieldsToDelete = [
      'display_name',
      'is_active', 
      'last_login',
      'updated_at',
      'created_at'  // created_at도 삭제 (camelCase createdAt 사용)
    ];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const userRef = db.collection('users').doc(doc.id);
      
      // 삭제할 필드가 있는지 확인
      const hasFieldsToDelete = fieldsToDelete.some(field => data.hasOwnProperty(field));
      
      if (hasFieldsToDelete) {
        console.log(`\n🔧 ${data.userid || doc.id}`);
        
        const updates = {};
        
        // 카멜케이스 필드가 없으면 스네이크케이스 값으로 마이그레이션
        if (!data.displayName && data.display_name) {
          updates.displayName = data.display_name;
          console.log(`   ✓ display_name → displayName: "${data.display_name}"`);
        }
        
        if (data.isActive === undefined && data.is_active !== undefined) {
          updates.isActive = data.is_active;
          console.log(`   ✓ is_active → isActive: ${data.is_active}`);
        }
        
        if (!data.lastLogin && data.last_login) {
          updates.lastLogin = data.last_login;
          console.log(`   ✓ last_login → lastLogin: "${data.last_login}"`);
        }
        
        if (!data.createdAt && data.created_at) {
          updates.createdAt = data.created_at;
          console.log(`   ✓ created_at → createdAt: "${data.created_at}"`);
        }
        
        // 스네이크케이스 필드 삭제
        fieldsToDelete.forEach(field => {
          if (data.hasOwnProperty(field)) {
            updates[field] = FieldValue.delete();
            console.log(`   ✗ ${field} 삭제`);
          }
        });
        
        batch.update(userRef, updates);
        updateCount++;
      } else {
        console.log(`✅ ${data.userid || doc.id}: 정리 불필요`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n\n✨ ${updateCount}명의 사용자 필드가 정리되었습니다!`);
    } else {
      console.log('\n\n✅ 모든 필드가 이미 정리되어 있습니다!');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 최종 확인:\n');

    // 최종 확인
    const finalSnapshot = await db.collection('users').get();
    finalSnapshot.forEach((doc) => {
      const data = doc.data();
      const fields = Object.keys(data);
      
      console.log(`${data.userid}:`);
      console.log(`  필드 목록: ${fields.join(', ')}`);
      
      // 스네이크케이스 필드가 남아있는지 확인
      const remainingSnakeCase = fields.filter(f => 
        f.includes('_') && !f.startsWith('_')
      );
      
      if (remainingSnakeCase.length > 0) {
        console.log(`  ⚠️  남은 스네이크케이스: ${remainingSnakeCase.join(', ')}`);
      } else {
        console.log(`  ✅ 모든 필드가 카멜케이스`);
      }
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('\n✅ 정리 완료!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

cleanupFields();

