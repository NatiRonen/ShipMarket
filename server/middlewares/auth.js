const ROLES = require("../utils/roles");
const { default: axios } = require("axios");

// if user is already logged in
exports.auth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    return res.status(401).json({ err: "please log in first" });
  }
};

exports.authAdmin = (req, res, next) => {
  let role = req.session.user.role;
  if (role !== ROLES.ADMIN) {
    return res.status(403).json({ err: "Access denied" });
  }
  next();
};

exports.authStoreAdmin = (req, res, next) => {
  let role = req.session.user.role;
  if (role !== ROLES.STORE_ADMIN && role !== ROLES.ADMIN) {
    return res.status(403).json({ err: "access denied" });
  }
  //chek the specific store
  next();
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
