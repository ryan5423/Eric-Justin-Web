export default function Footer() {
  return (
    <footer className="py-24 text-center border-t border-slate-50 bg-white">
      <span className="text-2xl font-black uppercase mb-6 block tracking-tighter text-slate-900">Eriju</span>
      <div className="max-w-md mx-auto mb-10 px-6">
        <p className="text-[10px] text-slate-400 leading-loose">
          本網站為 Eriju 個人創作與技術展示專案。所列商品為測試性販售之原創作品，非公司行號營運。下單前請詳閱專案說明，參與即代表支持個人創作。
        </p>
      </div>
      <p className="text-slate-300 text-[11px] tracking-[0.5em] uppercase">
        © {new Date().getFullYear()} Eriju Studio. All rights reserved.
      </p>
    </footer>
  );
}