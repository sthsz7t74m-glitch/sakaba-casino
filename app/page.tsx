"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findAnswerWords } from "./word-data";

type Screen = "lobby" | "chinchiro" | "classicChinchiro" | "dosukoi" | "ngword" | "majority" | "bomb" | "gesture" | "fiveSeconds" | "matchAll" | "wordWolf" | "firstImpression" | "forbiddenKana" | "noKatakana" | "rankingGuess" | "drawingSync" | "threeQuick" | "threeHints" | "commonPoint";

const diceGlyphs = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const kana = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ"];
const voicedKana = ["が","ぎ","ぐ","げ","ご","ざ","じ","ず","ぜ","ぞ","だ","で","ど","ば","び","ぶ","べ","ぼ","ぱ","ぴ","ぷ","ぺ","ぽ"];
const ngWords = ["乾杯","かわいい","マジで","仕事","スマホ","眠い","おいしい","やばい","写真","明日","旅行","推し","ビール","ゲーム","ごめん","なるほど","たしかに","でも","最高","酔った","もう一杯","SNS","カラオケ","恋愛","ほんとに","すごい","わかる","大丈夫","お腹すいた","暑い","寒い","疲れた","楽しい","久しぶり","ありがとう","名前","地元","学校","会社","休日","最近","おすすめ","人気","知ってる","面白い","好き","嫌い","絶対","一緒","次","帰る"];
const majorityQuestions = [
  { q:"一生食べるなら？", a:"お米", b:"パン" },
  { q:"旅行するなら？", a:"海", b:"山" },
  { q:"欲しい能力は？", a:"空を飛ぶ", b:"透明になる" },
  { q:"休日の朝は？", a:"早起き", b:"昼まで寝る" },
  { q:"住むなら？", a:"都会", b:"田舎" },
  { q:"見るなら？", a:"映画", b:"ドラマ" },
  { q:"夏と冬なら？", a:"夏", b:"冬" },
  { q:"タイムマシンなら？", a:"過去へ", b:"未来へ" },
  { q:"食べるなら？", a:"甘いもの", b:"しょっぱいもの" },
  { q:"ペットにするなら？", a:"犬", b:"猫" },
  { q:"飲み会の締めは？", a:"ラーメン", b:"デザート" },
  { q:"生まれ変わるなら？", a:"また自分", b:"別の人" },
  { q:"能力を選ぶなら？", a:"瞬間移動", b:"時間停止" },
  { q:"一生無料なら？", a:"外食", b:"旅行" },
  { q:"無人島に持っていくなら？", a:"ナイフ", b:"スマホ" },
  { q:"友達になるなら？", a:"よく話す人", b:"よく聞く人" },
  { q:"挑戦するなら？", a:"宇宙旅行", b:"深海探検" },
  { q:"得意になれるなら？", a:"歌", b:"ダンス" },
  { q:"朝起きたらなっていたいのは？", a:"大富豪", b:"有名人" },
  { q:"観戦するなら？", a:"スポーツ", b:"音楽ライブ" },
  { q:"プレゼントなら？", a:"欲しかった物", b:"サプライズ体験" },
  { q:"移動するなら？", a:"車", b:"電車" },
  { q:"主役になるなら？", a:"映画", b:"ゲーム" },
  { q:"一週間なしで過ごすなら？", a:"スマホ", b:"テレビ" },
  { q:"毎日食べるなら？", a:"カレー", b:"ラーメン" },
  { q:"見るなら？", a:"日の出", b:"夜景" },
  { q:"性格を選ぶなら？", a:"慎重", b:"大胆" },
  { q:"部屋に置くなら？", a:"大きなテレビ", b:"高級ソファ" },
  { q:"勝負するなら？", a:"知力", b:"運" },
  { q:"休みが増えるなら？", a:"毎週3連休", b:"年1回1か月休み" },
];
const bombCategories = ["食べ物","動物","地名","有名人","身近にある物","3文字以上の言葉","スポーツ","学校にある物","台所にある物","乗り物","職業","国名","都道府県","植物","映画やアニメのタイトル","丸い物","赤い物","夏に関係する物","冬に関係する物","コンビニにある物","旅行に持っていく物","体の部位","家電","楽器","カタカナ語"];
const gestureWords = ["ゴリラ","歯みがき","寝坊","野球","ラーメン","ジェットコースター","カラオケ","猫","忍者","サーフィン","スマホ","宇宙人","料理","筋トレ","酔っぱらい","オーケストラ","温泉","釣り","花火","ゾンビ","告白","電車","美容師","相撲","バスケットボール","ボウリング","スキー","水泳","ゴルフ","綱引き","大掃除","洗濯","皿洗い","掃除機","ドライヤー","目覚まし時計","蚊","ペンギン","カンガルー","ヘビ","カニ","象","赤ちゃん","おばけ","魔法使い","ロボット","警察官","消防士","医者","先生","アイドル","探偵","泥棒","ヒーロー","プロポーズ","面接","遅刻","くしゃみ","しゃっくり","熱い食べ物","重い荷物","迷子","写真撮影","テレビゲーム","ダンス","ギター","太鼓","誕生日","運動会","キャンプ","肝試し"];
const matchPrompts = ["赤いものといえば？","夏の食べ物といえば？","人気の動物といえば？","コンビニで買うものといえば？","日本の観光地といえば？","丸いものといえば？","朝ごはんといえば？","強いスポーツ選手といえば？","冬の食べ物といえば？","日本の山といえば？","海の生き物といえば？","学校の教科といえば？","おにぎりの具といえば？","ファストフードといえば？","黄色いものといえば？","春の花といえば？","運動会の種目といえば？","動物園の人気者といえば？","遊園地の乗り物といえば？","家電といえば？","文房具といえば？","日本料理といえば？","雨の日に使うものといえば？","お祭りの屋台といえば？","スポーツといえば？","楽器といえば？","都道府県といえば？","世界の国といえば？","宇宙にあるものといえば？","怖いものといえば？","かわいいものといえば？","高いものといえば？","冷たいものといえば？","無人島に持っていくものといえば？","休日にすることといえば？","誕生日プレゼントといえば？","旅行先で買うものといえば？","カラオケで最初に歌う曲の系統は？","飲み会の締めといえば？","眠れない夜にすることといえば？"];
const wolfPairs = [["うどん","そば"],["犬","猫"],["海","プール"],["映画館","動画配信"],["焼肉","しゃぶしゃぶ"],["東京","大阪"],["コーヒー","紅茶"],["花火","イルミネーション"],["カレー","シチュー"],["ラーメン","つけ麺"],["寿司","刺身"],["餃子","春巻き"],["アイス","かき氷"],["プリン","ゼリー"],["唐揚げ","とんかつ"],["りんご","梨"],["野球","サッカー"],["テニス","バドミントン"],["スキー","スノーボード"],["キャンプ","バーベキュー"],["遊園地","動物園"],["水族館","博物館"],["温泉","サウナ"],["旅行","引っ越し"],["電車","バス"],["自転車","バイク"],["学校","会社"],["先生","上司"],["漫画","小説"],["映画","ドラマ"],["歌手","俳優"],["ピアノ","ギター"],["夏","冬"],["朝","夜"],["雨","雪"],["太陽","月"],["電話","メッセージ"],["写真","動画"],["財布","スマホ"],["誕生日","クリスマス"]];
const impressionPrompts = ["一番早起きが得意そうな人","無人島でも生き残りそうな人","実は一番ロマンチストそうな人","宝くじを当てそうな人","秘密を守るのが上手そうな人","旅行の計画が上手そうな人","突然有名になりそうな人","一番やさしいと思う人","一番料理が上手そうな人","一番部屋がきれいそうな人","一番方向感覚がありそうな人","一番長生きしそうな人","一番運が強そうな人","一番動物に好かれそうな人","一番大食いそうな人","一番歌が上手そうな人","一番スポーツが得意そうな人","一番ゲームが強そうな人","一番字がきれいそうな人","一番記憶力がよさそうな人","一番相談しやすい人","一番プレゼント選びが上手そうな人","一番サプライズ好きそうな人","一番海外で暮らせそうな人","一番社長になりそうな人","一番先生に向いていそうな人","一番芸能人と友達になりそうな人","一番宇宙旅行に行きそうな人","一番怖い話が苦手そうな人","一番涙もろそうな人","一番笑い上戸そうな人","一番負けず嫌いそうな人","一番マイペースそうな人","一番流行に詳しそうな人","一番SNSを見ていそうな人","一番寝起きが悪そうな人","一番忘れ物が多そうな人","一番待ち合わせに早く来そうな人","一番秘密の趣味がありそうな人","一番今日を楽しんでいそうな人"];
const talkTopics = ["最近ハマっていること","行ってみたい旅行先","好きな食べ物","子どもの頃の思い出","理想の休日","最近笑ったこと","好きな季節","おすすめしたい作品","最近買ってよかった物","行きつけのお店","得意料理","苦手な食べ物","好きなスポーツ","学生時代の部活","好きな音楽","カラオケの定番","いつか挑戦したいこと","欲しい能力","宝くじが当たったら","無人島に持っていく物","朝起きて最初にすること","寝る前にすること","最近驚いたこと","好きな動物","好きな天気","住んでみたい場所","もう一度行きたい場所","子どもの頃の夢","理想の家","休日の過ごし方","つい集めてしまう物","やめられない習慣","得意な家事","苦手な家事","最近覚えたこと","人にすすめたいアプリ","お気に入りの写真","今年やりたいこと","一番好きな行事","今日一番楽しかったこと"];
const katakanaWords = ["スマートフォン","コンビニ","エレベーター","アイスクリーム","サブスクリプション","リモコン","ジェットコースター","ハンバーガー","パソコン","イヤホン","インターネット","カラオケ","エアコン","テレビ","ラジオ","カメラ","プリンター","キーボード","マウス","タブレット","アプリ","メール","パスワード","オンライン","ゲーム","スポーツ","サッカー","バスケットボール","テニス","ゴルフ","キャンプ","バーベキュー","ホテル","レストラン","カフェ","スーパー","デパート","タクシー","バス","トンネル","エスカレーター","マンション","ベランダ","キッチン","ソファ","テーブル","カーテン","ベッド","シャワー","トイレ","シャンプー","タオル","ドライヤー","スニーカー","サンダル","ジャケット","ネクタイ","アクセサリー","プレゼント","ケーキ","チョコレート","コーヒー","ジュース","サラダ","スープ","ステーキ","ピザ","パスタ","オムライス","フライパン"];
const rankingQuestions = [
  {q:"日本で面積が大きい都道府県 TOP3", answers:["北海道","岩手県","福島県"]},
  {q:"世界で人口が多い国 TOP3（目安）", answers:["インド","中国","アメリカ"]},
  {q:"五十音順で早い動物 TOP3", answers:["アザラシ","アシカ","アヒル"]},
  {q:"太陽系で太陽に近い惑星 TOP3", answers:["水星","金星","地球"]},
  {q:"日本の高い山 TOP3", answers:["富士山","北岳","奥穂高岳・間ノ岳"]},
  {q:"日本で長い川 TOP3", answers:["信濃川","利根川","石狩川"]},
  {q:"世界で面積が大きい国 TOP3", answers:["ロシア","カナダ","中国"]},
  {q:"太陽系で大きい惑星 TOP3", answers:["木星","土星","天王星"]},
  {q:"五十音順で早い都道府県 TOP3", answers:["愛知県","青森県","秋田県"]},
  {q:"標高が高い日本の湖 TOP3", answers:["中禅寺湖","榛名湖","山中湖"]},
  {q:"日本で面積が大きい湖 TOP3", answers:["琵琶湖","霞ヶ浦","サロマ湖"]},
  {q:"世界で面積が大きい大陸 TOP3", answers:["アジア","アフリカ","北アメリカ"]},
  {q:"数字が小さい都道府県コード TOP3", answers:["北海道","青森県","岩手県"]},
  {q:"太陽から遠い惑星 TOP3", answers:["海王星","天王星","土星"]},
  {q:"日本三名園を北から順に", answers:["兼六園","偕楽園","後楽園"]},
];
const drawingPrompts = ["猫","花火","自転車","富士山","ラーメン","宇宙人","誕生日ケーキ","ペンギン","ロボット","温泉","ドラゴン","おにぎり","犬","うさぎ","ライオン","キリン","象","パンダ","カエル","魚","タコ","恐竜","おばけ","雪だるま","サンタクロース","忍者","侍","魔法使い","王様","アイドル","サッカー選手","先生","赤ちゃん","家","学校","遊園地","無人島","宇宙船","タイムマシン","ジェットコースター","新幹線","消防車","飛行機","船","傘","時計","カメラ","スマホ","テレビ","冷蔵庫","扇風機","ギター","ピアノ","太鼓","バナナ","りんご","カレー","寿司","ハンバーガー","プリン","クリスマスツリー","運動会","キャンプ","海水浴","プロポーズ","寝坊","大掃除","世界一強そうな人","100年後の自分"];
const quickThreePrompts = ["赤いもの","丸いもの","空を飛ぶもの","冷たいもの","熱いもの","甘いもの","コンビニにあるもの","学校にあるもの","台所にあるもの","旅行に持っていくもの","動物園にいる動物","海にいる生き物","スポーツ","楽器","乗り物","職業","都道府県","国の名前","野菜","果物","麺料理","おにぎりの具","家電","文房具","体の部位","夏にすること","冬にすること","雨の日に使うもの","誕生日にもらいたいもの","無人島に持っていくもの","カタカナ4文字の言葉","『あ』から始まる言葉","駅にあるもの","公園にあるもの","お祭りにあるもの","眠いときにすること","休日にすること","怖いもの","かわいいもの","音が出るもの"];
const hintQuestions = [
  {answer:"ペンギン",hints:["鳥の仲間です","寒い場所のイメージがあります","空は飛べませんが泳ぐのが得意です"]},
  {answer:"富士山",hints:["日本にあります","世界文化遺産です","日本で一番高い山です"]},
  {answer:"カレー",hints:["香りが強い料理です","辛さを選べます","ごはんにかけて食べます"]},
  {answer:"スマートフォン",hints:["毎日使う人が多いです","写真も撮れます","電話やアプリが使えます"]},
  {answer:"冷蔵庫",hints:["家電です","台所にあります","食べ物を冷やします"]},
  {answer:"虹",hints:["自然現象です","雨上がりに見えることがあります","七色の橋のように見えます"]},
  {answer:"パンダ",hints:["動物です","竹を食べます","白と黒の模様です"]},
  {answer:"新幹線",hints:["乗り物です","駅に止まります","とても速い鉄道です"]},
  {answer:"たこ焼き",hints:["丸い食べ物です","中に海の生き物が入ります","大阪名物として有名です"]},
  {answer:"ピアノ",hints:["楽器です","両手を使います","白と黒の鍵盤があります"]},
  {answer:"消防車",hints:["赤い乗り物です","サイレンを鳴らします","火事の現場へ向かいます"]},
  {answer:"ひまわり",hints:["植物です","夏に咲きます","太陽のような黄色い花です"]},
  {answer:"月",hints:["空に見えます","形が日々変わって見えます","夜を照らす天体です"]},
  {answer:"雪だるま",hints:["冬に作ります","冷たいです","雪を丸めて重ねます"]},
  {answer:"ドラえもん",hints:["漫画のキャラクターです","未来から来ました","青いネコ型ロボットです"]},
  {answer:"サッカー",hints:["スポーツです","11人で行います","主に足でボールを扱います"]},
  {answer:"図書館",hints:["静かにする場所です","無料で利用できることが多いです","本を借りられます"]},
  {answer:"エレベーター",hints:["建物にあります","ボタンを押して使います","上下の階へ移動します"]},
  {answer:"かき氷",hints:["夏に人気です","とても冷たいです","削った氷にシロップをかけます"]},
  {answer:"カメレオン",hints:["動物です","長い舌があります","周囲に合わせて体の色を変えます"]},
];
const commonPointPairs = [["犬","警察官"],["海","空"],["カレー","ラーメン"],["スマホ","財布"],["学校","会社"],["電車","映画館"],["猫","赤ちゃん"],["雨","涙"],["夏","祭り"],["冬","冷蔵庫"],["本","旅行"],["ゲーム","スポーツ"],["コーヒー","夜"],["時計","先生"],["山","人生"],["写真","記憶"],["音楽","料理"],["コンビニ","遊園地"],["靴","車"],["誕生日","お正月"],["宇宙","海"],["傘","きのこ"],["ペン","剣"],["テレビ","窓"],["おにぎり","地球"],["花火","桜"],["冷蔵庫","図書館"],["カラオケ","お風呂"],["信号","トマト"],["電池","人間"]];

