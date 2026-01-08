// script.js
gsap.registerPlugin(ScrollTrigger);

// 1. Hero 圖片滾動縮放效果
gsap.to(".product-img", {
    scale: 0.8,
    opacity: 0.5,
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom center",
        scrub: true // 動畫隨捲軸平滑進行
    }
});

// 2. 文字漸顯效果
gsap.from(".reveal-text", {
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.3, // 讓文字一個接一個出現
    ease: "power4.out"
});

// 3. 特色卡片滾動進入
const cards = document.querySelectorAll('.feature-card');
cards.forEach(card => {
    gsap.from(card, {
        y: 100,
        opacity: 0,
        scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "top 60%",
            scrub: 1
        }
    });
});