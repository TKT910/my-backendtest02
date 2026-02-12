import '../styles/globals.css';
// 1. 作成した部品をインポート (パスは環境に合わせて調整してください)
import ToastProvider from '../components/ToastProvider';

export default function App({ Component, pageProps }) {
  return (
    <>
      {/* 2. ここに配置することで全ページで有効になります */}
      <ToastProvider />
      
      <Component {...pageProps} />
    </>
  );
}