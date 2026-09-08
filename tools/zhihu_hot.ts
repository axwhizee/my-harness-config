import { tool } from "@opencode-ai/plugin";
import { zhihuGet } from "./_zhihu";

interface HotItem {
  Title?: string;
  Url?: string;
  ThumbnailUrl?: string;
  Summary?: string;
}

export default tool({
  description:
    "获取知乎热榜（当前实时热点议题列表）。适合趋势感知、选题参考和发现当前讨论焦点；热榜只代表热度，不等于事实核查或完整事件解释，需要背景时配合 websearch 深读。",

  args: {
    limit: tool.schema
      .number()
      .default(20)
      .describe("返回条数，默认 20，范围 1-30"),
  },

  async execute(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 20, 30));
    const data = await zhihuGet<{ Total: number; Items: HotItem[] }>("hot_list", {
      Limit: limit,
    });
    const items = data.Items ?? [];
    if (!items.length) return "热榜暂无数据。";
    return (
      `知乎热榜（${items.length} 条）\n\n` +
      items
        .map((it, i) => {
          const parts = [`${i + 1}. **${it.Title ?? "(无标题)"}**`, `   URL: ${it.Url ?? ""}`];
          if (it.Summary) {
            const s = it.Summary.replace(/[\n\r]+/g, " ").trim();
            if (s) parts.push(`   ${s.slice(0, 300)}${s.length > 300 ? "..." : ""}`);
          }
          return parts.join("\n");
        })
        .join("\n\n")
    );
  },
});
