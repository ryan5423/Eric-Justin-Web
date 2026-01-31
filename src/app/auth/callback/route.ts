import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // 這裡改用直接輸入環境變數，避免 Import lib/supabase 時路徑出錯
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const response = NextResponse.redirect(requestUrl.origin)
      
      // 設定 Cookie (Next.js 15/16 語法)
      const cookieStore = await cookies()
      cookieStore.set('sb-access-token', data.session.access_token, { path: '/' })
      
      return response
    }
  }

  // 失敗就導回首頁
  return NextResponse.redirect(requestUrl.origin)
}