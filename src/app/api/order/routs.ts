import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 假設你的 order 表有這些欄位：product_name, customer_name, price
    const { product_name, customer_name, price, note } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 萬能鑰匙
    );

    // 1. 寫入原本的 order 資料表
    const { data, error: dbError } = await supabaseAdmin
      .from('order') 
      .insert([{ product_name, customer_name, price, note }])
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. 發送到 Discord (修好並安全化通知)
    await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "💰 新訂單通知！",
          color: 0x2ecc71, // 綠色代表錢進來了
          fields: [
            { name: "商品", value: data.product_name, inline: true },
            { name: "金額", value: `$${data.price}`, inline: true },
            { name: "訂購人", value: data.customer_name, inline: false },
            { name: "備註", value: data.note || "無", inline: false },
          ],
          footer: { text: `訂單編號: ${data.id}` },
          timestamp: new Date().toISOString()
        }]
      }),
    });

    return NextResponse.json({ success: true, orderId: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}