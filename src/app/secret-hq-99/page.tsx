"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// --- 類型定義 ---
type Order = {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  shipping_address: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled' | 'cancelling';
  items: any[];
  created_at: string;
  cancel_reason?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  status: boolean;
  image_url: string;
  description?: string;
};

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "ERIJUSTUDIO99";

export default function AdminPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [mainTab, setMainTab] = useState<"orders" | "products">("orders");
  const [orderSubTab, setOrderSubTab] = useState<Order["status"]>("pending");
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // --- 數據獲取 ---
  const fetchData = useCallback(async () => {
    const { data: ord } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const { data: prd } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (ord) setOrders(ord);
    if (prd) setProducts(prd);
  }, []);

  useEffect(() => {
    const auth = window.localStorage.getItem("admin_auth_status");
    if (auth === "true") {
      setIsLocked(false);
      fetchData();
    }
  }, [fetchData]);

  // --- 通知邏輯 (串接 API) ---
  const triggerNotification = async (order: Order, newStatus: string) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          name: order.user_name,
          email: order.user_email,
          phone: order.user_phone,
          address: newStatus === 'cancelled' ? `🛑 管理員已手動取消或同意取消` : `✅ 訂單已手動結案`,
          total: order.total_amount,
          items: order.items.map((i: any) => `• ${i.name} x ${i.qty}`).join("\n"),
          status: newStatus // 會觸發 Discord API 的顏色判斷
        }),
      });
    } catch (e) {
      console.error("Notification failed", e);
    }
  };

  // --- 狀態更動核心 ---
  const updateOrderStatus = async (order: Order, newStatus: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) return alert("更新失敗");
    
    // 如果是結案或取消，發送通知
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      await triggerNotification(order, newStatus);
    }

    fetchData();
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      window.localStorage.setItem("admin_auth_status", "true");
      setIsLocked(false);
      fetchData();
    } else {
      alert("管理密碼錯誤！");
    }
  };

  // --- 作品操作 ---
  const openEditModal = (product?: Product) => {
    setEditingProduct(product || { name: "", price: 0, status: true, image_url: "" });
    setIsModalOpen(true);
  };

  const saveProduct = async () => {
    if (!editingProduct?.name) return alert("請輸入名稱");
    if (editingProduct.id) {
      await supabase.from("products").update(editingProduct).eq("id", editingProduct.id);
    } else {
      await supabase.from("products").insert([editingProduct]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("確定刪除此作品？")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  // --- 紅點判斷邏輯 ---
  const getStatusCount = (status: Order["status"]) => orders.filter(o => o.status === status).length;
  const hasUrgentAction = orders.some(o => o.status === 'pending' || o.status === 'cancelling');

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-white rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-black text-3xl font-black italic shadow-2xl">E</div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="SECRET KEY" className="w-full bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl text-center font-black tracking-widest focus:outline-none focus:border-blue-500" autoFocus />
            <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase hover:bg-blue-600 hover:text-white transition-all">解鎖後台</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f5f5f7] overflow-y-auto flex flex-col font-sans antialiased text-slate-900">
      {/* 頂部導航 */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs">E</div>
            <span className="font-black italic text-lg tracking-tighter uppercase">Admin HQ</span>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setMainTab("orders")} className={`relative px-6 py-2 rounded-lg text-xs font-black transition-all ${mainTab === "orders" ? "bg-white text-black shadow-sm" : "text-gray-400"}`}>
              訂單管理
              {hasUrgentAction && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            <button onClick={() => setMainTab("products")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${mainTab === "products" ? "bg-white text-black shadow-sm" : "text-gray-400"}`}>作品庫</button>
          </div>
          <button onClick={() => { window.localStorage.removeItem("admin_auth_status"); window.location.reload(); }} className="text-[10px] font-black text-red-500 uppercase">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full p-6 py-10">
        {mainTab === "orders" ? (
          <section>
            {/* 子狀態分頁與紅點 */}
            <div className="flex gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
              {(['pending', 'processing', 'cancelling', 'delivered', 'completed', 'cancelled'] as const).map(tab => {
                const count = getStatusCount(tab);
                return (
                  <button 
                    key={tab}
                    onClick={() => setOrderSubTab(tab)}
                    className={`relative px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${orderSubTab === tab ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'}`}
                  >
                    {tab === 'pending' ? '待處理' : tab === 'processing' ? '製作中' : tab === 'cancelling' ? '取消申請' : tab === 'delivered' ? '已發貨' : tab === 'completed' ? '已完成' : '已取消'}
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${orderSubTab === tab ? 'bg-white text-black' : 'bg-red-500 text-white'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 訂單清單 */}
            <div className="grid gap-6">
              {orders.filter(o => o.status === orderSubTab).length === 0 ? (
                <div className="py-40 text-center text-gray-300 font-black uppercase tracking-[0.5em] italic">No Orders in this stage / 目前尚無訂單</div>
              ) : (
                orders.filter(o => o.status === orderSubTab).map(order => (
                  <div key={order.id} className={`bg-white p-8 rounded-[2.5rem] border-l-[12px] shadow-sm flex flex-col md:flex-row justify-between gap-8 transition-all hover:shadow-md ${order.status === 'cancelling' ? 'border-red-500 bg-red-50/20' : 'border-gray-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black italic tracking-tighter text-gray-900">{order.user_name}</h3>
                        {order.status === 'cancelling' && <span className="bg-red-500 text-white text-[9px] px-2 py-1 rounded font-black uppercase animate-pulse">Action Required</span>}
                      </div>
                      <p className="text-blue-600 font-bold text-sm mb-4">{order.user_phone}</p>
                      <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 mb-4 font-medium border border-gray-100">{order.shipping_address}</div>
                      
                      {order.cancel_reason && (
                        <div className="bg-red-500/10 border border-red-200 p-4 rounded-xl text-sm text-red-600 mb-4 font-bold italic">
                          🛑 客戶取消理由: {order.cancel_reason}
                        </div>
                      )}

                      <div className="space-y-2 border-t border-gray-50 pt-4">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs font-bold italic text-slate-400">
                            <span>{item.name} × {item.qty}</span>
                            <span className="text-slate-900 font-black">NT$ {(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-6 text-right min-w-[200px]">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase mb-1">{new Date(order.created_at).toLocaleString()}</p>
                        <p className="text-3xl font-black italic tracking-tighter tabular-nums text-slate-900">NT$ {order.total_amount.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Order ID: {order.id.slice(0, 8)}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 justify-end">
                        {/* 狀態切換邏輯 */}
                        {order.status === 'pending' && (
                          <button onClick={() => updateOrderStatus(order, 'processing')} className="bg-blue-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition">開始製作</button>
                        )}
                        
                        {order.status === 'processing' && (
                          <button onClick={() => updateOrderStatus(order, 'delivered')} className="bg-green-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition">發貨完成</button>
                        )}

                        {order.status === 'cancelling' && (
                          <>
                            <button onClick={() => updateOrderStatus(order, 'cancelled')} className="bg-red-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700">同意取消</button>
                            <button onClick={() => updateOrderStatus(order, 'processing')} className="bg-slate-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black">拒絕申請</button>
                          </>
                        )}

                        {order.status === 'delivered' && (
                          <button onClick={() => updateOrderStatus(order, 'completed')} className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition">結案</button>
                        )}

                        {/* 通用取消按鈕 (非終端狀態) */}
                        {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'cancelling' && (
                          <button onClick={() => { if(confirm("確定手動取消此訂單？")) updateOrderStatus(order, 'cancelled') }} className="text-[10px] font-black text-red-400 px-4 hover:text-red-600 transition underline underline-offset-4">手動取消</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <section>
            {/* 作品庫邏輯保持不變 */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Product List / 作品庫</h2>
              <button onClick={() => openEditModal()} className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-xl text-xs hover:scale-105 transition">+ 新增作品</button>
            </div>
            {/* 表格省略，同你提供的版本... */}
          </section>
        )}
      </main>

      {/* 作品編輯 Modal 省略，同你提供的版本... */}
    </div>
  );
}