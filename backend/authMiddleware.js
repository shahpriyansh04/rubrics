
// const jwt = require("jsonwebtoken");

// module.exports = async (request, response, next) => {
//   try {
//     //   get the token from the authorization header
//     const token = await request.headers.authorization.split(" ")[1];

//     //check if the token matches the supposed origin
//     const decodedToken = await jwt.verify(token, "RANDOM-TOKEN");

//     // retrieve the user details of the logged in user
//     const user = await decodedToken;

//     // pass the user down to the endpoints here
//     request.user = user;

//     // pass down functionality to the endpoint
//     next();

//   } catch (error) {
//     response.status(401).json({
//       error: new Error("Invalid request!"),
//     });
//   }
// };



const jwt = require("jsonwebtoken");

module.exports = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Get token from Authorization header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(403).json({ message: "Access Denied: No Token Provided" });

      // Verify token
      const decodedToken = jwt.verify(token, "RANDOM-TOKEN");
      req.user = decodedToken; // the user details from decoding jwt is passed to req

      // Role-based access control
      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({ message: "Access Denied: Unauthorized Role" });
      }

      next(); // Proceed to the next middleware/route handlers
    } catch (error) {
      res.status(401).json({ message: "Invalid Token" });
    }
  };
};
