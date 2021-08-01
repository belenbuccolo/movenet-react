import * as poseDetection from "@tensorflow-models/pose-detection";

const MOVENET_CONFIG = {
  maxPoses: 1,
  type: "lightning",
  scoreThreshold: 0.3,
};

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_RADIUS = 4;

const model = poseDetection.SupportedModels.MoveNet;

// export const drawPoses = (poses) => {
//   for (const pose of poses) {
//     drawResult(pose);
//   }
// };

export const drawPose = (pose, canvasContext) => {
  if (pose.keypoints != null) {
    drawKeypoints(pose.keypoints, canvasContext);
    drawSkeleton(pose.keypoints, canvasContext);
  }
};

const drawKeypoints = (keypoints, context) => {
  const keypointInd = poseDetection.util.getKeypointIndexBySide(model);
  context.fillStyle = "White";
  context.strokeStyle = "White";
  context.lineWidth = DEFAULT_LINE_WIDTH;

  for (const i of keypointInd.middle) {
    drawKeypoint(keypoints[i], context);
  }

  context.fillStyle = "Green";

  for (const i of keypointInd.left) {
    drawKeypoint(keypoints[i], context);
  }

  context.fillStyle = "Orange";

  for (const i of keypointInd.right) {
    drawKeypoint(keypoints[i], context);
  }
};

const drawKeypoint = (keypoint, context) => {
  // If score is null, just show the keypoint.
  const score = keypoint.score != null ? keypoint.score : 1;
  const scoreThreshold = MOVENET_CONFIG.scoreThreshold || 0;

  if (score >= scoreThreshold) {
    const circle = new Path2D();
    circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
    context.fill(circle);
    context.stroke(circle);
  }
};

const drawSkeleton = (keypoints, context) => {
  context.fillStyle = "White";
  context.strokeStyle = "White";
  context.lineWidth = DEFAULT_LINE_WIDTH;
  poseDetection.util.getAdjacentPairs(model).forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j]; // If score is null, just show the keypoint.

    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;
    const scoreThreshold = MOVENET_CONFIG.scoreThreshold || 0;

    if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
      context.beginPath();
      context.moveTo(kp1.x, kp1.y);
      context.lineTo(kp2.x, kp2.y);
      context.stroke();
    }
  });
};
