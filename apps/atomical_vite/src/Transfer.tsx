import { useEffect, useState, useRef, CSSProperties } from 'react';
import { handleAddress } from './App';
import { AmountToSend, IAtomicalsInfo, ISelectedUtxo } from './interfaces/api';
import { AtomicalService } from './services/atomical';
import { PullRefresh, List, Tabs, Cell, Divider, Switch } from 'react-vant';
import { detectAddressTypeToScripthash } from './clients/utils';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import ecc from '@bitcoinerlab/secp256k1';
import { Buffer } from 'buffer';
import { UTXO } from './interfaces/utxo';
import { AstroXWizzInhouseProvider } from 'webf_wizz_inhouse';
import { showToast } from '@uni/toast';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export interface TransferFtConfigInterface {
  atomicalsInfo: IAtomicalsInfo;
  selectedUtxos: ISelectedUtxo[];
  outputs: Array<AmountToSend>;
}

export enum TransferStatus {
  None,
  Sending,
  Success,
  Failed,
}

const flexCenter = { display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: 1, padding: 32 };

export const Transfer = ({
  originAddressType,
  originAddress,
  primaryAddress,
  fundingBalance,
  nonAtomUtxos,
  xonlyPubHex,
  relatedAtomicalId,
  relatedUtxos,
  relatedType,
  relatedTicker,
  relatedConfirmed,
  service,
  setVisible,
  provider,
}: {
  originAddressType?: string;
  originAddress?: string;
  primaryAddress?: string;
  fundingBalance?: number;
  nonAtomUtxos?: UTXO[];
  xonlyPubHex?: string;
  relatedAtomicalId?: string;
  relatedUtxos: ISelectedUtxo[];
  relatedType: 'FT' | 'NFT';
  relatedConfirmed?: number;
  relatedTicker?: string;
  provider?: AstroXWizzInhouseProvider;
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
  const [expectedFunding, setExpectedFundinng] = useState<number>(0);
  const [mergeValue, setMergeValue] = useState<boolean>(false);

  // sign and send
  const [signedSuccess, setSignedSuccess] = useState<boolean>(false);
  const [signedTx, setSignedTx] = useState<string | undefined>(undefined);
  const [txStatus, setTxStatus] = useState<TransferStatus>(TransferStatus.None);
  const [txMessage, setTxMessage] = useState<string | undefined>(undefined);
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const [unsendId, setUnsendId] = useState<string | undefined>(undefined);
  const [toConfirm, setToConfirm] = useState<boolean>(false);

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
            onClick={async () => {
              let sel = !selected ? [...selectedTxIDs, utxo.txid] : selectedTxIDs.filter(id => id !== utxo.txid);
              setSelectedTxIDs(sel);
              await handleSelectedAmount(sel);
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

  async function handleSelectedAmount(ids: string[]) {
    let selectedValue = 0;
    let selectedUtxos: ISelectedUtxo[] = [];
    let _amountsToSend: AmountToSend[] = [];
    for (let i = 0; i < ids.length; i += 1) {
      const selcted = ids[i];
      const found = relatedUtxos.find(item => item.txid === selcted);
      if (found) {
        selectedValue += found.value;
        selectedUtxos.push(found);
        if (!mergeValue) {
          _amountsToSend.push({
            address: sendAddress,
            value: found.value,
          });
        }
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

    if (mergeValue) {
      _amountsToSend = [];
      _amountsToSend.push({
        address: sendAddress,
        value: selectedValue,
      });
    }

    const obj: TransferFtConfigInterface = {
      atomicalsInfo: {
        confirmed: relatedConfirmed,
        type: relatedType,
        utxos: relatedUtxos,
      },
      selectedUtxos,
      outputs: _amountsToSend,
    };
    setAmountToSendNext(_amountsToSend);

    await buildAndSignTx(obj, primaryAddress, xonlyPubHex, 20, true);
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
      setSendAddressError(undefined);
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
    const txHex = await buildAndSignTx(obj, primaryAddress, xonlyPubHex, 20, false);

    if (txHex) {
      setTxStatus(TransferStatus.Sending);
      try {
        const txId = await service.electrumApi.broadcast(txHex);
        if (typeof txId !== 'string') {
          throw new Error('txId is not string');
        }
        if (txId !== unsendId) {
          console.log('txId is not same');
        }
        console.log({ txId });
        setTxMessage(undefined);
        setTxId(txId);
        setTxStatus(TransferStatus.Success);
      } catch (error) {
        setTxMessage((error as Error).message);
        setTxStatus(TransferStatus.Failed);
      }
      // signed success, continue sending
    } else {
      console.log('dispatch signing error');
    }
  }

  async function buildAndSignTx(
    transferOptions: TransferFtConfigInterface,
    address: string,
    xonlyPubkey: string,
    satsbyte: number,
    preload: boolean,
  ): Promise<string | undefined> {
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
      if (!preload) {
        const { output } = detectAddressTypeToScripthash(address);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.index,
          witnessUtxo: { value: utxo.value, script: Buffer.from(output as string, 'hex') },
          tapInternalKey: Buffer.from(xonlyPubkey, 'hex'),
        });
      }

      tokenBalanceIn += utxo.value;
      tokenInputsLength++;
    }

    for (const output of transferOptions.outputs) {
      if (!preload) {
        psbt.addOutput({
          value: output.value,
          address: output.address,
        });
      }
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
      return undefined;
    }

    if (preload) {
      if (transferOptions.selectedUtxos.length === 0) {
        setExpectedFundinng(0);
      } else {
        setExpectedFundinng(expectedSatoshisDeposit);
      }
    }
    // add nonAtomUtxos least to expected deposit value

    if (!preload) {
      let addedValue = 0;
      let addedInputs: UTXO[] = [];

      for (let i = 0; i <= nonAtomUtxos.length; i += 1) {
        const utxo = nonAtomUtxos[i];

        if (addedValue >= expectedSatoshisDeposit) {
          break;
        } else {
          addedValue += utxo.value;
          addedInputs.push(utxo);
          const { output } = detectAddressTypeToScripthash(address);
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.outputIndex,
            witnessUtxo: { value: utxo.value, script: Buffer.from(output as string, 'hex') },
            tapInternalKey: Buffer.from(xonlyPubkey, 'hex'),
          });
        }
      }
      console.log(addedValue);
      console.log(addedInputs);

      if (addedValue - expectedSatoshisDeposit >= 546) {
        psbt.addOutput({
          value: addedValue - expectedSatoshisDeposit,
          address: primaryAddress,
        });
      }
      const printedPsbt = psbt.toHex();
      console.log(printedPsbt);

      try {
        const s = await provider.signPsbt(originAddress, printedPsbt, { addressType: originAddressType === 'p2pkh' ? 'p2pkhtr' : 'p2tr' });
        console.log({ s });
        const signedPsbt = bitcoin.Psbt.fromHex(s);
        // signedPsbt.finalizeAllInputs();
        const tx = signedPsbt.extractTransaction();
        console.log(tx.toHex());
        setUnsendId(tx.getId());
        return tx.toHex();
      } catch (error) {
        console.log(error);
        return undefined;
      }
    }
  }

  const onMergeValue = async (value: boolean) => {
    setMergeValue(value);
    setSelectedTxIDs([]);
    await handleSelectedAmount([]);
  };

  const submitTing = () => (
    <>
      <div style={{ textAlign: 'left', marginTop: 32 }}>Address:</div>
      <div style={{ textAlign: 'left' }}>{sendAddress}</div>
      <div style={{ textAlign: 'left', marginTop: 24 }}>Amount:</div>
      <div style={{ textAlign: 'left', marginBottom: 32 }}>{sendAmount}</div>
      <div style={{ textAlign: 'left', marginTop: 24 }}>Gas Cost:</div>
      <div style={{ textAlign: 'left', marginBottom: 32 }}>{expectedFunding} sats</div>
      <div style={{ textAlign: 'left', marginTop: 24 }}>Merge Value:</div>
      <div style={{ textAlign: 'left', marginBottom: 40, color: mergeValue ? '#3399ff' : '#ff9933' }}>{`${mergeValue}`.toUpperCase()}</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            height: 60,
            width: '50%',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ddd',
          }}
          onTouchEnd={async () => {
            console.log('submit');
            setToConfirm(false);
          }}
        >
          Back
        </div>
        <div
          style={{
            height: 60,
            width: '50%',
            backgroundColor: '#3399ff',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
          }}
          onTouchEnd={async () => {
            console.log('submit');
            await handleSubmit();
          }}
        >
          Submit
        </div>
      </div>
    </>
  );

  const sendAndLoading = ({ status, txId }: { status: TransferStatus; txId?: string }) => {
    let comp;
    switch (status) {
      case TransferStatus.Sending:
        comp = (
          <div style={flexCenter as CSSProperties}>
            <h3 style={{ marginTop: 32, marginBottom: 32 }}>Sending ... </h3>
          </div>
        );
        break;
      case TransferStatus.Failed:
        comp = (
          <div style={flexCenter as CSSProperties}>
            <h3 style={{ marginTop: 32, marginBottom: 32 }}>Transaction Failed! </h3>
            <p style={{ marginTop: 32, marginBottom: 32 }}>{txMessage}</p>
            <div
              style={{
                fontSize: 16,
                backgroundColor: '#ff3399',
                borderRadius: 24,
                padding: 24,
                width: '100%',
              }}
              onTouchEnd={() => {
                window.navigator.clipboard.writeText(`{errorMessage:${txMessage},txId:${unsendId}}` || '');
                showToast('Copy Success');
              }}
            >
              {`Copy Message And ID: ${handleAddress(unsendId, 6)}`}
            </div>
          </div>
        );
        break;
      case TransferStatus.Success:
        comp = (
          <div style={flexCenter as CSSProperties}>
            <h3 style={{ marginTop: 32, marginBottom: 32 }}>Transaction Success! </h3>
            <div
              style={{
                fontSize: 16,
                backgroundColor: '#3399ff',
                borderRadius: 24,
                padding: 24,
                width: '100%',
              }}
              onTouchEnd={() => {
                window.navigator.clipboard.writeText(txId || '');
                showToast('Copy Success');
              }}
            >
              {`Copy TxID: ${handleAddress(txId, 6)}`}
            </div>
          </div>
        );
        break;
      case TransferStatus.None:
        comp = submitTing();
        break;
      default:
        comp = submitTing();
        break;
    }

    return <div>{comp}</div>;
  };

  return (
    <div style={{ color: '#fff', width: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div
          style={{ fontSize: 16, color: '#fff', padding: 8 }}
          onTouchStart={() => {
            setVisible();
          }}
        >
          Cancel
        </div>
      </div>
      {toConfirm === false ? (
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <div
            style={{ fontSize: 16, color: !sendAddressOk || !sendAmountOk ? '#999' : '#3399ff', padding: 8 }}
            onTouchStart={() => {
              if (!sendAddressOk || !sendAmountOk) return;
              else {
                setToConfirm(true);
              }
            }}
          >
            Next
          </div>
        </div>
      ) : null}

      <div style={{ padding: 8 }}>Transfer {`  \$${relatedTicker.toLocaleUpperCase()}` ?? ''}</div>

      {toConfirm === false ? (
        <>
          <div
            style={{
              fontSize: 24,
              marginTop: 32,
              borderBottom: '1px solid #fff',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <input ref={addressInput} placeholder="Address" type="text" value={sendAddress} style={{ color: '#ff9933' }} />
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

          <div
            style={{
              fontSize: 16,
              marginBottom: 8,
              paddingBottom: 8,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: 32 }}>BTC Balance: </span>
            <span style={{ color: '#ffffff' }}>{fundingBalance} sats</span>
          </div>
          <div
            style={{
              fontSize: 16,
              marginBottom: 8,
              paddingBottom: 8,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: 32 }}>GAS Cost: </span>
            <span style={{ color: expectedFunding > fundingBalance ? '#ff3399' : '#ffffff' }}>{expectedFunding} sats</span>
          </div>
          <div
            style={{
              fontSize: 16,
              marginBottom: 8,
              paddingBottom: 8,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: 32 }}>Selected {relatedTicker.toUpperCase()}: </span>
            <span style={{ color: expectedFunding > fundingBalance ? '#ff3399' : '#ffffff' }}>{selectedAmount}</span>
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#fff' }}>Merge Value</span>
            <Switch size="24px" onChange={onMergeValue} />
          </div>
          <div style={{ overflow: 'scroll', height: 220 }}>
            <ul style={{ margin: 0, padding: 0 }}>{utxoList()}</ul>
          </div>
        </>
      ) : (
        sendAndLoading({ status: txStatus, txId: txId })
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
