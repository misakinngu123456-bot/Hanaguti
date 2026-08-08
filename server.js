const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ゲーム状態の管理
let gameHistory = []; // 全ターンの履歴データ

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました:', socket.id);

  // 接続時に現在の最新状態を送信
  const lastStep = gameHistory.length > 0 ? gameHistory[gameHistory.length - 1] : null;
  socket.emit('init_state', { lastStep, totalSteps: gameHistory.length });

  // プレイヤーからの送信データ受け取り
  socket.on('submit_turn', (data) => {
    // data: { type: 'text' | 'image', content: '文字列' | 'Base64画像' }
    const stepData = {
      id: gameHistory.length + 1,
      type: data.type,
      content: data.content,
      sender: socket.id
    };

    gameHistory.push(stepData);

    // 全プレイヤーに次のターンを通知
    io.emit('next_turn', {
      lastStep: stepData,
      totalSteps: gameHistory.length
    });
  });

  // リセット機能
  socket.on('reset_game', () => {
    gameHistory = [];
    io.emit('game_reset');
  });

  socket.on('disconnect', () => {
    console.log('ユーザーが切断しました:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
