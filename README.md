# Favorite Pokemon

这是对 `https://favoritepokemon.vercel.app/` 的独立复刻版，目标部署地址为 `https://favorite-pokemon.vercel.app/`。

## 功能

- 声明自己最喜欢或最不喜欢的 Pokemon，并保存到本机浏览器。
- 浏览 Explore、Pokédex、Stats、Game 五个核心页面。
- 支持英文/西语切换、Favourite/Not My Favourite 模式切换。
- 使用 PokeAPI 读取公开 Pokemon 列表和图片资源。
- 使用本地声明加可复现种子票数生成统计和游戏数据，不写入源站 Supabase。

## 本地开发

```powershell
npm install
npm run dev -- --port 3001
```

## 验证

```powershell
npm run check
```

`npm run check` 会运行 Vitest 测试和生产构建。

## 部署

Vercel 项目名使用 `favorite-pokemon`。`vercel.json` 已配置 SPA rewrite，直接访问 `/pokedex`、`/stats`、`/game` 等路径会回退到 `index.html`。
