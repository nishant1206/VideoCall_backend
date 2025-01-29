import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { Box, Button, Typography, Paper, CircularProgress, Stack } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CallEndIcon from "@mui/icons-material/CallEnd";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [loading, setLoading] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const handleShareStream = () => {
    setIsSharing(true);
    sendStreams();  // your function to share the stream
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    setLoading(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
    setLoading(false);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  const toggleMic = () => {
    const audioTracks = myStream.getTracks().filter(track => track.kind === 'audio');
    audioTracks.forEach(track => track.enabled = !track.enabled);
    setIsMicOn(prev => !prev);
  };

  const toggleVideo = () => {
    const videoTracks = myStream.getTracks().filter(track => track.kind === 'video');
    videoTracks.forEach(track => track.enabled = !track.enabled);
    setIsVideoOn(prev => !prev);
  };

  const handleHangUp = () => {
    peer.close();
    setMyStream(null);
    setRemoteStream(null);
    setRemoteSocketId(null);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      sx={{
        background: "linear-gradient(135deg, #3a8dff 40%, #1e3c72 100%)",
        padding: 3,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: "fit-content",
          maxWidth: '1200px',
          padding: 3,
          borderRadius: 4,
          backgroundColor: "#f9f9f9",
          boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.2)",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >

        <Stack direction="row" spacing={2} justifyContent="center" my={1}>
          {myStream && (
            <Button
              onClick={handleShareStream}
              variant="contained"
              startIcon={<VideocamIcon />}
              sx={{
                width: 160,
                fontSize: "1rem",
                color: "#ffffff",
                backgroundColor: "#FF7043",
                "&:hover": {
                  backgroundColor: "#FF8A65",
                },
              }}
            >
              Share Stream
            </Button>
          )}
          {remoteSocketId && (
            <Button
              onClick={handleCallUser}
              variant="contained"
              startIcon={<VideocamIcon />}
              disabled={loading}
              sx={{
                width: 160,
                fontSize: "1rem",
                color: "#ffffff",
                backgroundColor: "#4CAF50",
                "&:hover": {
                  backgroundColor: "#66BB6A",
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Call"}
            </Button>
          )}
        </Stack>

        <Box
          display="flex"
          position="relative"
          width={"100%"}
          height={"600px"}
          overflow="hidden"
          borderRadius={3}
          boxShadow="0px 8px 16px rgba(0, 0, 0, 0.2)"
          sx={{
            backgroundColor: "#fff",
            position: 'relative',
          }}
        >
          {/* Remote Stream (Dynamic Size Based on isSharing) */}
          {remoteStream ? (
            <ReactPlayer
              playing
              url={remoteStream}
              height="100%"
              width="100%"
              style={{
                borderRadius: '12px',
                background: "#000",
              }}
            />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              width="100%"
              height="100%"
              color="text.secondary"
              sx={{ background: "#f9f9f9" }}
            >
              <PersonOffIcon color="disabled" fontSize="large" />
              <Typography variant="body2" color="text.secondary">
                No remote stream available ( Waiting for another participant )
              </Typography>
            </Box>
          )}

          {/* My Stream (Floating Preview) */}
          {myStream && (
            <Box
              position="absolute"
              bottom={16}
              right={16}
              width={isSharing ? "20%" : "25%"}
              height={isSharing ? "20%" : "30%"}
              sx={{
                border: "2px solid #fff",
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: "#000",
                zIndex: 10,
              }}
            >
              <ReactPlayer
                playing
                url={myStream}
                height="100%"
                width="100%"
                style={{
                  borderRadius: '12px',
                }}
              />
            </Box>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={3}
          mt={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            variant="outlined"
            color={isMicOn ? "primary" : "secondary"}
            onClick={toggleMic}
            startIcon={isMicOn ? <MicIcon /> : <MicOffIcon />}
          >
            {isMicOn ? "Mic On" : "Mic Off"}
          </Button>

          <Button
            variant="outlined"
            color={isVideoOn ? "primary" : "secondary"}
            onClick={toggleVideo}
            startIcon={isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
          >
            {isVideoOn ? "Video On" : "Video Off"}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleHangUp}
            startIcon={<CallEndIcon />}
          >
            Hang Up
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RoomPage;
