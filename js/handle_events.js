// for materialize
document.addEventListener("DOMContentLoaded", function () {
  const elem = document.querySelectorAll("select")[0];
  M.FormSelect.init(elem, []);
});

function handleSelect(event) {
  process = event.target.value;
  toneCurve?.updateProcess(process.endsWith("_full") ? "full" : "mono");

  completeForm();
}

// on upload file
function handleFile(file, imgType) {
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const blob = event.currentTarget.result;
      if (imgType === "colorpatch") {
        colorpatchImg = loadImage(blob);
      } else if (imgType === "target") {
        originalImg = loadImage(blob);
        currentImg = loadImage(blob);

        await sleep(0.1);

        originalImg.resize(originalImg.width / 2, 0);
        currentImg.resize(currentImg.width / 2, 0);

        completeForm();
      }
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please upload image file!!");
    currentImg = null;
  }
}

function onClickTabItem(index) {
  const headers = document.getElementsByClassName("editor-tab-header-item");
  headers.forEach((e) => e.classList.remove("selected"));
  headers[index].classList.add("selected");

  const contents = document.getElementsByClassName("editor-tab-item");
  contents.forEach((e) => hide(e.id));
  show(contents[index].id);

  currentEditorItemIndex = index;
  resetParameters();
}