function rand(max: number) { return Math.floor(Math.random() * max); }
function rollDie() { return rand(6) + 1; }

function Dice({ value, rolling = false, gold = false }: { value: number; rolling?: boolean; gold?: boolean }) {
  return <span className={`die ${rolling ? "rolling" : ""} ${gold ? "gold-die" : ""}`} aria-label={`サイコロの${value}`}>{diceGlyphs[value - 1]}</span>;
}

function judgeClassicChinchiro(dice: number[], reverse: boolean) {
  const values = reverse ? dice.map(v => 7 - v) : dice;
  const sorted = [...values].sort((a,b) => a-b);
  if (sorted[0] === sorted[2]) return { label: sorted[0] === 1 ? "ピンゾロ" : `${sorted[0]}のゾロ目`, tone: "win" };
  if (sorted.join("") === "456") return { label: "シゴロ", tone: "win" };
  if (sorted.join("") === "123") return { label: "ヒフミ", tone: "lose" };
  for (const v of [1,2,3,4,5,6]) {
    if (values.filter(x => x === v).length === 2) {
      const point = values.find(x => x !== v) ?? v;
      return { label: `${point}の目`, tone: point >= 4 ? "win" : point <= 2 ? "lose" : "draw" };
    }
  }
  return { label: "目なし", tone: "draw" };
}

