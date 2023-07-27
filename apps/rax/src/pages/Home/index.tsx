import { createElement } from 'rax';
import View from 'rax-view';
import Text from 'rax-text';

import styles from './index.module.css';
import Logo from '../../components/Logo';

export default function Home() {
  return (
    <View className={styles.homeContainer}>
      <Logo uri="//wizzwallet.io/assets/logo-0adc8f64.svg" />
      <Text className={styles.homeTitle}>Hello Wizz!</Text>
      <Text className={styles.homeInfo}>More information about Wizz</Text>
      <Text className={styles.homeInfo}>Visit https://wizzwallet.io</Text>
      <Text
        className={styles.homeInfo}
        onClick={async () => {
          window.open('http://127.0.0.1:5500/kraken/good.kbc1');
        }}
      >
        Click to Href to Good Page
      </Text>
    </View>
  );
}
