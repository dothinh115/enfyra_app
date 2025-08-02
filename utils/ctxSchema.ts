import { autocompletion, CompletionContext } from "@codemirror/autocomplete";

const ctxSchema = {
  $repos: ["main"],
  $body: [],
  $query: [],
  $params: [],
  $logs: [],
  $helpers: [],
  $req: [],
  $errors: ["throw400", "throw401"],
  $result: [],
  $data: [],
  $statusCode: [],
};

export const ctxAutocomplete = autocompletion({
  override: [
    (ctx: CompletionContext) => {
      // Match any token starting with $ and get what was typed so far
      const token = ctx.matchBefore(/\$\w*(\.[\w$]*)*\.?$/);
      if (!token) return null;
      if (!ctx.explicit && token.from === token.to) return null;

      const text = token.text;

      // If only typed $ or $cx (not enough $ctx), suggest $ctx
      if (/^\$\w*$/.test(text) && !text.startsWith("$ctx")) {
        return {
          from: token.from,
          options: [{ label: "$ctx", type: "variable" }],
        };
      }

      // If starts with $ctx then suggest inside
      if (text.startsWith("$ctx")) {
        // Remove prefix $ctx
        const path = text.slice(4).split(".").filter(Boolean);

        let current: any = ctxSchema;
        for (const segment of path) {
          if (current == null) break;
          if (Array.isArray(current)) {
            if (!current.includes(segment)) {
              current = null;
              break;
            }
            current = null;
          } else if (typeof current === "object" && segment in current) {
            current = current[segment];
          } else {
            current = null;
            break;
          }
        }

        if (current == null) return null;

        let options: { label: string; type: string }[] = [];
        if (Array.isArray(current)) {
          options = current.map((key) => ({ label: key, type: "property" }));
        } else if (typeof current === "object") {
          options = Object.keys(current).map((key) => ({
            label: key,
            type: "property",
          }));
        }

        // Insert from position after last dot
        let from = token.from;
        const lastDotIndex = text.lastIndexOf(".");
        if (lastDotIndex >= 0) {
          from = token.from + lastDotIndex + 1;
        }

        return {
          from,
          options,
        };
      }

      return null;
    },
  ],
});
