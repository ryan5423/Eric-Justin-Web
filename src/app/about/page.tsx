"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function AboutPage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // 使用 context 確保在 React 嚴格模式下不會重複初始化動畫
    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray(".reveal");
      reveals.forEach((el: any) => {
        gsap.fromTo(el, 
          { 
            opacity: 0, 
            y: 25 // 減少位移，讓滾動感更輕盈
          },
          {
            opacity: 1,
            y: 0,
            duration: 1, // 縮短時間，反應更及時
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 92%", // 稍微延後觸發點，確保使用者看到更多內容才開始動
              toggleActions: "play none none none"
            },
          }
        );
      });
    });

    return () => ctx.revert(); // 組件銷毀時徹底清理，防止記憶體洩漏
  }, []);

  return (
    <main className="min-h-screen">
      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10 opacity-40"></div>
        
        <div className="reveal max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-200 text-slate-500 px-4 py-1 rounded-full text-[11px] font-bold tracking-[0.2em] mx-auto w-fit mb-8 uppercase">
            Our Philosophy
          </div>
          <h1 className="text-7xl md:text-[130px] font-black text-slate-900 tracking-tighter mb-8 leading-[0.85]">
            重新定義<br />
            <span className="text-slate-200 italic">日常的重量</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto leading-tight font-medium">
            Eriju 誕生於對純粹美學的執著。我們將功能打磨至極致，在繁雜世界中，為您找到一處質感留白。
          </p>
        </div>
      </section>

      {/* --- Story Section --- */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-24 items-center">
          <div className="reveal order-2 md:order-1">
            <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tighter uppercase">
              始於 2026 / 台灣
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6 text-xl">
              在快速變遷的時代，我們選擇了一條精確的路。Eriju 專注於高品質生活，從材質的溫潤觸感到每一處細節都經過嚴格校準。
            </p>
            <p className="text-slate-400 leading-relaxed mb-8 text-lg font-medium">
              堅持「減法美學」—— 去掉多餘的裝飾，讓產品的本質與使用者的生活完美共鳴。
            </p>
            
            <div className="flex gap-16 border-t border-slate-100 pt-10">
              <div>
                <span className="block text-5xl font-black text-slate-900 tracking-tighter italic">999+</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">次細節打樣</span>
              </div>
              <div>
                <span className="block text-5xl font-black text-slate-900 tracking-tighter italic">100%</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">原創設計</span>
              </div>
            </div>
          </div>

          <div className="reveal order-1 md:order-2">
            <div className="rounded-[60px] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-1000 group bg-slate-50">
              <img 
                src="https://oikubhlwdbxrfhifqusn.supabase.co/storage/v1/object/public/assets/S__38223874.jpg" 
                alt="Brand visual" 
                className="w-full h-auto scale-110 group-hover:scale-100 transition-transform duration-1000 object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- Beliefs Section --- */}
      <section className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal text-center mb-24">
            <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase">信念</h2>
            <div className="w-12 h-1 bg-slate-900 mx-auto mt-6"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { id: "01", title: "極致純粹", en: "Purity", desc: "去掉多餘線條，只留下最純粹的幾何美感。我們追求一種「安靜的設計」，讓產品在使用中自然消失。" },
              { id: "02", title: "工藝溫度", en: "Craftsmanship", desc: "追求精準的同時，我們堅持最後一道工序由人工打磨。每一件產品都代表對質量的敬意。" },
              { id: "03", title: "永續思考", en: "Sustainability", desc: "我們拒絕快時尚。透過打造長壽命的耐看設計與高品質材質，讓每一件作品都能長久陪伴。" }
            ].map((v, i) => (
              <div 
                key={i} 
                className="reveal bg-white rounded-[40px] p-12 border border-black/5 hover:shadow-2xl hover:-translate-y-2 transition-transform duration-500 group"
              >
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-10 text-xl font-black shadow-lg group-hover:rotate-12 transition-transform duration-500">
                  {v.id}
                </div>
                <h3 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">
                  {v.title}<br />
                  <span className="text-slate-300 text-sm uppercase tracking-widest">{v.en}</span>
                </h3>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}