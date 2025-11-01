'use client';

import { StyleProvider } from '@ant-design/cssinjs';

import React from 'react';

export default function AntdRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StyleProvider hashPriority="high">{children}</StyleProvider>;
}
