import { useEffect, useState } from 'react';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState('');

  useEffect(() => {
    console.log('\n ==============');
    console.log({ data });
  }, [data]);

  return (
    <>
      <div>
        {/* <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a> */}
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <div onTouchEnd={() => setCount(count => count + 1)}>Click me</div>
        <p style={{ color: '#3399ff' }}>count is {count}</p>
      </div>
      <div className="card">
        <div
          onTouchEnd={async () => {
            const addr = await what();
            setData(addr);
          }}
        >
          Click me to fetch Data
        </div>
        <p style={{ color: '#3399ff' }}>data is {data}</p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

async function what() {
  const d = await fetch('https://api.ipify.org?format=json');
  return JSON.stringify(d);
}

export default App;