function GameHeader({ title, subtitle, icon, onBack }: { title: string; subtitle: string; icon: string; onBack: () => void }) {
  return <header className="game-header">
    <button className="back" onClick={onBack} aria-label="ゲーム一覧へ戻る">‹</button>
    <div><p>{subtitle}</p><h1>{title}</h1></div>
    <span className="mini-logo" aria-hidden="true">{icon}</span>
  </header>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const goLobby = () => setScreen("lobby");

  return <main className="app-shell">
    {screen === "lobby" && <Lobby open={setScreen} />}
    {screen === "chinchiro" && <FourDiceChinchiro back={goLobby} />}
    {screen === "classicChinchiro" && <ClassicChinchiro back={goLobby} />}
    {screen === "dosukoi" && <Dosukoi back={goLobby} />}
    {screen === "ngword" && <NgWord back={goLobby} />}
    {screen === "majority" && <Majority back={goLobby} />}
    {screen === "bomb" && <BombShiritori back={goLobby} />}
    {screen === "gesture" && <Gesture back={goLobby} />}
    {screen === "fiveSeconds" && <FiveSeconds back={goLobby} />}
    {screen === "matchAll" && <MatchAll back={goLobby} />}
    {screen === "wordWolf" && <WordWolf back={goLobby} />}
    {screen === "firstImpression" && <FirstImpression back={goLobby} />}
    {screen === "forbiddenKana" && <ForbiddenKana back={goLobby} />}
    {screen === "noKatakana" && <NoKatakana back={goLobby} />}
    {screen === "rankingGuess" && <RankingGuess back={goLobby} />}
    {screen === "drawingSync" && <DrawingSync back={goLobby} />}
    {screen === "threeQuick" && <ThreeQuick back={goLobby} />}
    {screen === "threeHints" && <ThreeHints back={goLobby} />}
    {screen === "commonPoint" && <CommonPoint back={goLobby} />}
  </main>;
}

