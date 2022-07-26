import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, doApiGet } from "../services/apiService";
import PopupMap from "./popupMap";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { getCurrentLocation, getGeoCodings, MAPS_KEY } from "../services/mapServices";
import "./css_courier/courier.css";
import LottieAnimation from "../comps/misc/lottieAnimation";
import { AppContext } from "../context/appContext";
import AuthCourierComp from "../comps/auth/authCourierComp";
import { toast } from "react-toastify";
import { READY_FOR_SHIPMENT_ORDER_STATUS } from "../services/consts";

const STORE_ICON =
  "https://cdn4.iconfinder.com/data/icons/map-pins-7/64/map_pin_pointer_location_navigation_parcel_package_box_delivery-64.png";

function OpenOrdersMap(props) {
  const [map, setMap] = useState(/**@type google.maps.map*/ (null));
  const [currentPosition, setCurrentPosition] = useState();
  const [storeswithOrders, setStoresWithOrders] = useState([]);
  const [show, setShow] = useState(false);
  const [popupInfo, setPopupInfo] = useState([]);

  const { socket } = useContext(AppContext);

  const handleToggle = () => setShow(!show);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    doApi();
    listenToStores();
  }, []);

  useEffect(() => {
    setPopupInfo(storeswithOrders.find((item) => item.store._id === popupInfo?.store._id));
  }, [storeswithOrders]);

  useEffect(() => {
    // getCurrentLocation(setCurrentPosition);
    navigator?.geolocation.getCurrentPosition(({ coords: { latitude: lat, longitude: lng } }) => {
      const pos = { lat, lng };
      setCurrentPosition(pos);
    });
  }, [map]);

  const doApi = async () => {
    let ordersUrl = API_URL + "/orders/storesWithOrders";
    try {
      let resp = await doApiGet(ordersUrl);
      let storesOrdersArray = resp.data.data;
      for (let item of storesOrdersArray) {
        item.store.coordinates = await getGeoCodings(item.store.address);
        item.orders.forEach((order) => {
          socket.emit("join-room-orders", order.short_id);
          socket.off("status-changed-msg");
        });
      }
      console.log(storesOrdersArray);
      setStoresWithOrders(storesOrdersArray);
    } catch (err) {
      console.log(err);
    }
  };

  const listenToStores = async () => {
    let url = API_URL + "/stores";
    let resp = await doApiGet(url);
    resp.data.forEach((store) => {
      socket.emit("join-room-orders", store.short_id);
      socket.off("status-changed-msg").on("status-changed-msg", (_room, _status) => {
        if (_status === READY_FOR_SHIPMENT_ORDER_STATUS) {
          let msg = `Order ${_room} is ${_status.replaceAll("_", " ")}`;
          toast.info(msg);
        }
      });
    });
  };
  socket.off("status-changed").on("status-changed", () => {
    console.log("from socket");
    doApi();
  });

  if (!isLoaded) return <LottieAnimation />;
  return (
    <div style={{ width: "100%", height: "100vh" }} className=" map-container">
      <AuthCourierComp />
      {show && (
        <PopupMap
          popupInfo={popupInfo}
          show={show}
          handleToggle={handleToggle}
          currentPosition={currentPosition}
        />
      )}
      <GoogleMap
        center={currentPosition}
        zoom={10}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onLoad={(map) => setMap(map)}
      >
        {storeswithOrders.map((item, idx) => {
          return (
            <Marker
              key={idx}
              position={item.store.coordinates}
              icon={STORE_ICON}
              title={item.store.name}
              onClick={() => {
                handleToggle();
                setPopupInfo(item);
              }}
            ></Marker>
          );
        })}
        {currentPosition && <Marker position={currentPosition} title="You are here" />}
      </GoogleMap>
    </div>
  );
}

export default OpenOrdersMap;
