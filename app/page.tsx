'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Eye, Clipboard, CheckCircle, LogOut, Shield, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { saveConversionLog } from '@/lib/firebase';

interface CompanyData {
  기업명: string;
  대표자명: string;
  주소: string;
}

export default function TextToExcelConverter() {
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<CompanyData[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // 최초 로그인 체크는 로그인 페이지에서 처리하므로 여기서는 제거
  }, [user, loading, router]);

  // 텍스트 파싱 함수
  const parseText = (text: string): CompanyData[] => {
    const companies: CompanyData[] = [];
    
    // "신용" 키워드로 각 기업 섹션 분리
    const sections = text.split(/신용\s*\n/);
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const lines = section.trim().split('\n');
      if (lines.length === 0) continue;
      
      // 기업명 추출 (첫 번째 줄)
      const companyName = lines[0].trim();
      if (!companyName) continue;
      
      // 대표자명 추출
      let ceoName = '';
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('대표자명') && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          
          // 여러 패턴 시도
          const patterns = [
            /^([가-힣]+)(?=신용)/,
            /^([가-힣]+)(?=기업상태)/,
            /^([가-힣]+)(?=기업유형)/,
            /^([가-힣]+)(?=사업자번호)/,
            /^([가-힣]{2,4})/
          ];
          
          for (const pattern of patterns) {
            const match = nextLine.match(pattern);
            if (match) {
              ceoName = match[1];
              break;
            }
          }
          
          break;
        }
      }
      
      // 주소 추출
      let address = '';
      for (const line of lines) {
        if (line.includes('주소')) {
          const startIdx = line.indexOf('주소') + 2;
          
          // 전화번호가 있으면 전화번호 전까지
          if (line.includes('전화번호')) {
            const endIdx = line.indexOf('전화번호');
            address = line.substring(startIdx, endIdx).trim();
          }
          // 최근 재무년도가 있으면 그 전까지
          else if (line.includes('최근 재무년도')) {
            const endIdx = line.indexOf('최근 재무년도');
            address = line.substring(startIdx, endIdx).trim();
          }
          // 주소 이후 전부
          else {
            address = line.substring(startIdx).trim();
          }
          
          // 공백 정리
          address = address.replace(/\s+/g, ' ');
          break;
        }
      }
      
      if (companyName && (ceoName || address)) {
        companies.push({
          기업명: companyName,
          대표자명: ceoName,
          주소: address
        });
      }
    }
    
    return companies;
  };

  // 미리보기
  const handlePreview = () => {
    if (!inputText.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    const data = parseText(inputText);
    
    if (data.length === 0) {
      alert('데이터를 추출할 수 없습니다. 텍스트 형식을 확인해주세요.');
      return;
    }

    setParsedData(data);
    setIsPreviewMode(true);
  };

  // 클립보드에서 붙여넣기
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      alert(`✅ ${text.length}자 붙여넣기 완료!`);
    } catch (error) {
      console.error('클립보드 읽기 실패:', error);
      alert('❌ 클립보드 접근 권한이 필요합니다.\n브라우저 설정에서 권한을 허용해주세요.');
    }
  };

  // 파일 읽기 공통 함수
  const readFile = (file: File) => {
    // 텍스트 파일만 허용
    if (!file.name.endsWith('.txt')) {
      alert('⚠️ .txt 파일만 업로드 가능합니다!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
      alert(`✅ ${file.name} 파일 업로드 완료!\n${text.length}자`);
    };
    reader.onerror = () => {
      alert('❌ 파일 읽기에 실패했습니다.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 파일 업로드 (버튼 클릭)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  // 드래그 앤 드롭 이벤트
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  // 엑셀 다운로드
  const handleDownload = async () => {
    if (parsedData.length === 0) {
      alert('먼저 미리보기를 해주세요.');
      return;
    }

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 데이터 배열 준비 (헤더 + 데이터)
    const wsData = [
      ['기업명', '대표자명', '주소'],
      ...parsedData.map(company => [
        company.기업명,
        company.대표자명,
        company.주소
      ])
    ];
    
    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 30 },  // 기업명
      { wch: 15 },  // 대표자명
      { wch: 50 }   // 주소
    ];
    
    // 워크북에 시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '기업 데이터');
    
    // 파일명 생성 (cretop_data_yymmddhhmm.xlsx)
    const now = new Date();
    const timestamp = now.toISOString()
      .slice(2, 16)
      .replace(/[-:T]/g, '')
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1$2$3$4$5');
    const filename = `cretop_data_${timestamp}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(wb, filename);
    
    // 변환 로그 저장
    if (user && userData) {
      await saveConversionLog({
        userId: user.uid,
        companyCount: parsedData.length,
        filename: filename,
        timestamp: new Date().toISOString()
      });
    }
    
    alert(`✅ ${parsedData.length}개 기업 데이터가 다운로드되었습니다!\n파일명: ${filename}`);
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!user || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-4 rounded-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  크레탑 데이터 엑셀 변환기
                </h1>
                <p className="text-gray-600 mt-1">
                  복잡한 텍스트 데이터를 깔끔한 엑셀 파일로 자동 변환
                </p>
              </div>
            </div>
            
            {/* 사용자 정보 및 메뉴 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{userData.displayName}</p>
                <p className="text-xs text-gray-500">
                  {userData.role === 'admin' ? '관리자' : '사용자'}
                </p>
              </div>
              
              {/* 관리자 페이지 버튼 */}
              {userData.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  title="관리자 페이지"
                >
                  <Shield className="w-4 h-4" />
                  관리자
                </button>
              )}
              
              {/* 로그아웃 버튼 */}
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 사용 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-lg">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">사용 방법</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1️⃣ 크레탑 웹사이트에서 기업 정보를 복사 (Cmd+C / Ctrl+C)</li>
                <li>2️⃣ 📋 클립보드에서 붙여넣기 버튼 클릭 또는 직접 입력</li>
                <li>3️⃣ 👁️ 미리보기 버튼으로 추출 결과 확인</li>
                <li>4️⃣ 📥 엑셀 다운로드 버튼으로 파일 저장</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 텍스트 입력 영역 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              텍스트 입력
            </h2>
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                파일 업로드
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handlePaste}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Clipboard className="w-4 h-4" />
                클립보드에서 붙여넣기
              </button>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative ${isDragging ? 'ring-4 ring-blue-400' : ''}`}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`w-full h-80 p-4 border-2 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="크레탑에서 복사한 텍스트를 붙여넣거나, .txt 파일을 드래그하세요..."
            />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-xl font-bold text-blue-600">파일을 여기에 드롭하세요</p>
                  <p className="text-sm text-blue-500 mt-2">.txt 파일만 지원됩니다</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {inputText.length > 0 ? `${inputText.length}자 입력됨` : '텍스트를 입력하거나 붙여넣으세요'}
            </p>
            {inputText.length > 0 && (
              <button
                onClick={() => {
                  setInputText('');
                  setParsedData([]);
                  setIsPreviewMode(false);
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                🔄 전체 초기화
              </button>
            )}
          </div>
        </div>

        {/* 미리보기 영역 */}
        {isPreviewMode && parsedData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  미리보기 ({parsedData.length}개 기업)
                </h2>
              </div>
              <button
                onClick={() => {
                  setParsedData([]);
                  setIsPreviewMode(false);
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
              >
                ✕ 미리보기 닫기
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-blue-700 px-4 py-3 text-left font-bold">번호</th>
                    <th className="border border-blue-700 px-4 py-3 text-left font-bold">기업명</th>
                    <th className="border border-blue-700 px-4 py-3 text-left font-bold">대표자명</th>
                    <th className="border border-blue-700 px-4 py-3 text-left font-bold">주소</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((company, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="border border-gray-300 px-4 py-2 text-center text-gray-600">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {company.기업명}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {company.대표자명 || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {company.주소 || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            disabled={!inputText.trim()}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <Eye className="w-5 h-5" />
            미리보기
          </button>
          
          <button
            onClick={handleDownload}
            disabled={parsedData.length === 0}
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            엑셀 다운로드
          </button>
        </div>

        {/* 통계 */}
        {parsedData.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  ✅ {parsedData.length}개 기업 데이터 추출 완료
                </p>
                <p className="text-sm text-green-700">
                  엑셀 다운로드 버튼을 클릭하여 파일을 저장하세요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 샘플 데이터 안내 */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📄 인식 가능한 텍스트 형식</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• 각 기업 데이터는 <code className="bg-gray-200 px-1 rounded">&quot;신용&quot;</code> 키워드로 구분됩니다</p>
            <p>• <strong>기업명</strong>: 첫 번째 줄에 위치</p>
            <p>• <strong>대표자명</strong>: &quot;대표자명&quot; 다음 줄에서 자동 추출</p>
            <p>• <strong>주소</strong>: &quot;주소&quot; 키워드부터 &quot;전화번호&quot; 또는 &quot;최근 재무년도&quot; 전까지</p>
          </div>
        </div>
      </div>
    </div>
  );
}
