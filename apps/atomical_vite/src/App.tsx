import { useEffect, useState } from 'react';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css';
import { ElectrumApi } from './clients/eletrum';
import { AtomicalService } from './services/atomical';
import { IAtomicalBalances } from './interfaces/api';
import Modal from './components/Modal';

function handleAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 6, address.length)}`;
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

  const getWalletInfo = async () => {
    const addr = 'bc1pgvdp7lf89d62zadds5jvyjntxmr7v70yv33g7vqaeu2p0cuexveq9hcwdv';
    setAddress(addr);
    await api.open();
    console.log(api.isOpen());
    const walletInfo = await service.walletInfo(addr, false);
    console.log(walletInfo);
    const { data } = walletInfo;
    const { atomicals_confirmed, atomicals_balances } = data;
    setBalance(atomicals_confirmed);
    setBalanceMap(atomicals_balances as IAtomicalBalances);
  };

  useEffect(() => {
    (async () => {
      await getWalletInfo();
    })();
  }, []);

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
              fontSize: 32,
            }}
            onTouchEnd={() => {
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
      <div style={{ minWidth: 600, width: '100%' }}>
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
            <div style={{ padding: 16, borderRadius: 16, backgroundColor: '#000', marginRight: 16 }}>{address ? handleAddress(address) : '...'}</div>
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
        }}
        onShow={() => {
          console.log('show');
        }}
        onMaskClick={() => {
          setVisible(false);
        }}
        contentStyle={{
          position: 'absolute',
          // top: '150rpx',
          // left: '0',
          // minWidth: '100%',
          width: '300rpx',
          padding: '32rpx',
          color: '#000',
          left: '50%',
          top: '50%',
          transform: `translate(-50%,-50%)`,
        }}
      >
        <p>{modalContent ?? '---'}</p>
      </Modal>
    </>
  );
}

export default App;
