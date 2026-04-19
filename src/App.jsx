import { useState, useEffect } from 'react'
import './App.css'
import { io } from "socket.io-client"

import Pager from './components/Pager';
import PopUp from './components/Popup';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

function App() {
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const s = io(API_URL);
    setSocket(s);

    return () => s.disconnect();
  }, []);

  const [ page, setPage ] = useState(1);
  const [ totalPages, setTotalPages ] = useState(1);
  const [ rooms, setRooms ] = useState([]);
  const [ isOpen, setIsOpen ] = useState(false);
  const [ isPopUpVisible, setPopUpVisible ] = useState(false);
  const [ myName, setMyName ] = useState(localStorage.getItem("name") || "Guest");

  const [ selected, setSelected ] = useState(null);
  const [ messages, setMessages ] = useState([]);

  const [ input, setInput ] = useState("");

  async function getRooms() {
    try {
      const res = await fetch(`${API_URL}/rooms?page=${page}`);
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
    if(!socket) return;
    const handler = (data) => {
      setMessages((prev) => {
        if (data.roomId !== selected?.roomId) return prev;
        return [data, ...prev];
      });
    };

    socket.on("message", handler);
    return () => socket.off("message", handler);
  }, [selected]);

  useEffect(() => {
    if(!myName) return;
    localStorage.setItem("name", myName);
  }, [myName])

  useEffect(() => {
    if(!socket) return;
    if(!selected) return;
    setMessages([]);
    socket.emit("join_room", {
      roomId: selected?.roomId,
      username: myName
    });
    (async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${selected.roomId}`);
        if(!res.ok) throw new Error("通信エラー");
        const data = await res.json();
        setMessages(data.messages);
      } catch (error) {
        console.log(error);
      }
    })();

    return () => {
      socket.emit("leave_room", {
        roomId: selected.roomId,
        username: myName
      });
    }
  }, [selected]);

  function sendMessage() {
    if(!socket) return;
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <PopUp
        isPopUpVisible={isPopUpVisible}
        setPopUpVisible={setPopUpVisible}
        onCreated={getRooms}
      />

      <div className={`
        fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-gray-100 p-4 transition-transform duration-300 ease-in-out transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:w-1/3 md:m-[20px] md:p-[10px] overflow-y-auto
      `}>
        <div className="flex justify-between items-center mb-4">
          <h1 className='text-3xl'>Rooms</h1>
          <button onClick={() => setIsOpen(false)} className="text-2xl p-2 md:hidden">✕</button>
        </div>
        <br />
        <button
          className="inline-flex h-9 items-center justify-center rounded-md bg-blue-500 px-3 font-medium text-neutral-50 hover:bg-blue-800 cursor-pointer"
          onClick={() => setPopUpVisible(true)}>
            ルーム作成
        </button><br />
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
          <div key={index} onClick={(e) => {setSelected(room); setIsOpen(false)}} className="mb-1 p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-100 flex justify-between items-center">
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
      <div className="flex-1 w-2/3 bg-gray-100 overflow-y-auto flex-col p-2 md:m-[20px] md:ml-[0px] md:p-[10px]">
        <div className={`h-9/10 ${selected ? "overflow-auto" : "overflow-hidden"}`}>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded hover:bg-gray-200"
            >
              ☰
            </button>
            {selected && <h1 className="text-xl">{selected.roomname}</h1>}
          </div>
          {selected ? (
            <>
              <br />
              <hr />
              <br />
              {messages.length > 0 ? (
                <>
                  {messages.map((message, index) => (
                    message.system == 1 ? (
                      <div key={index} className='text-gray-800'>
                        {message.message}
                      </div>
                    ) : (
                      <div key={index} className="mb-1 p-2 bg-white rounded shadow">
                        <span className='text-lg'>{message.username}</span> | <small>{new Date(message.post_at).toLocaleString()}</small>
                        <hr />
                        <br />
                        {message.message}
                      </div>
                    )
                  ))}
                </>
              ) : (
                <>メッセージがまだありません</>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
    
              <div className="text-5xl mb-2">💬</div>

              <h1 className="text-2xl font-semibold mb-2">
                Chat App!
              </h1>

              <p className="mb-4">
                ルームを選択して会話を始めよう
              </p>

              <button
                onClick={() => setIsOpen(true)}
                className="md:hidden px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                ルーム一覧を開く
              </button>

            </div>
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
