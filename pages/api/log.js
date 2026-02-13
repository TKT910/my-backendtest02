import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Vercelでの405エラーを避けるため、メソッド制限を一時的に解除
  const { userName, step, data } = req.body || req.query;
  const safeId = (userName || 'guest').replace(/[^a-zA-Z0-9]/g, ''); 

  try {
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
    return res.status(500).json({ error: 'Failed to save to database' });
  }
}