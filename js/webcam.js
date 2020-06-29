function setupCamera(video, constraints, callback) {
	if (navigator.mediaDevices === undefined || navigator.mediaDevices.getUserMedia === undefined) 
		onMediaFail('Camera not found.');
	else
		navigator.mediaDevices.getUserMedia(constraints)
			.then(onMediaStream)
			.catch(onMediaFail);

	function onMediaStream(stream) {
		video.srcObject = stream;
		video.onloadedmetadata = () => { 
			video.play(); 
			callback(null, stream); 
		};
	}

	function onMediaFail(err) {
		callback(err, null);
	}
}

function discoverCameras(callback) {
	if (navigator.mediaDevices === undefined || navigator.mediaDevices.enumerateDevices === undefined) 
		callback(null, { 'label':'Camera', 'id':null });
	else 
		navigator.mediaDevices.enumerateDevices()
			.then(onMediaDevices)
			.catch(onMediaFail);

	function onMediaDevices(deviceInfos) {
		for (let i = 0; i < deviceInfos.length; i++) {
			let deviceInfo = deviceInfos[i];
			if (deviceInfo.kind === 'videoinput') 
				callback(null, { 'label':(deviceInfo.label || 'Camera'), 'id':deviceInfo.deviceId });
		}
	}

	function onMediaFail(err) {
		callback(err, null);
  	}
}