function Lobby({ open }: { open: (screen: Screen) => void }) {
  const games: {id: Screen; icon: string; name: string; en: string; tag: string; color: string; badge?: string}[] = [
    {id:"chinchiro",icon:"🎲",name:"フォーダイスちんちろ",en:"FOUR DICE",tag:"完成版 v1.0.7",color:"coral",badge:"定番"},
    {id:"classicChinchiro",icon:"⚂",name:"ちんちろ",en:"CLASSIC CHINCHIRO",tag:"3個のサイコロで勝負",color:"mint",badge:"定番"},
    {id:"dosukoi",icon:"力",name:"どすこい",en:"DOSUKOI",tag:"言葉・ひらめき",color:"blue",badge:"定番"},
    {id:"ngword",icon:"㊙",name:"NGワード",en:"NG WORD",tag:"会話が盛り上がる",color:"pink",badge:"NEW"},
    {id:"majority",icon:"A/B",name:"究極の二択",en:"MAJORITY",tag:"みんなの本音",color:"yellow",badge:"NEW"},
    {id:"bomb",icon:"💣",name:"爆弾しりとり",en:"TIME BOMB",tag:"焦るほど面白い",color:"mint",badge:"NEW"},
    {id:"gesture",icon:"🙌",name:"ジェスチャー",en:"GESTURE",tag:"声なしで伝えよう",color:"purple",badge:"NEW"},
    {id:"fiveSeconds",icon:"⏱",name:"5秒ぴったり",en:"JUST FIVE",tag:"体内時計で止めよう",color:"coral",badge:"NEW"},
    {id:"matchAll",icon:"◎",name:"全員一致",en:"MATCH ALL",tag:"答えをそろえよう",color:"yellow",badge:"NEW"},
    {id:"wordWolf",icon:"🐺",name:"ワードウルフ",en:"WORD WOLF",tag:"少数派を見つけよう",color:"blue",badge:"NEW"},
    {id:"firstImpression",icon:"👑",name:"第一印象",en:"FIRST IMPRESSION",tag:"せーので指さし",color:"pink",badge:"NEW"},
    {id:"forbiddenKana",icon:"禁",name:"禁止文字トーク",en:"FORBIDDEN LETTER",tag:"その文字を言ったら負け",color:"coral",badge:"NEW"},
    {id:"noKatakana",icon:"ア",name:"カタカナ禁止",en:"NO KATAKANA",tag:"日本語だけで説明",color:"blue",badge:"NEW"},
    {id:"rankingGuess",icon:"🥇",name:"ランキング当て",en:"TOP THREE",tag:"TOP3を順番どおりに",color:"yellow",badge:"NEW"},
    {id:"drawingSync",icon:"🎨",name:"以心伝心お絵描き",en:"DRAW TOGETHER",tag:"同じ絵を描けるかな",color:"purple",badge:"NEW"},
    {id:"threeQuick",icon:"3",name:"3秒で3つ",en:"THREE QUICK",tag:"焦らず3つ答えよう",color:"coral",badge:"NEW"},
    {id:"threeHints",icon:"💡",name:"3ヒントクイズ",en:"THREE HINTS",tag:"少ないヒントで当てよう",color:"yellow",badge:"NEW"},
    {id:"commonPoint",icon:"🔗",name:"共通点さがし",en:"COMMON POINT",tag:"意外なつながりを発見",color:"mint",badge:"NEW"},
  ];

  return <div className="lobby">
    <header className="brand-header">
      <span className="brand-mark">宴</span>
      <div><p>ONE PHONE, EVERYONE PLAYS!</p><h1>宴会ゲーム<span>BOX</span></h1></div>
      <span className="party-dot" aria-hidden="true">✦</span>
    </header>

    <section className="welcome-card">
      <div>
        <span className="eyebrow">LET&apos;S PLAY TOGETHER</span>
        <h2>ゲームを選んで、<br />すぐに遊ぼう！</h2>
        <p>ひとつのスマホを囲めば準備OK。</p>
      </div>
      <div className="hero-icons" aria-hidden="true"><span>🎲</span><span>🎉</span><span>💬</span></div>
    </section>

    <div className="section-title"><div><b>ALL GAMES</b><h2>遊べるゲーム</h2></div><span>全18種類</span></div>
    <section className="game-grid">
      {games.map(game => <button className={"game-card " + game.color} key={game.id} onClick={() => open(game.id)}>
        <span className="card-badge">{game.badge}</span>
        <span className="game-icon">{game.icon}</span>
        <span className="game-copy"><small>{game.en}</small><strong>{game.name}</strong><em>{game.tag}</em></span>
        <span className="arrow">›</span>
      </button>)}
    </section>
    <footer><span>ルールは各ゲーム内で確認できます</span><b>v1.4.0</b></footer>
  </div>;
}

function FourDiceChinchiro({ back }: { back: () => void }) {
  return <div className="game-page iframe-page">
    <GameHeader title="フォーダイスちんちろ" subtitle="FOUR DICE CHINCHIRO" icon="🎲" onBack={back} />
    <div className="source-note"><b>完成版 v1.0.7</b><span>別Workで制作したゲームをそのまま収録</span></div>
    <iframe className="chinchiro-frame" src="games/four-dice-chinchiro/index.html" title="フォーダイスちんちろ v1.0.7" />
  </div>;
}

function ClassicChinchiro({ back }: { back: () => void }) {
  const [dice, setDice] = useState([1,2,3]);
  const [rolling, setRolling] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [gold, setGold] = useState(false);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{label:string;tone:string}|null>(null);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    window.setTimeout(() => {
      const isGold = rand(36) === 0;
      const next = isGold ? [6,6,6] : [rollDie(), rollDie(), rollDie()];
      setDice(next);
      setGold(isGold);
      setResult(judgeClassicChinchiro(next, reverse));
      setRound(r => r + 1);
      setRolling(false);
    }, 650);
  };

  return <div className="game-page classic-chinchiro-page">
    <GameHeader title="ちんちろ" subtitle="CLASSIC CHINCHIRO" icon="⚂" onBack={back} />
    <section className="classic-rule-strip"><span>ピンゾロ 5倍</span><span>ゾロ目 3倍</span><span>シゴロ 2倍</span><span>ヒフミ 2倍払い</span></section>
    <section className="classic-table-card">
      <div className="classic-table-top"><span>勝負 {round + 1}</span><label>裏目モード <input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} /></label></div>
      <div className="classic-dice-cup"><div>{dice.map((d,i) => <Dice key={i} value={d} rolling={rolling} gold={gold} />)}</div></div>
      <div className={`classic-result ${result?.tone ?? ""}`}>{result ? (reverse ? `裏目 → ${result.label}` : result.label) : "サイコロを振って勝負！"}</div>
      <p className="classic-note">同じ目が2個なら残り1個が「○の目」。ゴールドダイスは1/36です。</p>
    </section>
    <button className="primary classic-roll-button" onClick={roll} disabled={rolling}>{rolling ? "勝負中…" : "サイコロを振る"}</button>
  </div>;
}

