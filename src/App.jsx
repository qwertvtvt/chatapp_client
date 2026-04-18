import { useState, useEffect } from 'react'
import './App.css'
import { io } from "socket.io-client"
const socket = io("http://localhost:3000");

import Pager from './components/Pager';
import PopUp from './components/Popup';

function App() {
  const [ page, setPage ] = useState(1);
  const [ totalPages, setTotalPages ] = useState(1);
  const [ rooms, setRooms ] = useState([]);
  const [ myName, setMyName ] = useState("Guest");

  const [ selected, setSelected ] = useState(null);
  const [ messages, setMessages ] = useState([]);

  const [ input, setInput ] = useState("");

  async function getRooms() {
    try {
      const res = await fetch(`http://localhost:3000/rooms?page=${page}`);
      if(!res.ok) throw new Error("通信エラー");
      const data = await res.json();
      setRooms(data.rooms);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getRooms();
  }, [page]);


  useEffect(() => {
    socket.on("message", (data) => {
      setMessages((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("message");
    }
  }, []);

  useEffect(() => {
    if(selected) {
      socket.emit("join_room", {
        roomId: selected?.roomId,
        username: myName
      });
      (async () => {
        try {
          const res = await fetch(`http://localhost:3000/messages/${selected.roomId}`);
          if(!res.ok) throw new Error("通信エラー");
          const data = await res.json();
          setMessages(data.messages);
        } catch (error) {
          console.log(error);
        }
      })();
    }
  }, [selected]);

  function sendMessage() {
    if(!selected || input.trim() === "") return;
    const payload = {
      roomId: selected.roomId,
      username: myName,
      message: input
    }
    socket.emit("send", payload);
    setInput("");
  }

  return (
    <div className="flex h-screen bg-gray-400">
      <div className="w-1/3 bg-gray-100 overflow-y-auto" style={{ margin: 20, padding: 10 }}>
        <h1 className='text-3xl'>Rooms</h1>
        <br />
        <PopUp
          onCreated={getRooms}
        />
        <br />
        <hr />
        <br />
        <input
          type="text"
          placeholder="名前"
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
        /><br />
        <br />
        <hr />
        <br />
        {rooms.length > 0 ? rooms.map((room, index) => (
          <div key={index} onClick={(e) => setSelected(room)} className="mb-1 p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-100 flex justify-between items-center">
            <span className="truncate">
              {room.roomname}
            </span>
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
              <small>{new Date(room.created_at).toLocaleString()}</small>
            </span>
          </div>
        )) : (
          <>ルームがありません</>
        )}
        <br />
        <hr />
        <Pager
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
      <div className="w-2/3 bg-gray-100 overflow-y-auto flex-col" style={{ margin: 20, marginLeft: 0, padding: 10 }}>
        <div className='h-9/10 overflow-auto'>
          {selected ? (
            <>
              <h1 className='text-2xl'>{selected.roomname}</h1>
              <br />
              <hr />
              <br />
              {messages.length > 0 ? (
                <>
                  {messages.map((message, index) => (
                    <div key={index} className="mb-1 p-2 bg-white rounded shadow">
                      <span className='text-lg'>{message.username}</span> | <small>{new Date(message.post_at).toLocaleString()}</small>
                      <hr />
                      <br />
                      {message.message}
                    </div>
                  ))}
                </>
              ) : (
                <>メッセージがまだありません</>
              )}
            </>
          ) : (
            <>ルームを選択</>
          )}
        </div>
        <div className="h-1/10 flex items-center gap-2 pt-2">
          {selected ? (
            <>
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-white"
                placeholder="メッセージを入力..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                送信
              </button>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
