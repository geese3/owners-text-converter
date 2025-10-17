'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Key, CheckCircle, AlertCircle, LogOut, Home } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { updatePassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [validations, setValidations] = useState({
    length: false,
    hasLetter: false,
    hasNumber: false,
    hasSpecial: false,
    match: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 비밀번호 유효성 검증
  useEffect(() => {
    setValidations({
      length: newPassword.length >= 8,
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      match: newPassword === confirmPassword && confirmPassword.length > 0
    });
  }, [newPassword, confirmPassword]);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSkip = async () => {
    if (userData?.role === 'admin') {
      // 관리자는 건너뛰기 가능
      if (confirm('관리자 권한으로 비밀번호 변경을 건너뛰시겠습니까?')) {
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            isFirstLogin: false,
            updatedAt: new Date().toISOString()
          });
          router.push('/');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 현재 비밀번호 확인
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요');
      return;
    }

    // 모든 유효성 검사 통과 확인
    if (!Object.values(validations).every(v => v)) {
      setError('새 비밀번호 요구사항을 모두 충족해야 합니다');
      return;
    }

    setIsSubmitting(true);

    try {
      if (user && userData) {
        // 1. 현재 비밀번호로 재인증
        const credential = EmailAuthProvider.credential(
          userData.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        
        // 2. 비밀번호 변경
        await updatePassword(user, newPassword);
        
        // 3. Firestore의 isFirstLogin 플래그 제거
        await updateDoc(doc(db, 'users', user.uid), {
          isFirstLogin: false,
          lastPasswordChange: new Date().toISOString()
        });

        alert('✅ 비밀번호가 성공적으로 변경되었습니다!\n새 비밀번호로 다시 로그인해주세요.');
        
        // 4. 로그아웃
        await signOut();
        
        // 5. 로그인 페이지로 이동
        router.push('/login');
      }
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError('현재 비밀번호가 올바르지 않습니다');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('보안을 위해 다시 로그인이 필요합니다');
      } else {
        setError(error.message || '비밀번호 변경에 실패했습니다');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {/* 우측 상단 버튼들 */}
        <div className="absolute top-4 right-4 flex gap-2">
          {userData?.role === 'admin' && !userData?.isFirstLogin && (
            <button
              onClick={handleSkip}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="메인으로"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={signOut}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
            title="로그아웃"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* 아이콘 */}
        <div className="flex justify-center mb-8">
          <div className="bg-yellow-600 p-4 rounded-full">
            <Key className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            비밀번호 변경
          </h1>
          <p className="text-gray-600">
            보안을 위해 비밀번호를 변경해주세요
          </p>
          {userData.isFirstLogin && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 최초 로그인입니다. 반드시 비밀번호를 변경해야 합니다.
              </p>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 비밀번호 변경 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={userData?.isFirstLogin ? "초기 비밀번호: 1q2w3e4r5!" : "현재 비밀번호를 입력하세요"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="새 비밀번호를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="새 비밀번호를 다시 입력하세요"
              required
            />
          </div>

          {/* 비밀번호 요구사항 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-3">비밀번호 요구사항:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {validations.length ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                )}
                <span className={`text-sm ${validations.length ? 'text-green-700' : 'text-gray-600'}`}>
                  최소 8자 이상
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.hasLetter ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                )}
                <span className={`text-sm ${validations.hasLetter ? 'text-green-700' : 'text-gray-600'}`}>
                  영문자 포함
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.hasNumber ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                )}
                <span className={`text-sm ${validations.hasNumber ? 'text-green-700' : 'text-gray-600'}`}>
                  숫자 포함
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.hasSpecial ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                )}
                <span className={`text-sm ${validations.hasSpecial ? 'text-green-700' : 'text-gray-600'}`}>
                  특수문자 포함 (!@#$%^&*...)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.match ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                )}
                <span className={`text-sm ${validations.match ? 'text-green-700' : 'text-gray-600'}`}>
                  비밀번호 일치
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !Object.values(validations).every(v => v)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}