function Dosukoi({ back }: { back: () => void }) {
  const [min, setMin] = useState(4);
  const [max, setMax] = useState(8);
  const [voiced, setVoiced] = useState(false);
  const [sound, setSound] = useState(true);
  const [prompt, setPrompt] = useState({letter:"た", count:5});
  const [showExamples, setShowExamples] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [ready, setReady] = useState(false);
  const shuffleTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("dosukoi-settings");
    const timer = window.setTimeout(() => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          const savedMin = Math.max(1, Math.min(20, Number(saved.min) || 4));
          const savedMax = Math.max(savedMin, Math.min(20, Number(saved.max) || 8));
          setMin(savedMin);
          setMax(savedMax);
          setVoiced(Boolean(saved.voiced));
          setSound(saved.sound !== false);
        } catch {}
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("dosukoi-settings", JSON.stringify({min,max,voiced,sound}));
  }, [min,max,voiced,sound,ready]);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const requestLock = async () => {
      try {
        const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wakeLock && document.visibilityState === "visible") lock = await wakeLock.request("screen");
      } catch {}
    };
    const onVisibility = () => { if (document.visibilityState === "visible" && !lock) void requestLock(); };
    void requestLock();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (shuffleTimer.current) window.clearInterval(shuffleTimer.current);
      if (finishTimer.current) window.clearTimeout(finishTimer.current);
      if (lock) void lock.release();
    };
  }, []);

  const examples = useMemo(() => findAnswerWords(prompt.letter, prompt.count), [prompt]);
  const randomPrompt = () => {
    const letters = voiced ? [...kana, ...voicedKana] : kana;
    return { letter: letters[rand(letters.length)], count: min + rand(max - min + 1) };
  };
  const playCue = () => {
    if (!sound) return;
    try {
      const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const audio = new AudioCtor();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(220, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(520, audio.currentTime + .16);
      gain.gain.setValueAtTime(.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.18, audio.currentTime + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .24);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + .25);
      oscillator.addEventListener("ended", () => void audio.close());
    } catch {}
  };
  const next = () => {
    if (rolling) return;
    setRolling(true);
    setShowExamples(false);
    shuffleTimer.current = window.setInterval(() => setPrompt(randomPrompt()), 70);
    finishTimer.current = window.setTimeout(() => {
      if (shuffleTimer.current) window.clearInterval(shuffleTimer.current);
      setPrompt(randomPrompt());
      setRolling(false);
      playCue();
    }, 1000);
  };
  const setMinimum = (value: number) => setMin(Math.max(1, Math.min(value, max, 20)));
  const setMaximum = (value: number) => setMax(Math.max(min, Math.min(value, 20)));
  const reset = () => { setMin(4); setMax(8); setVoiced(false); setSound(true); };

  return <div className="game-page dosukoi-page">
    <GameHeader title="どすこい" subtitle="DOSUKOI" icon="力" onBack={back} />
    <section className="dosukoi-settings" aria-label="お題設定">
      <div className="count-setting"><span>最小</span><button onClick={() => setMinimum(min - 1)} disabled={min <= 1}>−</button><strong>{min}</strong><button onClick={() => setMinimum(min + 1)} disabled={min >= max}>＋</button></div>
      <div className="count-setting"><span>最大</span><button onClick={() => setMaximum(max - 1)} disabled={max <= min}>−</button><strong>{max}</strong><button onClick={() => setMaximum(max + 1)} disabled={max >= 20}>＋</button></div>
      <div className="dosukoi-toggles">
        <label><input type="checkbox" checked={voiced} onChange={e => setVoiced(e.target.checked)} />濁音・半濁音</label>
        <label><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} />効果音</label>
      </div>
      <div className="settings-actions"><button onClick={reset}>設定をリセット</button><button onClick={() => setShowHelp(true)}>遊び方</button></div>
    </section>
    <section className="dosukoi-stage">
      <span className="sumo-label">{rolling ? "抽選中" : "お題"}</span>
      <div className={"prompt-pair " + (rolling ? "prompt-rolling" : "")}><div><strong>{prompt.letter}</strong><small>から始まる</small></div><b>×</b><div><strong>{prompt.count}</strong><small>文字</small></div></div>
      <p><b>{prompt.letter}</b>から始まる・<b>{prompt.count}</b>文字</p>
    </section>
    <button className="primary dosukoi-next" onClick={next} disabled={rolling}>{rolling ? "はっけよい…" : "どすこい！"}</button>
    <button className="secondary" onClick={() => setShowExamples(v => !v)} disabled={rolling}>{showExamples ? "答えの例を隠す" : "答えの例を見る（最大5個）"}</button>
    {showExamples && <section className="examples"><p>答えの例</p>{examples.length ? examples.map(word => <span key={word.surface + "-" + word.reading}><b>{word.surface}</b>{(/[一-龯々]/.test(word.surface) || word.proper) && <small>{word.reading}</small>}</span>) : <span className="no-example">登録された候補はありません</span>}<small className="judge-note">正解判定はプレイヤー同士で決めてください</small></section>}
    {showHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="dosukoi-help" onClick={e => e.stopPropagation()}><h2 id="dosukoi-help">遊び方</h2><ol><li>文字数の範囲を決めます。</li><li>「どすこい！」で、文字と文字数を抽選します。</li><li>条件に合う言葉を、画面の外で早い者勝ちで答えます。</li></ol><p>小さい「ゃ・ゅ・ょ・っ」と「ー」も、それぞれ1文字です。「ん」と「を」はお題に出ません。</p><button className="primary" onClick={() => setShowHelp(false)}>わかった</button></section></div>}
  </div>;
}

function NgWord({ back }: { back: () => void }) {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["プレイヤー1","プレイヤー2","プレイヤー3","プレイヤー4","プレイヤー5","プレイヤー6","プレイヤー7","プレイヤー8"]);
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"setup"|"pass"|"play"|"result">("setup");
  const [revealed, setRevealed] = useState(false);

  const start = () => {
    const shuffled = [...ngWords].sort(() => Math.random() - .5);
    setWords(shuffled.slice(0,count));
    setIndex(0);
    setRevealed(false);
    setPhase("pass");
  };
  const next = () => {
    if (index + 1 >= count) { setPhase("play"); return; }
    setIndex(i => i + 1);
    setRevealed(false);
  };

  return <div className="game-page">
    <GameHeader title="NGワード" subtitle="NG WORD" icon="㊙" onBack={back} />
    {phase === "setup" && <section className="play-card setup-card">
      <p className="kicker">会話中に言ったらアウト！</p><h2>参加者を設定</h2>
      <label className="select-row">人数<select value={count} onChange={e => setCount(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}</select></label>
      <div className="name-list">{names.slice(0,count).map((name,i) => <input key={i} value={name} aria-label={(i+1) + "人目の名前"} onChange={e => setNames(current => current.map((v,j) => j === i ? e.target.value : v))} />)}</div>
      <button className="primary" onClick={start}>NGワードを配る</button>
      <p className="howto">本人以外がその人のNGワードを確認します。全員分を配ったら自由に会話スタート！</p>
    </section>}
    {phase === "pass" && <section className="play-card secret-card">
      <span className="turn-pill">{index + 1} / {count}</span>
      <p><b>{names[index]}</b>さんは<br />画面を見ないでください</p>
      {!revealed ? <button className="reveal-button" onClick={() => setRevealed(true)}>ほかの人が<br />NGワードを見る</button> : <>
        <small>{names[index]}さんのNGワード</small>
        <strong className="secret-word">{words[index]}</strong>
        <button className="primary" onClick={next}>{index + 1 === count ? "配り終わった！" : "隠して次の人へ"}</button>
      </>}
    </section>}
    {phase === "play" && <section className="play-card center-card"><span className="big-emoji">🗣️</span><h2>会話スタート！</h2><p>相手にNGワードを言わせよう。<br />自分のワードを言ったらアウト！</p><button className="primary" onClick={() => setPhase("result")}>答え合わせ</button></section>}
    {phase === "result" && <section className="play-card"><p className="kicker">ANSWER</p><h2>NGワード一覧</h2><div className="answer-list">{words.map((word,i) => <div key={word}><span>{names[i]}</span><b>{word}</b></div>)}</div><button className="primary" onClick={start}>同じメンバーでもう一度</button><button className="secondary" onClick={() => setPhase("setup")}>設定に戻る</button></section>}
  </div>;
}

