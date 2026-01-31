import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 1. 公開客戶端：給 Navbar、Page 等前端組件使用
// 它受 RLS 安全原則限制，只能看到你允許公開的資料
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. 管理員客戶端：專供後端 API Route 使用
// 它具有最高權限，可以繞過 RLS（用來處理訂單、發送 Discord 通知）
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("環境變數中缺少 Service Role Key");
  return createClient(supabaseUrl, serviceKey);
};