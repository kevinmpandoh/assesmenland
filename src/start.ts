import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const SERVER_FN_BASE = "/_serverFn/";

function serverFnFetch(input: string | Request | URL, init?: RequestInit) {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const normalizedUrl = url.startsWith("undefined")
    ? `${SERVER_FN_BASE}${url.slice("undefined".length)}`
    : url.startsWith("eyJ")
      ? `${SERVER_FN_BASE}${url}`
      : url;

  return fetch(normalizedUrl, init);
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
  serverFns: {
    fetch: serverFnFetch,
  },
}));
