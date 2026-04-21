import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const PopUp = ({ isPopUpVisible, setPopUpVisible, onCreated }) => {
  const [ roomName, setRoomName ] = useState("新しいルーム");

  const togglePopUp = () => {
    setPopUpVisible(!isPopUpVisible);
  };

  const createRoom = async () => {
    if(!roomName.trim()) return;
    try {
        const res = await fetch(`${API_URL}/create_room`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: roomName
            })
        });
        if(!res.ok) throw new Error("通信エラー");
        togglePopUp();
        onCreated();
        setRoomName("新しいルーム");
    } catch (error) {
        console.log(error);
    }
  }

  return (
    <div>
      {isPopUpVisible && (
        <div className="PopUp z-100">
          <label>ルーム名</label><br />
          <input
            type="text"
            placeholder="名前"
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          /><br />
          <br />
          <div className="flex justify-between">
            <button
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-500 px-3 font-medium text-neutral-50 hover:bg-blue-800 cursor-pointer"
                onClick={createRoom}>
                    ルームを作成
            </button>
            <button
                onClick={togglePopUp}
                className="inline-flex h-9 items-center justify-center rounded-md bg-gray-500 px-3 font-medium text-neutral-50 hover:bg-gray-800 cursor-pointer">
                閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopUp;
