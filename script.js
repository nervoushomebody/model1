const video = document.getElementById('webcam');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

const gestureNameInput = document.getElementById('gestureName');
const saveGestureBtn = document.getElementById('saveGesture');
const gestureListDiv = document.getElementById('gestureList');
const errorSlider = document.getElementById('errorSlider');
const errorValue = document.getElementById('errorValue');
const exportBtn = document.getElementById('exportGestures');
const importInput = document.getElementById('importGestures');

let gestureLibrary = JSON.parse(localStorage.getItem('gestures')) || {};
let errorThreshold = parseInt(errorSlider.value, 10);
let detector;

let overlays = [];

// Example gesture actions
const gestureActions = {
  "Add Shape": () => {
    overlays.push({ type: 'circle', x: 100, y: 100, radius: 30, color: 'green' });
  },
  "Move Shape": (gestureData) => {
    if (overlays.length > 0) {
      overlays[0].x += gestureData.dx || 10; // Example motion
      overlays[0].y += gestureData.dy || 10;
    }
  },
};

errorSlider.addEventListener('input', () => {
  errorValue.textContent = errorSlider.value; // Display current value
  errorThreshold = parseInt(errorSlider.value, 10);
});


// Set up webcam and canvas dimensions
async function setupWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
      resolve();
    };
  });
}

// Save gestures to localStorage
function saveGestures() {
  localStorage.setItem('gestures', JSON.stringify(gestureLibrary));
}


// Display saved gestures
function renderGestureList() {
  gestureListDiv.innerHTML = '';
  Object.keys(gestureLibrary).forEach((name) => {
    const div = document.createElement('div');
    div.className = 'gesture-item';
    div.innerHTML = `${name} <button onclick="deleteGesture('${name}')">Delete</button>`;
    gestureListDiv.appendChild(div);
  });
}

window.deleteGesture = (name) => {
  delete gestureLibrary[name];
  saveGestures();
  renderGestureList();
};

// Compare keypoints using Euclidean distance
function calculateDistance(point1, point2) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

function matchGesture(currentKeypoints) {
  for (const [name, savedKeypoints] of Object.entries(gestureLibrary)) {
    let totalDistance = 0;

    for (let i = 0; i < currentKeypoints.length; i++) {
      totalDistance += calculateDistance(currentKeypoints[i], savedKeypoints[i]);
    }

    const averageDistance = totalDistance / currentKeypoints.length;
    if (averageDistance < errorThreshold) {
      return name; // Return matched gesture name
    }
  }
  return null;
}

function renderOverlays() {
  overlays.forEach((overlay) => {
    if (overlay.type === 'circle') {
      ctx.beginPath();
      ctx.arc(overlay.x, overlay.y, overlay.radius, 0, 2 * Math.PI);
      ctx.fillStyle = overlay.color;
      ctx.fill();
    }
    // Add more shapes (e.g., rectangles, images) if needed
  });
}
// Main function for hand detection
async function main() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  detector = await handPoseDetection.createDetector(model, {
    runtime: 'mediapipe',

    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
  });

  await setupWebcam();

  async function detect() {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const hands = await detector.estimateHands(video);
  
    let recognizedGesture = null;
  
    if (hands.length > 0) {
      const keypoints = hands[0].keypoints;
  
      // Draw keypoints
      keypoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
  
      // Match gesture
      recognizedGesture = matchGesture(keypoints);
  
      // Execute gesture action
      if (recognizedGesture && gestureActions[recognizedGesture]) {
        gestureActions[recognizedGesture]({ dx: 5, dy: 5 }); // Example movement data
      }
    }
  
    // Display recognized gesture
    ctx.fillStyle = 'blue';
    ctx.font = '20px Arial';
    ctx.fillText(
      recognizedGesture ? `Gesture: ${recognizedGesture}` : 'No Gesture Recognized',
      10,
      30
    );
  
    // Render overlays
    renderOverlays();
  
    requestAnimationFrame(detect);
  }

  detect();
}

// Example: Save "Add Shape" gesture
saveGestureBtn.addEventListener('click', async () => {
  const gestureName = gestureNameInput.value.trim();
  if (!gestureName) {
    alert('Enter a gesture name!');
    return;

  }

  const hands = await detector.estimateHands(video);
  if (hands.length === 0) {
    alert('No hands detected!');
    return;
  }

  gestureLibrary[gestureName] = hands[0].keypoints;
  saveGestures();
  renderGestureList();
  alert(`Gesture "${gestureName}" saved!`);
});

// Export gestures
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(gestureLibrary)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gestures.json';
  a.click();
});

// Import gestures
importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const importedGestures = JSON.parse(e.target.result);
    gestureLibrary = { ...gestureLibrary, ...importedGestures };
    saveGestures();
    renderGestureList();
    alert('Gestures imported successfully!');
  };
  reader.readAsText(file);
});


renderGestureList();
main();