function Majority({ back }: { back: () => void }) {
  const [players, setPlayers] = useState(4);
  const [question, setQuestion] = useState(() => majorityQuestions[rand(majorityQuestions.length)]);
  const [votes, setVotes] = useState({a:0,b:0});
  const [revealed, setRevealed] = useState(false);
  const total = votes.a + votes.b;
  const vote = (side: "a"|"b") => {
    if (total >= players || revealed) return;
    const next = {...votes, [side]: votes[side] + 1};
    setVotes(next);
    if (next.a + next.b >= players) setRevealed(true);
  };
  const next = () => {
    let candidate = majorityQuestions[rand(majorityQuestions.length)];
    if (majorityQuestions.length > 1) while (candidate.q === question.q) candidate = majorityQuestions[rand(majorityQuestions.length)];
    setQuestion(candidate); setVotes({a:0,b:0}); setRevealed(false);
  };

  return <div className="game-page">
    <GameHeader title="究極の二択" subtitle="MAJORITY GAME" icon="A/B" onBack={back} />
    <section className="play-card majority-card">
      <div className="majority-top"><label>参加人数 <select value={players} onChange={e => {setPlayers(Number(e.target.value));setVotes({a:0,b:0});setRevealed(false);}}>{[2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label><span>{total} / {players} 投票</span></div>
      <p className="kicker">究極の質問</p><h2>{question.q}</h2>
      <div className="choice-grid">
        <button className="choice-a" onClick={() => vote("a")} disabled={revealed}><small>A</small><strong>{question.a}</strong>{revealed && <b>{votes.a}票</b>}</button>
        <button className="choice-b" onClick={() => vote("b")} disabled={revealed}><small>B</small><strong>{question.b}</strong>{revealed && <b>{votes.b}票</b>}</button>
      </div>
      {!revealed ? <p className="howto">スマホを順番に回して、どちらかをタップ。全員が投票すると結果発表！</p> : <>
        <div className="majority-result">{votes.a === votes.b ? "ぴったり半分！" : votes.a > votes.b ? "多数派は「" + question.a + "」" : "多数派は「" + question.b + "」"}</div>
        <button className="primary" onClick={next}>次のお題</button>
      </>}
    </section>
  </div>;
}

function BombShiritori({ back }: { back: () => void }) {
  const makeSeconds = () => 20 + rand(26);
  const [remaining, setRemaining] = useState(makeSeconds);
  const [running, setRunning] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [turn, setTurn] = useState(1);
  const [category, setCategory] = useState(() => bombCategories[rand(bombCategories.length)]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setExploded(true);
          try { navigator.vibrate?.([150,80,300]); } catch {}
          return 0;
        }
        return value - 1;
      });
    },1000);
    return () => window.clearInterval(timer);
  },[running]);
  const reset = () => {
    setRemaining(makeSeconds()); setRunning(false); setExploded(false); setTurn(1);
    setCategory(bombCategories[rand(bombCategories.length)]);
  };

  return <div className="game-page">
    <GameHeader title="爆弾しりとり" subtitle="TIME BOMB" icon="💣" onBack={back} />
    <section className={"play-card bomb-card " + (running ? "is-ticking " : "") + (exploded ? "is-exploded" : "")}>
      <span className="turn-pill">第 {turn} ターン</span>
      <p className="kicker">お題：{category}</p>
      <div className="bomb-visual"><span>{exploded ? "💥" : "💣"}</span><b>{remaining}</b><small>SEC</small></div>
      <h2>{exploded ? "ドカーン！" : running ? "しりとり中！" : "爆弾をスタート"}</h2>
      {!exploded && <button className="primary" onClick={() => setRunning(v => !v)}>{running ? "一時停止" : "スタート！"}</button>}
      {running && <button className="next-person" onClick={() => setTurn(t => t + 1)}>答えた！ 次の人へ →</button>}
      {exploded && <button className="primary" onClick={reset}>もう一度</button>}
      {!running && !exploded && <button className="secondary" onClick={reset}>お題と時間を変える</button>}
      <p className="howto">答えたら次の人にスマホを渡します。爆発したときに持っていた人が負け！</p>
    </section>
  </div>;
}

function Gesture({ back }: { back: () => void }) {
  const [time, setTime] = useState(60);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [word, setWord] = useState(() => gestureWords[rand(gestureWords.length)]);
  const [finished, setFinished] = useState(false);
  const nextWord = () => {
    let next = gestureWords[rand(gestureWords.length)];
    if (gestureWords.length > 1) while (next === word) next = gestureWords[rand(gestureWords.length)];
    setWord(next);
  };
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTime(value => {
      if (value <= 1) { window.clearInterval(timer); setRunning(false); setFinished(true); return 0; }
      return value - 1;
    }),1000);
    return () => window.clearInterval(timer);
  },[running]);
  const start = () => { setTime(60); setScore(0); setFinished(false); nextWord(); setRunning(true); };

  return <div className="game-page">
    <GameHeader title="ジェスチャー" subtitle="GESTURE GAME" icon="🙌" onBack={back} />
    <section className="play-card gesture-card">
      <div className="score-row"><span>残り <b>{time}</b> 秒</span><span>正解 <b>{score}</b> 問</span></div>
      {!running && !finished && <><span className="big-emoji">🙌</span><h2>声を出さずに伝えよう！</h2><p>演じる人だけがお題を見て、ジェスチャーで仲間に伝えます。</p><button className="primary" onClick={start}>60秒スタート</button></>}
      {running && <><p className="kicker">お題</p><strong className="gesture-word">{word}</strong><p className="gesture-note">声・文字・口パクは禁止！</p><div className="gesture-actions"><button onClick={nextWord}>スキップ</button><button onClick={() => {setScore(s => s + 1);nextWord();}}>正解！</button></div></>}
      {finished && <><span className="big-emoji">🎊</span><h2>タイムアップ！</h2><div className="final-score"><b>{score}</b><span>問正解</span></div><button className="primary" onClick={start}>もう一度</button></>}
    </section>
  </div>;
}

