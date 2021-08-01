const useCanvas = (canvasRef) => {
  // const [canvasContext, setCanvasContext] = useState(null);

  let canvasContext = canvasRef.current?.getContext("2d") || null;

  // const captureFrame = (video) => {
  //   canvasContext.drawImage(video, 0, 0, 640, 480);
  //   let img = null;
  //   canvasRef.toBlob((blob) => {
  //     img = new Image();
  //     img.src = window.URL.createObjectUrl(blob);
  //   });
  //   return img;
  // };

  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
  // Draws video frame on canvas
  const drawFrameOnCanvas = (video) => {
    canvasContext.drawImage(video, 0, 0, 640, 480);
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clearRect
  // Clears canvas from screen
  const clearCanvas = (canvas, canvasContext) => {
    canvasContext.clearRect(0, 0, canvas.current.width, canvas.current.height);
    canvasContext = null;
  };

  return { drawFrameOnCanvas, clearCanvas, canvasContext };
};

export default useCanvas;
