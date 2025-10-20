'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, createUser, updateUserStatus, getAllConversionLogs, resetUserPassword, UserData } from '@/lib/firebase';
import { Users, Plus, BarChart, ArrowLeft, Key, CheckCircle } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 새 사용자 폼
  const [newUser, setNewUser] = useState({
    userid: '',
    name: '',
    position: '팀장' as '팀장' | '부지점장' | '지점장',
    role: 'user' as 'admin' | 'user'
  });

  useEffect(() => {
    if (!authLoading && userData) {
      // 관리자 권한 체크
      if (userData.role !== 'admin') {
        alert('관리자만 접근할 수 있습니다');
        router.push('/');
        return;
      }
      
      loadData();
    } else if (!authLoading && !userData) {
      router.push('/login');
    }
    // 최초 로그인 체크는 로그인 페이지에서 처리하므로 여기서는 제거
  }, [authLoading, userData, router]);

  const loadData = async () => {
    setLoading(true);
    const [usersData, logsData] = await Promise.all([
      getAllUsers(),
      getAllConversionLogs()
    ]);
    setUsers(usersData);
    setLogs(logsData);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 비밀번호 설정
    const defaultPassword = '1q2w3e4r5!';
    
    // displayName = 이름 + 직책
    const displayName = `${newUser.name} ${newUser.position}`;

    const result = await createUser(
      newUser.userid,
      defaultPassword,
      displayName,
      newUser.role
    );

    if (result.success) {
      alert(`✅ 사용자가 생성되었습니다\n초기 비밀번호: ${defaultPassword}\n\n최초 로그인 시 비밀번호 변경이 필요합니다.`);
      setNewUser({ userid: '', name: '', position: '팀장', role: 'user' });
      setShowAddUser(false);
      loadData();
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  const handleToggleUserStatus = async (uid: string, currentStatus: boolean) => {
    const action = currentStatus ? '이용중지' : '활성화';
    
    if (!confirm(`정말 이 사용자를 ${action}하시겠습니까?`)) {
      return;
    }

    const result = await updateUserStatus(uid, !currentStatus);

    if (result.success) {
      alert(`✅ 사용자가 ${action}되었습니다`);
      loadData();
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  const handleResetPassword = async (uid: string, userid: string) => {
    if (!confirm(`${userid}의 비밀번호를 "1q2w3e4r5!"로 초기화하시겠습니까?`)) {
      return;
    }

    const result = await resetUserPassword(uid, '1q2w3e4r5!');

    if (result.success) {
      alert(`✅ ${userid}의 비밀번호가 "1q2w3e4r5!"로 초기화되었습니다`);
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
                <p className="text-gray-600">사용자 및 시스템 관리</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              메인으로
            </button>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <BarChart className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">총 변환 수</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}회</p>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 관리 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">👥 사용자 관리</h2>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 사용자 추가
            </button>
          </div>

          {/* 사용자 추가 폼 */}
          {showAddUser && (
            <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 초기 비밀번호는 자동으로 <strong>1q2w3e4r5!</strong>로 설정됩니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    아이디
                  </label>
                  <input
                    type="text"
                    value={newUser.userid}
                    onChange={(e) => setNewUser({...newUser, userid: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="영문 또는 이메일"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    직책
                  </label>
                  <select
                    value={newUser.position}
                    onChange={(e) => setNewUser({...newUser, position: e.target.value as '팀장' | '부지점장' | '지점장'})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="팀장">팀장</option>
                    <option value="부지점장">부지점장</option>
                    <option value="지점장">지점장</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    역할
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">일반 사용자</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  생성
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 사용자 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">아이디</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">이름</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold">역할</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold">상태</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">생성일</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold">액션</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{user.userid}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.displayName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '활성' : '중지'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleToggleUserStatus(user.uid, user.isActive)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            user.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.isActive ? '중지' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.uid, user.userid)}
                          className="px-3 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1"
                          title="비밀번호를 1q2w3e4r5!로 초기화"
                        >
                          <Key className="w-3 h-3" />
                          초기화
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 변환 로그 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 변환 로그</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">사용자</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold">기업 수</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">파일명</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">변환 일시</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 50).map((log, index) => {
                  const userId = log.userId as string;
                  const companyCount = log.companyCount as number;
                  const filename = log.filename as string;
                  const timestamp = log.timestamp as string;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        {users.find(u => u.uid === userId)?.userid || '알 수 없음'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {companyCount}개
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {filename}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                        {new Date(timestamp).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {logs.length > 50 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              최근 50개 로그만 표시됩니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

