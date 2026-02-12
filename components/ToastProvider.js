import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';

export default function ToastProvider() {
  useEffect(() => {
    // Reactのtoast機能を window.toast に代入して
    // 外部の script.js からも使えるようにする
    window.toast = toast;
  }, []);

  return (
    <Toaster 
      theme="light" 
      position="bottom-right" 
      richColors
      toastOptions={{
        style: {
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '12px 16px',
          fontWeight: '500',
          fontSize: '14px',
          color: '#1f2937'
        }
      }}
    />
  );
}