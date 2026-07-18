# Favmon 品牌 SERP 与账号一致性审计（2026-07-18）

## 结论

- `favmon.com` 首页已是品牌查询中最明确的官方结果，标题、描述、FAQ 和非官方 fan project 声明一致。
- 品牌词的主要风险不是旧服装项目，而是同名产品 `favMon`、`FavMon=Garchomp` 用户名和 `@favmon` 账号碰撞。
- 本轮没有在品牌查询前 20 样本或定向的 Facebook、Instagram、`favmon.com clothing` 查询中确认旧服装结果，因此**不创建未经证实的清理任务**。
- 自有结果覆盖仍偏弱：`site:favmon.com` 的公开查询样本主要返回首页，Stats、Picker、Game 和 Pokémon detail 页面尚未稳定占据品牌结果。

## 审计方法

- 时间：2026-07-18，Asia/Shanghai。
- 查询：`Favmon`、`favmon.com`、`Favmon Pokemon`、`site:favmon.com Favmon`。
- 定向复核：`"Favmon" Facebook`、`"Favmon" Instagram`、`"favmon.com" clothing`、`"Favmon" Pokemon site:reddit.com`。
- 下表为查询组公开结果按返回顺序去重后的前 20 项样本。搜索结果会随地区、时间和个性化变化，因此该序号用于本次审计复现，不视为所有用户都相同的固定 Google 排名。

## 前 20 个结果分类

