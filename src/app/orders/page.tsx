"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";

// --- 子組件：訂單卡片 ---
const OrderCard = ({ order, onRefresh }: { order: any; onRefresh: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 定義詳細狀態與進度描述 (新增了取消相關狀態)
  const statusStyles: any = {
    pending: { label: "訂單已受理", detail: "職人正在準備材料，請稍候", bg: "bg-amber-400", text: "text-amber-600", step: 1 },
    processing: { label: "工藝製作中", detail: "您的作品正在手工打造中", bg: "bg-blue-500", text: "text-blue-600", step: 2 },
    delivered: { label: "已發貨送遞", detail: "包裹已離開工作室，預計 2-3 天內送達", bg: "bg-green-500", text: "text-green-600", step: 3 },
    completed: { label: "訂單已歸檔", detail: "感謝您的支持，作品已順利抵達", bg: "bg-slate-200", text: "text-slate-400", step: 4 },
    cancelling: { label: "取消審核中", detail: "已提出取消申請，等待職人確認中", bg: "bg-red-200", text: "text-red-500", step: 1 },
    cancelled: { label: "訂單已取消", detail: "此訂單已取消，如有疑問請聯繫客服", bg: "bg-red-400", text: "text-red-400", step: 0 },
  };

  const currentStatus = statusStyles[order.status] || { label: "查詢中", detail: "", bg: "bg-slate-100", text: "text-slate-400", step: 1 };
  const items = order.items || [];
  const firstItem = items[0] || {};

  // --- 新增：申請取消邏輯 ---
  const handleRequestCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt("請輸入取消原因 (必填):");
    if (!reason) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "cancelling",
          cancel_reason: reason 
        })
        .eq("id", order.id);

      if (error) throw error;
      alert("申請已送出，請靜候審核");
      onRefresh();
    } catch (err: any) {
      alert("申請失敗: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- 原有：確認收貨邏輯 ---
  const handleFinish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("確認已經收到作品，並將此訂單移至歷史紀錄嗎？")) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id);

      if (error) throw error;
      
      setTimeout(() => {
        onRefresh();
        setIsOpen(false);
      }, 500);
    } catch (err: any) {
      alert("更新失敗: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div 
      className={`bg-white rounded-[32px] border transition-all duration-500 overflow-hidden cursor-pointer ${
        isOpen ? "border-slate-900 shadow-2xl scale-[1.02]" : "border-slate-100 hover:border-slate-300 shadow-sm"
      }`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* 卡片頭部 */}
      <div className="p-6 md:p-10 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <div className="relative flex-shrink-0">
            <img 
              src={firstItem.image || firstItem.image_url || "/photo/S__38223874.jpg"} 
              className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-[24px] bg-slate-50" 
            />
            {items.length > 1 && (
              <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] w-7 h-7 flex items-center justify-center rounded-full font-black border-4 border-white">
                +{items.length - 1}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg md:text-2xl tracking-tighter mb-2 uppercase italic">
              {firstItem.name || "作品訂單"}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentStatus.bg} ${order.status === 'processing' ? 'animate-pulse' : ''}`} />
              <span className={`text-[11px] font-black tracking-[0.2em] uppercase ${currentStatus.text}`}>
                {currentStatus.label}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total</p>
          <p className="font-black text-slate-900 text-xl md:text-3xl tracking-tighter italic tabular-nums">
            NT$ {order.total_amount?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 展開詳情 */}
      <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-6 md:px-10 pb-10">
            <div className="h-px bg-slate-50 w-full mb-10" />

            {/* 進度條 */}
            <div className="mb-14 px-2">
              <div className="flex justify-between items-end mb-5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Tracking / 物流進度</span>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{currentStatus.detail}</span>
              </div>
              <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                <div 
                  className="absolute top-0 left-0 h-full bg-slate-900 transition-all duration-1000 ease-out"
                  style={{ width: `${(currentStatus.step / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between">
                {['下單', '製作', '發貨', '完成'].map((label, i) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mb-3 ${i + 1 <= currentStatus.step ? 'bg-slate-900' : 'bg-slate-200'}`} />
                    <span className={`text-[9px] font-black uppercase ${i + 1 <= currentStatus.step ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 資訊欄 */}
            <div className="grid md:grid-cols-2 gap-12 mb-10">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 italic">Shipping Info / 配送資訊</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm font-medium">
                  <p className="font-black text-slate-900 mb-2">{order.user_name}</p>
                  <p className="text-slate-500">{order.shipping_add || order.shipping_address}</p>
                  <p className="text-[10px] text-slate-400 mt-4 font-mono">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 italic">Item List / 清單</p>
                <div className="space-y-4">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-600">{item.name} × {item.qty}</span>
                      <span className="font-black text-slate-900 italic">NT$ {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 動態按鈕區 (整合了確認收貨與取消申請) */}
            <div className="space-y-4">
                {order.status === "delivered" ? (
                <button 
                    onClick={handleFinish} 
                    disabled={isActionLoading} 
                    className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.4em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isActionLoading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    {isActionLoading ? "更新紀錄中..." : "確認收貨並歸檔"}
                </button>
                ) : order.status === "completed" ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-[24px]">
                    <p className="text-slate-300 text-[10px] font-black tracking-[0.3em] uppercase italic">Order Completed / 訂單已結案</p>
                </div>
                ) : order.status === "cancelling" ? (
                <div className="text-center py-6 bg-red-50 rounded-[24px] border border-red-100">
                    <p className="text-red-400 text-[10px] font-black tracking-[0.3em] uppercase italic animate-pulse">Cancellation Pending / 取消申請審核中</p>
                </div>
                ) : order.status === "cancelled" ? (
                <div className="text-center py-6 bg-slate-100 rounded-[24px]">
                    <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase italic">Order Cancelled / 訂單已取消</p>
                </div>
                ) : (
                <div className="text-center py-8 bg-slate-50 rounded-[24px] border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black tracking-[0.5em] uppercase italic animate-pulse mb-4">{currentStatus.detail}</p>
                    
                    {/* 只有在尚未發貨前 (pending/processing) 顯示取消按鈕 */}
                    {(order.status === "pending" || order.status === "processing") && (
                        <button 
                            onClick={handleRequestCancel}
                            disabled={isActionLoading}
                            className="text-[10px] font-black text-red-400 uppercase tracking-widest border-b border-red-200 hover:text-red-600 hover:border-red-600 transition-all"
                        >
                            Request Cancellation / 申請取消訂單
                        </button>
                    )}
                </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 主頁面組件 ---
function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "history">("active");

  const fetchData = useCallback(async (email: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_email", email) 
      .order("created_at", { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  }, []);

  const refreshOrders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) fetchData(session.user.email);
  }, [fetchData]);

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await fetchData(session.user.email);
        gsap.fromTo(".fade-up", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" });
      } else {
        router.push("/");
      }
    };

    init();
    return () => lenis.destroy();
  }, [fetchData, router]);

  // 過濾邏輯：active 包含尚未結束的所有訂單；history 包含完成與取消的訂單
  const filteredOrders = orders.filter(o => 
    view === "active" 
      ? (o.status !== "completed" && o.status !== "cancelled") 
      : (o.status === "completed" || o.status === "cancelled")
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-32">
      <main className="max-w-3xl mx-auto px-8">
        <header className="fade-up mb-20 md:flex items-end justify-between gap-10">
          <div>
            <p className="text-[11px] font-black tracking-[0.5em] text-slate-400 uppercase mb-4 italic">Management</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic uppercase text-slate-900">我的作品訂單</h1>
          </div>
          <div className="mt-10 md:mt-0 flex p-2 bg-slate-100/50 backdrop-blur-sm rounded-[24px] border border-slate-100">
            {["active", "history"].map((v) => (
              <button key={v} onClick={() => setView(v as any)} className={`px-8 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all duration-500 ${view === v ? "bg-white text-slate-900 shadow-md" : "text-slate-400"}`}>
                {v === "active" ? "進行中" : "歷史紀錄"}
              </button>
            ))}
          </div>
        </header>

        <div className="fade-up space-y-8">
          {loading ? (
            <div className="py-20 text-center font-black animate-pulse text-slate-200 tracking-widest uppercase">LOADING RECORDS...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-40 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] italic">No records found / 尚無相關紀錄</div>
          ) : (
            filteredOrders.map(order => <OrderCard key={order.id} order={order} onRefresh={refreshOrders} />)
          )}
        </div>
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center font-black text-slate-200 tracking-[1em] animate-pulse">LOADING</div>}>
      <OrdersContent />
    </Suspense>
  );
}