import { ElectrumApi } from "@/clients/eletrum";
import { MempoolService } from "@/clients/mempool";
import { ELECTRUMX_HTTP_PROXY, MEMPOOL_URL } from "@/constans";

export const getAtomApi = () => {
  return ElectrumApi.createClient(ELECTRUMX_HTTP_PROXY);
};

export const mempoolService = new MempoolService(MEMPOOL_URL);
