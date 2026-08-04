"use client";

import { useEffect } from "react";

const APP_VERSION = "v1.7.0";

const EXTRA_PROMPTS: Readonly<Record<string, readonly string[]>> = {
  "NGワード": ["推し","優勝","眠たい","おかわり","写真撮ろう","それな","ほんと？","懐かしい","天才","お腹いっぱい","帰りたい","もう一回","知らなかった","かわいそう","めっちゃ","たぶん","逆に","とりあえず","ありえる","絶対無理","大好き","最近どう？","予定ある？","乾杯しよう","時間やばい"],
  "究極の二択": ["一生同じ服 vs 一生同じ髪型","夏だけの世界 vs 冬だけの世界","毎日カレー vs 毎日ラーメン","透明人間 vs 空を飛ぶ","過去へ行く vs 未来へ行く","話すのが上手 vs 聞くのが上手","1億円もらう vs 20歳若返る","一生スマホなし vs 一生旅行なし","都会暮らし vs 田舎暮らし","犬になる vs 猫になる","好きな作品の世界へ行く vs 好きな有名人と友達になる","毎週3連休 vs 年1回1か月休み","寝なくていい体 vs 食べなくていい体","記憶力最強 vs 運動神経最強","一生無料の外食 vs 一生無料の交通費"],
  "爆弾しりとり": ["アニメキャラクター","ゲームタイトル","有名な食べ物","駅にあるもの","スマホに入っているもの","夏祭りにあるもの","旅行先ですること","居酒屋にあるもの","学校行事","スポーツ選手","家の中にある丸いもの","100円ショップにあるもの","朝にすること","寝る前にすること","雨の日に使うもの","コンビニスイーツ","日本の観光地","動物園にいる動物","カラオケで使う言葉","プレゼントでもらうもの"],
  "ジェスチャー": ["エレベーターに乗る","スマホを落とす","寝坊して慌てる","激辛料理を食べる","写真を撮られる","蚊を退治する","推しを見つける","財布をなくす","満員電車に乗る","温泉に入る","ホームランを打つ","PKを蹴る","ボウリングでストライク","赤ちゃんをあやす","犬の散歩","美容院で髪を切る","VRゲームを遊ぶ","ライブで盛り上がる","サウナで整う","宝くじが当たる"],
  "5秒ぴったり": ["目を閉じて10秒","片足立ちで5秒","拍手しながら7秒","笑わずに8秒","息を止めて6秒","全員で同時に5秒","声を出さずに10秒","スマホを見ずに3秒"],
  "全員一致": ["一番人気のコンビニ","朝ごはんの定番","日本で一番有名な山","赤い食べ物","夏の曲といえば","人気のアニメキャラ","旅行に必ず持っていくもの","おにぎりの具","学校の教科","冬のスポーツ","有名なゲーム","雨の日に使うもの","動物園の人気者","居酒屋の定番メニュー","誕生日プレゼント","丸いもの","怖いもの","日本の観光地","カラオケの定番","無人島に持っていくもの"],
  "ワードウルフ": ["マクドナルド／モスバーガー","ディズニーランド／USJ","ドラえもん／アンパンマン","富士山／東京タワー","YouTube／TikTok","海水浴／プール","カレー／ハヤシライス","焼き鳥／唐揚げ","サウナ／温泉","漫画／アニメ","ポケモン／マリオ","夏祭り／花火大会","新幹線／飛行機","目玉焼き／卵焼き","コーラ／サイダー"],
  "第一印象": ["一番無人島で頼れそうな人","一番YouTuberになりそうな人","一番宝くじを当てそうな人","一番寝起きが悪そうな人","一番料理が上手そうな人","一番秘密が多そうな人","一番海外で暮らせそうな人","一番先生に向いていそうな人","一番動物に好かれそうな人","一番方向音痴そうな人","一番サプライズが上手そうな人","一番社長になりそうな人","一番宇宙旅行に行きそうな人","一番今日を楽しんでいそうな人","一番SNSを見ていそうな人"],
  "禁止文字トーク": ["あを言わずに自己紹介","いを言わずに好きな食べ物を説明","うを言わずに休日の話","えを言わずに旅行の思い出","おを言わずに好きな作品を紹介","かを言わずに学校・仕事の話","しを言わずに最近買った物を説明","たを言わずに昨日の出来事","んを言わずに1分会話"],
  "カタカナ禁止": ["スマートフォン","コンビニ","エレベーター","アイスクリーム","サッカー","YouTube","ディズニーランド","リモコン","パソコン","カラオケ","ハンバーガー","アニメ","ゲームセンター","クリスマス","ジェットコースター"],
  "ランキング当て": ["日本で人口が多い都道府県TOP3","世界で面積が大きい国TOP3","人気の寿司ネタTOP3","コンビニで買うものTOP3","旅行で行きたい国TOP3","好きな季節TOP3","飼いたい動物TOP3","カラオケで盛り上がる曲ジャンルTOP3","無人島に持っていくものTOP3","朝ごはんの定番TOP3"],
  "以心伝心お絵描き": ["未来の車","最強のロボット","かわいい怪獣","理想の家","宇宙人","夏休み","運動会","誕生日ケーキ","日本代表マスコット","新しいスマホ","おばけ","遊園地","無人島","推しの衣装","世界一大きい動物"],
  "3秒で3つ": ["赤いもの","丸いもの","コンビニの商品","アニメキャラ","スポーツ","動物","都道府県","駅にあるもの","夏の食べ物","学校にあるもの","スマホアプリ","旅行先","家電","楽器","カタカナ語","飲み物","冬に使うもの","有名人","ゲームタイトル","お祭りの屋台"],
  "3ヒントクイズ": ["赤い・丸い・果物 → りんご","黄色い・長い・果物 → バナナ","青い・未来・猫型 → ドラえもん","電気・冷やす・台所 → 冷蔵庫","空・速い・旅行 → 飛行機","赤白・高い・東京 → 東京タワー","配管工・赤い帽子・ゲーム → マリオ","雷・黄色い・ポケモン → ピカチュウ","海・海賊・麦わら → ルフィ","鬼・刀・妹 → 炭治郎"],
  "共通点さがし": ["ラーメンとスマホ","犬と電車","学校と遊園地","夏とカレー","サッカーと将棋","猫とアイドル","雨とゲーム","コンビニと空港","漫画と旅行","寿司と映画","温泉とスマホ","野球と料理","宇宙と海","先生とYouTuber","電車とアニメ"],
};

