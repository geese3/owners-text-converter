'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/firebase';
import { LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  // 컴포넌트 마운트 시 저장된 정보 불러오기
  useEffect(() => {
    const savedUserid = localStorage.getItem('savedUserid');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedAutoLogin = localStorage.getItem('autoLogin') === 'true';

    if (savedRememberMe && savedUserid) {
      setUserid(savedUserid);
      setRememberMe(true);
    }

    if (savedAutoLogin && savedUserid && savedPassword) {
      setUserid(savedUserid);
      setPassword(savedPassword);
      setAutoLogin(true);
      setRememberMe(true);
      
      // 자동 로그인 실행
      const autoLoginAsync = async () => {
        const result = await login(savedUserid, savedPassword);
        if (result.success) {
          if (result.user?.isFirstLogin === true) {
            router.push('/change-password');
          } else {
            router.push('/');
          }
        }
      };
      autoLoginAsync();
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(userid, password);

      if (result.success) {
        // 아이디/비밀번호 저장 처리
        if (rememberMe) {
          localStorage.setItem('savedUserid', userid);
          localStorage.setItem('rememberMe', 'true');
          
          if (autoLogin) {
            localStorage.setItem('savedPassword', password);
            localStorage.setItem('autoLogin', 'true');
          } else {
            localStorage.removeItem('savedPassword');
            localStorage.setItem('autoLogin', 'false');
          }
        } else {
          // 저장 안 함
          localStorage.removeItem('savedUserid');
          localStorage.removeItem('savedPassword');
          localStorage.setItem('rememberMe', 'false');
          localStorage.setItem('autoLogin', 'false');
        }

        // 최초 로그인 체크
        if (result.user?.isFirstLogin === true) {
          router.push('/change-password');
        } else {
          router.push('/');
        }
      } else {
        setError(result.error || '로그인에 실패했습니다');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* 로고 */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <Image
              src="/owners-logo.png"
              alt="오너스 로고"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            크레탑 데이터 엑셀 변환기
          </h1>
          <p className="text-gray-600">
            로그인하여 사용하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              아이디
            </label>
            <input
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {/* 아이디 저장 & 자동 로그인 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  setRememberMe(e.target.checked);
                  if (!e.target.checked) {
                    setAutoLogin(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">아이디 저장</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => {
                  setAutoLogin(e.target.checked);
                  if (e.target.checked) {
                    setRememberMe(true);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">자동 로그인</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💡 관리자에게 계정을 요청하세요
          </p>
        </div>
      </div>
    </div>
  );
}

