declare global {
  function callf<T>(bridge: string, method: string, ...params: unknown[]): Promise<T>;
}

export {};
