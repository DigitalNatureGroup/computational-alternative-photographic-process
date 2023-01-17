const generateZipBlob = (nameContentPairs, name) => {
  function toBlob(base64) {
    var bin = atob(base64.replace(/^.*,/, ""));
    var buffer = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    // Blobを作成
    try {
      var blob = new Blob([buffer.buffer], {
        type: "image/png",
      });
    } catch (e) {
      return false;
    }

    return blob;
  }

  const zip = new JSZip();

  const folder = zip.folder(restrictFileName(name));

  nameContentPairs.forEach((nameContentPair) => {
    const name = restrictFileName(nameContentPair.name);
    const content = toBlob(nameContentPair.content);

    folder.file(name, content);
  });

  return zip.generateAsync({ type: "blob" }); // デフォルトで無圧縮
};

const saveBlob = (blob, name) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = restrictFileName(name) + ".zip";

  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Windows のファイル名に使用できない文字をエスケープ
 * Mac や Linux より Windows の方がファイル名の制限が厳しいため、Windows に合わせる
 */
const restrictFileName = (name) =>
  name.replace(/[\\\/:*?"<>|]/g, (c) => "%" + c.charCodeAt(0).toString(16));
