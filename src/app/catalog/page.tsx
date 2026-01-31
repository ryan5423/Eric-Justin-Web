"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import gsap from "gsap";

export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path: string) => {
    if (!path) return "/photo/S__38223874.jpg";
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const startTime = Date.now(); // 1. 紀錄抓取開始時間

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("status", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }

      // 2. 計算剩餘需要「強制等待」的時間，確保骨架屏不閃爍
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(800 - elapsedTime, 0);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    // 3. 只有當 loading 結束且產品渲染後，才執行 GSAP
    if (!loading && products.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".product-card", 
          { opacity: 0, y: 15 }, 
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: "power2.out",
          }
        );
      });
      return () => ctx.revert();
    }
  }, [loading, products]);

  return (
    <div className="relative min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-20">
        <header className="mb-24">
          <span className="text-[11px] font-bold tracking-[0.4em] text-orange-500 uppercase block mb-6">Official Collection</span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-none">探索所有收藏</h1>
          <div className="w-16 h-1.5 bg-slate-900 mt-10"></div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 lg:gap-16">
          {loading ? (
            // --- 骨架屏 (保持原本設計) ---
            [...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[1/1.1] bg-slate-100 rounded-[50px] mb-8" />
                <div className="h-4 bg-slate-100 rounded w-1/4 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))
          ) : (
            // --- 真實商品內容 (保持原本設計) ---
            products.map((p) => {
              const isOff = p.status === false;
              const imgUrl = getImageUrl(p.image_url);

              return (
                <div key={p.id} className={`product-card opacity-0 ${isOff ? 'opacity-60 grayscale-[40%]' : 'group'}`}>
                  <Link href={isOff ? "#" : `/buy?id=${p.id}`}>
                    <div className="relative aspect-[1/1.1] bg-white border border-black/[0.04] rounded-[50px] flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] group-hover:-translate-y-3">
                      <img 
                        src={imgUrl} 
                        alt={p.name}
                        className="w-[75%] h-[75%] object-contain transition-transform duration-1000 group-hover:scale-110" 
                      />
                      {isOff && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center font-black text-slate-400 text-[10px] uppercase tracking-widest">
                          Restocking
                        </div>
                      )}
                    </div>
                    
                    <div className="px-2 mt-8">
                      <span className={`text-[10px] font-extrabold tracking-[0.2em] px-3 py-1 rounded-full uppercase inline-block mb-3 ${isOff ? 'bg-slate-100 text-slate-300' : 'bg-orange-50 text-orange-600'}`}>
                        {isOff ? 'Archive' : (p.tag || 'Official')}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-orange-500 transition-colors">{p.name}</h3>
                      <p className={`font-bold ${isOff ? 'text-slate-300' : 'text-slate-500'}`}>NT$ {p.price?.toLocaleString()}</p>
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}