'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';
import FormField from '@/shared/components/FormField';
import Button from '@/shared/components/Button';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const usernameInputRef = useRef(null);

  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, []);

  const isExpired = searchParams?.get('expired') === '1';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    const errors = {};
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      errors.username = 'Tên đăng nhập là bắt buộc';
    } else if (trimmedUser.length < 3 || trimmedUser.length > 50) {
      errors.username = 'Tên đăng nhập phải từ 3 đến 50 ký tự';
    }

    if (!password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length > 100) {
      errors.password = 'Mật khẩu tối đa 100 ký tự';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login(trimmedUser, password);
      router.replace('/products');
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') {
        setErrorMsg('Sai tên đăng nhập hoặc mật khẩu.');
      } else if (err.code === 'ACCOUNT_LOCKED') {
        setErrorMsg('Tài khoản đã bị khóa. Vui lòng liên hệ quản lý.');
      } else if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(err.details);
      } else {
        setErrorMsg('Không kết nối được máy chủ. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {isExpired && !errorMsg && (
        <div className={styles.infoBox} role="status">
          Phiên đăng nhập đã hết hạn.
        </div>
      )}

      {errorMsg && (
        <div className={styles.alertBox} role="alert">
          {errorMsg}
        </div>
      )}

      <FormField label="Tên đăng nhập" htmlFor="username" error={fieldErrors.username}>
        <input
          ref={usernameInputRef}
          id="username"
          type="text"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={!!fieldErrors.username}
          disabled={loading}
          autoComplete="username"
        />
      </FormField>

      <FormField label="Mật khẩu" htmlFor="password" error={fieldErrors.password}>
        <div className={styles.passwordWrapper}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={`input ${styles.passwordInput}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={!!fieldErrors.password}
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
      </FormField>

      <Button type="submit" variant="primary" block loading={loading}>
        Đăng nhập
      </Button>
    </form>
  );
}
