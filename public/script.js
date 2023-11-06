const socket = io.connect("http://localhost:3000");
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const peerConnection = new RTCPeerConnection(configuration);
let isCaller = false;

document.addEventListener("DOMContentLoaded", () => {
  $('#nameModal').modal('show');
});

function initiateCall() {
  const userName = document.getElementById('userName').value;

  if (!userName) return; // Do not proceed if username is empty

  // Join the room using the provided name
  socket.emit('join-room', userName);

  // Close the modal
  $('#nameModal').modal('hide');

  if (isCaller) {
    createAndSendOffer();
  }
}

function createAndSendOffer() {
  peerConnection
    .createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      socket.emit("offer", peerConnection.localDescription, userName);
    });
}

socket.on('user-joined', () => {
  if (!isCaller) {
    isCaller = true;
    createAndSendOffer();
  }
});

socket.on("offer", (offer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      return peerConnection.createAnswer();
    })
    .then(answer => {
      return peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      socket.emit("answer", peerConnection.localDescription, userName);
    });
});

socket.on("answer", (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", (iceCandidate) => {
  const candidate = new RTCIceCandidate(iceCandidate);
  peerConnection.addIceCandidate(candidate);
});

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("ice-candidate", event.candidate, userName);
  }
};
let localStream = null;

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream; // Store the local stream for toggling later

    const localVideo = document.getElementById("localVideo");
    if (localVideo) {
      localVideo.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  });

function toggleVideo() {
  if (localStream) {
    let videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled; // Toggle the video track

      let videoButton = document.getElementById("toggleVideo");
      videoButton.innerText = videoTrack.enabled ? "Turn Off Video" : "Turn On Video";
    }
  }
}

function toggleAudio() {
  if (localStream) {
    let audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled; // Toggle the audio track

      let audioButton = document.getElementById("toggleAudio");
      audioButton.innerText = audioTrack.enabled ? "Mute" : "Unmute";
    }
  }
}


peerConnection.ontrack = (event) => {
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo) {
    remoteVideo.srcObject = event.streams[0];
  }
};