function FiveSeconds({ back }: { back: () => void }) {
  const [phase,setPhase] = useState<"ready"|"running"|"result">("ready");
  const [started,setStarted] = useState(0);
  const [elapsed,setElapsed] = useState(0);
  const start = () => { setStarted(performance.now()); setElapsed(0); setPhase("running"); };
  const stop = () => { setElapsed((performance.now()-started)/1000); setPhase("result"); };
  return <div className="game-page"><GameHeader title="5秒ぴったり" subtitle="JUST FIVE" icon="⏱" onBack={back}/><section className="play-card center-card">
    <span className="big-emoji">⏱️</span><h2>{phase==="ready"?"5秒を感覚で当てよう！":phase==="running"?"5秒だと思ったら止めて！":`${elapsed.toFixed(2)} 秒`}</h2>
    {phase==="result" && <div className="timing-result">誤差 <b>{Math.abs(elapsed-5).toFixed(2)}</b> 秒</div>}
    <button className="primary" onClick={phase==="running"?stop:start}>{phase==="running"?"ストップ！":phase==="result"?"もう一度":"スタート"}</button>
    <p className="howto">スタート後は時間を表示しません。全員で挑戦して、5秒に一番近い人が勝ち！</p>
  </section></div>;
}

function MatchAll({ back }: { back: () => void }) {
  const [prompt,setPrompt] = useState(()=>matchPrompts[rand(matchPrompts.length)]);
  const [show,setShow] = useState(false);
  const next=()=>{let n=matchPrompts[rand(matchPrompts.length)]; while(n===prompt)n=matchPrompts[rand(matchPrompts.length)];setPrompt(n);setShow(false)};
  return <div className="game-page"><GameHeader title="全員一致" subtitle="MATCH ALL" icon="◎" onBack={back}/><section className="play-card center-card">
    <p className="kicker">みんなの答えをそろえよう</p><strong className="party-prompt">{show?prompt:"お題はまだ秘密"}</strong>
    {!show?<button className="primary" onClick={()=>setShow(true)}>お題を表示</button>:<button className="primary" onClick={next}>次のお題</button>}
    <p className="howto">お題を見たら相談せず、せーので答えます。全員同じ答えなら成功！</p>
  </section></div>;
}

function WordWolf({ back }: { back: () => void }) {
  const [count,setCount]=useState(4); const [phase,setPhase]=useState<"setup"|"pass"|"talk"|"answer">("setup");
  const [index,setIndex]=useState(0); const [revealed,setRevealed]=useState(false); const [words,setWords]=useState<string[]>([]); const [pair,setPair]=useState<string[]>([]);
  const start=()=>{const p=wolfPairs[rand(wolfPairs.length)];const wolf=rand(count);setPair(p);setWords(Array.from({length:count},(_,i)=>i===wolf?p[1]:p[0]));setIndex(0);setRevealed(false);setPhase("pass")};
  const next=()=>{if(index+1===count){setPhase("talk");return}setIndex(i=>i+1);setRevealed(false)};
  return <div className="game-page"><GameHeader title="ワードウルフ" subtitle="WORD WOLF" icon="🐺" onBack={back}/><section className="play-card center-card">
    {phase==="setup"&&<><span className="big-emoji">🐺</span><h2>少数派を見つけよう</h2><label className="select-row">参加人数<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></label><button className="primary" onClick={start}>ゲーム開始</button></>}
    {phase==="pass"&&<><span className="turn-pill">{index+1} / {count}</span><h2>{index+1}人目だけ見てください</h2>{revealed?<><strong className="party-prompt">{words[index]}</strong><button className="primary" onClick={next}>隠して次の人へ</button></>:<button className="reveal-button" onClick={()=>setRevealed(true)}>自分のワードを見る</button>}</>}
    {phase==="talk"&&<><span className="big-emoji">🗣️</span><h2>話し合いスタート！</h2><p>自分のワードを直接言わずに会話し、少数派を予想します。</p><button className="primary" onClick={()=>setPhase("answer")}>答え合わせ</button></>}
    {phase==="answer"&&<><p className="kicker">ANSWER</p><h2>多数派「{pair[0]}」<br/>少数派「{pair[1]}」</h2><div className="answer-list">{words.map((w,i)=><div key={i}><span>{i+1}人目</span><b>{w}</b></div>)}</div><button className="primary" onClick={start}>もう一度</button></>}
  </section></div>;
}

function FirstImpression({ back }: { back: () => void }) {
  const [prompt,setPrompt]=useState(()=>impressionPrompts[rand(impressionPrompts.length)]); const [shown,setShown]=useState(false);
  const next=()=>{let n=impressionPrompts[rand(impressionPrompts.length)];while(n===prompt)n=impressionPrompts[rand(impressionPrompts.length)];setPrompt(n);setShown(false)};
  return <div className="game-page"><GameHeader title="第一印象" subtitle="FIRST IMPRESSION" icon="👑" onBack={back}/><section className="play-card center-card">
    <span className="big-emoji">👉</span><p className="kicker">お題</p><strong className="party-prompt">{prompt}</strong>
    {!shown?<button className="primary" onClick={()=>setShown(true)}>せーので指さす！</button>:<><div className="timing-result">一番多く指された人はだれ？</div><button className="primary" onClick={next}>次のお題</button></>}
    <p className="howto">3・2・1で、お題に一番当てはまる人を全員同時に指さします。</p>
  </section></div>;
}

function ForbiddenKana({ back }: { back: () => void }) {
  const [letter,setLetter]=useState(()=>kana[rand(kana.length)]); const [topic,setTopic]=useState(()=>talkTopics[rand(talkTopics.length)]); const [running,setRunning]=useState(false); const [seconds,setSeconds]=useState(60);
  useEffect(()=>{if(!running)return;const t=window.setInterval(()=>setSeconds(s=>{if(s<=1){window.clearInterval(t);setRunning(false);return 0}return s-1}),1000);return()=>window.clearInterval(t)},[running]);
  const reset=()=>{setLetter(kana[rand(kana.length)]);setTopic(talkTopics[rand(talkTopics.length)]);setSeconds(60);setRunning(false)};
  return <div className="game-page"><GameHeader title="禁止文字トーク" subtitle="FORBIDDEN LETTER" icon="禁" onBack={back}/><section className="play-card center-card"><p className="kicker">今回の禁止文字</p><strong className="party-prompt">「{letter}」</strong><h2>話題：{topic}</h2><div className="timing-result">残り <b>{seconds}</b> 秒</div><button className="primary" onClick={()=>seconds===0?reset():setRunning(v=>!v)}>{seconds===0?"次のゲーム":running?"一時停止":"60秒スタート"}</button><button className="secondary" onClick={reset}>文字と話題を変える</button><p className="howto">禁止文字を含む言葉を口にした人がアウト。聞き逃さないよう全員でチェック！</p></section></div>;
}

function NoKatakana({ back }: { back: () => void }) {
  const [word,setWord]=useState(()=>katakanaWords[rand(katakanaWords.length)]); const [show,setShow]=useState(false);
  const next=()=>{let n=katakanaWords[rand(katakanaWords.length)];while(n===word)n=katakanaWords[rand(katakanaWords.length)];setWord(n);setShow(false)};
  return <div className="game-page"><GameHeader title="カタカナ禁止" subtitle="NO KATAKANA" icon="ア" onBack={back}/><section className="play-card center-card"><span className="big-emoji">🤐</span><h2>カタカナを使わず説明！</h2><strong className="party-prompt">{show?word:"説明役だけ見てね"}</strong>{show?<button className="primary" onClick={next}>次のお題</button>:<button className="reveal-button" onClick={()=>setShow(true)}>お題を見る</button>}<p className="howto">お題そのものはもちろん、説明中もカタカナ禁止。ほかの人が当てたら成功！</p></section></div>;
}

