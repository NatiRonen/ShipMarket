const ROLES = require("../utils/roles");
const { default: axios } = require("axios");
const { StoreModel } = require("../models/storeModel");
const jwt = require("jsonwebtoken");

// if user is already logged in
exports.auth = (req, res, next) => {
  let token = req.header("x-api-key");
  if (!token) {
    return res.status(401).json({ err: "No token found" });
  }
  try {
    let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenData = decodeToken;
    next();
  } catch (err) {
    return res.status(401).json({ err: "Invalid token" });
  }
};

exports.authAdmin = (req, res, next) => {
  let token = req.header("x-api-key");
  if (!token) {
    return res.status(401).json({ err: "No token found" });
  }
  try {
    let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    // check if user role is system admin
    if (decodeToken.role == ROLES.ADMIN) {
      req.tokenData = decodeToken;
      next();
    } else {
      return res.status(401).json({ err: "Access denied" });
    }
  } catch (err) {
    return res.status(401).json({ err: "Invalid token" });
  }
};

exports.authStoreAdmin = async (req, res, next) => {
  let token = req.header("x-api-key");
  let idStore = req.params.idStore;
  if (!token) {
    return res.status(401).json({ err: "please log in first" });
  }
  try {
    let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenData = decodeToken;
    //verify the user id the store's admin or system admin
    let store = await StoreModel.findOne({
      _id: idStore,
      adminId: decodeToken._id,
    });
    if (store || req.tokenData.role === ROLES.ADMIN) {
      next();
    } else {
      return res.status(401).json({ err: "Access denied" });
    }
  } catch (err) {
    return res.status(401).json({ err: "Token invalid (if you hacker) or expired" });
  }
};

exports.authOwnership = async (req, res, next) => {
  let token = req.header("x-api-key");
  if (!token) {
    return res.status(401).json({ err: "please log in first" });
  }
  let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
  req.tokenData = decodeToken;
  let store_id = req.header("id-Store");
  if (req.tokenData.role === ROLES.ADMIN) {
    next();
  } else {
    let hisStore = await StoreModel.findOne({
      short_id: store_id,
      admin_short_id: req.tokenData.short_id,
    });
    if (!hisStore) {
      return res.status(403).json({ message: "access denied" });
    }
  }
  next();
};

exports.authCourier = (req, res, next) => {
  let token = req.header("x-api-key");
  if (!token) {
    return res.status(401).json({ err: "You must send token in header to this endpoint" });
  }
  try {
    let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    // check if user role is Courier
    // console.log(decodeToken.role);
    if (decodeToken.role == "courier" || decodeToken.role == "system_admin") {
      req.tokenData = decodeToken;
      next();
    } else {
      return res.status(401).json({ err: "You must be courier in this endpoint" });
    }
  } catch (err) {
    return res.status(401).json({ err: "Token invalid (if you hacker) or expired" });
  }
};

exports.payPalAuth = async (_tokenId, _orderId, _ifRealPay = true) => {
  let url = !_ifRealPay
    ? "https://api-m.sandbox.paypal.com/v2/checkout/orders/" + _orderId
    : "https://api-m.paypal.com/v2/checkout/orders/" + _orderId;
  try {
    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        Authorization: "Bearer " + _tokenId,
        "content-type": "application/json",
      },
    });
    console.log(resp.data);
    console.log(resp.data);
    return resp.data;
  } catch (err) {
    console.log(err.response);
    return err.response;
  }
};
