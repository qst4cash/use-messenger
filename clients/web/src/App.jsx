import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = '/api'

// Playlist Manager
class PlaylistManager {
  constructor() {
    this.playlist = []
    this.currentIndex = -1
    this.listeners = []
  }

  addTrack(track) {
    const exists = this.playlist.find(t => t.id === track.id)
    if (!exists) {
      this.playlist.push(track)
      this.notifyListeners()
    }
  }

  removeTrack(id) {
    const index = this.playlist.findIndex(t => t.id === id)
    if (index !== -1) {
      this.playlist.splice(index, 1)
      if (this.currentIndex >= index) {
        this.currentIndex--
      }
      this.notifyListeners()
    }
  }

  playTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index
      this.notifyListeners()
      return this.playlist[index]
    }
    return null
  }

  next() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++
      this.notifyListeners()
      return this.playlist[this.currentIndex]
    }
    return null
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.notifyListeners()
      return this.playlist[this.currentIndex]
    }
    return null
  }

  clear() {
    this.playlist = []
    this.currentIndex = -1
    this.notifyListeners()
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  getCurrentTrack() {
    return this.playlist[this.currentIndex] || null
  }

  getPlaylist() {
    return this.playlist
  }

  getCurrentIndex() {
    return this.currentIndex
  }
}

const playlistManager = new PlaylistManager()

// Global audio player manager
let currentPlayingAudio = null
const audioQueue = []
let currentQueueIndex = -1

function addToQueue(audioRef, fileName) {
  const index = audioQueue.findIndex(item => item.audioRef === audioRef)
  if (index === -1) {
    audioQueue.push({ audioRef, fileName })
  }
}

function playNext() {
  if (currentQueueIndex < audioQueue.length - 1) {
    currentQueueIndex++
    const nextAudio = audioQueue[currentQueueIndex]
    if (nextAudio && nextAudio.audioRef.current) {
      nextAudio.audioRef.current.play()
      currentPlayingAudio = nextAudio.audioRef.current
    }
  }
}