function RankingGuess({ back }: { back: () => void }) {
  const [item,setItem]=useState(()=>rankingQuestions[rand(rankingQuestions.length)]); const [show,setShow]=useState(false);
  const next=()=>{let n=rankingQuestions[rand(rankingQuestions.length)];while(n.q===item.q)n=rankingQuestions[rand(rankingQuestions.length)];setItem(n);setShow(false)};
  return <div className="game-page"><GameHeader title="ランキング当て" subtitle="TOP THREE" icon="🥇" onBack={back}/><section className="play-card center-card"><p className="kicker">順番まで当てよう</p><strong className="party-prompt">{item.q}</strong>{show?<><div className="rank-answer">{item.answers.map((a,i)=><div key={a}><b>{i+1}</b><span>{a}</span></div>)}</div><button className="primary" onClick={next}>次のランキング</button></>:<button className="primary" onClick={()=>setShow(true)}>答えを見る</button>}<p className="howto">相談してTOP3を予想。3つ全部と順番まで一致すれば完全正解！</p></section></div>;
}

function DrawingSync({ back }: { back: () => void }) {
  const [prompt,setPrompt]=useState(()=>drawingPrompts[rand(drawingPrompts.length)]); const [phase,setPhase]=useState<"ready"|"draw"|"compare">("ready"); const [seconds,setSeconds]=useState(30);
  useEffect(()=>{if(phase!=="draw")return;const t=window.setInterval(()=>setSeconds(s=>{if(s<=1){window.clearInterval(t);setPhase("compare");return 0}return s-1}),1000);return()=>window.clearInterval(t)},[phase]);
  const next=()=>{let n=drawingPrompts[rand(drawingPrompts.length)];while(n===prompt)n=drawingPrompts[rand(drawingPrompts.length)];setPrompt(n);setSeconds(30);setPhase("ready")};
  return <div className="game-page"><GameHeader title="以心伝心お絵描き" subtitle="DRAW TOGETHER" icon="🎨" onBack={back}/><section className="play-card center-card"><p className="kicker">全員同時に描こう</p><strong className="party-prompt">{prompt}</strong>{phase==="ready"&&<button className="primary" onClick={()=>setPhase("draw")}>30秒スタート</button>}{phase==="draw"&&<><div className="timing-result">残り <b>{seconds}</b> 秒</div><button className="primary" onClick={()=>setPhase("compare")}>描けた！</button></>}{phase==="compare"&&<><h2>せーので絵を見せよう！</h2><button className="primary" onClick={next}>次のお題</button></>}<p className="howto">紙やスマホのメモに描き、構図やポーズが一番似ていた2人が勝ち！</p></section></div>;
}

function ThreeQuick({ back }: { back: () => void }) {
  const [prompt,setPrompt]=useState(()=>quickThreePrompts[rand(quickThreePrompts.length)]); const [phase,setPhase]=useState<"ready"|"run"|"done">("ready"); const [seconds,setSeconds]=useState(3);
  useEffect(()=>{if(phase!=="run")return;const t=window.setInterval(()=>setSeconds(s=>{if(s<=1){window.clearInterval(t);setPhase("done");return 0}return s-1}),1000);return()=>window.clearInterval(t)},[phase]);
  const next=()=>{let n=quickThreePrompts[rand(quickThreePrompts.length)];while(n===prompt)n=quickThreePrompts[rand(quickThreePrompts.length)];setPrompt(n);setSeconds(3);setPhase("ready")};
  return <div className="game-page"><GameHeader title="3秒で3つ" subtitle="THREE QUICK" icon="3" onBack={back}/><section className="play-card center-card"><p className="kicker">3つ答えられるかな？</p><strong className="party-prompt">{prompt}</strong>{phase==="ready"&&<button className="primary" onClick={()=>setPhase("run")}>3秒スタート</button>}{phase==="run"&&<div className="timing-result">残り <b>{seconds}</b> 秒</div>}{phase==="done"&&<><h2>答えられた？</h2><button className="primary" onClick={next}>次のお題</button></>}<p className="howto">お題に当てはまるものを3秒以内に3つ答えます。言えたら成功！</p></section></div>;
}

function ThreeHints({ back }: { back: () => void }) {
  const [item,setItem]=useState(()=>hintQuestions[rand(hintQuestions.length)]); const [hintCount,setHintCount]=useState(1); const [answer,setAnswer]=useState(false);
  const next=()=>{let n=hintQuestions[rand(hintQuestions.length)];while(n.answer===item.answer)n=hintQuestions[rand(hintQuestions.length)];setItem(n);setHintCount(1);setAnswer(false)};
  return <div className="game-page"><GameHeader title="3ヒントクイズ" subtitle="THREE HINTS" icon="💡" onBack={back}/><section className="play-card center-card"><p className="kicker">少ないヒントほど高得点</p><div className="answer-list">{item.hints.slice(0,hintCount).map((h,i)=><div key={h}><span>ヒント {i+1}</span><b>{h}</b></div>)}</div>{answer?<><strong className="party-prompt">答え：{item.answer}</strong><button className="primary" onClick={next}>次の問題</button></>:<><button className="primary" onClick={()=>hintCount<3?setHintCount(n=>n+1):setAnswer(true)}>{hintCount<3?"次のヒント":"答えを見る"}</button><button className="secondary" onClick={()=>setAnswer(true)}>わかった！答えを見る</button></>}<p className="howto">1つ目で正解なら3点、2つ目なら2点、3つ目なら1点です。</p></section></div>;
}

function CommonPoint({ back }: { back: () => void }) {
  const [pair,setPair]=useState(()=>commonPointPairs[rand(commonPointPairs.length)]); const [shown,setShown]=useState(false);
  const next=()=>{let n=commonPointPairs[rand(commonPointPairs.length)];while(n[0]===pair[0]&&n[1]===pair[1])n=commonPointPairs[rand(commonPointPairs.length)];setPair(n);setShown(false)};
  return <div className="game-page"><GameHeader title="共通点さがし" subtitle="COMMON POINT" icon="🔗" onBack={back}/><section className="play-card center-card"><p className="kicker">2つをつなぐ共通点は？</p><strong className="party-prompt">{pair[0]} × {pair[1]}</strong>{!shown?<button className="primary" onClick={()=>setShown(true)}>せーので発表</button>:<><h2>一番おもしろい共通点を決めよう！</h2><button className="primary" onClick={next}>次のお題</button></>}<p className="howto">全員で共通点を考え、同時に発表します。正解はひとつではありません。</p></section></div>;
}
