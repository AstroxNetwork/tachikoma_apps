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

const provider = new AstroXWizzInhouseProvider();

export function handleAddress(address: string, padding: number = 6): string {
  return `${address.substring(0, padding)}...${address.substring(address.length - padding, address.length)}`;
}

function App() {
  const ELECTRUMX_WSS = 'wss://electrumx.atomicals.xyz:50012';

  const api = ElectrumApi.createClient(ELECTRUMX_WSS);

  const service = new AtomicalService(api);

  const [address, setAddress] = useState<string | undefined>(undefined);
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [balanceMap, setBalanceMap] = useState<IAtomicalBalances | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [modalContent, setModalContent] = useState<string | undefined>(undefined);
  const [atomUtxos, setAtomUtxos] = useState<ISelectedUtxo[]>([]);
  const [relatedUtxos, setRelatedUtxos] = useState<ISelectedUtxo[]>([]);
  const [relatedAtomicalId, setRelatedAtomicalId] = useState<string | undefined>(undefined);
  const [relatedConfirmed, setRelatedConfirmed] = useState<number | undefined>(undefined);
  const [relatedType, setRelatedType] = useState<'FT' | 'NFT' | undefined>(undefined);
  const [relatedTicker, setRelatedTicker] = useState<string | undefined>(undefined);
  const [xOnlyPubHex, setXonlyPubHex] = useState<string | undefined>(undefined);

  const getWalletInfo = async () => {
    // const addr = await getAddress();
    if (address) {
      await api.open();
      const walletInfo = await service.walletInfo(address, false);
      const { data } = walletInfo;
      const { atomicals_confirmed, atomicals_balances, atomicals_utxos } = data;
      console.log(data);
      console.log({ atomicals_confirmed });
      setBalance(atomicals_confirmed);
      setBalanceMap(atomicals_balances as IAtomicalBalances);
      if (atomicals_utxos.length > 0) {
        setAtomUtxos(atomicals_utxos);
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
    // const accs = await provider.requestAccounts();
    // const p2trPub = await provider.getPublicKey(accs[0]);
    // const xpub = (toXOnly(Buffer.from(p2trPub, 'hex')) as Buffer).toString('hex');
    setXonlyPubHex('133c85d348d6c0796382966380719397453592e706cd3329119a2d2cb8d2ff7b');
    const p2trAddress = 'bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv'; //fromPubToP2tr(p2trPub);
    setAddress(p2trAddress);

    return p2trAddress;
  };

  useEffect(() => {
    if (address === undefined) {
      (async () => {
        await getAddress();
      })();
    } else {
      (async () => {
        await getWalletInfo();
      })();
    }
  }, [address]);

  const handleBalanceMap = () => {
    if (balanceMap) {
      return Object.keys(balanceMap).map(key => {
        const data = balanceMap[key];
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
              setModalContent('Transaction will be implemented soon');
            }}
            key={key}
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
                  window.navigator.clipboard.writeText(address);
                  showToast('Copy Success');
                }
              }}
            >
              {address ? handleAddress(address) : '...'}
            </div>
            <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#000' }}>Tokens</div>
          </div>
        </section>
        <section>
          <div
            style={{
              color: '#fff',
              fontSize: 80,
              padding: 16,
              fontFamily:
                'EuclidCircularB,Inter var,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji',
            }}
          >
            {balance ?? '---'}
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
          padding: '32rpx',
          color: '#000',
          left: '50%',
          top: '50%',
          height: '1000rpx',
          transform: `translate(-50%,-50%)`,
          backgroundColor: '#242424',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
          }}
        >
          {relatedAtomicalId ? (
            <Transfer
              primaryAddress={address!}
              xonlyPubHex={xOnlyPubHex!}
              relatedAtomicalId={relatedAtomicalId!}
              relatedUtxos={relatedUtxos}
              relatedConfirmed={relatedConfirmed!}
              relatedType={relatedType!}
              relatedTicker={relatedTicker!}
              service={service}
              setVisible={() => {
                setVisible(false);
              }}
            />
          ) : null}
        </div>
      </Modal>
    </>
  );
}

export default App;
