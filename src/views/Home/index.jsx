import React, { useRef, useState, useEffect } from "react";

import "@tensorflow/tfjs-backend-webgl";

import { createDetector, estimatePose } from "../../utils/moveNet";
import { drawPose } from "../../utils/moveNetDrawing";
import useWebcam from "../../hooks/useWebcam";
import useCanvas from "../../hooks/useCanvas";
import S from "./style.module.css";

const WIDTH = 640;
const HEIGHT = 480;

let rafId = null;
let detector = null;

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [moveNetLoaded, setMoveNetLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const { drawFrameOnCanvas, clearCanvas, canvasContext } = useCanvas(canvasRef);
  const { playVideo, stopVideo, video, videoLoaded, setVideoLoaded } =
    useWebcam(videoRef);

  const loadMoveNet = async () => {
    detector = await createDetector();
  };

  const start = async () => {
    playVideo(videoRef);
    setMessage("loading moveNet...");

    try {
      await loadMoveNet();
      setMoveNetLoaded(true);
      setMessage("moveNet loaded");
      console.log("video", video);
    } catch (e) {
      setMessage("No se pudo cargar moveNet");
      console.log("error: ", e);
    }
  };

  const drawMoveNet = async () => {
    if (videoLoaded) {
      try {
        const pose = await estimatePose(video, detector);

        const keypoints = pose[0].keypoints;
        const angleLeft = calculateAngle(keypoints[5], keypoints[7], keypoints[9]);
        console.log(angleLeft);

        drawFrameOnCanvas(video);
        drawPose(pose[0], canvasContext);

        rafId = requestAnimationFrame(drawMoveNet);
      } catch (e) {
        console.log("No se pudo dibujar el canvas", e);
      }
    }
  };

  const draw = () => {
    setMessage("Drawing...");
    drawMoveNet();
  };

  const stop = () => {
    window.cancelAnimationFrame(rafId);
    detector.dispose();
    clearCanvas(canvasRef, canvasContext);
    stopVideo(videoRef);
    setMessage("Stopped");
  };

  /* 
  5: {y: 376.11812591552734, x: 511.36341094970703, score: 0.6282356977462769, name: "left_shoulder"}
  6: {y: 402.25189208984375, x: 166.63881301879883, score: 0.5707257390022278, name: "right_shoulder"}
  7: {y: 490.8916091918945, x: 594.706916809082, score: 0.14026609063148499, name: "left_elbow"}
  8: {y: 481.4422225952148, x: 85.7304573059082, score: 0.46147724986076355, name: "right_elbow"}
  9: {y: 419.6186065673828, x: 604.1909027099609, score: 0.2137855440378189, name: "left_wrist"}
  10: {y: 296.9840621948242, x: 71.44859790802002, score: 0.29132819175720215, name: "right_wrist"}
  11: {y: 479.81288909912104, x: 449.5811080932617, score: 0.08595475554466248, name: "left_hip"}
  12: {y: 482.9329681396484, x: 228.67826461791992, score: 0.11088351905345917, name: "right_hip"}
  13: {y: 383.33377838134766, x: 525.8654022216797, score: 0.19288723170757294, name: "left_knee"}
  14: {y: 372.1235656738281, x: 152.66307830810547, score: 0.10101945698261261, name: "right_knee"}
  15: {y: 328.81317138671875, x: 622.347412109375, score: 0.20611055195331573, name: "left_ankle"}
  16: {y: 323.6127471923828, x: 288.4675407409668, score: 0.05060917139053345, name: "right_ankle"}
  */
  const calculateAngle = (p1, p2, p3) => {
    const { x: x1, y: y1, score1, name1 } = p1;
    const { x: x2, y: y2, score2, name2 } = p2;
    const { x: x3, y: y3, score3, name3 } = p3;

    const angle =
      (Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2)) / (Math.PI / 180);

    return angle;
  };

  return (
    <div>
      <h1>Home</h1>
      <button onClick={start}>Start</button>
      {videoLoaded && <button onClick={stop}>Stop</button>}
      {moveNetLoaded && <button onClick={draw}>Start drawing</button>}
      <div>{message}</div>
      <section>
        <video
          id="video"
          ref={videoRef}
          className={S.video}
          width={WIDTH}
          height={HEIGHT}
          autoPlay
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
        ></video>
        <canvas
          id="canvas"
          ref={canvasRef}
          className={S.video}
          width={WIDTH}
          height={HEIGHT}
        ></canvas>
      </section>
    </div>
  );
};

export default Home;
