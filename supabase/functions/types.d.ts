// Local type shims for Supabase edge functions (Deno/npm import map)
// These declarations help the TypeScript server and tsc understand the
// non-standard `npm:` import specifiers and the global `Deno` object used
// inside the `supabase/functions` directory. They are intentionally minimal
// and only provide the pieces needed by the repo's functions.

declare module 'npm:@supabase/supabase-js@2' {
  // Re-export the public types from the regular package for convenience
  export * from '@supabase/supabase-js';
}

declare module 'npm:ethers@6.10.0' {
  // Re-export from the installed 'ethers' package so IDEs and tsc can resolve
  export * from 'ethers';
}

// Minimal Deno global typing used inside the functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve?: (handler: (req: Request) => Promise<Response> | Response) => void;
};

export {};