const GAME_TIPS: Readonly<Record<string, string>> = {
  "NGワード": "短すぎる会話にならないよう、質問をたくさん投げると盛り上がります。",
  "究極の二択": "少数派になった人は理由を話すルールがおすすめです。",
  "爆弾しりとり": "答えた人がスマホを次の人へ渡してください。",
  "ジェスチャー": "制限時間30秒、パスは1回までがおすすめです。",
  "全員一致": "完全一致で2点、惜しい答えは相談して1点にしても遊べます。",
  "ワードウルフ": "質問は一人1回ずつ。直接答えを言わないのがコツです。",
  "第一印象": "指された人数が一番多い人が、ひとことコメントします。",
  "禁止文字トーク": "30秒間会話できたら成功。言った本人が判定します。",
  "カタカナ禁止": "固有名詞も日本語へ言い換えると難易度が上がります。",
  "ランキング当て": "相談時間を60秒にするとテンポよく遊べます。",
  "以心伝心お絵描き": "絵を見せる前に、全員同時に描き終えてください。",
  "3秒で3つ": "答えが被ってもOK。止まらず言い切るのが大事です。",
  "3ヒントクイズ": "1ヒントで正解3点、2ヒント2点、3ヒント1点がおすすめです。",
  "共通点さがし": "こじつけでも全員が納得したら正解にしましょう。",
};

const randomItem = <T,>(items: readonly T[]): T | undefined =>
  items.length ? items[Math.floor(Math.random() * items.length)] : undefined;

export default function PartyGameEnhancer() {
  useEffect(() => {
    let currentPage: HTMLElement | null = null;
    let observer: MutationObserver | null = null;

    const detectTitle = (page: HTMLElement): string =>
      page.querySelector<HTMLElement>(".game-header h1, .game-header h2")?.textContent?.trim() ?? "";

    const removeLegacyVersions = () => {
      document.querySelectorAll<HTMLElement>("footer b, .dosukoi-version-badge").forEach(element => {
        if (element.textContent?.trim().match(/^v1\.[0-6]\./)) element.remove();
      });
    };

    const enhance = () => {
      removeLegacyVersions();
      const page = document.querySelector<HTMLElement>(".game-page");
      if (!page || page === currentPage) return;
      currentPage = page;

      const title = detectTitle(page);
      if (!title || title === "どすこい" || title.includes("ちんちろ")) return;

      page.dataset.partyEnhanced = "true";
      const header = page.querySelector<HTMLElement>(".game-header");
      if (header && !header.querySelector(".party-version")) {
        const badge = document.createElement("span");
        badge.className = "party-version";
        badge.textContent = APP_VERSION;
        header.appendChild(badge);
      }

      const mainCard = page.querySelector<HTMLElement>(".play-card, section");
      if (!mainCard) return;

      const tip = GAME_TIPS[title];
      if (tip && !page.querySelector(".party-tip")) {
        const tipBox = document.createElement("aside");
        tipBox.className = "party-tip";
        tipBox.innerHTML = `<b>盛り上がるコツ</b><span>${tip}</span>`;
        mainCard.before(tipBox);
      }

      const prompts = EXTRA_PROMPTS[title];
      if (prompts?.length && !page.querySelector(".party-extra-panel")) {
        const panel = document.createElement("section");
        panel.className = "party-extra-panel";
        panel.innerHTML = `
          <div class="party-extra-heading">
            <div><small>EXTRA PACK</small><b>追加お題パック</b></div>
            <span>${prompts.length}問</span>
          </div>
          <div class="party-extra-prompt" aria-live="polite">追加お題を引いてみよう</div>
          <button type="button" class="party-extra-draw">追加お題を抽選</button>`;
        mainCard.after(panel);

        const display = panel.querySelector<HTMLElement>(".party-extra-prompt");
        const button = panel.querySelector<HTMLButtonElement>(".party-extra-draw");
        let previous = "";
        button?.addEventListener("click", () => {
          let next = randomItem(prompts) ?? "";
          if (prompts.length > 1) while (next === previous) next = randomItem(prompts) ?? "";
          previous = next;
          if (display) display.textContent = next;
          panel.classList.remove("is-pop");
          requestAnimationFrame(() => panel.classList.add("is-pop"));
          try { navigator.vibrate?.(25); } catch {}
        });
      }
    };

    observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    enhance();

    return () => observer?.disconnect();
  }, []);

  return null;
}
