import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { TextField, Button, Typography, Paper, CircularProgress, IconButton } from "@mui/material";
import { AccountCircle, Room } from '@mui/icons-material';
import { Fade } from '@mui/material';

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      setLoading(true);
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="flex items-center justify-center h-screen bg-[url('https://source.unsplash.com/random/1920x1080/?chat,communication')] bg-cover bg-center">
      <Paper elevation={12} className="p-10 rounded-lg shadow-lg w-96 bg-white bg-opacity-80 backdrop-blur-md transition-transform transform hover:scale-105">
        <Fade in timeout={1000}>
          <Typography variant="h4" component="h1" align="center" className="text-gray-800 mb-6 font-bold drop-shadow-lg">
            Welcome to the Lobby
          </Typography>
        </Fade>
        <Typography variant="body1" align="center" className="text-gray-600 mb-4">
          Join your friends and start chatting!
        </Typography>
        <form onSubmit={handleSubmitForm} className="flex flex-col">
          <div className="flex items-center mb-4">
            <AccountCircle className="text-gray-600 mr-2" />
            <TextField
              label="Email ID"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              InputLabelProps={{
                style: { color: '#3f51b5' },
              }}
              InputProps={{
                style: { borderColor: '#3f51b5' },
              }}
            />
          </div>
          <div className="flex items-center mb-4">
            <Room className="text-gray-600 mr-2" />
            <TextField
              label="Room Number"
              variant="outlined"
              fullWidth
              margin="normal"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
              InputLabelProps={{
                style: { color: '#3f51b5' },
              }}
              InputProps={{
                style: { borderColor: '#3f51b5' },
              }}
            />
          </div>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            className="mt-4 hover:bg-blue-600 transition-transform transform hover:scale-105"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Join'}
          </Button>
        </form>
        <Typography variant="body2" align="center" className="mt-4 text-gray-500">
          Enter your details to get started.
        </Typography>
      </Paper>
    </div>
  );
};

export default LobbyScreen;
