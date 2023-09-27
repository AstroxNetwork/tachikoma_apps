import { useEffect, useRef, useState } from 'react';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css';
import { ElectrumApi } from './clients/eletrum';
import { AtomicalService } from './services/atomical';
import { IAtomicalBalances, ISelectedUtxo } from './interfaces/api';
import Modal from './components/Modal';
import { AstroXWizzInhouseProvider } from 'webf_wizz_inhouse';
import { fromPubToP2tr, toXOnly } from './clients/utils';
import { showToast } from '@uni/toast';
import { Transfer } from './Transfer';
import { Overlay, Popup } from 'react-vant';
import { UTXO } from './interfaces/utxo';
import { MempoolUtxo, mempoolService } from './clients/mempool';

const provider = new AstroXWizzInhouseProvider();

export function handleAddress(address: string, padding: number = 6): string {
  return `${address.substring(0, padding)}...${address.substring(address.length - padding, address.length)}`;
}

const ELECTRUMX_WSS = 'wss://electrumx.atomicals.xyz:50012';
function App() {
  const [originAddress, setOriginAddress] = useState<string | undefined>(undefined); // 'bc1qpgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv'
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [fundingBalance, setFundingBalance] = useState<number | undefined>(undefined);
  const [nonAtomUtxos, setNonAtomUtxos] = useState<UTXO[]>([]);
  const [balanceMap, setBalanceMap] = useState<IAtomicalBalances | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [modalContent, setModalContent] = useState<JSX.Element | string | undefined>(undefined);
  const [allUtxos, setAllUxtos] = useState<UTXO[]>([]);
  const [atomUtxos, setAtomUtxos] = useState<ISelectedUtxo[]>([]);
  const [relatedUtxos, setRelatedUtxos] = useState<ISelectedUtxo[]>([]);
  const [relatedAtomicalId, setRelatedAtomicalId] = useState<string | undefined>(undefined);
  const [relatedConfirmed, setRelatedConfirmed] = useState<number | undefined>(undefined);
  const [relatedType, setRelatedType] = useState<'FT' | 'NFT' | undefined>(undefined);
  const [relatedTicker, setRelatedTicker] = useState<string | undefined>(undefined);
  const [xOnlyPubHex, setXonlyPubHex] = useState<string | undefined>(undefined);
  const [isAllowedAddressType, setIsAllowedAddressType] = useState<boolean>(true);
  const [modalClosable, setModalClosable] = useState<boolean>(true);
  const [originAddressType, setOriginAddressType] = useState<string | undefined>(undefined);

  const [service, setService] = useState<AtomicalService | undefined>(undefined);

  const init = () => {
    try {
      const api = ElectrumApi.createClient(ELECTRUMX_WSS);
      const service = new AtomicalService(api);
      setService(service);
    } catch (error) {
      console.log('get service error');
      showToast({ content: `${error}`, type: 'fail' });
    }
  };

  const getWalletInfo = async () => {
    // const addr = await getAddress();
    if (address) {
      try {
        showToast({ content: 'Connecting Service', type: 'loading' });
        const walletInfo = await service.walletInfo(address, false);
        const { data } = walletInfo;
        const { atomicals_confirmed, atomicals_balances, atomicals_utxos } = data;
        console.log(data);
        console.log({ atomicals_confirmed });
        setBalance(atomicals_confirmed);
        setBalanceMap(atomicals_balances as IAtomicalBalances);

        const _allUtxos = await service.electrumApi.getUnspentAddress(address);
        const mempoolUtxos: MempoolUtxo[] = await mempoolService.getUtxo(address);
        const confirmedUtxos: UTXO[] = [];
        for (let i = 0; i < _allUtxos.utxos.length; i++) {
          const found = mempoolUtxos.findIndex(item => item.txid === _allUtxos.utxos[i].txid && item.status.confirmed === true);
          if (found > -1) {
            confirmedUtxos.push(_allUtxos.utxos[i]);
          }
        }
        const ordUtxosResoponse = await provider.getInscriptions(address);
        const { list: ordList, total } = ordUtxosResoponse;

        if (atomicals_utxos.length > 0) {
          setAtomUtxos(atomicals_utxos);
        }
        if (_allUtxos.utxos.length > 0) {
          setAllUxtos(confirmedUtxos);
        }

        const nonAtomUtxos: UTXO[] = [];
        const _nonAtomUtxos: UTXO[] = [];
        let nonAtomUtxosValue = 0;

        if (total === 0 || total === undefined) {
          for (let i = 0; i < confirmedUtxos.length; i++) {
            const utxo = confirmedUtxos[i];
            if (atomicals_utxos.findIndex(item => item.txid === utxo.txid) < 0) {
              nonAtomUtxos.push(utxo);
              nonAtomUtxosValue += utxo.value;
            }
          }
        } else {
          for (let i = 0; i < confirmedUtxos.length; i++) {
            const utxo = confirmedUtxos[i];
            if (atomicals_utxos.findIndex(item => item.txid === utxo.txid) < 0) {
              _nonAtomUtxos.push(utxo);
            }
          }

          for (let j = 0; j < _nonAtomUtxos.length; j++) {
            const utxo = _nonAtomUtxos[j];
            if (ordList.findIndex(item => item.output.split(':')[0] === utxo.txId) < 0) {
              nonAtomUtxos.push(utxo);
              nonAtomUtxosValue += utxo.value;
            }
          }
        }
        setNonAtomUtxos(nonAtomUtxos.sort((a, b) => b.value - a.value));
        setFundingBalance(nonAtomUtxosValue);
      } catch (error) {
        throw error;
      }
    }
  };

  const handleUtxos = (expect_id: string) => {
    const utxos = [];
    if (atomUtxos.length > 0) {
      for (let i = 0; i < atomUtxos.length; i += 1) {
        const utxo = atomUtxos[i];
        if (utxo.atomicals.length === 1) {
          const atomicalId = utxo.atomicals[0];
          if (atomicalId === expect_id) {
            utxos.push(utxo);
          }
        } else {
          break;
        }
      }
    }
    return utxos;
  };

  const getAddress = async () => {
    const accs = await provider.requestAccounts();
    const p2trPub = await provider.getPublicKey(accs[0]);
    setOriginAddress(accs[0]);
    const xpub = (toXOnly(Buffer.from(p2trPub, 'hex')) as Buffer).toString('hex');
    setXonlyPubHex(xpub);
    // setXonlyPubHex('133c85d348d6c0796382966380719397453592e706cd3329119a2d2cb8d2ff7b');
    const p2trAddress = fromPubToP2tr(p2trPub);
    const currentAddressType = await provider.getAddressType(accs[0]);
    // const p2trAddress = 'bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv'; //fromPubToP2tr(p2trPub);
    setAddress(p2trAddress);
    setOriginAddressType(currentAddressType);

    if (currentAddressType === 'p2pkh') {
      setIsAllowedAddressType(true);
    } else {
      if (currentAddressType === 'p2wpkh' || currentAddressType === 'p2sh') {
        setModalClosable(false);
        setVisible(true);
        setIsAllowedAddressType(false);
        setModalContent(
          <div style={{ textAlign: 'left' }}>
            <p style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-block' }}>Please aware this address you use to login is</span>
              <span style={{ display: 'inline-block', color: '#ff3399' }}>{` `}NOT supported</span>
              <span style={{ display: 'inline-block' }}>{` `}Please use</span>
            </p>
            <p style={{ textAlign: 'left', color: '#ff9933' }}>Legacy or P2TR</p>
            <p style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-block' }}>Meanwhile,</span>
              <span style={{ display: 'inline-block', color: '#ff3399' }}>{` `}DO NOT</span>
              <span style={{ display: 'inline-block' }}>{` `}mix other assets in your wallet.</span>
            </p>
          </div>,
        );
      } else {
        setVisible(true);
        setIsAllowedAddressType(false);
        setModalContent(
          <div style={{ textAlign: 'left' }}>
            <p style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-block' }}>Please ensure that this address is used</span>
              <span style={{ display: 'inline-block', color: '#ff3399' }}>{` `}EXCLUSIVELY FOR ARC-20</span>
              <span style={{ display: 'inline-block' }}>{` `}assets and is not mixed with other assets such as</span>
            </p>
            <p style={{ textAlign: 'left', color: '#ff9933' }}>BRC20 or Inscriptions.</p>
            <p style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-block' }}>Otherwise, there is a risk of your assets being</span>
              <span style={{ display: 'inline-block', color: '#ff3399' }}>{` `}LOST</span>
              <span style={{ display: 'inline-block' }}>{` `}during the transfer.</span>
            </p>
          </div>,
        );
      }
    }

    return p2trAddress;
  };

  useEffect(() => {
    if (address && service) {
      (async () => {
        try {
          await getWalletInfo();
        } catch (error) {
          // await service.close();
          console.log('get wallet info error + ', error);
          showToast({ content: `${error}`, type: 'fail' });
        }
      })();
    } else {
      if (address === undefined) {
        (async () => {
          try {
            await getAddress();
          } catch (error) {
            console.log('get address error');
            showToast({ content: `${error}`, type: 'fail' });
          }
          // await service.ensureService();
        })();
      } else if (!service && address) {
        init();
      }
    }
  }, [address, service]);

  const handleBalanceMap = () => {
    if (balanceMap) {
      return Object.values(balanceMap)
        .filter(v => {
          return v.type === 'FT';
        })
        .map(data => {
          return (
            <div
              style={{
                padding: 16,
                // backgroundColor: '#000',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                display: 'flex',
                borderBottom: '1px solid #e5e7eb',
                color: '#fff',
                fontSize: 18,
              }}
              onTouchEnd={() => {
                console.log({ id: data.atomical_id });
                setRelatedAtomicalId(data.atomical_id);
                setRelatedConfirmed(data.confirmed);
                setRelatedType(data.type);
                setRelatedTicker(data.ticker);
                const utxos = handleUtxos(data.atomical_id);
                console.log({ utxos });
                setRelatedUtxos(utxos);
                setVisible(true);
                // setModalContent('Transaction will be implemented soon');
              }}
              key={data.atomical_id}
            >
              <div>{`\$${data.ticker.toUpperCase()}`}</div>
              <div>{data.confirmed}</div>
            </div>
          );
        });
    }
  };

  return (
    <>
      <div style={{ minWidth: 320, width: '100%' }}>
        <section
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            paddingTop: 32,
            paddingBottom: 32,
            flex: 1,
          }}
        >
          <img src="./icon.png" style={{ width: 48, height: 48, borderRadius: 24 }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <div
              style={{ padding: 16, borderRadius: 16, backgroundColor: '#000', marginRight: 16 }}
              onTouchEnd={() => {
                if (address && address !== '') {
                  setVisible(true);
                  setIsAllowedAddressType(false);
                  setModalContent(
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ textAlign: 'left' }}>
                        <span style={{ display: 'inline-block' }}>Please make sure this address is</span>
                        <span style={{ display: 'inline-block', color: '#ff3399' }}>{` `}NOT</span>
                        <span style={{ display: 'inline-block' }}>{` `}mixed with other assets, for examples:</span>
                      </p>
                      <p style={{ textAlign: 'left', color: '#ff9933' }}>BRC20, Inscriptions</p>
                      <p style={{ textAlign: 'left' }}>
                        <span style={{ display: 'inline-block' }}>Otherwise your assets might be</span>
                        <span style={{ display: 'inline-block', color: '#ff3399' }}>{` `}LOST</span>
                        <span style={{ display: 'inline-block' }}>{` `}during transfer</span>
                      </p>
                    </div>,
                  );
                  window.navigator.clipboard.writeText(address);
                  showToast({ content: 'Copy Success', type: 'success' });
                }
              }}
            >
              {address ? handleAddress(address) : '...'}
            </div>
            <div
              style={{ padding: 16, borderRadius: 16, backgroundColor: '#000' }}
              onTouchEnd={() => {
                showToast({ content: 'NFT/Domains Soon', type: 'success' });
              }}
            >
              Tokens
            </div>
          </div>
        </section>
        <section>
          <div
            style={{
              color: '#fff',
              fontSize: 24,
              fontFamily:
                'EuclidCircularB,Inter var,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji',
            }}
          >
            <span>Token Balance</span>
            <span
              style={{
                fontSize: 24,
                marginLeft: 16,
                display: 'inline-block',
              }}
              onTouchEnd={async () => {
                try {
                  await getWalletInfo();
                  showToast({ content: 'Balance Updated', type: 'success' });
                } catch (error) {
                  console.log(error);
                  // await service.close();
                  showToast({ content: `${error}`, type: 'fail' });
                }
              }}
            >{`🚀`}</span>
          </div>

          <div
            style={{
              color: '#fff',
              fontSize: 64,
              padding: 32,
              fontFamily:
                'EuclidCircularB,Inter var,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji',
            }}
          >
            {balance ?? '---'}
          </div>
          <div
            style={{
              color: '#fff',
              fontSize: 16,
              fontFamily:
                'EuclidCircularB,Inter var,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji',
            }}
          >
            Available BTC
          </div>
          <div
            style={{
              color: '#f6f6f6',
              fontSize: 18,
              padding: 8,
              fontFamily:
                'EuclidCircularB,Inter var,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji',
            }}
          >
            {fundingBalance ?? '---'} sats
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#1e1f25',
            padding: 32,
            borderRadius: 16,
            marginTop: 32,
          }}
        >
          {handleBalanceMap()}
        </section>
      </div>
      <Modal
        visible={visible}
        onHide={() => {
          console.log('hide');
          setRelatedUtxos([]);
          setRelatedAtomicalId(undefined);
          setRelatedConfirmed(undefined);
        }}
        onShow={() => {
          console.log('show');
          console.log({ relatedUtxos });
        }}
        onMaskClick={() => {
          // setVisible(false);
        }}
        contentStyle={{
          position: 'absolute',
          // top: '150rpx',
          // left: '0',
          // minWidth: '100%',
          minWidth: '300rpx',
          padding: 0,
          color: '#000',
          left: '50%',
          bottom: '0%',
          height: '1200rpx',
          transform: `translate(-50%,0%)`,
          backgroundColor: '#242424',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            color: '#fff',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32rpx',
          }}
        >
          {isAllowedAddressType && relatedAtomicalId ? (
            <Transfer
              originAddressType={originAddressType}
              originAddress={originAddress}
              primaryAddress={address!}
              xonlyPubHex={xOnlyPubHex!}
              fundingBalance={fundingBalance!}
              nonAtomUtxos={nonAtomUtxos}
              relatedAtomicalId={relatedAtomicalId!}
              relatedUtxos={relatedUtxos}
              relatedConfirmed={relatedConfirmed!}
              relatedType={relatedType!}
              relatedTicker={relatedTicker!}
              service={service}
              provider={provider}
              setVisible={() => {
                setVisible(false);
              }}
            />
          ) : (
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  marginBottom: 32,
                  padding: 32,
                }}
              >
                {modalContent}
              </div>
              {modalClosable ? (
                <div
                  style={{
                    backgroundColor: '#3399ff',
                    color: '#fff',
                    padding: '30px 40px',
                    maxWidth: 400,
                  }}
                  onTouchStart={() => {
                    setIsAllowedAddressType(true);
                    setVisible(false);
                  }}
                >
                  I Understand
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export default App;
