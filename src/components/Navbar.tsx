"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false); // 手機版選單開關
  const [hasCartItems, setHasCartItems] = useState(false);

  useEffect(() => {
    // 獲取初始 Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 監聽 Auth 狀態變更 (登入/登出)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 購物車狀態偵測
    const checkCart = () => {
      const cart = JSON.parse(localStorage.getItem("ej_cart") || "[]");
      setHasCartItems(cart.length > 0);
    };
    
    checkCart();
    window.addEventListener('storage', checkCart);
    
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('storage', checkCart);
    };
  }, []);

  // 登入功能
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // 登出功能
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    window.location.href = "/"; // 強制跳轉回首頁刷新狀態
  };

  return (
    <>
      {/* 導覽列容器 */}
      <nav className="fixed top-0 left-1/2 -translate-x-1/2 mt-5 w-[92%] max-w-[1100px] h-[72px] bg-white/80 backdrop-blur-2xl border border-white/40 rounded-full flex items-center justify-between px-6 z-[1000] shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all">
        
        {/* Logo 區塊 */}
        <Link href="/" className="flex items-center group">
          <div className="w-11 h-11 rounded-2xl overflow-hidden relative shadow-md transition-all group-hover:rotate-6 active:scale-90">
            <Image 
              src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/icon.png" 
              alt="Eriju Logo" 
              fill 
              className="object-cover" 
            />
          </div>
          <span className="ml-3 text-xl font-black tracking-tighter text-slate-900 uppercase italic">Eriju</span>
        </Link>

        {/* 右側按鈕與功能區 */}
        <div className="flex items-center gap-3">
          
          {/* 電腦版選單 (md 以上顯示) */}
          <div className="hidden md:flex items-center gap-8 mr-6 text-[12px] font-bold tracking-[0.1em] text-slate-400">
            <Link href="/catalog" className="hover:text-slate-900 transition-colors">所有設計</Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">品牌故事</Link>
          </div>

          {/* 購物車圖標 */}
          <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-all active:scale-90">
            <span className="text-lg">🛒</span>
            {hasCartItems && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-slate-900 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </Link>

          {/* 電腦版：懸停會員選單 */}
          <div className="hidden md:block relative group">
            {user ? (
              <>
                {/* 使用者頭像 */}
                <div className="block w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-slate-100 shadow-sm transition-all group-hover:ring-slate-400 group-hover:scale-105 cursor-pointer">
                  <Image src={user.user_metadata.avatar_url} alt="User" width={40} height={40} />
                </div>

                {/* 下拉選單：滑鼠懸停觸發 */}
                <div className="absolute right-0 top-[40px] pt-5 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-[1001]">
                  <div className="w-48 bg-white/90 backdrop-blur-xl border border-black/5 rounded-[24px] shadow-2xl p-2">
                    <div className="px-4 py-3 border-b border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前登入</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.user_metadata.full_name}</p>
                    </div>
                    
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors mt-1">
                      📦 訂單查詢
                    </Link>
                    
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      🚪 登出帳號
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button 
                onClick={loginWithGoogle} 
                className="px-5 py-2.5 bg-slate-900 text-white text-[12px] font-bold uppercase rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                登入
              </button>
            )}
          </div>

          {/* 手機版漢堡按鈕 (md 以下顯示) */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-slate-900 rounded-full z-[1001] transition-all active:scale-90"
          >
            <div className={`w-4 h-0.5 bg-white transition-all duration-300 ${isOpen ? "rotate-45 translate-y-1" : ""}`}></div>
            <div className={`w-4 h-0.5 bg-white transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-1" : ""}`}></div>
          </button>
        </div>
      </nav>

      {/* 手機版全螢幕選單 */}
      <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-[999] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none translate-y-10"} md:hidden flex flex-col px-10 pt-40`}>
        <div className="flex flex-col gap-6">
          <Link href="/catalog" onClick={() => setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b border-slate-100 pb-6 flex justify-between items-center group">
            所有設計 <span className="text-xs font-normal tracking-[0.3em] text-slate-300">COLLECTION</span>
          </Link>
          <Link href="/about" onClick={() => setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b border-slate-100 pb-6 flex justify-between items-center group">
            關於我們 <span className="text-xs font-normal tracking-[0.3em] text-slate-300">STORY</span>
          </Link>
          {user && (
            <Link href="/orders" onClick={() => setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b border-slate-100 pb-6 flex justify-between items-center group">
              訂單查詢 <span className="text-xs font-normal tracking-[0.3em] text-slate-300">ORDERS</span>
            </Link>
          )}
        </div>

        {/* 手機選單底部：會員資訊 */}
        <div className="mt-auto mb-20">
          {user ? (
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
              <Image src={user.user_metadata.avatar_url} alt="Avatar" width={54} height={54} className="rounded-2xl shadow-sm" />
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-lg">{user.user_metadata.full_name}</p>
                <button 
                  onClick={handleSignOut} 
                  className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em] mt-1 bg-red-50 px-2 py-0.5 rounded-md"
                >
                  登出帳號 EXIT
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle} 
              className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-lg shadow-2xl shadow-slate-300 active:scale-95 transition-transform"
            >
              開始探索
            </button>
          )}
        </div>
      </div>
    </>
  );
}