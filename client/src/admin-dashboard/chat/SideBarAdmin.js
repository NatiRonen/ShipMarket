import React, { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotifications, resetNotifications } from "../../redux/userSlice";
import { AppContext } from "../../context/appContext";
import { API_URL, doApiGet, doApiMethod } from "../../services/apiService";
import axios from "axios";
import { ListGroup } from "react-bootstrap";
import { BsEraser } from "react-icons/bs";
import { BiAddToQueue } from "react-icons/bi";
import { MdOutlineAddBox } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import Collapse from "react-bootstrap/Collapse";
import { ADMIN_ROLE } from "../../services/consts";

function SideBarAdmin() {
  const user = useSelector((state) => state.user);
  const {
    socket,
    currentRoom,
    setCurrentRoom,
    rooms,
    setRooms,
    clients,
    setClients,
    setServiceMsg,
  } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [newForum, setNewForum] = useState("");
  const [tempRooms, setTempRooms] = useState([]);

  const dispatch = useDispatch();
  const searchRoomRef = useRef();

  useEffect(() => {
    getRooms();
    getClients();
    socket.emit("join-room", rooms[0]?.name);
  }, []);

  //switch the event off before on to prevert bugs
  socket.off("update-forums").on("update-forums", (payload) => {
    setRooms(payload);
  });
  const getRooms = async () => {
    let url = API_URL + "/chat/rooms";
    let resp = await axios(url);
    setRooms(resp.data);
    joinRoom(resp.data[0].name);
    setTempRooms(resp.data);
  };

  const getClients = async () => {
    let url = API_URL + "/users/usersList?perPage=999";
    let resp = await doApiGet(url);
    let clients = resp.data.filter((client) => client.role !== ADMIN_ROLE);
    setClients(clients);
  };

  const joinRoom = (_room, _isPublic = true, _roomData) => {
    if (!user) {
      return alert("Please login first");
    }
    socket.emit("join-room", _room, _roomData);
    setCurrentRoom(_room);
    if (_isPublic) {
      setServiceMsg(false);
    }
    dispatch(resetNotifications(_room));
  };

  socket.off("notifications").on("notifications", (_room) => {
    if (currentRoom !== _room) {
      dispatch(addNotifications(_room));
    }
  });

  const handleServiceMgs = (client) => {
    setServiceMsg(true);
    joinRoom(client._id, false, { name: client.name, image: client.picture });
  };

  const handelAddRmoveRoom = async (room) => {
    let url = API_URL + "/chat/addRmoveRoom/";
    let body = {
      name: room,
    };
    let resp = await doApiMethod(url, "POST", body);
  };

  const searchRoom = async () => {
    let searchQ = searchRoomRef.current.value;
    let temp = await rooms.filter((item) =>
      item.name.toUpperCase().includes(searchQ.toUpperCase())
    );
    setTempRooms(temp);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      searchRoom();
    }
  };

  if (!user) {
    return <></>;
  }
  return (
    <div className="forms_panel">
      <div className="settings-tray ps-4">
        <img className="profile-image" src={user.picture} alt="Profile img" />
        <span className="text-capitalize fw-semibold fst-italic">Hello {user.name}</span>
        <span className="float-end">
          <BiAddToQueue
            title="Add Forum"
            className="add_chat_Room_Btn"
            onClick={() => setOpen(!open)}
          />
        </span>
      </div>
      <Collapse in={open}>
        <div className="search-box">
          <div className="input-wrapper p-2">
            <MdOutlineAddBox
              className="add_Room_Btn float-end"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setOpen(false);
                handelAddRmoveRoom(newForum);
                setNewForum("");
                getRooms();
              }}
            />
            <input
              value={newForum}
              onChange={(e) => setNewForum(e.target.value)}
              placeholder="Forum name"
              type="text"
              className="ps-3"
            />
          </div>
        </div>
      </Collapse>
      <div className="search-box">
        <div className="input-wrapper p-2">
          <FiSearch style={{ cursor: "pointer" }} onClick={searchRoom} />
          <input
            ref={searchRoomRef}
            onKeyPress={handleKeyPress}
            placeholder="Search here"
            type="text"
            className="ps-3"
          />
        </div>
      </div>
      <small className="chat_titel ps-3">Forums</small>
      <ListGroup className="scroll_div_admin">
        {tempRooms.map((room, idx) => (
          <div
            key={idx}
            onClick={() => joinRoom(room.name)}
            active={room.name === currentRoom}
            className="friend-drawer friend-drawer--onhover "
          >
            <img
              className="profile-image"
              src={`https://avatars.dicebear.com/api/bottts/${room.name}.svg`}
              alt=""
            />
            <div className="mt-2 col-8 d-flex align-items-center ">
              <h6>{room.name}</h6>
              {currentRoom !== room.name && (
                <span className="badge rounded-pill bg-success ms-4">
                  {user.newMessages[room.name]}
                </span>
              )}
            </div>
            <BsEraser
              className="del_chat_Room_Btn mx-0"
              onClick={() => handelAddRmoveRoom(room.name)}
              title="Delete"
            />
          </div>
        ))}
      </ListGroup>
      <small className="chat_titel ps-3">Customers Service</small>
      <ListGroup className="scroll_div_Customers" style={{ minHeight: "42vh" }}>
        {clients.map((client, idx) => (
          <div
            key={idx}
            onClick={() => handleServiceMgs(client)}
            active={client._id === currentRoom}
            className="friend-drawer friend-drawer--onhover"
          >
            <img className="profile-image" src={client.picture} alt="" />
            <div className="mt-2 d-flex align-items-center">
              <h6>{client.name}</h6>
              {currentRoom !== client._id && (
                <span className="badge rounded-pill bg-primary ms-4">
                  {user.newMessages[client._id]}
                </span>
              )}
            </div>
          </div>
        ))}
      </ListGroup>
    </div>
  );
}
export default SideBarAdmin;
