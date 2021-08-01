import React, { useState, useRef } from "react";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

import { ControllerDataset } from "../../utils/controllerDataset";
import { createDetector, estimatePose, flattenKeypoints } from "../../utils/moveNet";
import { drawPose } from "../../utils/moveNetDrawing";
import useWebcam from "../../hooks/useWebcam";
import useCanvas from "../../hooks/useCanvas";
import S from "./style.module.css";

// The number of classes we want to predict. Up and down
const NUM_CLASSES = 2;

// Video and canvas size
const WIDTH = 640;
const HEIGHT = 480;

// Class to collect sample data
const controllerDataset = new ControllerDataset(NUM_CLASSES);

let rafId = null;
let detector = null;
let count = 0;

const Train = () => {
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

  const train = async (frame) => {
    if (controllerDataset.xs == null) {
      throw new Error("Add some examples before training!");
    }

    // Creates a 2-layer fully connected model. By creating a separate model,
    // rather than adding layers to the mobilenet model, we "freeze" the weights
    // of the mobilenet model, and only train weights from the new model.
    const model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        // tf.layers.flatten({ inputShape: (1, 51) }),
        // Layer 1.
        tf.layers.dense({
          inputShape: (10200, 1),
          units: 100,
          activation: "relu",
          kernelInitializer: "varianceScaling",
          useBias: true,
        }),
        // Layer 2. The number of units of the last layer should correspond
        // to the number of classes we want to predict.
        tf.layers.dense({
          units: NUM_CLASSES,
          kernelInitializer: "varianceScaling",
          useBias: false,
          activation: "softmax",
        }),
      ],
    });

    // Creates the optimizers which drives training of the model.
    const optimizer = tf.train.adam(0.0001);
    // We use categoricalCrossentropy which is the loss function we use for
    // categorical classification which measures the error between our predicted
    // probability distribution over classes (probability that an input is of each
    // class), versus the label (100% probability in the true class)>
    model.compile({ optimizer: optimizer, loss: "categoricalCrossentropy" });

    // We parameterize batch size as a fraction of the entire dataset because the
    // number of examples that are collected depends on how many examples the user
    // collects. This allows us to have a flexible batch size.
    // const batchSize = Math.floor(controllerDataset.xs.shape[0] * 0.4);
    // if (!(batchSize > 0)) {
    //   throw new Error(`Batch size is 0 or NaN. Please choose a non-zero fraction.`);
    // }

    // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
    model.fit(controllerDataset.xs, controllerDataset.ys, {
      // batchSize,
      epochs: 20,
      callbacks: {
        onBatchEnd: (batch, logs) => {
          console.log("FINISHED TRAINING, batch: ", batch, "loss: ", logs.loss);
        },
      },
    });
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

  const drawAndCollect = async (label) => {
    if (videoLoaded) {
      try {
        if (count < 100) {
          // Get keypoints from frame
          const pose = await estimatePose(video, detector);

          // Flatten keypoints and convert flattened array to tensor
          const keypoints = flattenKeypoints(pose[0].keypoints);
          const tensorKeypoints = tf.tensor1d(keypoints, "float32");

          // Save keypoints tensor from frame into dataset
          controllerDataset.addExample(tensorKeypoints, label);

          // Draw video and keypoints on canvas
          drawFrameOnCanvas(video);
          drawPose(pose[0], canvasContext);

          // Increment counter
          count++;

          // Collect another frame
          rafId = requestAnimationFrame(() => drawAndCollect(label));
        } else {
          // Once 100 frames were collected, stop
          stop();
          setMessage(`Finished collecting class ${label}`);
          console.log(controllerDataset.xs.shape, controllerDataset.ys.shape);
        }
      } catch (e) {
        console.log("Error: ", e);
      }
    }
  };

  // Collect frames until 100 frames are collected
  const collectSamples = (label) => {
    if (label === 1) setMessage("Collecting up movement...");
    if (label === 2) setMessage("Collecting down movement...");

    drawAndCollect(label);
  };

  // Stop video, clear canvas and reset count
  const stop = () => {
    window.cancelAnimationFrame(rafId);
    detector.dispose();

    clearCanvas(canvasRef, canvasContext);
    stopVideo(videoRef);

    setMessage("Stopped");
    count = 0;
  };

  return (
    <div>
      <h1>Training</h1>
      <div>{message}</div>
      <button onClick={start}>Start</button>
      {videoLoaded && <button onClick={stop}>Stop</button>}
      {moveNetLoaded && videoLoaded && (
        <div>
          <h4>Collect poses</h4>
          <div className={S.collect_buttons_container}>
            <div>
              Step 1:{" "}
              <button onClick={() => collectSamples(1)}>
                Collect class 1 (up movement)
              </button>
            </div>
            <div>
              Step 2:{" "}
              <button onClick={() => collectSamples(2)}>
                Collect class 2 (down movement)
              </button>
            </div>
            <div>
              Step 3: <button onClick={train}>Train model</button>
            </div>
          </div>
        </div>
      )}
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

export default Train;
