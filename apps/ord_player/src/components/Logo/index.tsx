import { createElement } from 'rax';
import Image from 'rax-image';
import { ReactSVG } from 'react-svg';

import styles from './index.module.css';

interface LogoProps {
  uri: string;
}

export default (props: LogoProps) => {
  const { uri } = props;
  const source = { uri };
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="&#231;&#188;&#150;&#231;&#187;&#132;">
        <path
          id="Fill 1"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M44.416 23.3755L40.52 19.4795L36.624 23.3755L40.52 27.2714L44.416 31.1674L48.312 27.2714L44.416 23.3755Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 2"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M44.4162 0L40.5205 3.89571L44.4162 7.79169L48.3122 3.89571L44.4162 0Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 3"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M52.208 15.584L56.104 19.4797L60 15.584L56.104 11.688L52.208 15.584Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 4"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M36.625 46.7514L40.521 50.6474L44.417 46.7514L40.521 42.8555L36.625 46.7514Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 5"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M9.35254 19.4795L13.2485 23.3755L17.1445 19.4795L13.2485 15.5835L9.35254 19.4795Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 6"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M28.8325 0L24.9365 3.89571L28.8325 7.79196L32.7282 3.89571L28.8325 0Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 7"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M13.249 7.79197L17.145 11.688L21.041 7.79197L17.145 3.896L13.249 7.79197Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 8"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M52.208 31.1677L56.104 35.0637L60 31.1677L56.104 27.272L52.208 31.1677Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 9"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M48.3125 42.8555L52.2085 46.7514L56.1045 42.8555L52.2085 38.9595L48.3125 42.8555Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 10"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M21.0408 15.584L24.9365 19.4797L21.0408 23.3757L24.9365 27.2716L21.0408 31.1676L19.0927 29.2198L15.197 33.1157L19.0927 37.0114L15.197 40.9074L11.4945 44.6099L7.79196 48.3124L3.89598 52.2082L0 56.1041L3.89598 60.0001L7.79196 56.1041L11.6879 52.2082L15.3904 48.5059L15.5839 48.3124L19.0927 44.8034L19.2862 44.6099L22.9889 40.9074L26.8846 44.8034L30.7806 40.9074L28.8328 38.9596L32.7285 35.0636L36.6247 38.9596L40.5204 35.0636L44.4164 38.9596L48.3124 35.0636L44.4164 31.1676L40.5204 27.2716L36.6247 31.1676L32.7285 27.2716L28.8328 23.3757L32.7285 19.4797L28.8328 15.584L24.9365 11.688L21.0408 15.584Z"
          fill="#0B0B0F"
        />
        <path
          id="Fill 11"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M44.4169 15.584L40.5209 11.688L36.625 15.584L32.729 11.688L28.833 15.584L32.729 19.4799L28.833 23.3759L32.729 27.2719L36.625 31.1676L40.5209 27.2719L36.625 23.3759L40.5209 19.4799L44.4169 23.3759L48.3129 19.4799L44.4169 15.584Z"
          fill="#0B0B0F"
        />
      </g>
    </svg>
  );
  // return <Image className={styles.logo} source={source} />;
};
