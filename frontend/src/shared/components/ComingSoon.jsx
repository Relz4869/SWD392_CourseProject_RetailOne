'use client';

import React from 'react';

export default function ComingSoon({ title, owner, ucs }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-text-main)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-primary-600)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Chức năng đang được phát triển
      </p>
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-full)',
          display: 'inline-block',
        }}
      >
        Phụ trách: <strong>{owner}</strong> &bull; Chức năng: <strong>{ucs}</strong>
      </div>
    </div>
  );
}

