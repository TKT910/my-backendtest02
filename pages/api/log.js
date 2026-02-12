import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { userName, step, data } = req.body;
  const safeId = (userName || 'guest').replace(/[^a-zA-Z0-9]/g, ''); 

  try {
    // フォルダ作成やファイル書き込み（fs）は一切行わず、Supabaseへ直接送る
    const { error } = await supabase
      .from('students_logs')
      .insert([{ 
        user_id: safeId, 
        step: step, 
        log_data: data, 
        created_at: new Date().toISOString() 
      }]);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logging failed:', error);
    // 保存に失敗しても、ここで res を返すことで、サーバー全体のクラッシュを防ぎます
    return res.status(500).json({ error: 'Failed to save to database' });
  }
}