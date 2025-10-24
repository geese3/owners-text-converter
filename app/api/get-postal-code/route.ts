import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: '주소가 필요합니다' }, { status: 400 });
    }

    // 카카오 주소 검색 API 호출
    const API_KEY = process.env.KAKAO_REST_API_KEY || '';
    
    if (!API_KEY) {
      console.error('❌ 카카오 API 키가 설정되지 않았습니다');
      return NextResponse.json({ 
        zipNo: null, 
        error: 'API 키가 설정되지 않았습니다' 
      });
    }

    // 주소 정리
    // 1. 괄호 제거
    // 2. 첫 번째 쉼표까지만 사용 (나머지 호수 정보 제거)
    // 3. 불필요한 동/층/호수 정보 제거
    let cleanAddress = address.replace(/\([^)]*\)/g, '').replace(/\)/g, ''); // 괄호 제거
    
    // 첫 번째 쉼표 이전까지만 사용
    const commaIndex = cleanAddress.indexOf(',');
    if (commaIndex > 0) {
      cleanAddress = cleanAddress.substring(0, commaIndex);
    }
    
    // 추가 정리
    cleanAddress = cleanAddress
      .replace(/\s*-\s*/g, '-')   // 하이픈 앞뒤 공백 제거
      .replace(/제\d+동/g, '')    // "제202동" 제거
      .replace(/제\d+층/g, '')    // "제13층" 제거
      .replace(/제\d+호/g, '')    // "제1307호" 제거
      .replace(/\d+층/g, '')      // "14층" 제거
      .replace(/\d+호/g, '')      // "1722호" 제거
      .replace(/[A-Z]동/g, '')    // "A동", "B동" 제거
      .replace(/\s+/g, ' ')       // 여러 공백을 하나로
      .replace(/\s+(번길|번가)/g, '$1')  // "번 길" → "번길", "번 가" → "번가"
      .replace(/(\d+)(로|길|대로)\s+/g, '$1$2 ') // 도로명 뒤 공백 정리
      .trim();
    
    console.log('🔍 원본 주소:', address);
    console.log('🧹 정리된 주소:', cleanAddress);

    try {
      // 카카오 주소 검색 API 호출
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(cleanAddress)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${API_KEY}`
          }
        }
      );

      if (!response.ok) {
        console.error('❌ API 호출 실패:', response.status, response.statusText);
        return NextResponse.json({ 
          zipNo: null, 
          error: 'API 호출 실패' 
        });
      }

      const data = await response.json();
      console.log('📡 API 응답:', JSON.stringify(data, null, 2).substring(0, 500));

      // 결과 확인
      if (!data.documents || data.documents.length === 0) {
        console.log('⚠️ 검색 결과 없음. 주소:', cleanAddress);
        return NextResponse.json({ 
          zipNo: null, 
          error: '주소를 찾을 수 없습니다' 
        });
      }

      // 첫 번째 결과에서 우편번호 추출
      const firstResult = data.documents[0];
      
      // road_address 또는 address에서 우편번호 가져오기
      let zipNo = null;
      let roadAddr = null;
      let jibunAddr = null;

      if (firstResult.road_address) {
        zipNo = firstResult.road_address.zone_no;
        roadAddr = firstResult.road_address.address_name;
      }
      
      if (firstResult.address) {
        if (!zipNo) zipNo = firstResult.address.zone_no;
        jibunAddr = firstResult.address.address_name;
      }

      if (zipNo) {
        console.log('✅ 우편번호 찾음:', zipNo, '| 주소:', cleanAddress);
      } else {
        console.log('⚠️ 우편번호를 찾지 못함. 주소:', cleanAddress);
      }

      return NextResponse.json({
        zipNo: zipNo || null,
        roadAddr: roadAddr || null,
        jibunAddr: jibunAddr || null
      });

    } catch (err) {
      console.error('API 호출 오류:', err);
      return NextResponse.json({ 
        zipNo: null, 
        error: '주소 조회 실패' 
      });
    }

  } catch (error) {
    console.error('우편번호 조회 오류:', error);
    return NextResponse.json({ 
      zipNo: null, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}

