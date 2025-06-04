async function uploadImage() {
    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.style.display = 'none';

    let input = document.getElementById("folder-input");
    let file = input.files[0];
    if (!file) {
      input = document.getElementById("image-input");
      file = input.files[0];
      if (!file) {
        alert("Please select an image.");
        return;
      }
    } else {
      return
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://127.0.0.1:8000/upload/", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        // Show YOLO labels
        const yoloList = document.getElementById("yolo-labels");
        let yoloColumn;
        yoloList.innerHTML = "";
        data.yolo_labels.forEach((label, index) => {
            if (index % 6 === 0) {
              yoloColumn = document.createElement("ul");
              yoloColumn.className = "yolo-results";
              yoloList.appendChild(yoloColumn);
            }
            const li = document.createElement("li");
            li.textContent = `${label.label} (${(label.confidence * 100).toFixed(1)}%)`;
            yoloColumn.appendChild(li);
        });
        yoloList.style.display = "flex";

        const yoloSection = document.getElementById("yolo-title");
        yoloSection.innerHTML = "<h3>YOLO Labels</h3>"


        // Show Google labels
        const googleList = document.getElementById("google-labels");
        let gooogleColumn;
        googleList.innerHTML = "";
        data.google_labels.forEach((label, index) => {
            if (index % 6 === 0) {
              gooogleColumn = document.createElement("ul");
              gooogleColumn.className = "yolo-results";
              googleList.appendChild(gooogleColumn);
            }
            const li = document.createElement("li");
            li.textContent = `${label.label} (${(label.confidence * 100).toFixed(1)}%)`;
            gooogleColumn.appendChild(li);
        });
        googleList.style.display = "flex";

        const googleSelection = document.getElementById("google-title");
        googleSelection.innerHTML = "<h3>Google Vision Labels</h3>";

        // Show YOLO labeled image
        const yoloImg = document.getElementById("yolo-image");
        yoloImg.src = `data:image/jpeg;base64,${data.yolo_image_base64}`;
        yoloImg.style.border = "#484349 3px solid";
        yoloImg.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.55)"

        // Show Google labeled image
        const googleImg = document.getElementById("google-image");
        googleImg.src = `data:image/jpeg;base64,${data.google_image_base64}`;
        googleImg.style.border = "#484349 3px solid";
        googleImg.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.55)"
        
        if (document.getElementById("drop-area")) {
          uploader = document.getElementById("drop-area");
          uploader.id = "drop-area-hid"
          folderUploader = document.getElementById("drop-area-folder");
          folderUploader.id = "drop-area-folder-hid"
        }

    } catch (err) {
        console.error(err);
        alert("Upload failed");
    }
}

document.getElementById("folder-input").addEventListener("change", async function () {
  const yoloList = document.getElementById("yolo-labels");
  yoloList.innerHTML = "";
  const yoloSection = document.getElementById("yolo-title");
  yoloSection.innerHTML = ""
  const yoloImg = document.getElementById("yolo-image");
  yoloImg.src = '';
  yoloImg.style.border = "none";
  yoloImg.style.boxShadow = "none";
  
  const googleList = document.getElementById("google-labels");
  googleList.innerHTML = "";
  const googleSelection = document.getElementById("google-title");
  googleSelection.innerHTML = "";
  const googleImg = document.getElementById("google-image");
  googleImg.src = '';
  googleImg.style.border = "none";
  googleImg.style.boxShadow = "none";

  const downloadBtn = document.getElementById("download-btn");
  downloadBtn.style.display = 'none';

  const files = this.files;
  if (!files.length) return;

  loading(files.length);

  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  try {
    const response = await fetch("http://localhost:8000/upload-folder/", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.download_url) {
      // Show and update the existing download button
      const downloadBtn = document.getElementById("download-btn");
      downloadBtn.href = result.download_url;
      downloadBtn.style.display = "block";
      downloadBtn.innerText = "Download Excel File";
      downloadBtn.setAttribute("download", "results.xlsx"); // Suggests filename on download
    } else {
      console.error("No download URL returned from server");
    }
  } catch (err) {
    console.error("Upload failed", err);
  }

  this.value = "";
});

document.addEventListener("DOMContentLoaded", () => {
  let dropArea = '';
  let dropAreaFolder = '';
  if (document.getElementById("yolo-results")) {
    dropArea = document.getElementById("drop-area-hid");
    dropAreaFolder = document.getElementById("drop-area-folder-hid");
  } else {
    dropArea = document.getElementById("drop-area");
    dropAreaFolder = document.getElementById("drop-area-folder");
  }
  const fileInput = document.getElementById("image-input");
  const folderInput = document.getElementById("folder-input");

  dropArea.addEventListener("click", () => fileInput.click());
  dropAreaFolder.addEventListener("click", () => folderInput.click());

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });

  dropAreaFolder.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropAreaFolder.classList.add("dragover");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
  });

  dropAreaFolder.addEventListener("dragleave", () => {
    dropAreaFolder.classList.remove("dragover");
  });

  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files; // Sync dropped file to hidden input
      uploadImage();
    }
  });

  dropAreaFolder.addEventListener("drop", (e) => {
    e.preventDefault();
    dropAreaFolder.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files; // Sync dropped file to hidden input
      uploadImage();
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      uploadImage();
    }
  });

  folderInput.addEventListener("change", () => {
    if (folderInput.files.length > 0) {
      uploadImage();
    }
  });
});


function loading(fileAmount) {
  const avgTimePerFile = 810;
  const estimatedTime = fileAmount * avgTimePerFile;

  let startTime = Date.now();
  const currentProgress = document.getElementById("current-progress");
  const progressBar = document.getElementById("progress-bar");
  const statusText = document.getElementById("status-text");

  currentProgress.style.display = 'block';
  progressBar.style.display = 'block';
  statusText.style.display = 'block';

  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / estimatedTime, 1);
    currentProgress.style.width = (progress * 100) + "%";
    statusText.innerText = `Processing... ${(progress * 100).toFixed(0)}%`;

    if (progress >= 1) {
      clearInterval(interval);
      currentProgress.style.display = 'none';
      currentProgress.style.width = '0%'
      statusText.innerText = 'Processing... 0%';
      statusText.style.display = 'none';
      progressBar.style.display = 'none';
    }
  }, 100);
}