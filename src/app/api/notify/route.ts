import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body: { 
      order_id: string; 
      name: string; 
      email: string;      
      phone: string; 
      address: string;    
      total: number; 
      items: string; 
      status?: string; // 接收狀態來判斷顏色
    } = await req.json();

    const { order_id, name, email, phone, address, total, items, status } = body;
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!discordWebhookUrl) {
      console.error("❌ 錯誤: 未設定 DISCORD_WEBHOOK_URL");
      return NextResponse.json({ success: false, error: "Webhook URL missing" }, { status: 500 });
    }

    // --- 動態樣式配置 ---
    let config = {
      title: "📦 官網新訂單 - 待處理",
      color: 0xd98b5f, // 暖橘色 (預設新訂單)
      footer: "New Order Detected"
    };

    // 根據狀態切換顏色與標題
    if (status === "cancelling") {
      config = {
        title: "🛑 訂單取消申請 - 待審核",
        color: 0xff4d4d, // 明亮紅
        footer: "Cancellation Request Received"
      };
    } else if (status === "completed") {
      config = {
        title: "🎉 訂單已順利結案",
        color: 0x2ecc71, // 翡翠綠
        footer: "Order Completion Confirmed"
      };
    }

    const embedMessage = {
      username: "Eriju Studio 系統助手",
      embeds: [{
        title: config.title,
        color: config.color,
        fields: [
          { name: "📋 訂單編號", value: `\`${order_id}\``, inline: false },
          { name: "👤 客戶姓名", value: name, inline: true },
          { name: "📞 聯絡電話", value: phone, inline: true },
          { name: "📧 客戶信箱", value: email, inline: false },
          { name: "📍 收件資訊 / 備註", value: `\`${address}\``, inline: false },
          { name: "💰 訂單總額", value: `**NT$ ${total.toLocaleString()}**`, inline: false },
          { name: "🛒 內容明細", value: items }
        ],
        footer: { text: `Eriju Studio Management • ${config.footer}` },
        timestamp: new Date().toISOString()
      }]
    };

    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedMessage)
    });

    if (!response.ok) throw new Error('Discord API 響應錯誤');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}