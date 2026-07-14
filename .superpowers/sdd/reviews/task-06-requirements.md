# Task 06 需求符合性审查

**结论：PASS**

## 审查范围

- `Task 06 brief：Metadata、静态 fallback 与最终门禁`
- 已批准设计第 7.3、7.4、8、9、11 节
- 实施计划 Task 6
- 当前未提交差异与现有 `dist/_seo`、`public/sitemap.xml` 构建产物

## 逐项证据

1. **三条英文 title 精确匹配：PASS**
   - 首页：`Declare & Rank Your Favorite Pokémon | Favmon`
   - `/stats`：`Most Popular Pokémon — Live Community Rankings | Favmon`
   - `/game`：`Guess Which Pokémon Is More Popular | Favmon`
   - `src/App.tsx` 与 `scripts/seo-config.mjs` 使用相同 title/socialTitle；现有 `dist/_seo/stats.html` 与 `dist/_seo/game.html` 也输出对应 title。

2. **description 社区口径可信：PASS**
   - 三条英文 description 均明确使用 `Favmon community declarations`。
   - 未把数据描述成全球、全体玩家或权威样本；`/stats` 明确是 community sample。

3. **运行时与静态多语言 route SEO 一致：PASS**
   - 当前 diff 对 `src/App.tsx` 与 `scripts/seo-config.mjs` 的英文 `/`、`/stats`、`/game` 做了成对、等值修改。
   - 其他 locale/route 配置未被本任务修改，既有双份结构保持对应；未发现单边漂移。

4. **仅英文 `/stats` 使用专用 fallback：PASS**
   - `renderCrawlableFallback` 只在 `route === '/stats' && language === 'en'` 时调用新专用正文。
   - 其他核心 route、其他语言和 Pokémon 详情 fallback 继续走原有通用分支，没有扩大模板改写范围。

5. **`/stats` fallback 内容完整且准确：PASS**
   - 现有 `dist/_seo/stats.html` 包含页面用途、`Favmon community sample and methodology`、Favorite mode、Least-favorite mode。
   - 明确说明排名数据在运行时加载，`Refresh` 会重新请求最新社区总数和排名。
   - 含可抓取普通链接：`https://favmon.com/`、`/pokedex`、`/explore`。
   - 正文明确静态 fallback 不猜测 vote counts 或 ranking order；未输出虚构票数、Top 10、静态排名、Neon 或全球权威断言。
   - fallback 为纯构建期静态正文，不依赖 `/api/data` 成功。

6. **详情页与 sitemap 回归边界：PASS**
   - `dist/_seo/pokemon/pikachu.html` 仍含 canonical `https://favmon.com/pokemon/pikachu` 与 `FAQPage`。
   - `public/sitemap.xml` 的 `<loc>` 数量仍为 **1095**。
   - 当前生产代码 diff 未触及 Pokémon 详情内容/FAQ 模板或 sitemap route family。

7. **`public/answers.md` 判断：应保留**
   - 该文件只同步了 Home、Game、Stats 三条新的 title/description，内容与 `scripts/seo-config.mjs` 的本任务语义变更一致。
   - 它不是纯日期更新，也未扩展详情页或生成虚构排名，因此属于必要的语义生成产物。

8. **补充回归测试范围：PASS**
   - 新增的三页测试仅补充 Open Graph/Twitter URL 与 description 的精确断言，直接覆盖既有 metadata 同步要求，没有扩大产品行为或路由范围。
   - 新增正式 AST parity test 用于逐 locale、逐 route 比较 `src/App.tsx` 与 `scripts/seo-config.mjs`，为双份 SEO 配置一致性提供持续回归保护。
   - 本轮未修改生产实现或静态 fallback，因此不影响上述需求结论与边界判断。

## 结论

Task 06 当前实现满足 brief、设计与计划中的需求边界，可进入代码质量审查及根代理最终完整门禁。