function playPrevious() {
  if (currentQueueIndex > 0) {
    currentQueueIndex--
    const prevAudio = audioQueue[currentQueueIndex]
    if (prevAudio && prevAudio.audioRef.current) {
      prevAudio.audioRef.current.play()
      currentPlayingAudio = prevAudio.audioRef.current
    }
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('use_token')
    const savedUser = localStorage.getItem('use_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Auth setUser={setUser} setToken={setToken} />
  }

  return <ChatApp user={user} setUser={setUser} token={token} onLogout={handleLogout} />

  function handleLogout() {
    localStorage.removeItem('use_token')
    localStorage.removeItem('use_user')
    setUser(null)
    setToken(null)
  }
}

function Auth({ setUser, setToken }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isLogin ? '/auth/login' : '/auth/register'
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed')
        return
      }

      localStorage.setItem('use_token', data.token)
      localStorage.setItem('use_user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>USE</h1>
        </div>
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-button" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AudioPlayer({ fileUrl, fileName }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    // Add to queue on mount
    addToQueue(audioRef, fileName)

    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      playNext() // Auto play next track
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [fileName])

  const togglePlay = () => {
    // Stop currently playing audio if exists
    if (currentPlayingAudio && currentPlayingAudio !== audioRef.current) {
      currentPlayingAudio.pause()
    }

    if (isPlaying) {
      audioRef.current.pause()
      currentPlayingAudio = null
    } else {
      audioRef.current.play()
      currentPlayingAudio = audioRef.current
      // Update queue index
      const index = audioQueue.findIndex(item => item.audioRef === audioRef)
      if (index !== -1) {
        currentQueueIndex = index
      }
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    audioRef.current.currentTime = percentage * duration
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const addToPlaylist = () => {
    playlistManager.addTrack({
      id: fileUrl,
      title: fileName,
      duration: duration,
      url: fileUrl,
      audioRef: audioRef
    })
  }

  return (
    <div className="audio-player-telegram">
      <button className="play-button" onClick={togglePlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="audio-info-telegram">
        <div className="audio-name-telegram">{fileName}</div>
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
      <button className="add-to-playlist-btn" onClick={addToPlaylist} title="Add to playlist">
        ➕
      </button>
      <audio ref={audioRef} src={fileUrl} />
    </div>
  )
}

function Playlist() {
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const unsubscribe = playlistManager.subscribe(() => {
      setPlaylist([...playlistManager.getPlaylist()])
      setCurrentIndex(playlistManager.getCurrentIndex())
    })
    return unsubscribe
  }, [])

  const handlePlayTrack = (index) => {
    const track = playlistManager.playTrack(index)
    if (track && track.audioRef?.current) {
      if (currentPlayingAudio) currentPlayingAudio.pause()
      track.audioRef.current.play()
      currentPlayingAudio = track.audioRef.current
    }
  }

  const handleNext = () => {
    const track = playlistManager.next()
    if (track && track.audioRef?.current) {
      if (currentPlayingAudio) currentPlayingAudio.pause()
      track.audioRef.current.play()
      currentPlayingAudio = track.audioRef.current
    }
  }

  const handlePrev = () => {
    const track = playlistManager.prev()
    if (track && track.audioRef?.current) {
      if (currentPlayingAudio) currentPlayingAudio.pause()
      track.audioRef.current.play()
      currentPlayingAudio = track.audioRef.current
    }
  }

  if (playlist.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        className="playlist-container"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="playlist-header" onClick={() => setIsExpanded(!isExpanded)}>
          <span>🎵 Playlist ({playlist.length})</span>
          <span className="playlist-toggle">{isExpanded ? '▼' : '▲'}</span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="playlist-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="playlist-tracks">
                {playlist.map((track, index) => (
                  <motion.div
                    key={track.id}
                    className={`playlist-track ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => handlePlayTrack(index)}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="track-number">{index + 1}</span>
                    <span className="track-title">{track.title}</span>
                    {index === currentIndex && <span className="playing-icon">▶</span>}
                    <button
                      className="remove-track-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        playlistManager.removeTrack(track.id)
                      }}
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="playlist-controls">
          <button onClick={handlePrev} disabled={currentIndex <= 0}>
            ⏮
          </button>
          <button onClick={handleNext} disabled={currentIndex >= playlist.length - 1}>
            ⏭
          </button>
          <button onClick={() => playlistManager.clear()}>
            Clear
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function ChatApp({ user, setUser, token, onLogout }) {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [users, setUsers] = useState([])
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [peerConnection, setPeerConnection] = useState(null)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const ringtoneRef = useRef(null)

  function getOtherUser(chat) {
    return chat.users?.find(u => u.id !== user.id) || { username: 'Unknown' }
  }

  function getInitials(name) {
    return name.slice(0, 2).toUpperCase()
  }

  useEffect(() => {
    fetchChats()
    connectWebSocket()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (selectedChat) {
      setMessages([])
      fetchMessages(selectedChat.id)
    } else {
      setMessages([])
    }
  }, [selectedChat])

  useEffect(() => {
    if (selectedChat) {
      setMessages(prev => [...prev].sort((a, b) => a.id - b.id))
    }
  }, [messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${token}`)
    ws.onopen = () => {}
    ws.onclose = () => {}
    ws.onerror = (e) => console.error('WebSocket error', e)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'message') {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.id)
          if (exists) return prev
          return [...prev, data].sort((a, b) => a.id - b.id)
        })
        fetchChats()
      } else if (data.type === 'message_delete') {
        setMessages(prev => prev.filter(m => m.id !== data.message_id))
        fetchChats()
      } else if (data.type === 'avatar_update') {
        // Update avatar in chats list
        setChats(prev => prev.map(chat => {
          if (chat.user1_id === data.user_id) {
            return { ...chat, user1_avatar_url: data.avatar_url }
          }
          if (chat.user2_id === data.user_id) {
            return { ...chat, user2_avatar_url: data.avatar_url }
          }
          return chat
        }))
        // Update current user avatar
        if (data.user_id === user.id) {
          const updatedUser = { ...user, avatar_url: data.avatar_url }
          setUser(updatedUser)
          localStorage.setItem('use_user', JSON.stringify(updatedUser))
        }
      } else if (data.type === 'call_offer') {
        handleIncomingCall(data)
      } else if (data.type === 'call_answer') {
        handleCallAnswer(data)
      } else if (data.type === 'ice_candidate') {
        handleIceCandidate(data)
      } else if (data.type === 'call_end') {
        endCall()
      }
    }
    wsRef.current = ws
  }

  async function fetchChats() {
    try {
      const res = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChats(data)
      }
    } catch (err) {}
  }

  async function fetchMessages(chatId) {
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.sort((a, b) => a.id - b.id))
      }
    } catch (err) {}
  }

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.filter(u => u.id !== user.id))
      }
    } catch (err) {}
  }

  function handleNewChat() {
    fetchUsers()
    setShowNewChat(true)
  }

  async function createChat(otherUserId) {
    try {
      const res = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: otherUserId })
      })
      if (res.ok) {
        const chat = await res.json()
        setChats(prev => [chat, ...prev])
        setSelectedChat(chat)
        setShowNewChat(false)
      }
    } catch (err) {}
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    setNewMessage('')

    const message = {
      type: 'message',
      chat_id: selectedChat.id,
      content: newMessage.trim()
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return

    try {
      const res = await fetch(`${API_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        alert('Failed to delete message')
      }
    } catch (err) {
      alert('Failed to delete message')
    }
  }

  async function sendFile(file, fileType) {
    if (!selectedChat) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('chat_id', selectedChat.id)
    formData.append('file_type', fileType)
    formData.append('caption', '')

    try {
      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) {
        const errorText = await res.text()
        alert(`Failed to upload file: ${res.status}`)
      }
    } catch (err) {
      alert('Failed to upload file: ' + err.message)
    }
  }

  function handleFileSelect(fileType) {
    const input = document.createElement('input')
    input.type = 'file'

    if (fileType === 'image') {
      input.accept = 'image/*'
    } else if (fileType === 'video') {
      input.accept = 'video/*'
    } else if (fileType === 'audio') {
      input.accept = 'audio/*'
    }

    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        sendFile(file, fileType)
      }
    }

    input.click()
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        await sendFile(file, 'audio')
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      alert('Microphone access denied')
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  async function startCall() {
    if (!selectedChat) return

    try {
      // Play ringtone
      playRingtone()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            to_user_id: getOtherUser(selectedChat).id,
            candidate: event.candidate
          }))
        }
      }

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0]
          remoteAudioRef.current.play().catch(err => {})
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_offer',
          to_user_id: getOtherUser(selectedChat).id,
          offer: offer
        }))
      }

      setPeerConnection(pc)
      setInCall(true)
    } catch (err) {
      alert('Microphone access denied')
      stopRingtone()
    }
  }

  async function handleIncomingCall(data) {
    setIncomingCall(data)
    playRingtone()
  }

  async function acceptCall() {
    if (!incomingCall) return

    try {
      stopRingtone()
      playConnectSound()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            to_user_id: incomingCall.from_user_id,
            candidate: event.candidate
          }))
        }
      }

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0]
          remoteAudioRef.current.play().catch(err => {})
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_answer',
          to_user_id: incomingCall.from_user_id,
          answer: answer
        }))
      }

      setPeerConnection(pc)
      setInCall(true)
      setIncomingCall(null)
    } catch (err) {
      alert('Failed to accept call')
      stopRingtone()
    }
  }

  function rejectCall() {
    stopRingtone()
    if (incomingCall && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_end',
        to_user_id: incomingCall.from_user_id
      }))
    }
    setIncomingCall(null)
  }

  async function handleCallAnswer(data) {
    stopRingtone()
    playConnectSound()
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
    }
  }

  async function handleIceCandidate(data) {
    if (peerConnection && data.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
    }
  }

  function endCall() {
    stopRingtone()
    if (peerConnection) {
      peerConnection.close()
      setPeerConnection(null)
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    setInCall(false)

    if (selectedChat && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_end',
        to_user_id: getOtherUser(selectedChat).id
      }))
    }
  }

  function playRingtone() {
    if (!ringtoneRef.current) {
      // Create simple beep ringtone using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      // Repeat every 2 seconds
      ringtoneRef.current = setInterval(() => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.frequency.value = 800
        osc.type = 'sine'

        gain.gain.setValueAtTime(0, audioContext.currentTime)
        gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)

        osc.start(audioContext.currentTime)
        osc.stop(audioContext.currentTime + 0.5)
      }, 2000)
    }
  }

  function stopRingtone() {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current)
      ringtoneRef.current = null
    }
  }

  function playConnectSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 1000
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  function formatTime(dateString) {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        // Avatar will be updated via WebSocket broadcast
        setShowAvatarUpload(false)
      } else {
        const errorText = await res.text()
        alert(`Failed to upload avatar: ${res.status}`)
      }
    } catch (err) {
      alert('Failed to upload avatar: ' + err.message)
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (file) {
      uploadAvatar(file)
    }
  }

  return (
    <div className="chat-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar" onClick={() => setShowAvatarUpload(true)}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" />
              ) : (
                getInitials(user.username)
              )}
            </div>
            <h2>{user.username}</h2>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
        <div className="chat-list">
          {chats.map(chat => {
            const otherUser = getOtherUser(chat)
            return (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-avatar">
                  {otherUser.avatar_url ? (
                    <img src={otherUser.avatar_url} alt="Avatar" />
                  ) : (
                    getInitials(otherUser.username)
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-name">{otherUser.username}</div>
                  <div className="chat-last-message">Click to view messages</div>
                </div>
              </div>
            )
          })}
        </div>
        <button className="new-chat-btn" onClick={handleNewChat}>
          + New Chat
        </button>
      </div>

      <div className="main-chat">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-avatar">
                {getOtherUser(selectedChat).avatar_url ? (
                  <img src={getOtherUser(selectedChat).avatar_url} alt="Avatar" />
                ) : (
                  getInitials(getOtherUser(selectedChat).username)
                )}
              </div>
              <div className="chat-header-name">
                {getOtherUser(selectedChat).username}
              </div>
              <button className="call-btn" onClick={startCall} disabled={inCall} title="Audio Call">
                📞
              </button>
            </div>
            <Playlist />
            <div className="messages-container">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.user_id === user.id ? 'sent' : 'received'}`}
                >
                  {msg.user_id !== user.id && (
                    <div className="message-sender">{msg.username}</div>
                  )}

                  {msg.user_id === user.id && (
                    <button
                      className="delete-message-btn"
                      onClick={() => deleteMessage(msg.id)}
                      title="Delete message"
                    >
                      ✕
                    </button>
                  )}

                  {msg.file_url && msg.file_type === 'image' && (
                    <div className="message-file">
                      <img src={msg.file_url} alt="Image" style={{maxWidth: '300px', borderRadius: '10px'}} />
                    </div>
                  )}

                  {msg.file_url && msg.file_type === 'video' && (
                    <div className="message-file">
                      <video controls style={{maxWidth: '300px', borderRadius: '10px'}}>
                        <source src={msg.file_url} />
                      </video>
                    </div>
                  )}

                  {msg.file_url && msg.file_type === 'audio' && (
                    <AudioPlayer
                      fileUrl={msg.file_url}
                      fileName={msg.file_name || msg.file_url.split('/').pop()}
                    />
                  )}

                  {msg.content && <div className="message-content">{msg.content}</div>}

                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                    {msg.user_id === user.id && (
                      <span className="message-status">
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="message-input-container" onSubmit={sendMessage}>
              <div className="file-buttons">
                <button type="button" className="file-btn" onClick={() => handleFileSelect('image')} title="Send Image">
                  📷
                </button>
                <button type="button" className="file-btn" onClick={() => handleFileSelect('video')} title="Send Video">
                  🎥
                </button>
                <button type="button" className="file-btn" onClick={() => handleFileSelect('audio')} title="Send Audio">
                  🎵
                </button>
                <button
                  type="button"
                  className={`file-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? "Stop Recording" : "Record Voice"}
                >
                  {isRecording ? '⏹️' : '🎤'}
                </button>
              </div>
              <input
                className="message-input"
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button className="send-btn" type="submit" disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <h3>Select a chat</h3>
            <p>Choose a conversation or start a new one</p>
          </div>
        )}
      </div>

      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>New Chat</h3>
            <div className="user-list">
              {users.map(u => (
                <div key={u.id} className="user-item" onClick={() => createChat(u.id)}>
                  <div className="chat-avatar">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="Avatar" />
                    ) : (
                      getInitials(u.username)
                    )}
                  </div>
                  <div className="chat-name">{u.username}</div>
                </div>
              ))}
            </div>
            <button className="modal-close" onClick={() => setShowNewChat(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAvatarUpload && (
        <div className="modal-overlay" onClick={() => setShowAvatarUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Upload Avatar</h3>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleAvatarChange}
              style={{ marginBottom: '20px' }}
            />
            <button className="modal-close" onClick={() => setShowAvatarUpload(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {inCall && (
        <div className="modal-overlay">
          <div className="call-modal">
            <div className="call-icon">📞</div>
            <h3>Call in progress</h3>
            <p>{selectedChat ? getOtherUser(selectedChat).username : 'Unknown'}</p>
            <button className="end-call-btn" onClick={endCall}>
              End Call
            </button>
          </div>
        </div>
      )}

      {incomingCall && (
        <div className="modal-overlay">
          <div className="call-modal">
            <div className="call-icon">📞</div>
            <h3>Incoming Call</h3>
            <p>User ID: {incomingCall.from_user_id}</p>
            <div className="call-actions">
              <button className="accept-call-btn" onClick={acceptCall}>
                Accept
              </button>
              <button className="reject-call-btn" onClick={rejectCall}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay style={{display: 'none'}} />
    </div>
  )
}

export default App
