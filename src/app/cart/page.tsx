"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setForm(f => ({ 
          ...f, 
          name: session.user.user_metadata.full_name || "" 
        }));
      }

      const savedCart = JSON.parse(localStorage.getItem("ej_cart") || "[]");
      if (savedCart.length > 0) {
        const { data: products } = await supabase.from("products").select("*");
        const updatedCart = savedCart.map((item: any) => {
          const real = products?.find(p => p.id === item.id);
          return real ? { 
            ...item, 
            price: real.price, 
            name: real.name, 
            image: real.image_url 
          } : item;
        });
        setCart(updatedCart);
        localStorage.setItem("ej_cart", JSON.stringify(updatedCart));
      }
      
      setLoading(false);
      
      setTimeout(() => {
        gsap.fromTo(".reveal", 
          { y: 15, opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "expo.out" }
        );
      }, 50);
    };

    initPage();
  }, []);

  const updateQty = (id: string, delta: number) => {
    gsap.fromTo(`#item-${id}`, { scale: 1 }, { scale: 1.02, duration: 0.1, yoyo: true, repeat: 1 });
    const newCart = cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    });
    setCart(newCart);
    localStorage.setItem("ej_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const removeItem = (id: string) => {
    gsap.to(`#item-${id}`, {
      x: -20, opacity: 0, scale: 0.95, duration: 0.4,
      onComplete: () => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        localStorage.setItem("ej_cart", JSON.stringify(newCart));
        window.dispatchEvent(new Event("storage"));
      }
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // --- 核心：修正後的成功動畫與跳轉流程 ---
  const runSuccessRitual = () => {
    setShowSuccess(true);
    
    // 強制 UI 渲染後再執行 GSAP
    setTimeout(() => {
      const tl = gsap.timeline();
      
      tl.to(".success-overlay", { 
        opacity: 1, 
        duration: 0.6, 
        ease: "power3.out" 
      })
      .fromTo(".success-check", 
        { scale: 0, rotate: -30, opacity: 0 }, 
        { scale: 1, rotate: 0, opacity: 1, duration: 0.8, ease: "back.out(2)" }
      )
      .fromTo(".firework", 
        { scale: 0, opacity: 0 }, 
        { scale: 2.5, opacity: 1, stagger: 0.1, duration: 0.8, ease: "expo.out" }, 
        "-=0.5"
      )
      .to(".success-overlay", { 
        opacity: 0, 
        duration: 0.8, 
        delay: 1.5, // 停留時間
        onComplete: () => {
          router.push("/orders");
        }
      });
    }, 10);
  };

  const processOrder = async () => {
    if (!user || !form.name || !form.phone || !form.address) return;

    setIsProcessing(true);
    
    const orderData = {
      user_email: user.email,
      user_name: form.name,
      user_phone: form.phone,
      shipping_address: form.address,
      items: cart,
      total_amount: subtotal,
      status: 'pending'
    };

    try {
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: data.id,
          name: form.name,
          phone: form.phone,
          total: subtotal,
          items: cart.map(i => `${i.name} (x${i.qty})`).join(', ')
        })
      });

      // 訂單完成後的清理
      localStorage.removeItem('ej_cart');
      window.dispatchEvent(new Event("storage"));

      // 執行儀式動畫 (跳轉會在動畫完成後觸發)
      runSuccessRitual();

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      alert("訂單送出失敗，請稍後再試");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fcfcfc]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
      <div className="font-black text-slate-400 text-[10px] uppercase tracking-[0.5em]">讀取清單中...</div>
    </div>
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-32 pb-24 text-slate-900 overflow-x-hidden">
      
      {/* 成功儀式層 - 移除了 pointer-events-none 以免動畫被阻擋 */}
      {showSuccess && (
        <div className="success-overlay fixed inset-0 z-[2000] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center opacity-0">
          <div className="relative flex items-center justify-center">
            {/* 虛擬煙火粒子 */}
            <div className="firework absolute top-0 left-0 w-3 h-3 bg-amber-400 rounded-full blur-[2px]" />
            <div className="firework absolute bottom-10 right-10 w-4 h-4 bg-orange-500 rounded-full blur-[2px]" />
            <div className="firework absolute -top-20 right-10 w-2 h-2 bg-yellow-300 rounded-full blur-[1px]" />
            <div className="firework absolute bottom-0 -left-20 w-5 h-5 bg-slate-200 rounded-full blur-[3px]" />
            
            {/* 打勾圓圈 */}
            <div className="success-check w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h2 className="mt-12 text-4xl font-black italic tracking-tighter">Order Confirmed.</h2>
          <p className="mt-3 text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">感謝您的收藏，正在為您準備</p>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6">
        <header className="reveal mb-12">
          <span className="text-[10px] font-black tracking-[0.4em] text-amber-600 uppercase block mb-4">Final Check</span>
          <h1 className="text-5xl font-black tracking-tighter italic">確認您的訂單。</h1>
        </header>

        {cart.length === 0 ? (
          <div className="reveal py-32 text-center">
            <p className="text-slate-300 font-black text-2xl mb-8 tracking-tighter italic">購物袋目前是空的。</p>
            <Link href="/catalog" className="inline-block bg-slate-900 text-white px-12 py-4 rounded-full font-black text-xs tracking-[0.2em] hover:bg-amber-600 transition-all uppercase">返回商店</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-16">
              {cart.map((item) => (
                <div key={item.id} id={`item-${item.id}`} className="reveal bg-white p-6 flex gap-6 items-center rounded-[32px] border border-black/[0.06] shadow-sm group hover:shadow-md transition-all duration-500">
                  <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 p-1 border border-slate-50 group-hover:scale-105 transition-transform duration-700">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-black text-slate-900 text-xl leading-tight uppercase italic">{item.name}</h3>
                    <div className="flex items-center gap-5 mt-4">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-slate-900">-</button>
                        <span className="w-8 text-center text-sm font-black">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-slate-900">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-[10px] text-slate-400 font-black uppercase hover:text-red-500 transition underline underline-offset-4 decoration-1">移除品項</button>
                    </div>
                  </div>
                  <div className="text-right font-black text-slate-900 text-lg tracking-tighter">
                    NT$ {(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <section className="reveal space-y-8 mb-16">
              <h2 className="text-2xl font-black tracking-tight italic underline underline-offset-8 decoration-slate-200">收件資訊。</h2>
              <div className="bg-white p-8 space-y-6 rounded-[35px] border border-black/[0.06] shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">收件人姓名 Recipient</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="請輸入姓名" className="w-full p-5 bg-slate-50 border border-transparent rounded-[22px] text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">聯絡電話 Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="09xx-xxx-xxx" className="w-full p-5 bg-slate-50 border border-transparent rounded-[22px] text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">寄送地址 Shipping Address</label>
                  <textarea rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="請輸入包含郵遞區號的完整地址(限台灣地區)" className="w-full p-5 bg-slate-50 border border-transparent rounded-[22px] text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all resize-none" />
                </div>
              </div>
            </section>

            <section className="reveal border-t border-slate-100 pt-10 space-y-4">
              <div className="flex justify-between text-slate-400 text-[11px] font-black tracking-widest uppercase px-2">
                <span>小計 Subtotal</span>
                <span className="text-slate-900">NT$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-4xl md:text-5xl font-black mt-6 px-2">
                <span className="tracking-tighter">總計</span>
                <span className="tracking-tighter italic">NT$ {subtotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={processOrder}
                disabled={isProcessing || !user}
                className={`w-full py-7 rounded-[32px] font-black text-lg mt-12 uppercase tracking-[0.3em] transition-all duration-700 shadow-xl ${
                  isProcessing || !user 
                  ? 'bg-slate-100 text-slate-300' 
                  : 'bg-slate-900 text-white hover:bg-[#d98b5f]'
                }`}
              >
                {isProcessing ? "訂單處理中..." : "送出訂單"}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}