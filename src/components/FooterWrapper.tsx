"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // 定義不需要顯示 Footer 的頁面名單
  const hiddenRoutes = ["/buy", "/cart"];
  
  // 檢查目前路徑是否在名單中（使用 includes 確保帶有參數的 /buy?id=... 也能被偵測）
  const shouldHide = hiddenRoutes.some(route => pathname?.includes(route));

  if (shouldHide) return null;

  return <Footer />;
}