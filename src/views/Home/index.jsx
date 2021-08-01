import React, { useRef, useState, useEffect } from "react";

import * as tf from "@tensorflow/tfjs";
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

  // const loadTmModel = async () => {
  //   const model = await tf.loadLayersModel("/my_model/model.json");
  //   console.log("model", model);
  //   return model;
  // };

  // useEffect(() => {
  //   console.log("use effect");
  //   const model = loadTmModel();
  //   console.log("modelll", model);
  // }, []);

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

  return (
    <div>
      <title>Video</title>
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
