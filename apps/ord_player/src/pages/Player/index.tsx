import { createElement, useEffect, useRef, useState } from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import styles from './index.module.css';

export default function Player() {
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        backgroundColor: '#000',
      }}
    >
      <View
        style={{
          height: 64,
          width: '100%',
          backgroundColor: 'rgba(255,255,0,0.5)',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', padding: 32 }}>Close</Text>
        <Text style={{ color: '#fff', padding: 32 }}>Song Name</Text>
        <Text style={{ color: '#fff', padding: 32 }}>About</Text>
      </View>

      <canvas id="wrap" height="600" width="600">
        <View
          style={{
            width: 600,
            height: 600,
          }}
          className={styles.rotate}
        >
          <Text>what</Text>
        </View>
      </canvas>

      <View
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        <View
          style={{
            height: 100,
            width: '100%',
            flex: 1,
            // backgroundColor: 'rgba(0,255,255,0.5)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>❤️</Text>
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>🔨</Text>
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>💬</Text>
        </View>
        <View
          style={{
            height: 60,
            width: '100%',
            flex: 1,
            backgroundColor: 'rgba(0,255,0,0.5)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', padding: 32 }}>play bar</Text>
        </View>
        <View
          style={{
            height: 128,
            width: '100%',
            flex: 1,
            // backgroundColor: 'rgba(255,255,0,0.5)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>🔀</Text>
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>⏮️ </Text>
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>▶️</Text>
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>⏭️</Text>
          <Text style={{ color: '#fff', padding: 32, display: 'block', fontSize: 48 }}>⏏️</Text>
        </View>
      </View>
    </View>
  );
}
