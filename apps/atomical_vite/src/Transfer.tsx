import { useEffect, useState, useRef } from 'react';
import { handleAddress } from './App';
import { AmountToSend, IAtomicalsInfo, ISelectedUtxo } from './interfaces/api';
import { AtomicalService } from './services/atomical';
import { PullRefresh, List, Tabs, Cell, Divider, Button } from 'react-vant';
import { detectAddressTypeToScripthash } from './clients/utils';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import ecc from '@bitcoinerlab/secp256k1';
import { Buffer } from 'buffer';
import { UTXO } from './interfaces/utxo';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export interface TransferFtConfigInterface {
  atomicalsInfo: IAtomicalsInfo;
  selectedUtxos: ISelectedUtxo[];
  outputs: Array<AmountToSend>;
}

export const Transfer = ({
  primaryAddress,
  xonlyPubHex,
  relatedAtomicalId,
  relatedUtxos,
  relatedType,
  relatedTicker,
  relatedConfirmed,
  service,
  setVisible,
}: {
  primaryAddress?: string;
  xonlyPubHex?: string;
  relatedAtomicalId?: string;
  relatedUtxos: ISelectedUtxo[];
  relatedType: 'FT' | 'NFT';
  relatedConfirmed?: number;
  relatedTicker?: string;
  service: AtomicalService;
  setVisible: Function;
}) => {
  const addressInput = useRef(null);
  // const amountInput = useRef(null);
  const [selectedTxIDs, setSelectedTxIDs] = useState<string[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [sendAddress, setSendAddress] = useState<string | undefined>(undefined);
  const [sendAddressError, setSendAddressError] = useState<string | undefined>(undefined);
  const [sendAmount, setSendAmount] = useState<number | undefined>(0);
  // const [sendAmountError, setSendAmountError] = useState<string | undefined>(undefined);
  const [sendAmountOk, setSendAmountOk] = useState<boolean>(false);
  const [sendAddressOk, setSendAddressOk] = useState<boolean>(false);
  const [amountToSendNext, setAmountToSendNext] = useState<AmountToSend[]>([]);
  const [selectedUtxos, setSelectedUtxos] = useState<ISelectedUtxo[]>([]);

  const utxoList = () => {
    return relatedUtxos
      .sort((a, b) => a.height - b.height)
      .map((utxo, index) => {
        const selected = selectedTxIDs.findIndex(id => id === utxo.txid) > -1;
        return (
          <li
            key={index}
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              display: 'flex',
              paddingTop: 8,
              paddingBottom: 8,
              margin: 0,
            }}
            onClick={() => {
              let sel = !selected ? [...selectedTxIDs, utxo.txid] : selectedTxIDs.filter(id => id !== utxo.txid);
              setSelectedTxIDs(sel);
              handleSelectedAmount(sel);
            }}
          >
            <span>{selected ? `✅` : `🔳`}</span>
            <div style={{ marginLeft: 16, width: 160 }}>{handleAddress(utxo.txid, 4)}</div>
            <div style={{ marginLeft: 16 }}>{utxo.value}</div>
            <div style={{ marginLeft: 16 }}>{utxo.height}</div>
          </li>
        );
      });
  };

  useEffect(() => {
    handleInputRefs();
  }, []);

  function handleInputRefs() {
    addressInput.current.addEventListener('change', e => {
      setSendAddress(e.currentTarget.value);
      const valid = validateAddress(e.currentTarget.value);
      setSendAddressOk(valid);
    });
    // amountInput.current.addEventListener('change', e => {
    //   setSendAmount(Number.parseInt(e.currentTarget.value, 10));
    //   const valid = validateInput(Number.parseInt(e.currentTarget.value, 10));
    //   setSendAmountOk(valid);
    // });
  }

  function handleSelectedAmount(ids: string[]) {
    let selectedValue = 0;
    let selectedUtxos: ISelectedUtxo[] = [];
    for (let i = 0; i < ids.length; i += 1) {
      const selcted = ids[i];
      const found = relatedUtxos.find(item => item.txid === selcted);
      if (found) {
        selectedValue += found.value;
        selectedUtxos.push(found);
      }
    }
    setSelectedAmount(selectedValue);
    setSelectedUtxos(selectedUtxos);
    setSendAmount(selectedValue);
    if (selectedValue > 0) {
      setSendAmountOk(true);
    } else {
      setSendAmountOk(false);
    }
  }

  //   function validateInput(inputVal: number): boolean {
  //     if (inputVal > selectedAmount && selectedAmount > 0) {
  //       setSendAmountError(`Amount must be less than ${selectedAmount}`);
  //       return false;
  //     }
  //     return true;
  //   }

  function validateAddress(address: string): boolean {
    try {
      detectAddressTypeToScripthash(address);
      return true;
    } catch (error) {
      setSendAddressError(`Address is not correct`);
      return false;
    }
  }

  async function handleSubmit() {
    const obj: TransferFtConfigInterface = {
      atomicalsInfo: {
        confirmed: relatedConfirmed,
        type: relatedType,
        utxos: relatedUtxos,
      },
      selectedUtxos,
      outputs: amountToSendNext,
    };

    console.log({ obj });
    await buildAndSendTransaction(obj, sendAddress, xonlyPubHex, 20);
  }

  async function buildAndSendTransaction(
    transferOptions: TransferFtConfigInterface,
    address: string,
    xonlyPubkey: string,
    satsbyte: number,
  ): Promise<any> {
    if (transferOptions.atomicalsInfo.type !== 'FT') {
      throw 'Atomical is not an FT. It is expected to be an FT type';
    }

    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    let tokenBalanceIn = 0;
    let tokenBalanceOut = 0;
    let tokenInputsLength = 0;
    let tokenOutputsLength = 0;
    for (const utxo of transferOptions.selectedUtxos) {
      // Add the atomical input, the value from the input counts towards the total satoshi amount required
      const { output } = detectAddressTypeToScripthash(address);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.index,
        witnessUtxo: { value: utxo.value, script: Buffer.from(output as string, 'hex') },
        tapInternalKey: Buffer.from(xonlyPubkey, 'hex'),
      });
      tokenBalanceIn += utxo.value;
      tokenInputsLength++;
    }

    for (const output of transferOptions.outputs) {
      psbt.addOutput({
        value: output.value,
        address: output.address,
      });
      tokenBalanceOut += output.value;
      tokenOutputsLength++;
    }
    console.log({ tokenBalanceIn });
    console.log({ tokenBalanceOut });
    // TODO DETECT THAT THERE NEEDS TO BE CHANGE ADDED AND THEN
    if (tokenBalanceIn !== tokenBalanceOut) {
      console.log('Invalid input and output does not match for token. Developer Error.');
    }

    const { expectedSatoshisDeposit } = calculateFTFundsRequired(transferOptions.selectedUtxos.length, transferOptions.outputs.length, satsbyte, 0);
    if (expectedSatoshisDeposit <= 546) {
      console.log('Invalid expectedSatoshisDeposit. Developer Error.');
    }
    console.log(expectedSatoshisDeposit);

    const allUtxos = await service.electrumApi.getUnspentAddress(address);
    console.log(allUtxos);
    const nonAtomUtxos: UTXO[] = [];
    for (let i = 0; i < allUtxos.utxos.length; i++) {
      const utxo = allUtxos.utxos[i];
      if (transferOptions.atomicalsInfo.utxos.findIndex(item => item.txid === utxo.txid) < 0) {
        nonAtomUtxos.push(utxo);
      }
    }
    console.log(nonAtomUtxos);

    // logBanner(`DEPOSIT ${expectedSatoshisDeposit / 100000000} BTC to ${keyPairFunding.address}`);
    // qrcode.generate(keyPairFunding.address, { small: false });
    // console.log(`...`);
    // console.log(`...`);
    // console.log(`WAITING UNTIL ${expectedSatoshisDeposit / 100000000} BTC RECEIVED AT ${keyPairFunding.address}`);
    // console.log(`...`);
    // console.log(`...`);
    // let utxo = await this.electrumApi.waitUntilUTXO(keyPairFunding.address, expectedSatoshisDeposit, 5, false);
    // console.log(`Detected UTXO (${utxo.txid}:${utxo.vout}) with value ${utxo.value} for funding the transfer operation...`);
    // // Add the funding input
    // psbt.addInput({
    //   hash: utxo.txid,
    //   index: utxo.outputIndex,
    //   witnessUtxo: { value: utxo.value, script: keyPairFunding.output },
    //   tapInternalKey: keyPairFunding.childNodeXOnlyPubkey,
    // });
    // const isMoreThanDustChangeRemaining = utxo.value - expectedSatoshisDeposit >= 546;
    // if (isMoreThanDustChangeRemaining) {
    //   // Add change output
    //   console.log(`Adding change output, remaining: ${utxo.value - expectedSatoshisDeposit}`);
    //   psbt.addOutput({
    //     value: utxo.value - expectedSatoshisDeposit,
    //     address: keyPairFunding.address,
    //   });
    // }
    // let i = 0;
    // for (i = 0; i < tokenInputsLength; i++) {
    //   console.log(`Signing Atomical input ${i}...`);
    //   psbt.signInput(i, keyPairAtomical.tweakedChildNode);
    // }
    // // Sign the final funding input
    // console.log('Signing funding input...');
    // psbt.signInput(i, keyPairFunding.tweakedChildNode);

    // psbt.finalizeAllInputs();
    // const tx = psbt.extractTransaction();

    // const rawtx = tx.toHex();
    // await jsonFileWriter(`transfer_txs/${tx.getId()}.json`, {
    //   rawtx,
    // });

    // console.log(`Constructed Atomicals FT Transfer, attempting to broadcast: ${tx.getId()}`);
    // console.log(`Saved raw transaction to: transfer_txs/${tx.getId()}.json`);
    // await jsonFileWriter(`transfer_txs/${tx.getId()}.json`, {
    //   rawtx,
    // });
    // let broadcastedTxId = await this.electrumApi.broadcast(rawtx);
    // console.log(`Success!`);
    // return {
    //   success: true,
    //   data: { txid: broadcastedTxId },
    // };
  }

  return (
    <div style={{ color: '#fff', width: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div
          style={{ fontSize: 16, color: '#fff' }}
          onClick={() => {
            setVisible();
          }}
        >
          Cancel
        </div>
      </div>
      {amountToSendNext.length === 0 ? (
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <div
            style={{ fontSize: 16, color: !sendAddressOk || !sendAmountOk ? '#999' : '#3399ff' }}
            onClick={() => {
              if (!sendAddressOk || !sendAmountOk) return;
              else {
                console.log({ sendAddress, sendAmount });
                const amountsToSend: AmountToSend[] = [];
                amountsToSend.push({
                  address: sendAddress,
                  value: sendAmount,
                });
                setAmountToSendNext(amountsToSend);
              }
            }}
          >
            Next
          </div>
        </div>
      ) : null}

      <div>Transfer {`  \$${relatedTicker.toLocaleUpperCase()}` ?? ''}</div>

      {amountToSendNext.length === 0 ? (
        <>
          <div
            style={{
              fontSize: 24,
              borderBottom: '1px solid #fff',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <input ref={addressInput} placeholder="Address" type="text" value={sendAddress} />
            <div
              style={{
                color: '#3399ff',
                // marginLeft: 8,
                width: 100,
                fontSize: 12,
              }}
              onTouchEnd={async () => {
                const isText = await window.navigator.clipboard.readText();
                if (isText && isText !== '') {
                  setSendAddress(isText);
                  const valid = validateAddress(isText);
                  setSendAddressOk(valid);
                }
              }}
            >
              Paste
            </div>
          </div>
          {sendAddressError && <div style={{ color: '#ff3399' }}>{sendAddressError}</div>}
          <div style={{ fontSize: 16, marginBottom: 16, paddingBottom: 16 }}>
            <span style={{ marginRight: 32 }}>Selected {relatedTicker.toUpperCase()}: </span>
            <span style={{ color: '#ff3399' }}>{selectedAmount}</span>
          </div>
          <div style={{ fontSize: 16, marginBottom: 16, paddingBottom: 16 }}>
            <span style={{ marginRight: 32 }}>Selected {relatedTicker.toUpperCase()}: </span>
            <span style={{ color: '#ff3399' }}>{selectedAmount}</span>
          </div>
          <ul style={{ margin: 0, padding: 0 }}>{utxoList()}</ul>
        </>
      ) : (
        <>
          <div style={{ marginTop: 32, marginBottom: 16 }}>Confirm Tx Detail</div>
          <div style={{ textAlign: 'left' }}>Address:</div>
          <div style={{ textAlign: 'left' }}>{sendAddress}</div>
          <div style={{ textAlign: 'left', marginTop: 24 }}>Amount:</div>
          <div style={{ textAlign: 'left', marginBottom: 32 }}>{sendAmount}</div>
          <Button
            round
            nativeType="submit"
            type="primary"
            block
            onClick={async () => {
              await handleSubmit();
            }}
          >
            Submit
          </Button>
        </>
      )}
    </div>
  );
};

export const calculateFTFundsRequired = (
  numberOfInputs: number,
  numberOfOutputs: number,
  satsByte: number,
  mintDataLength = 0,
  baseTxByteLength = 300,
) => {
  // The default base includes assumes 1 input and 1 output with room to spare
  const estimatedTxSizeBytes = baseTxByteLength + mintDataLength;
  const baseInputSize = 36 + 4 + 64;
  const baseOutputSize = 8 + 20 + 4;

  let expectedSatoshisDeposit = (estimatedTxSizeBytes + numberOfInputs * baseInputSize + numberOfOutputs * baseOutputSize) * satsByte;
  if (expectedSatoshisDeposit > 0 && expectedSatoshisDeposit < 546) {
    expectedSatoshisDeposit = 546;
  }
  return {
    expectedSatoshisDeposit,
  };
};