| 样本序号 | 结果 | 分类 | 风险/价值 | 处理动作 |
| --- | --- | --- | --- | --- |
| 1 | [Declare & Rank Your Favorite Pokémon \| Favmon](https://favmon.com/) | 自有官网 | 正向；品牌主体清晰 | 保持 canonical、FAQ、Organization/WebSite schema 与统一描述 |
| 2 | [favMon - Find your Favorite](https://brenocbmnz.github.io/favMon/) | 同名竞品 | 高；名称和 Pokémon picker 意图高度重叠 | 通过 `Favmon community Pokédex`、实时排名和声明卡片持续差异化 |
| 3 | [Every Pokémon is someone's favorite — the project is back online!](https://www.reddit.com/r/pokemon/comments/1ulsid9/every_pok%C3%A9mon_is_someones_favorite_the_project_is/) | 相邻竞品/社区帖 | 高；占据相同叙事 | 不复制其故事；推广使用社区排名差异和数据结论 |
| 4 | [FavMon=Garchomp — Smogon profile](https://www.smogon.com/forums/members/653095/) | 用户名碰撞 | 中；品牌词被高活跃账号占用 | 不做清理；官网统一使用完整品牌描述 |
| 5 | [Published - SM OU Magearna](https://www.smogon.com/forums/threads/sm-ou-magearna.3780132/) | 用户名衍生内容 | 中；由 `FavMon=Garchomp` 产生 | 不做清理；用自有内容扩大官网覆盖 |
| 6 | [Past Generation Analyses — Smogon](https://www.smogon.com/forums/forums/past-generation-analyses.148/) | 用户名衍生内容 | 中 | 不做清理 |
| 7 | [gen4uu ladder — Pokémon Showdown](https://pokemonshowdown.com/ladder/gen4uu) | 用户名衍生内容 | 低 | 不做清理 |
| 8 | [SM Uploaded Analyses — Smogon](https://www.smogon.com/forums/forums/sm-uploaded-analyses.459/) | 用户名衍生内容 | 低 | 不做清理 |
| 9 | [FAVMON by TaubeQ — Lospec](https://lospec.com/gallery/taubeq/favmon) | 同词创作 | 低；非产品、非品牌冒用 | 不做清理 |
| 10 | [Jamie Star / @favmon 聚合页](https://www.idcrawl.com/jamie-star) | 社交账号碰撞/第三方聚合 | 中；显示 `@favmon` 已与其他身份关联 | 不把 `@favmon` 声称为官方账号；正式建号前核验并优先考虑 `@favmonapp` |
| 11 | [Machines of Nature and Machines of Art — PhilPapers](https://philpapers.org/rec/FAVMON) | 学术索引代码碰撞 | 低 | 不做清理 |
| 12 | [Fav mon? — Reddit](https://www.reddit.com/r/ThePokemonHub/comments/1r26yr5/fav_mon/) | 通用短语 | 低 | 可用原创数据内容竞争相关讨论意图，不硬投链接 |
| 13 | [MY Top 24 Fav Mons — Reddit](https://www.reddit.com/r/pokemon/comments/1jj2j7p) | 通用短语 | 低 | 不做清理 |
| 14 | [Fav and Least Fav mon from each Gen — Reddit](https://www.reddit.com/r/PokeCorner/comments/1svycmt/whats_everyones_fav_and_least_fav_mon_from_each/) | 通用短语 | 低；与产品意图相邻 | 后续可产出按世代数据图，但遵守社区自推广规则 |
| 15 | [All my favorites as a Pokémon Fanatic — Reddit](https://www.reddit.com/r/pokemon/comments/1hjbr85) | 通用讨论 | 低 | 不做清理 |
| 16 | [My fav pokemon of every type — Reddit](https://www.reddit.com/r/pokemon/comments/hzbwar) | 通用讨论 | 低 | 后续可由 Picker/属性排行榜承接搜索意图 |
| 17 | [Some fave mons getting me all the way — Reddit](https://www.reddit.com/r/PokemonFireRed/comments/1j3x9ww) | 通用讨论 | 低 | 不做清理 |
| 18 | [Does the favorite pokemon picker website work — Reddit](https://www.reddit.com/r/pokemon/comments/vxmggt) | 相邻产品讨论 | 中；用户有 picker 质量疑问 | 用公开方法说明和稳定的 Picker 体验建立信任 |
| 19 | [fabmon.com Domain and Website Information](https://com.all-url.info/com/fabmon.com/) | 拼写相近的无关域名 | 低 | 不做清理；页面标题始终同时使用 Favmon 与 Pokémon |
| 20 | [Favom AI](https://www.favom.ai/) | 拼写相近的无关品牌 | 低 | 不做清理 |

## 统一品牌口径

### 英文标准描述

> Favmon is a fan-made community Pokédex where trainers declare their favorite or least-favorite Pokémon, compare live community rankings, and create shareable trainer cards.

### 中文标准描述

> Favmon 是一个独立、非官方的 Pokémon 社区图鉴：用户可以声明最喜欢或最不喜欢的 Pokémon、比较实时社区排名，并生成可分享的训练家卡片。

### 非官方项目说明

> Favmon is an independent fan-made project. It is not affiliated with or endorsed by Nintendo or The Pokémon Company.

网站首页 FAQ、结构化数据、`llms.txt`、`answers.md` 和页脚已经使用等价口径。本次同步 README 首段，使仓库说明也明确包含 `fan-made`、独立和非官方属性。

## 后续动作

1. 在 Google Search Console 检查 `/stats`、`/picker`、`/game` 和 5 个代表性 Pokémon detail URL 的渲染与索引状态。
2. 发布真实数据内容后，让相应内容页而不只是首页进入品牌 SERP；目标是品牌前 20 中至少 5 个自有结果。
3. 创建社交账号前逐个平台核验 handle；若 `@favmon` 不可用，统一采用 `@favmonapp`，不要出现多个变体。
4. 每月用同一查询组复查一次。只有能提供实际 URL、截图或平台账号证据时，才建立旧品牌清理任务。

## 本轮不执行的动作

- 不联系论坛用户、竞品或 `@favmon` 账号持有人。
- 不对无关搜索结果提出下架或投诉。
- 不发布 Reddit、Discord 或社交媒体推广内容。
- 不把未确认存在的旧服装结果写成事实。
