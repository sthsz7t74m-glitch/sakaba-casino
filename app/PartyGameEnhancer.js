"use client";

import { useEffect } from "react";

const APP_VERSION = "v1.7.0";

const EXTRA_PROMPTS = {
  "NGワード": ["推し","優勝","眠たい","おかわり","それな","懐かしい","天才","帰りたい","もう一回","めっちゃ","逆に","とりあえず","大好き","時間やばい"],
  "究極の二択": ["一生同じ服 vs 一生同じ髪型","夏だけの世界 vs 冬だけの世界","毎日カレー vs 毎日ラーメン","透明人間 vs 空を飛ぶ","過去へ行く vs 未来へ行く","都会暮らし vs 田舎暮らし","犬になる vs 猫になる","毎週3連休 vs 年1回1か月休み"],
  "爆弾しりとり": ["アニメキャラクター","ゲームタイトル","駅にあるもの","スマホに入っているもの","夏祭りにあるもの","旅行先ですること","居酒屋にあるもの","学校行事","スポーツ選手","100円ショップにあるもの"],
  "ジェスチャー": ["エレベーターに乗る","スマホを落とす","寝坊して慌てる","激辛料理を食べる","写真を撮られる","蚊を退治する","財布をなくす","満員電車に乗る","ホームランを打つ","宝くじが当たる"],
  "5秒ぴったり": ["目を閉じて10秒","片足立ちで5秒","拍手しながら7秒","笑わずに8秒","息を止めて6秒","全員で同時に5秒"],
  "全員一致": ["一番人気のコンビニ","朝ごはんの定番","日本で一番有名な山","赤い食べ物","人気のアニメキャラ","おにぎりの具","冬のスポーツ","有名なゲーム","居酒屋の定番メニュー","無人島に持っていくもの"],
  "ワードウルフ": ["マクドナルド／モスバーガー","ディズニーランド／USJ","ドラえもん／アンパンマン","YouTube／TikTok","海水浴／プール","カレー／ハヤシライス","漫画／アニメ","ポケモン／マリオ"],
  "第一印象": ["一番無人島で頼れそうな人","一番YouTuberになりそうな人","一番宝くじを当てそうな人","一番料理が上手そうな人","一番秘密が多そうな人","一番海外で暮らせそうな人","一番動物に好かれそうな人","一番社長になりそうな人"],
  "禁止文字トーク": ["あを言わずに自己紹介","いを言わずに好きな食べ物を説明","うを言わずに休日の話","えを言わずに旅行の思い出","おを言わずに好きな作品を紹介","かを言わずに仕事の話"],
  "カタカナ禁止": ["スマートフォン","コンビニ","エレベーター","アイスクリーム","サッカー","YouTube","ディズニーランド","リモコン","パソコン","カラオケ"],
  "ランキング当て": ["人口が多い都道府県TOP3","面積が大きい国TOP3","人気の寿司ネタTOP3","旅行で行きたい国TOP3","飼いたい動物TOP3","朝ごはんの定番TOP3"],
  "以心伝心お絵描き": ["未来の車","最強のロボット","かわいい怪獣","理想の家","宇宙人","誕生日ケーキ","おばけ","無人島"],
  "3秒で3つ": ["赤いもの","丸いもの","コンビニの商品","アニメキャラ","スポーツ","動物","都道府県","駅にあるもの","スマホアプリ","ゲームタイトル"],
  "3ヒントクイズ": ["赤い・丸い・果物 → りんご","黄色い・長い・果物 → バナナ","青い・未来・猫型 → ドラえもん","電気・冷やす・台所 → 冷蔵庫","配管工・赤い帽子・ゲーム → マリオ","雷・黄色い・ポケモン → ピカチュウ"],
  "共通点さがし": ["ラーメンとスマホ","犬と電車","学校と遊園地","夏とカレー","サッカーと将棋","猫とアイドル","雨とゲーム","漫画と旅行"]
};

const GAME_TIPS = {
  "NGワード": "質問を多めにすると会話が続きます。",
  "究極の二択": "少数派になった人は理由を話すと盛り上がります。",
  "爆弾しりとり": "答えたらすぐ次の人へスマホを渡してください。",
  "ジェスチャー": "制限時間30秒、パス1回がおすすめです。",
  "全員一致": "完全一致で2点、惜しい答えは1点でも遊べます。",
  "ワードウルフ": "直接答えを言わず、遠回しに質問しましょう。",
  "第一印象": "一番指された人がひとことコメントします。",
  "禁止文字トーク": "30秒会話できたら成功です。",
  "カタカナ禁止": "固有名詞も日本語へ言い換えると難しくなります。",
  "ランキング当て": "相談時間60秒がおすすめです。",
  "以心伝心お絵描き": "全員が描き終わるまで絵を見せないでください。",
  "3秒で3つ": "止まらず3つ言い切るのがコツです。",
  "3ヒントクイズ": "1ヒント3点、2ヒント2点、3ヒント1点がおすすめです。",
  "共通点さがし": "こじつけでも全員が納得したら正解です。"
};

function pick(items, previous) {
  if (!items || items.length === 0) return "";
  let next = items[Math.floor(Math.random() * items.length)];
  if (items.length > 1) {
    while (next === previous) next = items[Math.floor(Math.random() * items.length)];
  }
  return next;
}

export default function PartyGameEnhancer() {
  useEffect(() => {
    let currentPage = null;

    const enhance = () => {
      document.querySelectorAll("footer b, .dosukoi-version-badge").forEach(element => {
        if (/^v1\.[0-6]\./.test((element.textContent || "").trim())) element.remove();
      });

      const page = document.querySelector(".game-page");
      if (!page || page === currentPage) return;
      currentPage = page;

      const title = (page.querySelector(".game-header h1, .game-header h2")?.textContent || "").trim();
      if (!title || title === "どすこい" || title.includes("ちんちろ")) return;

      const header = page.querySelector(".game-header");
      if (header && !header.querySelector(".party-version")) {
        const badge = document.createElement("span");
        badge.className = "party-version";
        badge.textContent = APP_VERSION;
        header.appendChild(badge);
      }

      const mainCard = page.querySelector(".play-card, section");
      if (!mainCard) return;

      const tip = GAME_TIPS[title];
      if (tip && !page.querySelector(".party-tip")) {
        const tipBox = document.createElement("aside");
        tipBox.className = "party-tip";
        const label = document.createElement("b");
        label.textContent = "盛り上がるコツ";
        const text = document.createElement("span");
        text.textContent = tip;
        tipBox.append(label, text);
        mainCard.before(tipBox);
      }

      const prompts = EXTRA_PROMPTS[title];
      if (prompts && prompts.length && !page.querySelector(".party-extra-panel")) {
        const panel = document.createElement("section");
        panel.className = "party-extra-panel";
        panel.innerHTML = `<div class="party-extra-heading"><div><small>EXTRA PACK</small><b>追加お題パック</b></div><span>${prompts.length}問</span></div><div class="party-extra-prompt" aria-live="polite">追加お題を引いてみよう</div><button type="button" class="party-extra-draw">追加お題を抽選</button>`;
        mainCard.after(panel);

        const display = panel.querySelector(".party-extra-prompt");
        const button = panel.querySelector(".party-extra-draw");
        let previous = "";
        button?.addEventListener("click", () => {
          const next = pick(prompts, previous);
          previous = next;
          if (display) display.textContent = next;
          panel.classList.remove("is-pop");
          window.requestAnimationFrame(() => panel.classList.add("is-pop"));
        });
      }
    };

    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    enhance();
    return () => observer.disconnect();
  }, []);

  return null;
}
