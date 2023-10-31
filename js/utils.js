function show(elemId) {
  document.getElementById(elemId).classList.remove("hidden");
}

function hide(elemId) {
  document.getElementById(elemId).classList.add("hidden");
}

const sleep = (waitSeconds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, waitSeconds * 1000);
  });
};

function toBlob(image) {
  const base64 = image.canvas.toDataURL();
  const bin = atob(base64.replace(/^.*,/, ""));
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i);
  }

  try {
    return (blob = new Blob([buffer.buffer], {
      type: "image/png",
    }));
  } catch (e) {
    return false;
  }
}

async function compressImg(img) {
  return new Promise((resolve) =>
    setTimeout(() => {
      img.resize(img.width / 2, 0);
      resolve();
    }, 100)
  );
}
