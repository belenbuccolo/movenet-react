import * as poseDetection from "@tensorflow-models/pose-detection";

export async function createDetector() {
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  };
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  );
  return detector;
}

export async function estimatePose(video, detector) {
  let pose = null;
  if (video) {
    pose = await detector.estimatePoses(video, {
      maxPoses: 1, //When maxPoses = 1, a single pose is detected
      // flipHorizontal: false,
    });
  }
  return pose;
}

export const flattenKeypoints = (keypoints) => {
  const flattenedKeypoints = [];
  for (let i = 0; i < keypoints.length; i++) {
    flattenedKeypoints.push(keypoints[i]["y"]);
    flattenedKeypoints.push(keypoints[i]["x"]);
    flattenedKeypoints.push(keypoints[i]["score"]);
  }
  return flattenedKeypoints;
};
