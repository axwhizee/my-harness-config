// 知乎开放平台 HTTP API 共享 helper。
// Access Secret 从 ZHIHU_ACCESS_SECRET 环境变量读取（不在代码/日志中落明文）。
// 参考: ~/LLM/Skills/zhihu/references/http-api.md

export function secret(): string {
  const k = process.env.ZHIHU_ACCESS_SECRET;
  if (!k) {
    throw new Error(
      "ZHIHU_ACCESS_SECRET 未设置。请在启动 opencode 的终端里 export ZHIHU_ACCESS_SECRET=...（注意：在 Windows 系统设置的环境变量不会自动继承到 WSL，需要在 WSL 侧也设置）"
    );
  }
  return k;
}

const CONTENT_BASE = "https://developer.zhihu.com/api/v1/content";

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${secret()}`,
    "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
    "Content-Type": "application/json",
  };
}

/**
 * GET 知乎内容接口，返回服务端 Data 字段。
 * 例: zhihuGet("global_search", { Query, Count, Filter, SearchDB })
 */
export async function zhihuGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    qs.set(k, String(v));
  }
  const res = await fetch(`${CONTENT_BASE}/${path}?${qs.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`zhihu HTTP ${res.status}: ${await res.text()}`);
  const body: { Code: number; Message?: string; Data: T } = await res.json();
  if (body.Code !== 0) {
    throw new Error(`zhihu API ${body.Code}: ${body.Message ?? JSON.stringify(body)}`);
  }
  return body.Data;
}

export interface ZhidaMessage {
  role: string;
  content: string;
}

/**
 * 调用知乎直答（OpenAI 兼容 chat completions）。
 * 返回最终答案与（thinking 模型的）推理过程。
 */
export async function zhida(
  messages: ZhidaMessage[],
  model = "zhida-agent",
): Promise<{ content: string; reasoning?: string }> {
  const res = await fetch("https://developer.zhihu.com/v1/chat/completions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!res.ok) throw new Error(`zhida HTTP ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const msg = body?.choices?.[0]?.message;
  if (!msg) throw new Error(`zhida 响应异常: ${JSON.stringify(body).slice(0, 500)}`);
  return {
    content: typeof msg.content === "string" ? msg.content : "",
    reasoning: msg.reasoning_content,
  };
}
