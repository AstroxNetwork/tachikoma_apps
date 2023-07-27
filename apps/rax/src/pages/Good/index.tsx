import { createElement } from 'rax';
import View from 'rax-view';
import Text from 'rax-text';

import styles from '../Home/index.module.css';
import Logo from '../../components/Logo';

export default function Good() {
  return (
    <View className={styles.homeContainer}>
      <Logo uri="//wizzwallet.io/assets/logo-0adc8f64.svg" />
      <Text className={styles.homeTitle}>Good Day Wizz!</Text>
      <Text className={styles.homeInfo}>Welcome here</Text>
      <Text
        className={styles.homeInfo}
        onClick={async () => {
          window.open('http://127.0.0.1:5500/kraken/home.kbc1');
        }}
      >
        Click to Back to Home Page
      </Text>
    </View>
  );
}
