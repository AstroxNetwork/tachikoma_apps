import React from "react";
import { useSpring, animated, config } from "react-spring";

const LoadingDots = () => {
  const dot1Props = useSpring({
    from: { transform: "translateY(2px)" },
    to: { transform: "translateY(-3px)" },
    config: { duration: 500 },
    reset: true,
    loop: { reverse: true, delay: 250 },
  });

  const dot2Props = useSpring({
    from: { transform: "translateY(1px)" },
    to: { transform: "translateY(-2px)" },
    config: { duration: 500 },
    reset: true,
    loop: { reverse: true, delay: 500 },
  });

  const dot3Props = useSpring({
    from: { transform: "translateY(1px)" },
    to: { transform: "translateY(-1px)" },
    config: { duration: 500 },
    reset: true,
    loop: { reverse: true, delay: 350 },
  });

  return (
    <div className="flex justify-center items-center mx-2">
      <animated.div style={dot1Props}>
        <div className="w-[3px] h-[3px] rounded-full bg-gray-500 mx-[2px]" />
      </animated.div>
      <animated.div style={dot2Props}>
        <div className="w-[3px] h-[3px] rounded-full bg-gray-500 mx-[2px]" />
      </animated.div>
      <animated.div style={dot3Props}>
        <div className="w-[3px] h-[3px] rounded-full bg-gray-500 mx-[2px]" />
      </animated.div>
    </div>
  );
};

export default LoadingDots;
