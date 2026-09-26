import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Jev 평가실', description: '내용과 기준을 입력하고 Jev의 평가를 확인하세요.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="ko"><body>{children}</body></html>;
}
