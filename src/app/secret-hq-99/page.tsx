"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// --- 類型定義 ---
type Order = {
  id: string;
  user_name: string;
  user_phone: string;
  shipping_address: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled' | 'cancelling'; // 新增 cancelling
  items: any[];
  created_at: string;
  cancel_reason?: string; // 新增取消理由
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

  useEffect(() => {
    const auth = window.localStorage.getItem("admin_auth_status");
    if (auth === "true") {
      setIsLocked(false);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const { data: ord } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const { data: prd } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (ord) setOrders(ord);
    if (prd) setProducts(prd);
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

  const updateOrderStatus = async (id: string, newStatus: Order["status"]) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    fetchData();
  };

  // --- 紅點判斷 (包含新的 cancelling 狀態) ---
  const hasActiveOrders = orders.some(o => o.status === 'pending' || o.status === 'processing' || o.status === 'cancelling');

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-sm text-center">
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
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs">E</div>
            <span className="font-black italic text-lg tracking-tighter uppercase">Admin HQ</span>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setMainTab("orders")} className={`relative px-6 py-2 rounded-lg text-xs font-black transition-all ${mainTab === "orders" ? "bg-white text-black shadow-sm" : "text-gray-400"}`}>
              訂單管理
              {hasActiveOrders && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            <button onClick={() => setMainTab("products")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${mainTab === "products" ? "bg-white text-black shadow-sm" : "text-gray-400"}`}>作品庫</button>
          </div>
          <button onClick={() => { window.localStorage.removeItem("admin_auth_status"); window.location.reload(); }} className="text-[10px] font-black text-red-500 uppercase">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full p-6 py-10">
        {mainTab === "orders" ? (
          <section>
            <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
              {(['pending', 'processing', 'cancelling', 'delivered', 'completed', 'cancelled'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setOrderSubTab(tab)}
                  className={`relative px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderSubTab === tab ? 'bg-black text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}
                >
                  {tab === 'pending' ? '待處理' : tab === 'processing' ? '製作中' : tab === 'cancelling' ? '取消申請' : tab === 'delivered' ? '已發貨' : tab === 'completed' ? '已完成' : '已取消'}
                  {/* 紅點邏輯：pending, processing, cancelling 且有內容時顯示 */}
                  {(tab === 'pending' || tab === 'processing' || tab === 'cancelling') && orders.some(o => o.status === tab) && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-6">
              {orders.filter(o => o.status === orderSubTab).map(order => (
                <div key={order.id} className={`bg-white p-8 rounded-[2.5rem] border-l-[12px] shadow-sm flex flex-col md:flex-row justify-between gap-8 ${order.status === 'cancelling' ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-black italic tracking-tighter text-gray-900">{order.user_name}</h3>
                      {order.status === 'cancelling' && <span className="bg-red-500 text-white text-[9px] px-2 py-1 rounded font-black uppercase animate-pulse">Request Cancel</span>}
                    </div>
                    <p className="text-blue-600 font-bold text-sm mb-4">{order.user_phone}</p>
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 mb-4 font-medium">{order.shipping_address}</div>
                    
                    {/* 如果有取消理由，顯示出來 */}
                    {order.cancel_reason && (
                      <div className="bg-red-100/50 border border-red-200 p-4 rounded-xl text-sm text-red-600 mb-4 font-bold italic">
                        取消原因: {order.cancel_reason}
                      </div>
                    )}

                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs font-bold italic text-slate-400">
                          <span>{item.name} × {item.qty}</span>
                          <span className="text-slate-900">NT$ {item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-6 text-right">
                    <div>
                      <p className="text-[10px] font-black text-gray-300 uppercase mb-1">{new Date(order.created_at).toLocaleString()}</p>
                      <p className="text-3xl font-black italic tracking-tighter tabular-nums">NT$ {order.total_amount.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* --- 根據狀態顯示不同按鈕 --- */}
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'processing')} className="bg-blue-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">開始製作</button>
                      )}
                      
                      {order.status === 'processing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="bg-green-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100">發貨完成</button>
                      )}

                      {/* 取消審核按鈕 */}
                      {order.status === 'cancelling' && (
                        <>
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100">同意取消</button>
                          <button onClick={() => updateOrderStatus(order.id, 'processing')} className="bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest">拒絕申請</button>
                        </>
                      )}

                      {order.status === 'delivered' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest">結案</button>
                      )}

                      {/* 通用取消 (非結案且非取消中) */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'cancelling' && (
                        <button onClick={() => { if(confirm("確定手動取消此訂單？")) updateOrderStatus(order.id, 'cancelled') }} className="text-[10px] font-black text-red-400 px-4 hover:text-red-600 transition">取消</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Product List / 作品庫</h2>
              <button onClick={() => openEditModal()} className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-xl text-xs hover:scale-105 transition">+ 新增作品</button>
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">作品</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">售價</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">狀態</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <img src={p.image_url} className="w-12 h-12 object-cover rounded-xl bg-slate-100 shadow-sm" />
                          <span className="font-black text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-6 font-mono font-bold text-blue-600">NT$ {p.price.toLocaleString()}</td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {p.status ? '供應中' : '缺貨中'}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button onClick={() => openEditModal(p)} className="text-[10px] font-black uppercase text-slate-400 hover:text-black transition px-3 py-2">編輯</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-[10px] font-black uppercase text-red-300 hover:text-red-500 transition px-3 py-2">刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* 編輯/新增 Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 text-slate-900">{editingProduct.id ? 'Edit Product' : 'New Product'}</h2>
            <div className="space-y-6">
              <div className="grid gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">作品名稱</label>
                <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold focus:bg-white focus:border-black transition outline-none" placeholder="作品標題" />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">售價 (NT$)</label>
                <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold focus:bg-white focus:border-black transition outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">圖片連結 (Image URL)</label>
                <input value={editingProduct.image_url} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold focus:bg-white focus:border-black transition outline-none" placeholder="https://..." />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">供應狀態</span>
                <button onClick={() => setEditingProduct({...editingProduct, status: !editingProduct.status})} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${editingProduct.status ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-red-500 text-white shadow-lg shadow-red-100'}`}>
                    {editingProduct.status ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                <button onClick={saveProduct} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}