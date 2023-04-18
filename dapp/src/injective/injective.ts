import {
  ChainGrpcAuthApi,
  ChainGrpcWasmApi,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
  Msgs,
  PrivateKey,
  TxGrpcClient,
  TxResponse,
  createTransactionFromMsg,
} from "@injectivelabs/sdk-ts";
import { DEFAULT_GAS_PRICE } from "@injectivelabs/utils";

export class Injective {
  private readonly wallet: PrivateKey;
  private readonly chainId = "injective-888";
  private readonly gasMultiplier = 1.8;
  private readonly gasPrice = DEFAULT_GAS_PRICE;

  constructor(
    private readonly grpcEndpoint: string,
    readonly mnemonic: string
  ) {
    this.wallet = PrivateKey.fromMnemonic(mnemonic);
  }

  getAddress(): string {
    return this.wallet.toBech32();
  }

  async signAndBroadcastMsg(msg: Msgs | Msgs[]): Promise<TxResponse> {
    const chainGrpcAuthApi = new ChainGrpcAuthApi(this.grpcEndpoint);
    const account = await chainGrpcAuthApi.fetchAccount(this.getAddress());
    const { txRaw: simulateTxRaw } = createTransactionFromMsg({
      sequence: account.baseAccount.sequence,
      accountNumber: account.baseAccount.accountNumber,
      message: msg,
      chainId: this.chainId,
      pubKey: this.wallet.toPublicKey().toBase64(),
    });

    const txService = new TxGrpcClient(this.grpcEndpoint);
    // simulation
    const {
      gasInfo: { gasUsed },
    } = await txService.simulate(simulateTxRaw);

    // simulation returns us the approximate gas used
    // gas passed with the transaction should be more than that
    // in order for it to be successfully executed
    // this multiplier takes care of that
    const fee = {
      amount: [
        {
          denom: "inj",
          amount: (gasUsed * this.gasPrice * this.gasMultiplier).toFixed(),
        },
      ],
      gas: (gasUsed * this.gasMultiplier).toFixed(),
    };

    const { signBytes, txRaw } = createTransactionFromMsg({
      sequence: account.baseAccount.sequence,
      accountNumber: account.baseAccount.accountNumber,
      message: msg,
      chainId: this.chainId,
      fee,
      pubKey: this.wallet.toPublicKey().toBase64(),
    });

    const sig = await this.wallet.sign(Buffer.from(signBytes));

    /** Append Signatures */
    txRaw.setSignaturesList([sig]);

    const txResponse = await txService.broadcast(txRaw);

    if (txResponse.code !== 0) {
      console.log(`Transaction failed: ${txResponse.rawLog}`);
      throw new Error(`Transaction failed: ${txResponse.rawLog}`);
    } else {
      console.log(
        `Broadcasted transaction hash: ${JSON.stringify(txResponse.txHash)}`
      );
    }

    return txResponse;
  }

  async querySmartContract<T>(contract: string, query: Object): Promise<T> {
    const api = new ChainGrpcWasmApi(this.grpcEndpoint);
    const queryStr = Buffer.from(JSON.stringify(query)).toString("base64");
    const { data } = await api.fetchSmartContractState(contract, queryStr);

    const json = Buffer.from(data as String, "base64").toString();

    return JSON.parse(json) as T;
  }
}
