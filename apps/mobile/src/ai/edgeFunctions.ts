import { supabase, isSupabaseConfigured } from '../supabase/client.js';

/**
 * Calls a Supabase Edge Function by name and resolves with its JSON body.
 *
 * Every AI request goes through this seam: provider keys live only in the
 * edge function's environment, never in the client bundle or on the device.
 * Rejects when the backend is unconfigured or the call fails, so callers can
 * fall back to their deterministic answers.
 */
export type EdgeFunctionInvoker = (name: string, body: unknown) => Promise<unknown>;

export const invokeEdgeFunction: EdgeFunctionInvoker = async (name, body) => {
  if (!isSupabaseConfigured()) {
    throw new Error(`Backend not configured; cannot reach edge function "${name}".`);
  }

  const { data, error } = await supabase.functions.invoke(name, { body: body as object });
  if (error) {
    // An HTTP error's own message is generic ("non-2xx status code"); the
    // status is what tells a schema mismatch (400) from a crash (500) or an
    // undeployed function (404).
    const status = (error as { context?: { status?: number } }).context?.status;
    throw new Error(
      status
        ? `Edge function "${name}" returned HTTP ${status}.`
        : `Edge function "${name}" failed: ${error.message}`
    );
  }
  return data;
};
