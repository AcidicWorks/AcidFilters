const isMobileDevice = 
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i);

// -- DOM elements --

const menu = document.querySelector('#opt-menu');
const videoSelect = document.querySelector('#videoSource');
const video = document.querySelector('#video');
const canvas = document.querySelector('#canvas');
const vs = document.querySelector('#vshader').textContent;
const fs = document.querySelector('#fshader').textContent;

// -- Setup shader program and variables --

const gl = canvas.getContext('webgl', { preserveDrawingBuffer:true });
const program = createProgram(gl, vs, fs);
const width = gl.getUniformLocation(program, 'width');
const height = gl.getUniformLocation(program, 'height');
const sampler = gl.getUniformLocation(program, 'sampler0');
const position = gl.getAttribLocation(program, 'position');
const texture = createTexture(gl);
const vertexBuffer = webglScreenQuad(gl);
gl.uniform1i(sampler, 0);
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
let animID = undefined;
let facingCameraId = undefined;
let facingFrontId = undefined;
let facingBackId = undefined;

hideMenu();

// -- DOM events --

document.addEventListener('DOMContentLoaded', function(event) {
    if (isMobileDevice) {
        let snapshot = document.querySelector('#snapshot');
        snapshot.parentNode.removeChild(snapshot);
    }

    setupCamera(video, {video:true}, (err, stream) => {
        if (err)
            alert(err);
        else
            discoverCameras((err, camera) => {
                if (err)
                    alert(err);
                else {
                    const option = document.createElement('option');
                    option.value = camera.id;
                    option.text = camera.label;
                    videoSelect.appendChild(option);

                    let label = camera.label.toLowerCase();
                    let isFrontCamera = label.includes('front');
                    let isBackCamera = label.includes('back');
                    if (isFrontCamera || isBackCamera) {
                        if (isFrontCamera) {
                            facingFrontId = camera.id;
                            facingCameraId = camera.id;
                        }
                        else {
                            facingBackId = camera.id;
                            facingCameraId = camera.id;
                        }
                        videoSelect.onchange();
                        if (facingFrontId && facingBackId) {
                            videoSelect.classList.add('hide');
                            document.querySelector('#facingMode').classList.remove('hide');
                        }
                    }   
                    else if (videoSelect.length === 1 || label.indexOf('built-in') !== -1) {
                        option.setAttribute('selected', 'selected');
                        videoSelect.dispatchEvent(new Event('change'));
                    }							
                }
            });
    });
});

videoSelect.onchange = () => {
    const id = facingCameraId ? facingCameraId : videoSelect.value;
    startVideo(id);
};	

// -- Menu tasks --

function hideOnBoarding() {
    let onboarding = document.querySelector('#on-boarding');
    if (onboarding) 
        onboarding.classList.add('fade-out');
}

function goToParentPage() {
    window.location = 'index.html';
}

function showMenu() {
    menu.style.display = 'block';
}

function hideMenu() {
    menu.style.display = 'none';
}

function toggleMenu() {
    menu.style.display === 'none' || menu.style.display === '' ? showMenu() : hideMenu();;
}

function toggleFacingMode() {
    if (facingFrontId && facingBackId) {
        facingCameraId = facingCameraId === facingFrontId ? facingBackId : facingFrontId;
        videoSelect.onchange();
    }
}

function saveSnapshot() {
    const now = new Date();
    const stamp = 
         `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-` + 
         `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const img = document.querySelector('#snapshot-img');
    const link = document.querySelector('#snapshot-link');
    img.src = canvas.toDataURL();
    link.download = `webcam-${stamp}.png`;
    link.href = img.src;
    link.click();
}

function createSlider(id, name, min, max, step, oninput) {
    const label = document.createElement('div');
    label.className = 'slider-label';
    label.for = id;
    label.innerText = name;
    const input = document.createElement('input');
    input.className = 'slider-input';
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step
    input.oninput = oninput;
    const slider = document.createElement('div');
    slider.className = 'slider';
    slider.id = id;
    slider.appendChild(input);
    slider.appendChild(label);
    document.querySelector('#sliders').appendChild(slider);
    return (val) => { 
        input.value = val;
        input.oninput();
    };
}

function createPreset(name, onclick) {
    const preset = document.createElement('button');
    preset.className = 'preset';
    preset.innerText = name;
    preset.onclick = onclick;
    document.querySelector('#presets').appendChild(preset);
    return preset;
}	

// -- Video tasks --

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.width * (video.videoHeight / video.videoWidth);			
    gl.uniform1f(width, canvas.width);
    gl.uniform1f(height, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function startVideo(id) {
    const constraints = {
        video: { 
            width: video.videoWidth,
            deviceId: id ? { exact:id } : null
        },
        audio: true,
    };

    setupCamera(video, constraints, (err, stream) => {
        if (err)
            alert('WEBCAM FAILED: ' + err);
        else {
            resizeCanvas();
            startAnimation();
            hideOnBoarding();
        }
    });
}

function startAnimation() {
    window.cancelAnimationFrame(animID);
    animID = window.requestAnimationFrame(function loop() {
        updateTexture(gl, texture, vertexBuffer, video);
        animID = window.requestAnimationFrame(loop);
    });
}		
