import "./globals.css";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper"; // 引入包裝組件
import SmoothScroll from "@/components/SmoothScroll";

export const metadata = {
  title: "Eriju | 官方網站",
  description: "正式啟程。這不只是發售，而是一場關於生活質感的重新校準。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        <SmoothScroll>
          <Navbar />
          <main className="pt-24">{children}</main>
          {/* 讓 Wrapper 自動幫你決定要不要顯示 Footer */}
          <FooterWrapper /> 
        </SmoothScroll>
      </body>
    </html>
  );
}