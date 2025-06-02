async function uploadImage() {
    const input = document.getElementById("image-input");
    const file = input.files[0];
    if (!file) {
        alert("Please select an image.");
        return;
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
        }

    } catch (err) {
        console.error(err);
        alert("Upload failed");
    }
}

document.addEventListener("DOMContentLoaded", () => {
  let dropArea = '';
  if (document.getElementById("yolo-results")) {
    dropArea = document.getElementById("drop-area-hid");
  } else {
    dropArea = document.getElementById("drop-area");
  }
  const fileInput = document.getElementById("image-input");

  dropArea.addEventListener("click", () => fileInput.click());

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
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

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      uploadImage();
    }
  });
});